# Estados Financieros Districlínicas

Aplicación web para generar, a partir del Libro de Inventario / Balance de prueba mensual, los estados financieros bajo NIIF para Pymes (ESF, ERI, ECP, EFE, indicadores, notas, certificación), además de impuestos, conciliaciones bancarias y cartera de proveedores.

Es un sitio estático: un solo `index.html` que se ejecuta completo en el navegador. Los archivos contables se procesan en el equipo de quien los carga; no se suben al repositorio.

## Publicar en GitHub Pages

1. Cree un repositorio en GitHub (por ejemplo `estados-financieros`) y suba estos archivos a la rama `main`.
2. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`. Guarde.
3. En uno o dos minutos la app queda en `https://SU-USUARIO.github.io/estados-financieros/`. Comparta ese enlace.

> En el plan gratuito de GitHub, Pages solo funciona con repositorios **públicos**. El código queda visible, pero los datos contables no, porque no están en el repositorio. Si quiere el código privado, necesita GitHub Pro/Team, o publicar en Netlify, Cloudflare Pages o Vercel desde un repositorio privado.

## Dónde se guardan los datos

La app trae dos modos; se elige en `config.js`. **Esta instalación usa el modo compartido** (proyecto Firebase `estados-financieros-a0e3b`).

Para dar acceso a una persona nueva: agregue su correo de Google en `firestore.rules` y en Firebase → Firestore Database → Reglas, y pulse **Publicar**.

### Modo local

Cada persona trabaja con los datos de su propio navegador (IndexedDB). No necesita servidor ni cuentas.

- Abajo a la derecha aparecen **Respaldar** y **Restaurar**: generan y leen un archivo `.json` con toda la información (meses cargados, parámetros, notas, impuestos, conciliaciones, proveedores).
- Para pasarle el trabajo a un compañero, respalde y envíele el archivo.
- Borrar los datos del navegador elimina la información: respalde con regularidad.

### Modo compartido (Firebase)

Todo el equipo ve y edita los mismos datos en tiempo real, con inicio de sesión de Google y una lista de correos autorizados.

1. Cree un proyecto gratuito en <https://console.firebase.google.com>.
2. **Authentication → Sign-in method**: active **Google**. En **Authentication → Settings → Authorized domains**, agregue `SU-USUARIO.github.io`.
3. **Firestore Database → Crear base de datos** (modo producción, región `southamerica-east1` o la más cercana).
4. **Firestore → Reglas**: pegue el contenido de `firestore.rules`, ponga los correos autorizados y publique.
5. **Configuración del proyecto → Tus apps → Web (`</>`)**: registre la app y copie el objeto `firebaseConfig` en `config.js`, en el campo `firebase`.
6. Suba el cambio de `config.js` a GitHub.

La configuración de Firebase en `config.js` no es secreta; quien no esté en la lista de `firestore.rules` no puede leer ni escribir nada.

En ambos modos, los botones **Respaldar** y **Restaurar** (abajo a la derecha) descargan o cargan un archivo `.json` con toda la información. Sirven para copias de seguridad y para pasar datos de un modo a otro.

## Probar en su computador

```bash
npx serve .          # o: python -m http.server 8000
```

Abra la dirección que indique. No abra `index.html` con doble clic: algunos navegadores bloquean el almacenamiento con `file://`.

## Estructura

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La app completa (interfaz, motor de cálculo, exportación a PDF y Excel). |
| `plataforma.js` | Adaptador de almacenamiento y descargas (modo local o Firebase). |
| `config.js` | Elige el modo y guarda la configuración de Firebase. |
| `firestore.rules` | Reglas de seguridad para el modo compartido. |

Librerías externas (CDN): SheetJS 0.18.5, jsPDF 2.5.1, jsPDF-AutoTable 3.8.2 y, en modo compartido, Firebase 10.

## Trabajar en el código con otras personas

- Invite colaboradores en **Settings → Collaborators**.
- Haga cambios en una rama y abra un *pull request* para revisarlos antes de pasarlos a `main`; cada cambio en `main` se publica solo.
- No suba archivos contables (`.xlsx`, `.xls`) ni respaldos (`respaldo-*.json`): el `.gitignore` ya los excluye.
