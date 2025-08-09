// =============================================================================
//  SCRIPT.JS - VERSIÓN FINAL Y COMPLETA (ESTRATEGIA 100% MARKDOWN)
// =============================================================================

let protocolData = null; // Estado global para el protocolo en construcción

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM listo. Aplicación iniciada.");
    const generateButton = document.getElementById('generateButton');
    if (generateButton) {
        generateButton.addEventListener('click', generateProtocolStructure);
    } else {
        console.error("Error CRÍTICO: No se encontró el botón con id='generateButton'.");
    }
});

function generateProtocolStructure() {
    const protocolTitle = document.getElementById('protocolTitle').value.trim();
    if (!protocolTitle) { alert("Por favor, ingrese un título para el protocolo."); return; }
    
    document.getElementById('loader').style.display = 'block';
    document.getElementById('protocolStructure').innerHTML = '';
    document.getElementById('protocolOutput').style.display = 'none';
    document.getElementById('actionButtons').innerHTML = '';

    protocolData = createBaseStructure(protocolTitle);
    renderStructureUI();
    document.getElementById('loader').style.display = 'none';
}

function createBaseStructure(title) {
    const medicalUnit = document.getElementById('medicalUnit').value;
    return {
        metadata: { 
            titulo: title, 
            version: "1.0",
            unidadResponsable: { nombre: `Unidad Técnica de ${medicalUnit}` },
            fechaElaboracion: new Date().toISOString().slice(0, 10)
        },
        secciones: {
            justificacion: { titulo: "1. Justificación y Alcance", markdownContent: null },
            objetivos: { titulo: "2. Objetivos", markdownContent: null },
            glosario: { titulo: "3. Glosario y Definiciones", markdownContent: null },
            procedimiento: { titulo: "4. Procedimiento", markdownContent: null },
            nivelesEvidencia: { titulo: "5. Niveles de Evidencia (GRADE)", markdownContent: null },
            algoritmosFlujogramas: { titulo: "6. Algoritmo de Actuación", markdownContent: null },
            indicadores: { titulo: "7. Indicadores de Calidad", markdownContent: null },
            bibliografia: { titulo: "8. Bibliografía", markdownContent: null },
            anexos: { titulo: "9. Anexos", markdownContent: null }
        }
    };
}

function renderStructureUI() {
    const container = document.getElementById('protocolStructure');
    container.innerHTML = '<h3>Estructura del Protocolo (Generar contenido por sección):</h3>';
    for (const key in protocolData.secciones) {
        container.innerHTML += `<div class="section-generator" id="gen-${key}"><span>${protocolData.secciones[key].titulo}</span><button onclick="generateSectionContent('${key}')">Generar</button></div>`;
    }
    container.innerHTML += `<div class="section-generator" id="gen-all"><span><strong>GENERAR TODO EL PROTOCOLO</strong></span><button onclick="generateAllSections()">Generar Todo</button></div>`;
}

async function generateAllSections() {
    const allButtons = document.querySelectorAll('.section-generator button');
    allButtons.forEach(btn => btn.disabled = true);
    for (const sectionKey of Object.keys(protocolData.secciones)) {
        if (!protocolData.secciones[sectionKey].markdownContent) {
            await generateSectionContent(sectionKey);
        }
    }
    allButtons.forEach(btn => btn.disabled = false);
    document.getElementById('gen-all').querySelector('button').textContent = 'Generar Todo';
}

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
        const prompt = getSpecializedPrompt(sectionKey, protocolData.metadata.titulo);
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

        if(!generatedContent || !generatedContent[sectionKey] || !generatedContent[sectionKey].markdownContent){
            throw new Error("La respuesta del modelo no tuvo el formato JSON esperado. Respuesta: " + rawText);
        }

        protocolData.secciones[sectionKey] = generatedContent[sectionKey];
        
        sectionDiv.innerHTML = `<span>${protocolData.secciones[sectionKey].titulo}</span> <span class="status">✓ Generado</span>`;
        
        document.getElementById('protocolOutput').style.display = 'block';
        renderProtocol(protocolData);

    } catch (error) {
        console.error(`Error generando la sección ${sectionKey}:`, error);
        sectionDiv.innerHTML = `<span>${protocolData.secciones[sectionKey].titulo}</span> <span class="error">✗ Error</span> <button onclick="generateSectionContent('${sectionKey}')">Reintentar</button>`;
    }
}

function getSpecializedPrompt(sectionKey, protocolTitle) {
    const promptBase = `**Rol:** Eres un experto en redacción de protocolos médicos para el Hospital HECAM en Quito, Ecuador.\n` +
                     `**Tarea:** Genera el contenido para la sección "${sectionKey}" de un protocolo sobre "${protocolTitle}".\n` +
                     `**Formato de Salida:** Debes responder ÚNICAMENTE con un objeto JSON que contenga una sola clave principal: "${sectionKey}". El valor de esta clave debe ser un objeto con dos claves: "titulo" y "markdownContent".\n`;

    let specificInstructions = '';

    switch (sectionKey) {
        case 'justificacion':
            specificInstructions = `En "markdownContent", escribe un texto detallado para la justificación, usando subtítulos (###) para "Carga Global y Local", "Relevancia en HECAM", y "Desafío de la Altitud".`;
            break;
        case 'objetivos':
            specificInstructions = `En "markdownContent", crea dos listas con subtítulos (###): "Objetivos Generales" (2-3 puntos) y "Objetivos Específicos" (5-6 puntos detallados).`;
            break;
        case 'glosario':
            specificInstructions = `En "markdownContent", crea una lista de definiciones para 10-15 términos clave sobre "${protocolTitle}". Formato: **Término:** Definición.`;
            break;
        case 'procedimiento':
            specificInstructions = `En "markdownContent", detalla el procedimiento completo, usando subtítulos (###) para "Evaluación Inicial", "Manejo Terapéutico", "Monitorización" y "Criterios de Alta". Usa listas anidadas para los detalles (ej. para exámenes de laboratorio).`;
            break;
        case 'nivelesEvidencia':
            specificInstructions = `En "markdownContent", crea una tabla en formato Markdown para las recomendaciones GRADE. La tabla debe tener las columnas: "Área", "Recomendación", "Nivel de Evidencia", "Fuerza de Recomendación". Genera 4-6 recomendaciones completas. Después, añade un subtítulo "### Interpretación GRADE" y explica los niveles.`;
            break;
        case 'algoritmosFlujogramas':
            specificInstructions = `En "markdownContent", crea un subtítulo "### Algoritmo de Diagnóstico y Tratamiento". Luego, en un bloque de código Markdown (\`\`\`mermaid), escribe el código Mermaid.js para un diagrama de flujo simple pero completo sobre el manejo de "${protocolTitle}". Asegúrate de que la sintaxis sea correcta.`;
            break;
        case 'indicadores':
            specificInstructions = `En "markdownContent", crea una tabla en formato Markdown con los indicadores de calidad. Columnas: "Nombre", "Definición", "Cálculo", "Meta", "Periodo", "Responsable". Genera 3-5 indicadores completos y realistas, sin usar 'N/A'.`;
            break;
        case 'bibliografia':
            specificInstructions = `En "markdownContent", crea una lista numerada con 10-15 referencias bibliográficas recientes y relevantes en formato Vancouver.`;
            break;
        case 'anexos':
             specificInstructions = `En "markdownContent", crea un subtítulo "### Anexo 1: Cronograma de Implementación" y luego una tabla en formato Markdown con 8 pasos para la implementación del protocolo. Columnas: "ID", "Tarea", "Comienzo", "Fin".`;
             break;
    }
    
    return `${promptBase}\n${specificInstructions}`;
}


function extractJson(str) {
    let firstOpen = str.indexOf('{'); if (firstOpen === -1) return null;
    let openBraces = 0, jsonEnd = -1;
    for (let i = firstOpen; i < str.length; i++) { if (str[i] === '{') openBraces++; else if (str[i] === '}') openBraces--; if (openBraces === 0) { jsonEnd = i + 1; break; } }
    if (jsonEnd !== -1) { try { return JSON.parse(str.substring(firstOpen, jsonEnd)); } catch (e) { return null; } } return null;
}

function renderProtocol(data) {
    const outputDiv = document.getElementById("protocolOutput");
    const actionButtonsDiv = document.getElementById("actionButtons");
    if (!data || !data.metadata || !data.secciones) {
        outputDiv.innerHTML = '<p style="color: orange;">El protocolo generado no tiene la estructura esperada.</p>';
        return;
    }

    let html = `<div class="protocol-header"><h1>PROTOCOLO: ${data.metadata.titulo || "Sin Título"}</h1><p><strong>Código:</strong> ${data.metadata.protocoloCodigo || "HECAM-XX-PR-XXX"}</p><p><strong>Versión:</strong> ${data.metadata.version || "1.0"} | <strong>Unidad Responsable:</strong> ${data.metadata.unidadResponsable.nombre || "N/A"}</p><p><strong>Fecha de Elaboración:</strong> ${data.metadata.fechaElaboracion || "N/A"}</p></div><hr>`;
    
    const sectionKeys = ["justificacion", "objetivos", "glosario", "procedimiento", "nivelesEvidencia", "algoritmosFlujogramas", "indicadores", "bibliografia", "anexos"];

    sectionKeys.forEach(key => {
        const section = data.secciones[key];
        html += `<section><h2>${section.titulo || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</h2>`;
        
        const isGenerated = section && (section.markdownContent || section.tablaRecomendaciones || section.flujogramas || section.items || section.referencias);

        if (!isGenerated) {
            html += '<p style="color: orange;"><em>Contenido aún no generado.</em></p>';
        } else {
            if (section.markdownContent) {
                const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
                let mermaidCodes = [];
                const contentWithPlaceholders = section.markdownContent.replace(mermaidRegex, (match, code) => {
                    const mermaidId = `mermaid-${key}-${mermaidCodes.length}`;
                    mermaidCodes.push({ id: mermaidId, code: code.trim() });
                    return `<div class="mermaid" id="${mermaidId}"></div>`;
                });

                html += marked.parse(contentWithPlaceholders);

                setTimeout(() => {
                    mermaidCodes.forEach(mc => {
                        try {
                            const diagramContainer = document.getElementById(mc.id);
                            if (diagramContainer && window.mermaid) {
                               mermaid.render(mc.id + '-svg', mc.code, (svgCode) => {
                                   diagramContainer.innerHTML = svgCode;
                               });
                            }
                        } catch (e) {
                            console.error("Error renderizando Mermaid:", e);
                            const diagramContainer = document.getElementById(mc.id);
                            if(diagramContainer) diagramContainer.innerHTML = `<p style="color:red; font-family: monospace; text-align: left; white-space: pre-wrap;"><strong>Error de sintaxis en el diagrama. Código recibido:</strong>\n${mc.code}</p>`;
                        }
                    });
                }, 100);
            }
            if (Array.isArray(section.tablaRecomendaciones)) {
                html += "<table><thead><tr><th>Área</th><th>Recomendación</th><th>Nivel de Evidencia</th><th>Fuerza de Recomendación</th></tr></thead><tbody>";
                section.tablaRecomendaciones.forEach(rec => { html += `<tr><td>${rec.area || "N/A"}</td><td>${rec.recomendacion || "N/A"}</td><td>${rec.nivelEvidencia || "N/A"}</td><td>${rec.fuerzaRecomendacion || "N/A"}</td></tr>`; });
                html += "</tbody></table>";
            }
            if (section.interpretacion) {
                html += `<h3>${section.interpretacion.titulo || "Interpretación GRADE"}</h3>`;
                if(section.interpretacion.nivelEvidencia && Array.isArray(section.interpretacion.nivelEvidencia.items)) {
                    html += `<h4>${section.interpretacion.nivelEvidencia.titulo}</h4><ul>`;
                    section.interpretacion.nivelEvidencia.items.forEach(item => { html += `<li><strong>${item.nivel}:</strong> ${item.descripcion}</li>`; });
                    html += `</ul>`;
                }
                if(section.interpretacion.fuerzaRecomendacion && Array.isArray(section.interpretacion.fuerzaRecomendacion.items)) {
                    html += `<h4>${section.interpretacion.fuerzaRecomendacion.titulo}</h4><ul>`;
                    section.interpretacion.fuerzaRecomendacion.items.forEach(item => { html += `<li><strong>${item.fuerza}:</strong> ${item.descripcion}</li>`; });
                    html += `</ul>`;
                }
            }
            if (Array.isArray(section.flujogramas) && section.flujogramas.length > 0) {
                 section.flujogramas.forEach((flujo) => { 
                    if (flujo.descripcion_mermaid) {
                        const mermaidId = `mermaid-direct-${Math.random()}`;
                        html += `<h4>${flujo.tituloFigura || "Flujograma"}</h4><div class="mermaid" id="${mermaidId}"></div>`; 
                        setTimeout(() => {
                            try {
                                const diagramContainer = document.getElementById(mermaidId);
                                if(diagramContainer && window.mermaid) {
                                    mermaid.render(mermaidId + '-svg', flujo.descripcion_mermaid, (svgCode) => {
                                        diagramContainer.innerHTML = svgCode;
                                    });
                                }
                            } catch(e) {
                                console.error("Error renderizando Mermaid directo:", e);
                                const diagramContainer = document.getElementById(mermaidId);
                                if(diagramContainer) diagramContainer.innerHTML = `<p style="color:red; font-family: monospace; text-align: left; white-space: pre-wrap;"><strong>Error de sintaxis en el diagrama. Código recibido:</strong>\n${flujo.descripcion_mermaid}</p>`;
                            }
                        }, 100);
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
            // --- CORRECCIÓN FINAL PARA BIBLIOGRAFÍA ---
            if (Array.isArray(section.referencias)) {
                 html += "<h4>Referencias</h4><ol>";
                 section.referencias.forEach(ref => {
                     // Si el LLM insiste en mandar un objeto, intentamos formatearlo.
                     if (typeof ref === 'object' && ref !== null) {
                         // Unir los valores del objeto en un string coherente.
                         const authors = ref.autores || (Array.isArray(ref.autor) ? ref.autor.join(', ') : (ref.autor || ''));
                         const title = ref.titulo || '';
                         const journal = ref.revista || ref.fuente || '';
                         const year = ref.anio || '';
                         const details = ref.volumen_pagina || ref.doi || '';
                         html += `<li>${[authors, title, journal, year, details].filter(Boolean).join('. ')}.</li>`;
                     } else {
                         html += `<li>${ref}</li>`; // Si es un string, lo muestra directamente
                     }
                 });
                 html += "</ol>";
            }
        }
        html += `</section>`;
    });

    outputDiv.innerHTML = html;
    actionButtonsDiv.innerHTML = '<button onclick="copyHtml()">Copiar HTML</button><button onclick="downloadHtml()">Descargar como HTML</button>';
}
function copyHtml() {
    const protocolHtml = document.getElementById('protocolOutput').innerHTML;
    navigator.clipboard.writeText(protocolHtml).then(() => {
        alert('¡HTML del protocolo copiado al portapapeles!');
    }).catch(() => alert('Error al copiar.'));
}

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
