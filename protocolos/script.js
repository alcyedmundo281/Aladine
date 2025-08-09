// =============================================================================
//  SCRIPT.JS - VERSIÓN 4.0 (ENFOQUE MULTI-PROMPT)
// =============================================================================

// Variable global para almacenar el estado del protocolo en construcción.
let protocolData = null;

// Asigna el evento principal al botón cuando el DOM está listo.
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('generateButton').addEventListener('click', generateProtocolStructure);
});

/**
 * Inicia el proceso. Crea una estructura JSON vacía para el protocolo
 * y renderiza la interfaz de usuario para la generación por secciones.
 */
function generateProtocolStructure() {
    const protocolTitle = document.getElementById('protocolTitle').value.trim();
    if (!protocolTitle) {
        alert("Por favor, ingrese un título para el protocolo.");
        return;
    }
    
    // Resetea la interfaz
    document.getElementById('loader').style.display = 'block';
    document.getElementById('protocolStructure').innerHTML = '';
    document.getElementById('protocolOutput').style.display = 'none';
    document.getElementById('actionButtons').innerHTML = '';

    protocolData = createBaseStructure(protocolTitle);
    renderStructureUI();
    document.getElementById('loader').style.display = 'none';
}

/**
 * Crea el objeto JSON esqueleto para un nuevo protocolo.
 * @param {string} title - El título del protocolo.
 * @returns {object} - El objeto JSON base.
 */
function createBaseStructure(title) {
    const medicalUnit = document.getElementById('medicalUnit').value;
    return {
        metadata: { 
            titulo: title, 
            version: "1.0",
            unidadResponsable: { nombre: `Unidad Técnica de ${medicalUnit}` },
            fechaElaboracion: new Date().toISOString().slice(0, 10),
            protocoloCodigo: "HECAM-XX-PR-XXX"
        },
        secciones: {
            justificacion: { titulo: "1. Justificación y Alcance", content: null },
            objetivos: { titulo: "2. Objetivos", content: null },
            glosario: { titulo: "3. Glosario y Definiciones", content: null },
            procedimiento: { titulo: "4. Procedimiento (Plan de Acción/Actuación)", content: null },
            nivelesEvidencia: { titulo: "5. Nivel de Evidencia y Grado de Recomendaciones (GRADE)", content: null },
            algoritmosFlujogramas: { titulo: "6. Algoritmo de Actuación", content: null },
            indicadores: { titulo: "7. Indicadores de Calidad", content: null },
            bibliografia: { titulo: "8. Bibliografía", content: null },
            anexos: { titulo: "9. Anexos", content: null }
        }
    };
}

/**
 * Dibuja en el HTML la lista de secciones con sus botones de generación.
 */
function renderStructureUI() {
    const container = document.getElementById('protocolStructure');
    container.innerHTML = '<h3>Estructura del Protocolo (Generar contenido por sección):</h3>';
    
    for (const key in protocolData.secciones) {
        container.innerHTML += `
            <div class="section-generator" id="gen-${key}">
                <span>${protocolData.secciones[key].titulo}</span>
                <button onclick="generateSectionContent('${key}')">Generar</button>
            </div>
        `;
    }
    container.innerHTML += `
        <div class="section-generator" id="gen-all">
            <span><strong>GENERAR TODO EL PROTOCOLO</strong> (Puede tomar un momento)</span>
            <button onclick="generateAllSections()">Generar Todo</button>
        </div>
    `;
}

/**
 * Llama a generateSectionContent para todas las secciones de forma secuencial.
 */
async function generateAllSections() {
    const allButtons = document.querySelectorAll('.section-generator button');
    allButtons.forEach(btn => btn.disabled = true);
    
    for (const sectionKey of Object.keys(protocolData.secciones)) {
        // Solo genera si la sección aún no ha sido generada
        if (!protocolData.secciones[sectionKey].content) {
            await generateSectionContent(sectionKey);
        }
    }

    allButtons.forEach(btn => btn.disabled = false);
    document.getElementById('gen-all').querySelector('button').textContent = 'Generar Todo';
}

/**
 * Genera el contenido para una sección específica usando un prompt especializado.
 * @param {string} sectionKey - La clave de la sección a generar (ej. "justificacion").
 */

async function generateSectionContent(sectionKey) {
    const sectionDiv = document.getElementById(`gen-${sectionKey}`);
    const button = sectionDiv.querySelector('button');
    button.disabled = true;
    button.textContent = 'Generando...';

    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) {
        alert("Por favor, ingrese su API Key.");
        button.disabled = false;
        button.textContent = 'Generar';
        return;
    }

    // --- PASO 1: AÑADIMOS LOGS DE DEPURACIÓN ---
    console.log(`--- Iniciando generación para la sección: ${sectionKey} ---`);

    try {
        const [htaResponse, nacResponse] = await Promise.all([
            fetch('hipertension_arterial_example.json'),
            fetch('neumonia_comunitaria_example.json')
        ]);
        if (!htaResponse.ok || !nacResponse.ok) throw new Error("No se pudieron cargar los archivos JSON de ejemplo.");
        
        const htaExample = await htaResponse.json();
        const nacExample = await nacResponse.json();
        
        const prompt = getSpecializedPrompt(sectionKey, protocolData.metadata.titulo, htaExample, nacExample);
        console.log(`Prompt para "${sectionKey}":`, prompt); // Log para ver el prompt
        
        const modelName = 'gemini-1.5-flash-latest';
        const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                "generationConfig": { "temperature": 0.5, "maxOutputTokens": 8192 }
            })
        });

        const responseData = await apiResponse.json();
        
        // Log para ver la respuesta completa de la API
        console.log(`Respuesta COMPLETA de la API para "${sectionKey}":`, responseData);

        if (!apiResponse.ok) throw new Error(responseData.error.message);
        
        if (!responseData.candidates || !responseData.candidates[0].content) {
            const reason = (responseData.promptFeedback && responseData.promptFeedback.blockReason) || "Razón desconocida";
            throw new Error(`La respuesta de la API fue bloqueada o está vacía. Razón: ${reason}.`);
        }

        const rawText = responseData.candidates[0].content.parts[0].text;
        console.log(`Texto CRUDO recibido para "${sectionKey}":`, rawText); // Log para ver el texto crudo

        const generatedContent = extractJson(rawText);
        console.log(`Contenido JSON EXTRAÍDO para "${sectionKey}":`, generatedContent); // Log para ver el JSON parseado

        if(!generatedContent || !generatedContent[sectionKey]){
            throw new Error("La respuesta del modelo no tuvo el formato JSON esperado (faltó la clave principal '" + sectionKey + "').");
        }

        protocolData.secciones[sectionKey] = generatedContent[sectionKey];
        protocolData.secciones[sectionKey].content = "Generated"; // Marcamos como generada
        
        sectionDiv.innerHTML = `<span>${protocolData.secciones[sectionKey].titulo}</span> <span class="status">✓ Generado</span>`;
        
        renderProtocol(protocolData);

    } catch (error) {
        console.error(`Error generando la sección ${sectionKey}:`, error);
        sectionDiv.innerHTML = `<span>${protocolData.secciones[sectionKey].titulo}</span> <span class="error">✗ Error</span> <button onclick="generateSectionContent('${sectionKey}')">Reintentar</button>`;
        alert(`Error al generar la sección "${sectionKey}": ${error.message}`);
    }
}

/**
 * Devuelve un prompt detallado y específico para cada sección del protocolo.
 * @param {string} sectionKey - La clave de la sección.
 * @param {string} protocolTitle - El título del protocolo.
 * @param {object} htaExample - El JSON del ejemplo de HTA.
 * @param {object} nacExample - El JSON del ejemplo de NAC.
 * @returns {string} El prompt especializado.
 */

function getSpecializedPrompt(sectionKey, protocolTitle, htaExample, nacExample) {
    // **PROMPT SIMPLIFICADO PARA DEPURACIÓN**
    // Nos enfocamos en una sola cosa: que devuelva la clave correcta.
    const prompt = `**Tarea:** Genera SOLAMENTE la sección "${sectionKey}" para un protocolo sobre "${protocolTitle}".
**Formato de Salida:** Tu respuesta debe ser ÚNICAMENTE un objeto JSON con una sola clave principal: "${sectionKey}".
**Ejemplo de formato esperado para 'justificacion':**
{
  "justificacion": {
    "titulo": "1. Justificación y Alcance",
    "contenido": {
      "problemaSaludPublica": "Descripción del problema...",
      "prevalencia": { "institucional_hecam": "Impacto en el HECAM..." }
    }
  }
}
`;
    return prompt;
}

// --- SECCIÓN 3: FUNCIONES DE UTILIDAD (RENDERIZADO, COPIA, DESCARGA) ---

function extractJson(str) {
    let firstOpen = str.indexOf('{'); if (firstOpen === -1) return null;
    let openBraces = 0, jsonEnd = -1;
    for (let i = firstOpen; i < str.length; i++) { if (str[i] === '{') openBraces++; else if (str[i] === '}') openBraces--; if (openBraces === 0) { jsonEnd = i + 1; break; } }
    if (jsonEnd !== -1) { try { return JSON.parse(str.substring(firstOpen, jsonEnd)); } catch (e) { return null; } } return null;
}

function renderProtocol(data) {
    const outputDiv = document.getElementById("protocolOutput");
    const actionButtonsDiv = document.getElementById("actionButtons");
    if (!data || !data.metadata || !data.secciones) { return outputDiv.innerHTML = '<p style="color: orange;">El protocolo generado no tiene la estructura esperada.</p>'; }
    let html = `<div class="protocol-header"><h1>PROTOCOLO: ${data.metadata.titulo || "Sin Título"}</h1><p><strong>Código:</strong> ${data.metadata.protocoloCodigo || "HECAM-XX-PR-XXX"}</p><p><strong>Versión:</strong> ${data.metadata.version || "1.0"} | <strong>Unidad Responsable:</strong> ${data.metadata.unidadResponsable.nombre || "N/A"}</p><p><strong>Fecha de Elaboración:</strong> ${data.metadata.fechaElaboracion || "N/A"}</p></div><hr>`;
    const sectionKeys = ["justificacion", "objetivos", "glosario", "procedimiento", "nivelesEvidencia", "algoritmosFlujogramas", "indicadores", "bibliografia", "anexos"];
    sectionKeys.forEach(key => {
        const section = data.secciones[key];
        if (!section || !section.titulo) {
            html += `<section><h2>${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</h2><p style="color: orange;"><em>Contenido aún no generado.</em></p></section>`;
            return;
        }
        html += `<section><h2>${section.titulo}</h2>`;
        if (key === "justificacion" && section.contenido) {
            if (section.contenido.problemaSaludPublica) html += `<p>${section.contenido.problemaSaludPublica}</p>`;
            if (section.contenido.prevalencia && section.contenido.prevalencia.institucional_hecam) html += `<p><strong>Prevalencia Institucional:</strong> ${section.contenido.prevalencia.institucional_hecam}</p>`;
            if (section.contenido.poblacionObjetivo) html += `<p><strong>Población Objetivo:</strong> ${section.contenido.poblacionObjetivo}</p>`;
            if (Array.isArray(section.contenido.unidadesInvolucradas)) html += `<p><strong>Unidades Involucradas:</strong> ${section.contenido.unidadesInvolucradas.join(", ")}</p>`;
            if (Array.isArray(section.contenido.resultadosEsperados)) { html += `<strong>Resultados Esperados:</strong><ul>${section.contenido.resultadosEsperados.map(item => `<li>${item}</li>`).join("")}</ul>`; }
        } else if (key === "objetivos") {
            if (section.general) html += `<p><strong>Objetivo General:</strong> ${section.general}</p>`;
            if (Array.isArray(section.especificos)) { html += `<strong>Objetivos Específicos:</strong><ul>${section.especificos.map(obj => `<li>${obj}</li>`).join("")}</ul>`; }
        } else if (key === "glosario" && Array.isArray(section.terminos)) {
            html += "<ul>"; section.terminos.forEach(term => html += `<li><strong>${term.abreviatura || term.termino}:</strong> ${term.definicion}</li>`); html += "</ul>";
        } else if (key === "procedimiento" && section.subsecciones) {
            Object.values(section.subsecciones).forEach(sub => {
                if (sub && sub.titulo) {
                    html += `<h3>${sub.titulo}</h3>`;
                    for (const [subKey, value] of Object.entries(sub)) {
                        if (subKey !== "titulo") {
                            html += `<strong>${subKey.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}:</strong>`;
                            html += renderValue(value);
                        }
                    }
                }
            });
        } else if (key === "nivelesEvidencia") {
            if (Array.isArray(section.tablaRecomendaciones) && section.tablaRecomendaciones.length > 0) {
                html += "<table><thead><tr><th>Área</th><th>Recomendación</th><th>Nivel de Evidencia</th><th>Fuerza de Recomendación</th></tr></thead><tbody>";
                section.tablaRecomendaciones.forEach(rec => { html += `<tr><td>${rec.area || "N/A"}</td><td>${rec.recomendacion || "N/A"}</td><td>${rec.nivelEvidencia || "N/A"}</td><td>${rec.fuerzaRecomendacion || "N/A"}</td></tr>`; });
                html += "</tbody></table>";
            }
            if (section.interpretacion) {
                html += `<h3>${section.interpretacion.titulo || "Interpretación GRADE"}</h3>`;
                if (section.interpretacion.nivelEvidencia) {
                    html += `<h4>${section.interpretacion.nivelEvidencia.titulo}</h4><ul>`;
                    section.interpretacion.nivelEvidencia.items.forEach(item => { html += `<li><strong>${item.nivel}:</strong> ${item.descripcion}</li>`; });
                    html += "</ul>";
                }
                if (section.interpretacion.fuerzaRecomendacion) {
                    html += `<h4>${section.interpretacion.fuerzaRecomendacion.titulo}</h4><ul>`;
                    section.interpretacion.fuerzaRecomendacion.items.forEach(item => { html += `<li><strong>${item.fuerza}:</strong> ${item.descripcion}</li>`; });
                    html += "</ul>";
                }
            }
        } else if (key === "algoritmosFlujogramas" && Array.isArray(section.flujogramas) && section.flujogramas.length > 0) {
            section.flujogramas.forEach((flujo) => { html += `<h4>${flujo.tituloFigura || "Flujograma"}</h4><div class="mermaid">${flujo.descripcion_mermaid}</div>`; });
        } else if (key === "indicadores" && Array.isArray(section.items) && section.items.length > 0) {
            html += "<table><thead><tr>";
            const headers = Object.keys(section.items[0]);
            headers.forEach(header => html += `<th>${header.charAt(0).toUpperCase() + header.slice(1)}</th>`);
            html += "</tr></thead><tbody>";
            section.items.forEach(item => { html += "<tr>"; headers.forEach(header => html += `<td>${item[header] || "N/A"}</td>`); html += "</tr>"; });
            html += "</tbody></table>";
        } else if (key === "bibliografia" && Array.isArray(section.referencias) && section.referencias.length > 0) {
            html += "<h4>Referencias</h4><ol>";
            section.referencias.forEach(ref => html += `<li>${ref}</li>`);
            html += "</ol>";
        } else if (key === "anexos" && Array.isArray(section.items)) {
            section.items.forEach(item => {
                if (item.tituloAnexo) html += `<h3>${item.tituloAnexo}</h3>`;
                if (item.tipo === "tabla_gantt" && Array.isArray(item.tareas)) {
                    html += "<table><thead><tr><th>ID</th><th>Tarea</th><th>Comienzo</th><th>Fin</th></tr></thead><tbody>";
                    item.tareas.forEach(task => { html += `<tr><td>${task.id}</td><td>${task.nombre}</td><td>${task.inicio}</td><td>${task.fin}</td></tr>`; });
                    html += "</tbody></table>";
                }
            });
        }
        html += `</section>`;
    });

    outputDiv.innerHTML = html;
    actionButtonsDiv.innerHTML = '<button onclick="copyHtml()">Copiar HTML</button><button onclick="downloadHtml()">Descargar como HTML</button>';
    setTimeout(() => { try { if (window.mermaid) { document.querySelectorAll(".mermaid").forEach(el => el.removeAttribute("data-processed")); window.mermaid.run(); } } catch (e) { console.error("Error al renderizar Mermaid:", e); } }, 100);
}

function renderValue(value) {
    if (Array.isArray(value)) {
        let listHtml = "<ul>"; value.forEach(item => { listHtml += `<li>${renderValue(item)}</li>`; }); listHtml += "</ul>"; return listHtml;
    }
    if (typeof value === 'object' && value !== null) {
        if (value.nombre && value.link) { return `${value.nombre} (<a href='${value.link}' target='_blank' rel='noopener noreferrer'>Ir a la calculadora</a>)`; }
        let objectHtml = '<ul style="list-style-type: none; padding-left: 15px;">';
        for (const [key, val] of Object.entries(value)) {
            const formattedKey = key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
            objectHtml += `<li><em>${formattedKey}:</em> ${renderValue(val)}</li>`;
        }
        return objectHtml += "</ul>";
    }
    return value;
}

function copyHtml() { navigator.clipboard.writeText(document.getElementById('protocolOutput').innerHTML).then(() => alert('¡HTML del protocolo copiado!'), () => alert('Error al copiar')); }

function downloadHtml() {
    const protocolHtml = document.getElementById('protocolOutput').innerHTML;
    const protocolTitle = document.getElementById('protocolTitle').value.trim() || 'protocolo';
    const fullHtml = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${protocolTitle}</title><style>body{font-family:Arial,sans-serif;line-height:1.6;margin:2cm}h1,h2,h3,h4{color:#005a9c}h2{border-bottom:1px solid #eee;padding-bottom:5px;margin-top:30px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background-color:#f2f2f2}.mermaid{display:none}</style></head><body>${protocolHtml}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${protocolTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
    </script>
</body>
</html>
