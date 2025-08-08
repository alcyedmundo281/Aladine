// =============================================================================
//  SCRIPT.JS - VERSIÓN FINAL UNIFICADA Y CORREGIDA
// =============================================================================

// Espera a que el DOM esté completamente cargado para iniciar la app.
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM listo. Inicializando la aplicación...");

    const generateButton = document.getElementById('generateButton');
    
    if (generateButton) {
        console.log("Botón 'Generar Protocolo' encontrado y evento asociado.");
        generateButton.addEventListener('click', generateProtocol);
    } else {
        console.error("Error CRÍTICO: No se encontró el botón con id='generateButton'.");
        alert("Error de inicialización: El botón de generar no se encuentra.");
        return;
    }

    // Carga el último protocolo guardado si existe.
    try {
        const savedProtocol = localStorage.getItem('lastGeneratedProtocol');
        if (savedProtocol) {
            console.log("Protocolo guardado encontrado. Renderizando...");
            const protocolData = JSON.parse(savedProtocol);
            renderProtocol(protocolData);
            document.getElementById('protocolTitle').value = protocolData.metadata.titulo;
            const unitName = protocolData.metadata.unidadResponsable.nombre.replace('Unidad Técnica de ', '');
            document.getElementById('medicalUnit').value = unitName;
        }
    } catch (e) {
        console.error("Error al cargar datos desde Local Storage:", e);
        localStorage.removeItem('lastGeneratedProtocol');
    }
});

/**
 * Función principal que se activa al hacer clic en el botón.
 */
async function generateProtocol() {
    console.log("Botón presionado. Iniciando generación de protocolo.");
    
    const protocolTitle = document.getElementById('protocolTitle').value.trim();
    const medicalUnit = document.getElementById('medicalUnit').value;
    const apiKey = document.getElementById('apiKey').value.trim();
    const loader = document.getElementById('loader');
    const outputDiv = document.getElementById('protocolOutput');
    const actionButtonsDiv = document.getElementById('actionButtons');

    if (!protocolTitle || !medicalUnit || !apiKey) {
        alert("Por favor, complete todos los campos: Título, Unidad Médica y API Key.");
        return;
    }

    actionButtonsDiv.innerHTML = '';
    outputDiv.innerHTML = '';
    loader.style.display = 'block';

    const modelName = 'gemini-1.5-flash-latest';

    try {
        const [htaResponse, nacResponse] = await Promise.all([
            fetch('hipertension_arterial_example.json'),
            fetch('neumonia_comunitaria_example.json')
        ]);

        if (!htaResponse.ok) throw new Error(`Fallo al cargar 'hipertension_arterial_example.json' (Estado: ${htaResponse.status})`);
        if (!nacResponse.ok) throw new Error(`Fallo al cargar 'neumonia_comunitaria_example.json' (Estado: ${nacResponse.status})`);
        
        const htaExample = await htaResponse.json();
        const nacExample = await nacResponse.json();
        
        const prompt = createGeminiPromptWithExamples(protocolTitle, medicalUnit, htaExample, nacExample);
        
        const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                "generationConfig": {
                    "temperature": 0.4,
                    "maxOutputTokens": 16384, // Límite de tokens aumentado
                }
            })
        });

        const responseData = await apiResponse.json();

        if (!apiResponse.ok) {
            let errorMessage = `Error ${apiResponse.status}: ${apiResponse.statusText}`;
            if (responseData && responseData.error && responseData.error.message) {
                errorMessage += ` - ${responseData.error.message}`;
            }
            throw new Error(errorMessage);
        }
        
        if (!responseData.candidates || !responseData.candidates[0].content) {
            const reason = (responseData.promptFeedback && responseData.promptFeedback.blockReason) || "Razón desconocida";
            const finishReason = responseData.candidates[0].finishReason;
            if (finishReason === 'MAX_TOKENS') {
                throw new Error(`La respuesta de la API fue cortada porque excedió el límite máximo de tokens. El protocolo está incompleto.`);
            }
            throw new Error(`La respuesta de la API fue bloqueada o está vacía. Razón: ${reason}.`);
        }
        
        const rawText = responseData.candidates[0].content.parts[0].text;
        const protocolData = extractJson(rawText);

        if (!protocolData) {
            console.error("Respuesta cruda de la API que no pudo ser parseada:", rawText);
            throw new Error("La respuesta de la API no contenía un JSON válido que pudiera ser extraído.");
        }
        
        localStorage.setItem('lastGeneratedProtocol', JSON.stringify(protocolData));
        renderProtocol(protocolData);

    } catch (error) {
        console.error('Error detallado en generateProtocol:', error);
        outputDiv.innerHTML = `<p style="color: red;"><strong>Ocurrió un error:</strong> ${error.message}. <br><strong>Posibles causas:</strong><br>1. La API Key es inválida o tiene restricciones.<br>2. Los archivos JSON de ejemplo no se encuentran en la misma carpeta.<br>3. Problema de red.<br><strong>Revisa la consola (F12) para más detalles.</strong></p>`;
    } finally {
        loader.style.display = 'none';
    }
}


/**
 * Extrae el primer objeto JSON válido de una cadena de texto.
 * @param {string} str - La cadena que contiene el JSON.
 * @returns {object|null} - El objeto JSON parseado o null si no se encuentra.
 */
function extractJson(str) {
    let firstOpen = str.indexOf('{');
    if (firstOpen === -1) return null;
    
    let openBraces = 0;
    let jsonEnd = -1;

    for (let i = firstOpen; i < str.length; i++) {
        if (str[i] === '{') {
            openBraces++;
        } else if (str[i] === '}') {
            openBraces--;
        }
        if (openBraces === 0) {
            jsonEnd = i + 1;
            break;
        }
    }
    
    if (jsonEnd !== -1) {
        try {
            const finalJsonString = str.substring(firstOpen, jsonEnd);
            return JSON.parse(finalJsonString);
        } catch (finalError) {
            console.error("No se pudo parsear el JSON extraído.", finalError);
            return null;
        }
    }
    return null;
}

/**
 * Renderiza el objeto de protocolo en el DOM y añade los botones de acción.
 * @param {object} data - El objeto JSON completo del protocolo.
 */
function renderProtocol(data) {
    const outputDiv = document.getElementById('protocolOutput');
    const actionButtonsDiv = document.getElementById('actionButtons');

    if (!data || !data.metadata || !data.secciones) {
        outputDiv.innerHTML = `<p style="color: orange;">El protocolo generado no tiene la estructura esperada.</p>`;
        return;
    }

    let html = `<div class="protocol-header"><h1>PROTOCOLO: ${data.metadata.titulo || 'Sin Título'}</h1><p><strong>Código:</strong> ${data.metadata.protocoloCodigo || 'HECAM-XX-PR-XXX'}</p><p><strong>Versión:</strong> ${data.metadata.version || '1.0'} | <strong>Unidad Responsable:</strong> ${data.metadata.unidadResponsable.nombre || 'N/A'}</p><p><strong>Fecha de Elaboración:</strong> ${data.metadata.fechaElaboracion || 'N/A'}</p></div><hr>`;
    
    const sectionKeys = ['justificacion', 'objetivos', 'glosario', 'procedimiento', 'algoritmosFlujogramas', 'indicadores', 'bibliografia'];

    sectionKeys.forEach(key => {
        const section = data.secciones[key];
        if (!section || !section.titulo) {
            html += `<section><h2>${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</h2><p style="color: orange;"><em>Esta sección no fue generada por el modelo.</em></p></section>`;
            return;
        }

        html += `<section><h2>${section.titulo}</h2>`;

        // Renderizado de contenido simple
        if (section.contenido) {
            if (section.contenido.problemaSaludPublica) html += `<p>${section.contenido.problemaSaludPublica}</p>`;
            if (section.contenido.prevalencia && section.contenido.prevalencia.institucional_hecam) html += `<p><strong>Prevalencia Institucional:</strong> ${section.contenido.prevalencia.institucional_hecam}</p>`;
            if (section.contenido.poblacionObjetivo) html += `<p><strong>Población Objetivo:</strong> ${section.contenido.poblacionObjetivo}</p>`;
            if (Array.isArray(section.contenido.unidadesInvolucradas)) html += `<p><strong>Unidades Involucradas:</strong> ${section.contenido.unidadesInvolucradas.join(', ')}</p>`;
            if (Array.isArray(section.contenido.resultadosEsperados)) { html += `<strong>Resultados Esperados:</strong><ul>${section.contenido.resultadosEsperados.map(item => `<li>${item}</li>`).join('')}</ul>`; }
        }
        if (section.general) html += `<p><strong>Objetivo General:</strong> ${section.general}</p>`;
        if (Array.isArray(section.especificos)) { html += `<strong>Objetivos Específicos:</strong><ul>${section.especificos.map(obj => `<li>${obj}</li>`).join('')}</ul>`; }
        if (Array.isArray(section.terminos)) { html += '<ul>'; section.terminos.forEach(term => html += `<li><strong>${term.abreviatura || term.termino}:</strong> ${term.definicion}</li>`); html += '</ul>'; }

        // --- INICIO DE LA LÓGICA DE RENDERIZADO RECURSIVA Y CORREGIDA ---
        function renderValue(value) {
            if (Array.isArray(value)) {
                let listHtml = '<ul>';
                value.forEach(item => {
                    listHtml += `<li>${renderValue(item)}</li>`;
                });
                listHtml += '</ul>';
                return listHtml;
            } else if (typeof value === 'object' && value !== null) {
                if (value.nombre && value.link) { // Caso especial para calculadoras
                    return `${value.nombre} (<a href='${value.link}' target='_blank' rel='noopener noreferrer'>Ir a la calculadora</a>)`;
                }
                let objectHtml = '<ul style="list-style-type: none; padding-left: 15px;">';
                for (const [key, val] of Object.entries(value)) {
                    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    objectHtml += `<li><em>${formattedKey}:</em> ${renderValue(val)}</li>`;
                }
                objectHtml += '</ul>';
                return objectHtml;
            } else {
                return value; // Es un string, número, etc.
            }
        }
        
        if (section.subsecciones) {
            Object.values(section.subsecciones).forEach(sub => {
                if (!sub || !sub.titulo) return;
                html += `<h3>${sub.titulo}</h3>`;
                for (const [key, value] of Object.entries(sub)) {
                    if (key === 'titulo') continue;
                    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    html += `<strong>${formattedKey}:</strong>`;
                    html += renderValue(value);
                }
            });
        }
        // --- FIN DE LA LÓGICA DE RENDERIZADO CORREGIDA ---

        if (Array.isArray(section.flujogramas) && section.flujogramas.length > 0) {
             section.flujogramas.forEach((flujo) => { html += `<h4>${flujo.tituloFigura || 'Flujograma'}</h4>`; html += `<div class="mermaid">${flujo.descripcion_mermaid}</div>`; });
        }
        if (Array.isArray(section.items) && section.items.length > 0) {
            html += '<table><thead><tr>';
            const headers = Object.keys(section.items[0]);
            headers.forEach(header => html += `<th>${header.charAt(0).toUpperCase() + header.slice(1)}</th>`);
            html += '</tr></thead><tbody>';
            section.items.forEach(item => { html += '<tr>'; headers.forEach(header => html += `<td>${item[header] || 'N/A'}</td>`); html += '</tr>'; });
            html += '</tbody></table>';
        }
        if (Array.isArray(section.referencias) && section.referencias.length > 0) {
             html += '<h4>Referencias</h4><ol>'; section.referencias.forEach(ref => html += `<li>${ref}</li>`); html += '</ol>';
        } else if (key === 'bibliografia' && (!section.referencias || section.referencias.length === 0)) {
            html += `<p style="color: orange;"><em>No se generaron referencias bibliográficas.</em></p>`;
        }
        
        html += `</section>`;
    });

    outputDiv.innerHTML = html;
    
    actionButtonsDiv.innerHTML = `<button onclick="copyHtml()">Copiar HTML</button><button onclick="downloadHtml()">Descargar como HTML</button>`;

    setTimeout(() => { 
        try { 
            if (window.mermaid) { 
                document.querySelectorAll('.mermaid').forEach(el => el.removeAttribute('data-processed')); 
                window.mermaid.run(); 
            } 
        } catch (e) { 
            console.error("Error al renderizar Mermaid:", e); 
        } 
    }, 100);
}

/**
 * Copia el contenido HTML del protocolo al portapapeles.
 */
function copyHtml() {
    const protocolHtml = document.getElementById('protocolOutput').innerHTML;
    navigator.clipboard.writeText(protocolHtml).then(() => {
        alert('¡HTML del protocolo copiado al portapapeles!');
    }).catch(err => {
        console.error('Error al copiar el HTML: ', err);
        alert('No se pudo copiar el texto. Revisa la consola.');
    });
}

/**
 * Descarga el protocolo como un archivo .html.
 */
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


/**
 * Crea el prompt para la API de Gemini, incluyendo los ejemplos.
 * @returns {string} - El prompt completo.
 */

function createGeminiPromptWithExamples(newTitle, newUnit, example1, example2) {
    // **NUEVO: Añadimos un ejemplo explícito de código Mermaid simple**
    const mermaidExample = "graph TD; A[Sospecha de Infección] --> B{Evaluar con qSOFA ≥ 2?}; B -- Sí --> C[Iniciar Paquete de 1 Hora: Cultivos, Lactato, Antibióticos, Fluidos]; B -- No --> D[Monitorear y reevaluar]; C --> E[Reevaluación hemodinámica];";

    return `**ROL Y OBJETIVO:**\nEres un asistente médico experto en la redacción de guías clínicas y protocolos hospitalarios para el Hospital de Especialidades Carlos Andrade Marín (HECAM) en Quito, Ecuador. Tu tarea es generar un protocolo completo, basado en evidencia y adaptado al contexto local.\n\n**CONTEXTO CLAVE (DEBE APLICARSE A LA NUEVA GENERACIÓN):**\n1.  **CNMB:** Los medicamentos deben priorizar el Cuadro Nacional de Medicamentos Básicos de Ecuador.\n2.  **ALTITUD:** Siempre que sea relevante (cardio, neumo), añade una nota sobre el impacto de la altitud de Quito (2800m).\n3.  **RECURSOS:** Los recursos y escalas deben ser de acceso libre y validados internacionalmente (ej. MDCalc, calculadoras de sociedades médicas).\n\n**INSTRUCCIÓN:**\nA continuación se presentan dos ejemplos completos de protocolos. Analiza su estructura, nivel de detalle y tono clínico. Luego, genera un **NUEVO** protocolo siguiendo **EXACTAMENTE** el mismo formato y calidad.\n
    **IMPORTANTE PARA EL ALGORITMO:** Para la clave "descripcion_mermaid", debes generar un código de diagrama de flujo simple y sintácticamente correcto para Mermaid.js, siguiendo este formato: \`${mermaidExample}\`\n
    ---\n**EJEMPLO 1:**\n${JSON.stringify(example1, null, 2)}\n---\n\n---\n**EJEMPLO 2:**\n${JSON.stringify(example2, null, 2)}\n---\n\n**TAREA FINAL:**\nAhora, genera un nuevo protocolo en formato JSON válido.\n- **Título del Protocolo:** "${newTitle}"\n- **Unidad Médica Responsable:** "Unidad Técnica de ${newUnit}"\n\n**RECORDATORIO CRÍTICO: Es imperativo que completes TODAS las secciones del JSON, incluyendo algoritmos, indicadores y bibliografía, basándote en la evidencia actual para el tema solicitado. No dejes ninguna sección vacía.**\n\nTu respuesta debe ser **ÚNICAMENTE el objeto JSON completo y válido** para el nuevo protocolo, sin ningún texto, formato markdown o explicación adicional.`;
}
