
// reporteHistorial.js

import { db } from './firebase.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";
import { generarContenidoMensual } from './app.js'; // Asegúrate de que esta función esté exportada correctamente

document.addEventListener("DOMContentLoaded", () => {
  const mesSelector = document.getElementById("mesSelector");
  const generarBtn = document.getElementById("generarReporteBtn");
  const verPlantillaBtn = document.getElementById("verPlantillaBtn");
  const resumen = document.getElementById("resumen");
  const reporteArea = document.getElementById("reporteArea");

  // Rellenar selector de mes
  const today = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const mes = date.toISOString().slice(0, 7);
    const option = document.createElement("option");
    option.value = mes;
    option.textContent = date.toLocaleString('es-ES', { month: 'long' }) + " " + date.getFullYear();
    mesSelector.appendChild(option);
  }

  // Cargar historial por defecto
  mesSelector.addEventListener("change", () => cargarHistorial(mesSelector.value));
  cargarHistorial(mesSelector.value);

  // Botón: Generar reporte (texto plano)
  generarBtn.addEventListener("click", async () => {
    const datos = await obtenerDatosDelMes(mesSelector.value);
    const contenido = generarContenidoMensual(datos);
    reporteArea.innerHTML = contenido;
  });

  // Botón: Ver plantilla (reporte.html)
  verPlantillaBtn.addEventListener("click", async () => {
    const datos = await obtenerDatosDelMes(mesSelector.value);
    const html = generarContenidoMensual(datos);

    localStorage.setItem("reporteData", JSON.stringify({
      html,
      mes: mesSelector.value
    }));

    window.location.href = "reporte.html";
  });

  async function obtenerDatosDelMes(mes) {
    const q = query(collection(db, "jardineria"), where("mes", "==", mes));
    const snapshot = await getDocs(q);
    const datos = [];
    snapshot.forEach(docSnap => datos.push(docSnap.data()));
    return datos;
  }

  async function cargarHistorial(mes) {
    const datos = await obtenerDatosDelMes(mes);
    resumen.innerHTML = "";
    datos.forEach(reg => {
      for (let semana = 1; semana <= 4; semana++) {
        const tareas = reg[`semana${semana}`];
        if (tareas && tareas.length > 0) {
          const div = document.createElement("div");
          div.className = "registro-mensual";
          let html = `<strong>Semana ${semana}</strong> (${reg[`fechaSemana${semana}`]})<br>`;
          html += `Responsable: ${reg.responsable}<br><ul>`;
          tareas.forEach(t => {
            const clase = t.completada ? "" : " class='incompleto'";
            const icono = t.completada ? "[✔]" : "[ ]";
            html += `<li${clase}>${icono} ${t.tarea}</li>`;
          });
          html += `</ul><em>Comentario: ${reg[`comentarioSemana${semana}`] || "Sin comentarios"}</em>`;
          div.innerHTML = html;
          resumen.appendChild(div);
        }
      }
    });
  }
});
