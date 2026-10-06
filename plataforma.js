/*
 * plataforma.js — reemplaza la API window.claude que la app usaba dentro de claude.ai.
 *
 * Ofrece tres capacidades con la misma forma que la app ya espera:
 *   use("db")          → base de datos con API tipo Firestore (doc/collection, get/set/delete/onSnapshot)
 *   use("downloads")   → guardar archivos (PDF, Excel) con la descarga normal del navegador
 *   use("permissions") → permisos siempre concedidos (no hay panel de permisos fuera de claude.ai)
 *
 * Modos de base de datos (se elige en config.js):
 *   - "local":    los datos quedan en el navegador de cada persona (IndexedDB). Sin servidor.
 *   - "firebase": los datos quedan en Firestore y los comparte todo el equipo, con inicio de sesión
 *                 de Google y lista de correos autorizados (ver firestore.rules).
 */
(function () {
  "use strict";
  const CFG = window.APP_CONFIG || {};
  const MODO = CFG.firebase && CFG.firebase.apiKey ? "firebase" : "local";
  const clon = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));

  /* ------------------------------------------------------------------ descargas */
  const downloads = {
    async save({ filename, data }) {
      const blob = data instanceof Blob ? data : new Blob([data], { type: tipoMime(filename) });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.style.display = "none";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    },
  };
  function tipoMime(n) {
    const e = (n.split(".").pop() || "").toLowerCase();
    return { pdf: "application/pdf", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", json: "application/json", csv: "text/csv" }[e] || "application/octet-stream";
  }

  const permissions = {
    async state() { return "granted"; },
    async request(lista) { return Object.fromEntries((lista || []).map((k) => [k, "granted"])); },
    async manage() {},
  };

  /* ------------------------------------------------------------------ BD local (IndexedDB) */
  function crearDBLocal() {
    const NOMBRE = "estados-financieros", STORE = "docs";
    const cache = new Map();          // ruta → datos
    const oyentes = new Set();        // { tipo: "col"|"doc", ruta, fn }
    const canal = "BroadcastChannel" in window ? new BroadcastChannel(NOMBRE) : null;

    const abrir = new Promise((ok, mal) => {
      const r = indexedDB.open(NOMBRE, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => ok(r.result);
      r.onerror = () => mal(r.error);
    });
    const listo = abrir.then((idb) => new Promise((ok, mal) => {
      const tx = idb.transaction(STORE, "readonly");
      const st = tx.objectStore(STORE);
      const req = st.openCursor();
      req.onsuccess = () => { const c = req.result; if (c) { cache.set(c.key, c.value); c.continue(); } else ok(); };
      req.onerror = () => mal(req.error);
    }));

    async function escribir(ruta, valor) {
      const idb = await abrir;
      await new Promise((ok, mal) => {
        const tx = idb.transaction(STORE, "readwrite");
        const st = tx.objectStore(STORE);
        if (valor === undefined) st.delete(ruta); else st.put(valor, ruta);
        tx.oncomplete = ok; tx.onerror = () => mal(tx.error); tx.onabort = () => mal(tx.error);
      });
    }

    const docSnap = (ruta) => {
      const datos = cache.get(ruta);
      return { id: ruta.split("/").pop(), ref: { path: ruta }, exists: datos !== undefined, data: () => clon(datos), get: (k) => (datos ? clon(datos[k]) : undefined) };
    };
    const colSnap = (col) => {
      const docs = [...cache.keys()].filter((k) => k.startsWith(col + "/") && !k.slice(col.length + 1).includes("/")).sort().map(docSnap);
      return { docs, size: docs.length, empty: !docs.length, forEach: (f) => docs.forEach(f) };
    };
    function notificar(ruta) {
      const col = ruta.slice(0, ruta.lastIndexOf("/"));
      for (const o of oyentes) {
        if (o.tipo === "doc" && o.ruta === ruta) o.fn(docSnap(ruta));
        if (o.tipo === "col" && o.ruta === col) o.fn(colSnap(col));
      }
    }
    if (canal) canal.onmessage = async (ev) => {
      const { ruta, valor } = ev.data || {};
      if (!ruta) return;
      if (valor === undefined) cache.delete(ruta); else cache.set(ruta, valor);
      notificar(ruta);
    };
    async function cambiar(ruta, valor) {
      await listo;
      valor = clon(valor);
      if (valor === undefined) cache.delete(ruta); else cache.set(ruta, valor);
      await escribir(ruta, valor);
      if (canal) canal.postMessage({ ruta, valor });
      notificar(ruta);
    }
    function suscribir(tipo, ruta, fn, err) {
      const o = { tipo, ruta, fn };
      listo.then(() => { oyentes.add(o); fn(tipo === "doc" ? docSnap(ruta) : colSnap(ruta)); }, (e) => err && err(e));
      return () => oyentes.delete(o);
    }
    const db = {
      doc(ruta) {
        return {
          id: ruta.split("/").pop(), path: ruta,
          get: () => listo.then(() => docSnap(ruta)),
          set: (datos, opts) => cambiar(ruta, opts && opts.merge ? { ...(cache.get(ruta) || {}), ...datos } : datos),
          update: (datos) => cambiar(ruta, { ...(cache.get(ruta) || {}), ...datos }),
          delete: () => cambiar(ruta, undefined),
          onSnapshot: (fn, err) => suscribir("doc", ruta, fn, err),
        };
      },
      collection(col) {
        return {
          doc: (id) => db.doc(col + "/" + id),
          get: () => listo.then(() => colSnap(col)),
          onSnapshot: (fn, err) => suscribir("col", col, fn, err),
        };
      },
      /* Respaldo: todo el contenido como objeto { ruta: datos } */
      async exportar() { await listo; return Object.fromEntries([...cache.entries()].map(([k, v]) => [k, clon(v)])); },
      async importar(obj, reemplazar) {
        await listo;
        if (reemplazar) for (const k of [...cache.keys()]) if (!(k in obj)) await cambiar(k, undefined);
        for (const [k, v] of Object.entries(obj)) await cambiar(k, v);
      },
    };
    return db;
  }

  /* ------------------------------------------------------------------ BD compartida (Firebase) */
  const cargarScript = (src) => new Promise((ok, mal) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => mal(new Error("No se pudo cargar " + src)); document.head.appendChild(s); });

  let promesaFirebase = null;
  function crearDBFirebase() {
    if (promesaFirebase) return promesaFirebase;
    promesaFirebase = (async () => {
      const V = CFG.firebaseVersion || "10.12.2";
      const base = `https://www.gstatic.com/firebasejs/${V}/`;
      await cargarScript(base + "firebase-app-compat.js");
      await Promise.all([cargarScript(base + "firebase-auth-compat.js"), cargarScript(base + "firebase-firestore-compat.js")]);
      const app = firebase.initializeApp(CFG.firebase);
      const auth = app.auth();
      const fs = app.firestore();
      try { fs.settings({ ignoreUndefinedProperties: true, merge: true }); } catch (e) { /* ya configurado */ }
      try { await fs.enablePersistence({ synchronizeTabs: true }); } catch (e) { /* sin caché sin conexión */ }
      const usuario = await esperarSesion(auth);
      ponerUsuario(usuario, () => auth.signOut().then(() => location.reload()));
      return fs;
    })();
    return promesaFirebase;
  }

  function esperarSesion(auth) {
    return new Promise((ok) => {
      const parar = auth.onAuthStateChanged((u) => {
        if (u) { quitarPortada(); parar(); ok(u); }
        else mostrarPortada(auth);
      });
    });
  }

  /* ------------------------------------------------------------------ interfaz mínima del adaptador */
  const CSS = `
  .pf-portada{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:rgba(11,19,34,.72);font:15px/1.5 "Source Sans 3","Segoe UI",system-ui,sans-serif}
  .pf-caja{background:#fff;color:#15233f;border-radius:10px;padding:28px 26px;max-width:380px;width:calc(100% - 32px);text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.3)}
  .pf-caja h2{margin:0 0 6px;font:700 18px/1.3 Montserrat,"Segoe UI",sans-serif;color:#20386e}
  .pf-caja p{margin:0 0 16px;color:#56637a}
  .pf-btn{border:1px solid #20386e;background:#20386e;color:#fff;border-radius:6px;padding:9px 16px;cursor:pointer;font:inherit;font-weight:600}
  .pf-btn.sec{background:#fff;color:#20386e}
  .pf-err{color:#b42318;font-size:13px;margin-top:10px}
  .pf-chip{position:fixed;right:12px;bottom:12px;z-index:50;display:flex;gap:6px;align-items:center;background:#fff;color:#15233f;border:1px solid #dbe3ec;border-radius:99px;padding:4px 6px 4px 12px;font:12.5px "Source Sans 3","Segoe UI",sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.08)}
  .pf-chip button{border:0;background:#e4f4f8;color:#20386e;border-radius:99px;padding:3px 10px;cursor:pointer;font:inherit;font-weight:600}
  @media print{.pf-chip,.pf-portada{display:none!important}}`;
  function estilos() { if (document.getElementById("pf-css")) return; const s = document.createElement("style"); s.id = "pf-css"; s.textContent = CSS; document.head.appendChild(s); }
  const alCargar = (f) => (document.body ? f() : document.addEventListener("DOMContentLoaded", f));

  function mostrarPortada(auth) {
    alCargar(() => {
      estilos();
      if (document.getElementById("pf-portada")) return;
      const d = document.createElement("div");
      d.id = "pf-portada"; d.className = "pf-portada";
      d.innerHTML = `<div class="pf-caja"><h2>${CFG.titulo || "Estados Financieros"}</h2><p>Inicie sesión con su cuenta de Google autorizada para ver y trabajar con la información compartida.</p><button class="pf-btn" type="button">Iniciar sesión con Google</button><div class="pf-err" hidden></div></div>`;
      d.querySelector("button").onclick = async () => {
        const e = d.querySelector(".pf-err"); e.hidden = true;
        try { await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); }
        catch (err) { e.textContent = "No se pudo iniciar sesión: " + (err.message || err.code); e.hidden = false; }
      };
      document.body.appendChild(d);
    });
  }
  function quitarPortada() { const d = document.getElementById("pf-portada"); if (d) d.remove(); }

  function ponerUsuario(u, salir) {
    alCargar(() => {
      estilos();
      const c = document.createElement("div"); c.className = "pf-chip";
      c.innerHTML = `<span title="Datos compartidos en la nube">☁ ${escapar(u.email || u.displayName || "Usuario")}</span><button type="button">Salir</button>`;
      c.querySelector("button").onclick = salir;
      document.body.appendChild(c);
    });
  }

  function ponerRespaldoLocal(db) {
    alCargar(() => {
      estilos();
      const c = document.createElement("div"); c.className = "pf-chip";
      c.innerHTML = `<span title="Los datos se guardan solo en este navegador">Datos en este equipo</span><button type="button" data-a="exp">Respaldar</button><button type="button" data-a="imp">Restaurar</button><input type="file" accept=".json,application/json" hidden>`;
      const inp = c.querySelector("input");
      c.querySelector('[data-a="exp"]').onclick = async () => {
        const datos = await db.exportar();
        const f = new Date().toISOString().slice(0, 10);
        await downloads.save({ filename: `respaldo-estados-financieros-${f}.json`, data: JSON.stringify({ app: "estados-financieros", version: 1, fecha: new Date().toISOString(), datos }) });
      };
      c.querySelector('[data-a="imp"]').onclick = () => inp.click();
      inp.onchange = async () => {
        const f = inp.files[0]; inp.value = ""; if (!f) return;
        try {
          const j = JSON.parse(await f.text());
          const datos = j && j.datos ? j.datos : j;
          if (!datos || typeof datos !== "object") throw new Error("archivo sin datos");
          const n = Object.keys(datos).length;
          const reemplazar = confirm(`El respaldo trae ${n} registros.\n\nAceptar: reemplazar todo lo que hay en este equipo.\nCancelar: combinar con lo existente.`);
          await db.importar(datos, reemplazar);
          alert("Respaldo restaurado.");
        } catch (err) { alert("No se pudo leer el respaldo: " + err.message); }
      };
      document.body.appendChild(c);
    });
  }
  const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ------------------------------------------------------------------ API pública */
  let dbLocal = null;
  window.claude = {
    plataforma: MODO,
    async use(nombre) {
      if (nombre === "downloads") return downloads;
      if (nombre === "permissions") return permissions;
      if (nombre === "db") {
        if (MODO === "firebase") return crearDBFirebase();
        if (!dbLocal) { dbLocal = crearDBLocal(); ponerRespaldoLocal(dbLocal); }
        return dbLocal;
      }
      const e = new Error(`Capacidad no disponible: ${nombre}`); e.code = "unavailable"; throw e;
    },
  };
})();
