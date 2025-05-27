document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("toggleDarkMode");
  const savedTheme = localStorage.getItem("theme");

  // Aplica el modo guardado
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    if (btn) btn.innerHTML = '<i class="fas fa-sun"></i>';
  }

  // Si hay botón, se puede cambiar manualmente
  if (btn) {
    btn.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      const isDark = document.body.classList.contains("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      btn.innerHTML = isDark
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
    });
  }
});
