// =============================================================================
//  SCRIPT.JS - VERSIÓN FINAL (ESTRATEGIA 100% MARKDOWN)
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
    const mermaidExample = "graph TD; A[Sospecha de SIADH] --> B{Evaluar Criterios Diagnósticos}; B -- Sí --> C[Iniciar Manejo]; B -- No --> D[Buscar Otra Causa de Hiponatremia];";
    const promptBase = `**Rol:** Eres un experto en redacción de protocolos médicos para el Hospital HECAM en Quito, Ecuador.\n` +
                     `**Tarea:** Genera SOLAMENTE la sección "${sectionKey}" para un protocolo sobre "${protocolTitle}".\n` +
                     `**Formato de Salida:** Debes responder ÚNICAMENTE con un objeto JSON que contenga una sola clave principal: "${sectionKey}".\n`;

    let specificInstructions = '';

    switch (sectionKey) {
        // ... (casos para justificacion, objetivos, glosario, procedimiento que ya funcionan bien)
        case 'justificacion':
        case 'objetivos':
        case 'glosario':
        case 'procedimiento':
            specificInstructions = `El valor de la clave "${sectionKey}" debe ser un objeto con "titulo" y "markdownContent". En "markdownContent", escribe el texto completo y detallado usando formato Markdown (### Título, **Negrita**, - Lista). Sé muy detallado y exhaustivo, como en el ejemplo de Sepsis.`;
            break;
        case 'nivelesEvidencia':
            specificInstructions = `El valor de la clave debe ser un objeto con "titulo", un array "tablaRecomendaciones" (con 4-6 objetos), y un objeto "interpretacion" con la explicación de GRADE.`;
            break;

        // --- INICIO DE LAS CORRECCIONES FINALES ---
        case 'algoritmosFlujogramas':
            specificInstructions = `**Detalles para '${sectionKey}':** El valor de la clave debe ser un objeto con "titulo" y un array "flujogramas". Genera un objeto de flujograma con "tituloFigura" y "descripcion_mermaid". El valor de "descripcion_mermaid" DEBE ser un string de una sola línea, sintácticamente correcto para Mermaid.js, como este ejemplo: \`${mermaidExample}\`.`;
            break;

        case 'indicadores':
            specificInstructions = `**Detalles para '${sectionKey}':** El valor de la clave debe ser un objeto con "titulo" y un array "items". Genera 3-5 indicadores de calidad REALISTAS y COMPLETOS para monitorizar el protocolo de "${protocolTitle}". Cada indicador debe ser un objeto con "nombre", "definicion", "calculo", "meta", "periodo", y "responsable". Es crucial que inventes contenido realista para cada campo y no dejes ninguno como 'N/A'. **Ejemplo de un item:** {"nombre": "Tiempo hasta corrección de sodio", "definicion": "Tiempo promedio en horas para aumentar el sodio sérico en 4-6 mEq/L en casos severos.", "calculo": "Promedio de horas", "meta": "< 24 horas", "periodo": "Trimestral", "responsable": "Jefe de Medicina Interna"}`;
            break;

        case 'bibliografia':
            specificInstructions = `**Detalles para '${sectionKey}':** El valor de la clave debe ser un objeto con "titulo" y un array "referencias". Cada elemento del array "referencias" DEBE SER UN OBJETO con las claves "autores", "titulo", "revista", "anio", y "volumen_pagina". Genera entre 10 y 15 referencias.`;
            break;
        // --- FIN DE CORRECCIONES ---
        
        case 'anexos':
             specificInstructions = `**Detalles para '${sectionKey}':** El valor de la clave debe ser un objeto con "titulo" y un array "items". Genera un cronograma Gantt con 8 pasos.`;
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
    if (!data || !data.metadata || !data.secciones) { return outputDiv.innerHTML = '<p style="color: orange;">El protocolo generado no tiene la estructura esperada.</p>'; }

    let html = `<div class="protocol-header"><h1>PROTOCOLO: ${data.metadata.titulo||"Sin Título"}</h1><p><strong>Código:</strong> ${data.metadata.protocoloCodigo||"HECAM-XX-PR-XXX"}</p><p><strong>Versión:</strong> ${data.metadata.version||"1.0"} | <strong>Unidad Responsable:</strong> ${data.metadata.unidadResponsable.nombre||"N/A"}</p><p><strong>Fecha de Elaboración:</strong> ${data.metadata.fechaElaboracion||"N/A"}</p></div><hr>`;
    const sectionKeys = ["justificacion", "objetivos", "glosario", "procedimiento", "nivelesEvidencia", "algoritmosFlujogramas", "indicadores", "bibliografia", "anexos"];
    
    sectionKeys.forEach(key => {
        const section = data.secciones[key];
        html += `<section><h2>${section.titulo || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</h2>`;
        
        const isGenerated = section && Object.keys(section).length > 1; // Verifica si hay más que solo el título

        if (!isGenerated) {
            html += '<p style="color: orange;"><em>Contenido aún no generado.</em></p>';
        } else {
            if (section.markdownContent) {
                const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
                let mermaidCodes = [];
                const contentWithPlaceholders = section.markdownContent.replace(mermaidRegex, (match, code) => {
                    const mermaidId = `mermaid-${key}-${mermaidCodes.length}`;
                    mermaidCodes.push({ id: mermaidId, code: code });
                    return `<div class="mermaid" id="${mermaidId}"></div>`;
                });
                html += marked.parse(contentWithPlaceholders);
                setTimeout(() => {
                    mermaidCodes.forEach(mc => {
                        try {
                            const diagramContainer = document.getElementById(mc.id);
                            if (diagramContainer) {
                               mermaid.render(mc.id + '-svg', mc.code, (svgCode) => {
                                   diagramContainer.innerHTML = svgCode;
                               });
                            }
                        } catch(e) { console.error("Error renderizando Mermaid:", e); }
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
                if(section.interpretacion.nivelEvidencia) {
                    html += `<h4>${section.interpretacion.nivelEvidencia.titulo}</h4><ul>`;
                    section.interpretacion.nivelEvidencia.items.forEach(item => { html += `<li><strong>${item.nivel}:</strong> ${item.descripcion}</li>`; });
                    html += `</ul>`;
                }
                if(section.interpretacion.fuerzaRecomendacion) {
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
                                if(diagramContainer) {
                                    mermaid.render(mermaidId + '-svg', flujo.descripcion_mermaid, (svgCode) => {
                                        diagramContainer.innerHTML = svgCode;
                                    });
                                }
                            } catch(e) {
                                console.error("Error renderizando Mermaid directo:", e);
                                const diagramContainer = document.getElementById(mermaidId);
                                if(diagramContainer) diagramContainer.innerHTML = `<p style="color:red">Error de sintaxis en el código del diagrama.</p>`;
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
                     if (typeof ref === 'object' && ref !== null) {
                         // Formatear como referencia Vancouver desde el objeto
                         html += `<li>${ref.autores || ''}. ${ref.titulo || ''}. <em>${ref.revista || ''}</em>. ${ref.anio || ''};${ref.volumen_pagina || ''}.</li>`;
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
    </script>
</body>
</html>
