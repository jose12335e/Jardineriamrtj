document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const usuario = document.getElementById("usuario").value.trim();
  const contrasena = document.getElementById("contrasena").value.trim();
  const mensajeError = document.getElementById("mensajeError");

  // Credenciales permitidas
  const usuarioValido = "Miraflores";
  const contrasenaValida = "M1914"; // Contraseña fija

  // Validación simple
  if (usuario === usuarioValido && contrasena === contrasenaValida) {
    // Guardamos estado de sesión
    sessionStorage.setItem("isLoggedIn", "true");
    // Redirigimos al dashboard
    window.location.href = "app.html";
  } else {
    mensajeError.textContent = "Usuario o contraseña incorrectos.";
  }
});