// app.js

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js ";

import { db } from "./firebase.js";
import { auth } from "./auth.js";

// Función para generar contenido del reporte (antes de usarla)
function generarContenidoReporte() {
  const responsable = document.getElementById("responsable").value || "Sin responsable";
  const mesSelector = document.getElementById("mesSelector");
  const mes = mesSelector.options[mesSelector.selectedIndex]?.text || 'No seleccionado';

  let contenido = `=== PLAN DE JARDINERÍA ===\n`;
  contenido += `Responsable: ${responsable}\n`;
  contenido += `Mes: ${mes}\n\n`;

  for (let semana = 1; semana <= 4; semana++) {
    const fecha = document.getElementById(`fechaSemana${semana}`)?.value || 'No definida';
    const comentario = document.getElementById(`comentarioSemana${semana}`)?.value || '(sin comentarios)';
    const tareas = Array.from(document.querySelectorAll(`input.semana${semana}`)).map(cb => ({
      tarea: cb.parentElement.textContent.trim(),
      completada: cb.checked
    }));

    contenido += `SEMANA ${semana} - Fecha: ${fecha}\n`;
    tareas.forEach(t => {
      contenido += `${t.completada ? '[✔]' : '[ ]'} ${t.tarea}\n`;
    });
    contenido += `Comentarios: ${comentario}\n\n`;
  }

  return contenido;
}

// Manejador de eliminación (definido antes de usarlo)
function handleEliminar(e) {
  if (e.target.classList.contains("eliminarBtn")) {
    const id = e.target.dataset.id;
    if (confirm("¿Estás seguro de que quieres eliminar este registro?")) {
      borrarRegistro(id);
    }
  }
}

async function borrarRegistro(id) {
  try {
    await deleteDoc(doc(db, "tareas", id));
    alert("🗑️ Registro eliminado correctamente.");
    const mesSelector = document.getElementById("mesSelector");
    cargarHistorial(mesSelector.value);
  } catch (error) {
    console.error("❌ Error al eliminar:", error.message);
    alert("Hubo un error al eliminar el registro.");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const guardarBtn = document.getElementById('guardarBtn');
  const generarBtn = document.getElementById('generarReporteBtn');
  const mesSelector = document.getElementById('mesSelector');

  // Cargar meses en selector
  const today = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const mes = date.toISOString().slice(0, 7);
    const option = document.createElement('option');
    option.value = mes;
    option.textContent = `${date.toLocaleString('es-ES', { month: 'long' })} ${date.getFullYear()}`;
    mesSelector.appendChild(option);
  }

  // Guardar datos
  if (guardarBtn) {
    guardarBtn.addEventListener('click', async () => {

      function getChecklist(className) {
        const checkboxes = document.querySelectorAll(`input.${className}`);
        return Array.from(checkboxes).map(cb => ({
          tarea: cb.parentElement.textContent.trim(),
          completada: cb.checked
        }));
      }

      const data = {
        responsable: document.getElementById('responsable')?.value || '',
        mes: new Date().toISOString().slice(0, 7),
        semana1: getChecklist('semana1'),
        semana2: getChecklist('semana2'),
        semana3: getChecklist('semana3'),
        semana4: getChecklist('semana4'),
        fechaSemana1: document.getElementById('fechaSemana1')?.value || '',
        fechaSemana2: document.getElementById('fechaSemana2')?.value || '',
        fechaSemana3: document.getElementById('fechaSemana3')?.value || '',
        fechaSemana4: document.getElementById('fechaSemana4')?.value || '',
        comentarioSemana1: document.getElementById('comentarioSemana1')?.value || '',
        comentarioSemana2: document.getElementById('comentarioSemana2')?.value || '',
        comentarioSemana3: document.getElementById('comentarioSemana3')?.value || '',
        comentarioSemana4: document.getElementById('comentarioSemana4')?.value || '',
        timestamp: new Date()
      };

      try {
        await addDoc(collection(db, "tareas"), data);
        alert("✅ Registro guardado correctamente");
        cargarHistorial(mesSelector.value);
      } catch (error) {
        console.error("❌ Error al guardar:", error.message);
        alert("Hubo un error al guardar el registro.");
      }
    });
  }

  // Generar reporte
  if (document.getElementById('generarReporteBtn')) {
    document.getElementById('generarReporteBtn').addEventListener('click', () => {
      const area = document.getElementById("reporteArea");
      if (area) {
        area.textContent = generarContenidoReporte();
      }
    });
  }

  // Descargar como .txt
  if (document.getElementById('descargarTxtBtn')) {
    document.getElementById('descargarTxtBtn').addEventListener('click', () => {
      const contenido = generarContenidoReporte();
      const blob = new Blob([contenido], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `reporte_jardineria_${new Date().toISOString().slice(0, 7)}.txt`;
      link.click();
    });
  }

  // Imprimir o guardar como PDF
  if (document.getElementById('imprimirBtn')) {
    document.getElementById('imprimirBtn').addEventListener('click', () => {
      const contenido = document.getElementById("reporteArea").innerHTML;
      const ventana = window.open('', '_blank');
      ventana.document.write(`
        <html>
          <head><title>Reporte Mensual</title></head>
          <body>${contenido}</body>
        </html>
      `);
      ventana.document.close();
      ventana.print();
    });
  }

  // Compartir (solo móviles)
  if (document.getElementById('compartirBtn')) {
    if (navigator.share) {
      document.getElementById('compartirBtn').disabled = false;
      document.getElementById('compartirBtn').addEventListener('click', async () => {
        const contenido = generarContenidoReporte();

        try {
          await navigator.share({
            title: 'Reporte de Jardinería',
            text: contenido
          });
        } catch (err) {
          console.error("Error al compartir:", err);
        }
      });
    } else {
      document.getElementById('compartirBtn').disabled = true;
    }
  }

  // Cargar historial inicial
  if (mesSelector) {
    cargarHistorial(mesSelector.value);
    mesSelector.addEventListener('change', () => {
      cargarHistorial(mesSelector.value);
    });
  }
});

// Mostrar historial con botón de eliminar
async function cargarHistorial(mes) {
  try {
    const resumen = document.getElementById("resumen");
    resumen.innerHTML = ""; // Limpiar antes de recargar

    const q = query(collection(db, "tareas"), where("mes", "==", mes));
    const snapshot = await getDocs(q);

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const div = document.createElement("div");
      div.classList.add("registro-mensual");

      let html = `<strong>${data.responsable}</strong> - ${data.mes}<br/><br/>`;

      [1, 2, 3, 4].forEach(semana => {
        const tareas = data[`semana${semana}`] || [];
        const completadas = tareas.filter(t => t.completada).length;

        html += `<strong>Semana ${semana}</strong> (${data[`fechaSemana${semana}`] || 'Sin fecha'}): ${completadas} de ${tareas.length} completadas<br/>`;

        if (data[`comentarioSemana${semana}`]) {
          html += `<em>Comentario: ${data[`comentarioSemana${semana}`]}</em><br/>`;
        }

        html += "<br/>";
      });

      html += `<button class="eliminarBtn" data-id="${docSnap.id}">Eliminar</button>`;
      div.innerHTML = html;
      resumen.appendChild(div);
    });

    // Eliminar evento previo para evitar duplicados
    resumen.removeEventListener("click", handleEliminar);
    resumen.addEventListener("click", handleEliminar);

  } catch (error) {
    console.error("❌ Error al cargar historial:", error.message);
  }
}