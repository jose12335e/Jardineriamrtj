import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js ";

import { db } from "./firebase.js";
import { auth } from "./auth.js";

// === Mostrar notificaciones ===
function mostrarNotificacion(mensaje, tipo = "exito") {
  const noti = document.getElementById("notificacion");
  noti.className = "notificacion mostrar " + tipo;
  noti.textContent = mensaje;

  setTimeout(() => {
    noti.classList.remove("mostrar");
  }, 3000);
}

// === Genera contenido del reporte (acepta datos como parámetro) ===
function generarContenidoReporte(datos) {
  let contenido = `=== PLAN DE JARDINERÍA ===\n`;
  if (datos) {
    contenido += `Responsable: ${datos.responsable || 'Sin responsable'}\n`;
    contenido += `Mes: ${datos.mes || 'No definido'}\n\n`;

    for (let semana = 1; semana <= 4; semana++) {
      const fecha = datos[`fechaSemana${semana}`] || 'No definida';
      const comentario = datos[`comentarioSemana${semana}`] || '(sin comentarios)';
      const tareas = datos[`semana${semana}`] || [];

      if (tareas.length > 0 || fecha !== 'No definida' || comentario !== '(sin comentarios)') {
        contenido += `SEMANA ${semana} - Fecha: ${fecha}\n`;
        tareas.forEach(t => {
          contenido += `${t.completada ? '[✔]' : '[ ]'} ${t.tarea}\n`;
        });
        contenido += `Comentarios: ${comentario}\n\n`;
      }
    }
  } else {
    contenido += "No hay datos disponibles.\n";
  }

  return contenido;
}

// === Guardar solo la semana que se llenó ===
async function guardarSemana(semanaNum) {
  const responsable = document.getElementById('responsable').value.trim();
  if (!responsable) {
    mostrarNotificacion("⚠️ El campo 'Responsable' es obligatorio.", "error");
    return;
  }

  const data = {
    responsable,
    mes: new Date().toISOString().slice(0, 7),
    [`semana${semanaNum}`]: Array.from(document.querySelectorAll(`input.semana${semanaNum}`)).map(cb => ({
      tarea: cb.parentElement.textContent.trim(),
      completada: cb.checked
    })),
    [`fechaSemana${semanaNum}`]: document.getElementById(`fechaSemana${semanaNum}`)?.value || '',
    [`comentarioSemana${semanaNum}`]: document.getElementById(`comentarioSemana${semanaNum}`)?.value || ''
  };

  try {
    await addDoc(collection(db, "jardineria"), data);
    mostrarNotificacion(`✅ Semana ${semanaNum} guardada correctamente`, "exito");
    window.scrollTo({ top: 0, behavior: 'smooth' });
    cargarHistorial(data.mes);
  } catch (error) {
    console.error("❌ Error al guardar:", error.message);
    mostrarNotificacion("Hubo un error al guardar la semana.", "error");
  }
}

// === Manejador de eliminación ===
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
    await deleteDoc(doc(db, "jardineria", id));
    mostrarNotificacion("🗑️ Registro eliminado correctamente.", "info");
    const mesSelector = document.getElementById("mesSelector");
    cargarHistorial(mesSelector.value);
  } catch (error) {
    console.error("❌ Error al eliminar:", error.message);
    mostrarNotificacion("Hubo un error al eliminar el registro.", "error");
  }
}

// === Cargar historial ===
async function cargarHistorial(mes) {
  const resumen = document.getElementById("resumen");
  const loader = document.getElementById("loader");

  loader.style.display = "block";
  resumen.innerHTML = "";

  try {
    const q = query(collection(db, "jardineria"), where("mes", "==", mes));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      resumen.innerHTML = "<p>No hay registros para este mes.</p>";
    } else {
      const registrosPorSemana = {};

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        for (let i = 1; i <= 4; i++) {
          if (data[`semana${i}`]?.length > 0) {
            if (!registrosPorSemana[i]) registrosPorSemana[i] = [];
            registrosPorSemana[i].push({
              ...data,
              numeroSemana: i
            });
          }
        }
      });

      Object.entries(registrosPorSemana).forEach(([semana, registros]) => {
        const div = document.createElement("div");
        div.classList.add("registro-mensual");

        let html = `<strong>Semana ${semana}</strong> (${registros[0][`fechaSemana${semana}`]})<br/>`;
        html += `Responsable: ${registros[0].responsable}<br/><br/>`;

        registros[0][`semana${semana}`].forEach(t => {
          html += `${t.completada ? '[✔]' : '[ ]'} ${t.tarea}\n<br>`;
        });

        html += `<em>Comentario: ${registros[0][`comentarioSemana${semana}`]}</em><br/><br/>`;
        html += `<button class="verDetalleBtn" data-id="${semana}">Ver Detalle</button>`;
        div.innerHTML = html;
        resumen.appendChild(div);
      });
    }

    // Listener para botón Ver Detalle
    resumen.addEventListener("click", (e) => {
      if (e.target.classList.contains("verDetalleBtn")) {
        const semana = e.target.dataset.id;
        mostrarReporteDesdeFirebase(semana);
      }
    });

  } catch (error) {
    console.error("❌ Error al cargar historial:", error.message);
    resumen.innerHTML = "<p>Error al cargar los datos. Inténtalo más tarde.</p>";
  } finally {
    loader.style.display = "none";
  }
}

// === Muestra reporte desde Firebase ===
async function mostrarReporteDesdeFirebase(semana) {
  try {
    const mesSelector = document.getElementById("mesSelector");
    const q = query(
      collection(db, "jardineria"),
      where("mes", "==", mesSelector.value)
    );
    const snapshot = await getDocs(q);
    const registrosFiltrados = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data[`semana${semana}`]?.length > 0) {
        registrosFiltrados.push(data);
      }
    });

    if (registrosFiltrados.length > 0) {
      const area = document.getElementById("reporteArea");
      area.textContent = generarContenidoReporte(registrosFiltrados[0]);
    }

  } catch (error) {
    console.error("Error al obtener el documento:", error.message);
  }
}

// === Función para generar contenido mensual ===
export function generarContenidoMensual(datosArray) {
  let contenido = `
    <h2>PLAN DE JARDINERÍA MENSUAL</h2>
    <p><strong>Mes:</strong> ${new Date().toISOString().slice(0, 7)}</p>`;
  
  if (!datosArray || datosArray.length === 0) {
    return "<p>No hay registros disponibles.</p>";
  }

  const semanas = {}; // Agrupamos por semana

  datosArray.forEach((datos, index) => {
    for (let semana = 1; semana <= 4; semana++) {
      const fecha = datos[`fechaSemana${semana}`] || 'No definida';
      const comentario = datos[`comentarioSemana${semana}`] || '(sin comentarios)';
      const tareas = datos[`semana${semana}`] || [];

      if (tareas.length > 0 || fecha !== 'No definida' || comentario !== '(sin comentarios)') {
        if (!semanas[semana]) {
          semanas[semana] = [];
        }

        semanas[semana].push({
          responsable: datos.responsable,
          fecha,
          tareas,
          comentario
        });
      }
    }
  });

  Object.keys(semanas).forEach(semana => {
    contenido += `<h3>Semana ${semana}</h3>`;
    semanas[semana].forEach(data => {
      contenido += `<p><strong>Responsable:</strong> ${data.responsable}</p>`;
      contenido += `<p><strong>Fecha:</strong> ${data.fecha}</p>`;
      contenido += `<ul>`;
      data.tareas.forEach(t => {
        contenido += `<li>${t.completada ? '[✔]' : '[ ]'} ${t.tarea}</li>`;
      });
      contenido += `</ul>`;
      contenido += `<p><em>Comentarios: ${data.comentario}</em></p><hr>`;
    });
  });

  return contenido;
}

document.addEventListener('DOMContentLoaded', () => {
  const guardarBtn = document.getElementById('guardarBtn');
  const mesSelector = document.getElementById('mesSelector');

  // Botones dinámicos para guardar solo la semana que se llenó
  for (let i = 1; i <= 4; i++) {
    const btn = document.createElement("button");
    btn.textContent = `Guardar Semana ${i}`;
    btn.style.marginTop = "20px";
    btn.onclick = () => guardarSemana(i);
    document.getElementById("formulario").appendChild(btn);
  }

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

  // Generar reporte mensual completo
  if (document.getElementById('generarReporteBtn')) {
    document.getElementById('generarReporteBtn').addEventListener('click', async () => {
      const mesSelector = document.getElementById("mesSelector");
      const q = query(collection(db, "jardineria"), where("mes", "==", mesSelector.value));
      const snapshot = await getDocs(q);
      
      const datosMes = [];
      snapshot.forEach(docSnap => {
        datosMes.push(docSnap.data());
      });

      const area = document.getElementById("reporteArea");
      area.textContent = ""; // Limpiar antes de generar
      area.textContent = generarContenidoReporte(datosMes[0]); // Solo el primer registro
    });
  }

  // Descargar como .txt
  if (document.getElementById('descargarTxtBtn')) {
    document.getElementById('descargarTxtBtn').addEventListener('click', () => {
      const contenido = document.getElementById("reporteArea").textContent;
      const blob = new Blob([contenido], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `reporte_jardineria_${new Date().toISOString().slice(0, 7)}.txt`;
      link.click();
    });
  }

  // Imprimir o abrir nueva ventana
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

  // Botón "Ver en plantilla"
  if (document.getElementById('verPlantillaBtn')) {
    document.getElementById('verPlantillaBtn').addEventListener('click', async () => {
      const mesSelector = document.getElementById("mesSelector");
      const q = query(collection(db, "jardineria"), where("mes", "==", mesSelector.value));
      const snapshot = await getDocs(q);
      const datosMes = [];

      snapshot.forEach(docSnap => {
        datosMes.push(docSnap.data());
      });

      const reporteHTML = generarContenidoMensual(datosMes);

      localStorage.setItem("reporteData", JSON.stringify({
        html: reporteHTML,
        mes: mesSelector.value
      }));

      window.location.href = "reporte.html";
    });
  }

  // Modo oscuro
  document.getElementById("toggleDarkMode").addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const btn = document.getElementById("toggleDarkMode");
    btn.textContent = document.body.classList.contains("dark-mode") ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
  });

  // Cargar historial inicial
  if (mesSelector) {
    cargarHistorial(mesSelector.value);
    mesSelector.addEventListener('change', () => {
      cargarHistorial(mesSelector.value);
    });
  }
});
// Verificar si el usuario ha iniciado sesión
if (!sessionStorage.getItem("isLoggedIn")) {
  alert("Por favor, inicia sesión primero.");
  window.location.href = "login.html";
}