document.addEventListener('DOMContentLoaded', () => {
  const reporteGuardado = localStorage.getItem("reporteData");

  // Cargar el contenido del reporte desde localStorage
  if (reporteGuardado) {
    const { html } = JSON.parse(reporteGuardado);
    document.getElementById("reporteArea").innerHTML = html;
  } else {
    document.getElementById("reporteArea").textContent = "No hay datos disponibles.";
  }

  // Botón: Descargar como .txt
  document.getElementById("descargarTxtBtn").addEventListener("click", () => {
    const textoPlano = document.getElementById("reporteArea").innerText;
    const blob = new Blob([textoPlano], { type: 'text/plain' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_jardineria_${new Date().toISOString().slice(0, 7)}.txt`;
    link.click();
  });

  // Botón: Imprimir
  document.getElementById("imprimirBtn").addEventListener("click", () => {
    window.print();
  });

  // Botón: Compartir (solo móvil)
  const compartirBtn = document.getElementById("compartirBtn");
  if (navigator.share) {
    compartirBtn.disabled = false;
    compartirBtn.addEventListener("click", () => {
      const texto = document.getElementById("reporteArea").innerText;
      navigator.share({
        title: "Reporte de Jardinería",
        text: texto
      }).catch(err => console.error("Error al compartir:", err));
    });
  } else {
    compartirBtn.disabled = true;
  }
});