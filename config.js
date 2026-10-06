/*
 * Configuración de la app.
 *
 * MODO LOCAL (por defecto): deje `firebase: null`.
 *   Cada persona guarda sus datos en su propio navegador. Use los botones
 *   "Respaldar" / "Restaurar" (abajo a la derecha) para pasar la información
 *   de un equipo a otro.
 *
 * MODO COMPARTIDO: pegue aquí la configuración web de su proyecto de Firebase
 *   (Consola de Firebase → Configuración del proyecto → Tus apps → Web).
 *   Todos los usuarios autorizados en firestore.rules verán y editarán los
 *   mismos datos. Estos valores no son secretos: la seguridad la dan las reglas.
 */
window.APP_CONFIG = {
  titulo: "Estados Financieros Districlínicas",

  firebase: null,
  // firebase: {
  //   apiKey: "AIza...",
  //   authDomain: "su-proyecto.firebaseapp.com",
  //   projectId: "su-proyecto",
  //   storageBucket: "su-proyecto.appspot.com",
  //   messagingSenderId: "000000000000",
  //   appId: "1:000000000000:web:xxxxxxxxxxxx",
  // },
};
