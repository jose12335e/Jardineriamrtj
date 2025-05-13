// auth.js
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js ";
import { db } from "./firebase.js";

const auth = getAuth();

// Credenciales compartidas - Deben existir en Authentication
const sharedEmail = "equipo@jardineria.com";
const sharedPassword = "contraseñaEquipo2025";

signInWithEmailAndPassword(auth, sharedEmail, sharedPassword)
  .then((userCredential) => {
    console.log("✅ Autenticado automáticamente:", userCredential.user.email);
  })
  .catch((error) => {
    alert("⚠️ Error al iniciar sesión automática: " + error.message);
  });

export { auth };