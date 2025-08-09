// =============================================================================
//  SCRIPT.JS - VERSIÓN FINAL COMPLETA (ARQUITECTURA MULTI-PROMPT)
// =============================================================================

// Variable global para almacenar el estado del protocolo en construcción.
let protocolData = null;

// Asigna el evento principal al botón cuando el DOM está listo.
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM listo. Inicializando la aplicación...");
    const generateButton = document.getElementById('generateButton');
    if (generateButton) {
        console.log("Botón 'Generar Protocolo' encontrado y evento asociado.");
        generateButton.addEventListener('click', generateProtocolStructure);
    } else {
        console.error("Error CRÍTICO: No se encontró el botón con id='generateButton'.");
        alert("Error de inicialización: El botón de generar no se encuentra.");
    }
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
            justificacion: { titulo: "1. Justificación y Alcance" },
            objetivos: { titulo: "2. Objetivos" },
            glosario: { titulo: "3. Glosario y Definiciones" },
            procedimiento: { titulo: "4. Procedimiento (Plan de Acción/Actuación)" },
            nivelesEvidencia: { titulo: "5. Nivel de Evidencia y Grado de Recomendaciones (GRADE)" },
            algoritmosFlujogramas: { titulo: "6. Algoritmo de Actuación" },
            indicadores: { titulo: "7. Indicadores de Calidad" },
            bibliografia: { titulo: "8. Bibliografía" },
            anexos: { titulo: "9. Anexos" }
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
        container.innerHTML += `<div class="section-generator" id="gen-${key}"><span>${protocolData.secciones[key].titulo}</span><button onclick="generateSectionContent('${key}')">Generar</button></div>`;
    }
    container.innerHTML += `<div class="section-generator" id="gen-all"><span><strong>GENERAR TODO EL PROTOCOLO</strong> (Puede tomar un momento)</span><button onclick="generateAllSections()">Generar Todo</button></div>`;
}

/**
 * Llama a generateSectionContent para todas las secciones de forma secuencial.
 */
async function generateAllSections() {
    const allButtons = document.querySelectorAll('.section-generator button');
    allButtons.forEach(btn => btn.disabled = true);
    for (const sectionKey of Object.keys(protocolData.secciones)) {
        if (!isSectionGenerated(sectionKey)) {
            await generateSectionContent(sectionKey);
        }
    }
    allButtons.forEach(btn => btn.disabled = false);
    document.getElementById('gen-all').querySelector('button').textContent = 'Generar Todo';
}

/**
 * Verifica si una sección ya tiene contenido generado.
 */
function isSectionGenerated(sectionKey) {
    const section = protocolData.secciones[sectionKey];
    return section && (section.markdownContent || section.tablaRecomendaciones || section.flujogramas || section.items || section.referencias);
}

/**
 * Genera el contenido para una sección específica usando un prompt especializado.
 * @param {string} sectionKey - La clave de la sección a generar.
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

    try {
        const [htaResponse, nacResponse] = await Promise.all([
            fetch('hipertension_arterial_example.json'),
            fetch('neumonia_comunitaria_example.json')
        ]);
        if (!htaResponse.ok || !nacResponse.ok) throw new Error("No se pudieron cargar los archivos JSON de ejemplo.");
        
        const htaExample = await htaResponse.json();
        const nacExample = await nacResponse.json();
        
        const prompt = getSpecializedPrompt(sectionKey, protocolData.metadata.titulo, htaExample, nacExample);
        
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
        if (!apiResponse.ok) throw new Error(responseData.error.message || `Error ${apiResponse.status}`);

        if (!responseData.candidates || !responseData.candidates[0].content) {
            throw new Error("Respuesta inválida o bloqueada por la API. Razón: " + (responseData.promptFeedback?.blockReason || 'desconocida'));
        }
        
        const rawText = responseData.candidates[0].content.parts[0].text;
        const generatedContent = extractJson(rawText);

        if(!generatedContent || !generatedContent[sectionKey]){
            throw new Error("La respuesta del modelo no tuvo el formato JSON esperado. Respuesta: " + rawText);
        }

        protocolData.secciones[sectionKey] = generatedContent[sectionKey];
        
        sectionDiv.innerHTML = `<span>${protocolData.secciones[sectionKey].titulo}</span> <span class="status">✓ Generado</span>`;
        
        document.getElementById('protocolOutput').style.display = 'block';
        renderProtocol(protocolData);

    } catch (error) {
        console.error(`Error generando la sección ${sectionKey}:`, error);
        sectionDiv.innerHTML = `<span>${protocolData.secciones[sectionKey].titulo}</span> <span class="error">✗ Error</span> <button onclick="generateSectionContent('${sectionKey}')">Reintentar</button>`;
        alert(`Error al generar la sección "${sectionKey}": ${error.message}`);
    }
}

/**
 * Devuelve un prompt detallado y específico para cada sección del protocolo.
 */
function getSpecializedPrompt(sectionKey, protocolTitle) {
    // Los ejemplos ya no son necesarios en cada prompt, los mantenemos en una variable por si se necesitan
    const mermaidExample = "graph TD; A[Sospecha] --> B{Criterios?}; B -- Si --> C[Tratamiento]; B -- No --> D[Reevaluar];";
    const promptBase = `**Rol:** Eres un experto en redacción de protocolos médicos para el Hospital HECAM en Quito, Ecuador.\n` +
                     `**Tarea:** Genera SOLAMENTE la sección "${sectionKey}" para un protocolo sobre "${protocolTitle}".\n` +
                     `**Formato de Salida:** Debes responder ÚNICAMENTE con un objeto JSON que contenga una sola clave principal: "${sectionKey}".\n`;
    
    let specificInstructions = '';

    switch (sectionKey) {
        // ... (casos para justificacion, objetivos, glosario, procedimiento que ya funcionan)
        case 'justificacion': case 'objetivos': case 'glosario': case 'procedimiento':
            specificInstructions = `El valor de la clave "${sectionKey}" debe ser un objeto con "titulo" y "markdownContent". En "markdownContent", escribe el texto completo y detallado usando formato Markdown (### Título, **Negrita**, - Lista).`;
            break;
        case 'nivelesEvidencia':
            specificInstructions = `El valor de la clave debe ser un objeto con "titulo", un array "tablaRecomendaciones" (con 4-6 objetos), y un objeto "interpretacion" con la explicación de GRADE.`;
            break;

        // --- INICIO DE LAS CORRECCIONES FINALES ---
        case 'algoritmosFlujogramas':
            specificInstructions = `**Detalles para '${sectionKey}':** El valor de la clave debe ser un objeto con "titulo" y un array "flujogramas". Genera al menos un objeto de flujograma con "tituloFigura" y "descripcion_mermaid". El valor de "descripcion_mermaid" DEBE ser un string de una sola línea, sintácticamente correcto para Mermaid.js, como este ejemplo: \`${mermaidExample}\`. NO uses caracteres especiales o saltos de línea dentro de esta clave.`;
            break;

        case 'indicadores':
            specificInstructions = `**Detalles para '${sectionKey}':** El valor de la clave debe ser un objeto con "titulo" y un array "items". Genera 3-5 indicadores de calidad REALISTAS y COMPLETOS para monitorizar el protocolo de "${protocolTitle}". Cada indicador debe ser un objeto con "nombre", "definicion", "calculo", "meta", "periodo", y "responsable". Es crucial que inventes contenido realista para cada campo y no dejes ninguno como 'N/A'.`;
            break;

        case 'bibliografia':
            specificInstructions = `**Detalles para '${sectionKey}':** El valor de la clave debe ser un objeto con "titulo" y un array "referencias". El array "referencias" debe ser un array de STRINGS, donde cada string es una referencia completa en formato Vancouver. Genera entre 10 y 15 referencias.`;
            break;
        // --- FIN DE CORRECCIONES ---
        
        case 'anexos':
             specificInstructions = `**Detalles para '${sectionKey}':** El objeto debe ser un objeto con "titulo" y un array "items". Genera un cronograma Gantt con 8 pasos.`;
             break;
    }
    return `${promptBase}\n${specificInstructions}`;
}

/**
 * Extrae el primer objeto JSON válido de una cadena de texto.
 */
function extractJson(str) {
    let firstOpen = str.indexOf('{'); if (firstOpen === -1) return null;
    let openBraces = 0, jsonEnd = -1;
    for (let i = firstOpen; i < str.length; i++) { if (str[i] === '{') openBraces++; else if (str[i] === '}') openBraces--; if (openBraces === 0) { jsonEnd = i + 1; break; } }
    if (jsonEnd !== -1) { try { return JSON.parse(str.substring(firstOpen, jsonEnd)); } catch (e) { return null; } } return null;
}

/**
 * Renderiza el objeto de protocolo en el DOM y añade los botones de acción.
 */

function renderProtocol(data) {
    const outputDiv = document.getElementById("protocolOutput");
    const actionButtonsDiv = document.getElementById("actionButtons");
    if (!data || !data.metadata || !data.secciones) { return outputDiv.innerHTML = '<p style="color: orange;">El protocolo generado no tiene la estructura esperada.</p>'; }

    let html = `<div class="protocol-header"><h1>PROTOCOLO: ${data.metadata.titulo||"Sin Título"}</h1><p><strong>Código:</strong> ${data.metadata.protocoloCodigo||"HECAM-XX-PR-XXX"}</p><p><strong>Versión:</strong> ${data.metadata.version||"1.0"} | <strong>Unidad Responsable:</strong> ${data.metadata.unidadResponsable.nombre||"N/A"}</p><p><strong>Fecha de Elaboración:</strong> ${data.metadata.fechaElaboracion||"N/A"}</p></div><hr>`;
    const sectionKeys = ["justificacion", "objetivos", "glosario", "procedimiento", "nivelesEvidencia", "algoritmosFlujogramas", "indicadores", "bibliografia", "anexos"];
    
    sectionKeys.forEach(key => {
        const section = data.secciones[key];
        html += `<section><h2>${section.titulo || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</h2>`;
        
        if (!isSectionGenerated(key)) {
            html += '<p style="color: orange;"><em>Contenido aún no generado.</em></p>';
        } else {
            if (section.markdownContent) { html += marked.parse(section.markdownContent); }
            if (Array.isArray(section.tablaRecomendaciones)) {
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
            if (Array.isArray(section.flujogramas) && section.flujogramas.length > 0) {
                 section.flujogramas.forEach((flujo) => { 
                    if (flujo.descripcion_mermaid) {
                        html += `<h4>${flujo.tituloFigura || "Flujograma"}</h4><div class="mermaid">${flujo.descripcion_mermaid}</div>`; 
                    }
                });
            }
            if (Array.isArray(section.items)) {
                if (key === "indicadores") {
                    html += "<table><thead><tr><th>Nombre</th><th>Definición</th><th>Cálculo</th><th>Meta</th><th>Periodo</th><th>Responsable</th></tr></thead><tbody>";
                    section.items.forEach(item => { html += `<tr><td>${item.nombre || "N/A"}</td><td>${item.definicion || "N/A"}</td><td>${item.calculo || "N/A"}</td><td>${item.meta || "N/A"}</td><td>${item.periodo || "N/A"}</td><td>${item.responsable || "N/A"}</td></tr>`; });
                    html += "</tbody></table>";
                } else if (key === "anexos") {
                    section.items.forEach(item => {
                        if (item.tituloAnexo) html += `<h3>${item.tituloAnexo}</h3>`;
                        if (item.tipo === "tabla_gantt" && Array.isArray(item.tareas)) {
                            html += "<table><thead><tr><th>ID</th><th>Tarea</th><th>Comienzo</th><th>Fin</th></tr></thead><tbody>";
                            item.tareas.forEach(task => { html += `<tr><td>${task.id}</td><td>${task.nombre}</td><td>${task.inicio}</td><td>${task.fin}</td></tr>`; });
                            html += "</tbody></table>";
                        }
                    });
                }
            }
            if (Array.isArray(section.referencias)) {
                 html += "<h4>Referencias</h4><ol>";
                 section.referencias.forEach(ref => {
                     // **CORRECCIÓN FINAL PARA BIBLIOGRAFÍA**
                     // Si el LLM insiste en mandar un objeto, intentamos extraer la información.
                     if (typeof ref === 'object' && ref !== null) {
                         html += `<li>${Object.values(ref).join(' ')}</li>`;
                     } else {
                         html += `<li>${ref}</li>`;
                     }
                 });
                 html += "</ol>";
            }
        }
        html += `</section>`;
    });
    outputDiv.innerHTML = html;
    actionButtonsDiv.innerHTML = '<button onclick="copyHtml()">Copiar HTML</button><button onclick="downloadHtml()">Descargar como HTML</button>';
    setTimeout(() => { try { if (window.mermaid) { window.mermaid.run(); } } catch (e) { console.error("Error al renderizar Mermaid:", e); } }, 100);
}

function renderValue(value) {if(Array.isArray(value)){let listHtml="<ul>";value.forEach(item=>{listHtml+=`<li>${renderValue(item)}</li>`});listHtml+="</ul>";return listHtml}if("object"==typeof value&&null!==value){if(value.nombre&&value.link)return`${value.nombre} (<a href='${value.link}' target='_blank' rel='noopener noreferrer'>Ir a la calculadora</a>)`;let objectHtml='<ul style="list-style-type: none; padding-left: 15px;">';for(const[key,val]of Object.entries(value)){const formattedKey=key.replace(/([A-Z])/g," $1").replace(/^./,str=>str.toUpperCase());objectHtml+=`<li><em>${formattedKey}:</em> ${renderValue(val)}</li>`}return objectHtml+="</ul>"}return value}
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
