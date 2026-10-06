/*
 * Configuración de la app.
 *
 * MODO COMPARTIDO (activo): los datos viven en Firebase (Firestore) y los ven
 *   todos los usuarios autorizados en firestore.rules. Cada persona entra con
 *   su cuenta de Google. Estos valores no son secretos: la seguridad la dan
 *   las reglas de Firestore.
 *
 * MODO LOCAL: cambie `firebase` por `null`. Cada persona guardará sus datos
 *   en su propio navegador y los pasará con "Respaldar" / "Restaurar".
 */
window.APP_CONFIG = {
  titulo: "Estados Financieros Districlínicas",

  firebase: {
    apiKey: "AIzaSyATpvtGKJi5ffgKimCYn9rqvGX9K78AETc",
    authDomain: "estados-financieros-a0e3b.firebaseapp.com",
    projectId: "estados-financieros-a0e3b",
    storageBucket: "estados-financieros-a0e3b.firebasestorage.app",
    messagingSenderId: "754476155788",
    appId: "1:754476155788:web:88d4c9342e8b3c3b698ca9",
  },
};
