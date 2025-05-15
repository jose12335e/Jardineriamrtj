document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const usuario = document.getElementById("usuario").value.trim();
  const contrasena = document.getElementById("contrasena").value.trim();
  const mensajeError = document.getElementById("mensajeError");

  // Credenciales permitidas
  const usuarioValido = "admin";
  const contrasenaValida = "j2113"; // Tu contraseña tipo j2113

  if (usuario === usuarioValido && contrasena === contrasenaValida) {
    // Redirigir al dashboard o index principal
    window.location.href = "index.html";
  } else {
    mensajeError.textContent = "Usuario o contraseña incorrectos.";
  }
});