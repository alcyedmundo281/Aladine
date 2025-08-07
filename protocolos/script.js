// script.js - VERSIÓN CORREGIDA CON FETCH Y MANEJO DE ERRORES DETALLADO

document.addEventListener('DOMContentLoaded', () => {
    // Verificación inicial para asegurar que los elementos del DOM existen
    const generateButton = document.getElementById('generateButton');
    if (generateButton) {
        generateButton.addEventListener('click', generateProtocol);
    } else {
        console.error("Error crítico: El botón 'generateButton' no se encontró en el DOM.");
        return;
    }

    // Cargar el último protocolo desde el Local Storage
    try {
        const savedProtocol = localStorage.getItem('lastGeneratedProtocol');
        if (savedProtocol) {
            const protocolData = JSON.parse(savedProtocol);
            renderProtocol(protocolData);
            document.getElementById('protocolTitle').value = protocolData.metadata.titulo;
            document.getElementById('medicalUnit').value = protocolData.metadata.unidadResponsable.nombre.replace('Unidad Técnica de ', '');
        }
    } catch (e) {
        console.error("Error al cargar o parsear el protocolo guardado desde Local Storage:", e);
        localStorage.removeItem('lastGeneratedProtocol'); // Limpiar dato corrupto
    }
});

async function generateProtocol() {
    const protocolTitle = document.getElementById('protocolTitle').value.trim();
    const medicalUnit = document.getElementById('medicalUnit').value;
    const apiKey = document.getElementById('apiKey').value.trim();
    const loader = document.getElementById('loader');
    const outputDiv = document.getElementById('protocolOutput');

    if (!protocolTitle || !medicalUnit || !apiKey) {
        alert("Por favor, complete todos los campos: Título, Unidad Médica y API Key.");
        return;
    }

    loader.style.display = 'block';
    outputDiv.innerHTML = '';

    try {
        // **PASO 1: Cargar los archivos JSON de ejemplo**
        console.log("Iniciando carga de archivos JSON de ejemplo...");
        const [htaResponse, nacResponse] = await Promise.all([
            fetch('hipertension_arterial_example.json'),
            fetch('neumonia_comunitaria_example.json')
        ]).catch(networkError => {
            throw new Error(`Error de red al cargar los archivos de ejemplo: ${networkError.message}`);
        });

        if (!htaResponse.ok) throw new Error(`No se pudo cargar 'hipertension_arterial_example.json'. Estado: ${htaResponse.status}`);
        if (!nacResponse.ok) throw new Error(`No se pudo cargar 'neumonia_comunitaria_example.json'. Estado: ${nacResponse.status}`);
        
        const htaExample = await htaResponse.json();
        const nacExample = await nacResponse.json();
        console.log("Archivos JSON de ejemplo cargados exitosamente.");

        // **PASO 2: Crear el prompt para la API**
        const prompt = createGeminiPromptWithExamples(protocolTitle, medicalUnit, htaExample, nacExample);
        console.log("Prompt creado. Enviando a la API de Gemini...");

        // **PASO 3: Llamar a la API de Gemini**
        const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                "generationConfig": {"temperature": 0.4, "maxOutputTokens": 8192}
            })
        });

        const responseData = await apiResponse.json();
        console.log("Respuesta recibida de la API.");

        if (!apiResponse.ok) {
            let errorMessage = `Error ${apiResponse.status}: ${apiResponse.statusText}`;
            if (responseData && responseData.error && responseData.error.message) {
                errorMessage += ` - ${responseData.error.message}`;
            }
            throw new Error(errorMessage);
        }
        
        if (!responseData.candidates || !responseData.candidates.length) {
            let reason = responseData.promptFeedback ? responseData.promptFeedback.blockReason : "Razón desconocida";
             throw new Error(`La respuesta de la API fue bloqueada o está vacía. Razón: ${reason}. Esto suele ocurrir por políticas de seguridad de Google.`);
        }

        const jsonString = responseData.candidates[0].content.parts[0].text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        
        let protocolData;
        try {
            protocolData = JSON.parse(jsonString);
        } catch (parseError) {
            console.error("Error al parsear la respuesta JSON de Gemini:", parseError);
            console.log("Respuesta cruda recibida:", jsonString);
            throw new Error("La respuesta de la API no es un JSON válido. Revisa la consola para ver la respuesta cruda.");
        }

        console.log("Protocolo generado y parseado correctamente. Renderizando...");
        localStorage.setItem('lastGeneratedProtocol', JSON.stringify(protocolData));
        renderProtocol(protocolData);

    } catch (error) {
        console.error('Error detallado en generateProtocol:', error);
        outputDiv.innerHTML = `<p style="color: red;"><strong>Ocurrió un error:</strong> ${error.message}. <br><strong>Posibles causas:</strong><br>1. La API Key es inválida o tiene restricciones.<br>2. Los archivos JSON de ejemplo no están en la misma carpeta que 'index.html'.<br>3. Problema de red o la API bloqueó la solicitud.<br><strong>Revisa la consola del navegador (F12) para más detalles.</strong></p>`;
    } finally {
        loader.style.display = 'none';
    }
}

function renderProtocol(data) {
    const outputDiv = document.getElementById('protocolOutput');
    if (!data || !data.metadata || !data.secciones) {
        outputDiv.innerHTML = `<p style="color: orange;">El protocolo generado no tiene la estructura esperada.</p>`;
        return;
    }
    
    let html = `<div class="protocol-header">
                    <h1>PROTOCOLO: ${data.metadata.titulo}</h1>
                    <p><strong>Código:</strong> ${data.metadata.protocoloCodigo || 'HECAM-XX-PR-XXX'}</p>
                    <p><strong>Versión:</strong> ${data.metadata.version} | <strong>Unidad Responsable:</strong> ${data.metadata.unidadResponsable.nombre}</p>
                    <p><strong>Fecha de Elaboración:</strong> ${data.metadata.fechaElaboracion}</p>
                </div><hr>`;

    Object.values(data.secciones).forEach(section => {
        if (!section || !section.titulo) return;
        html += `<section><h2>${section.titulo}</h2>`;

        if (section.contenido) {
            if(section.contenido.problemaSaludPublica) html += `<p>${section.contenido.problemaSaludPublica}</p>`;
            if(section.contenido.prevalencia && section.contenido.prevalencia.institucional_hecam) html += `<p><strong>Prevalencia Institucional:</strong> ${section.contenido.prevalencia.institucional_hecam}</p>`;
            if(section.contenido.poblacionObjetivo) html += `<p><strong>Población Objetivo:</strong> ${section.contenido.poblacionObjetivo}</p>`;
            if(section.contenido.unidadesInvolucradas) html += `<p><strong>Unidades Involucradas:</strong> ${section.contenido.unidadesInvolucradas.join(', ')}</p>`;
            if(section.contenido.resultadosEsperados) {
                html += `<strong>Resultados Esperados:</strong><ul>${section.contenido.resultadosEsperados.map(item => `<li>${item}</li>`).join('')}</ul>`;
            }
        }
        
        if(section.general) html += `<p><strong>Objetivo General:</strong> ${section.general}</p>`;
        if(section.especificos) {
            html += `<strong>Objetivos Específicos:</strong><ul>${section.especificos.map(obj => `<li>${obj}</li>`).join('')}</ul>`;
        }

        if (section.terminos) {
            html += '<ul>';
            section.terminos.forEach(term => html += `<li><strong>${term.abreviatura}:</strong> ${term.definicion}</li>`);
            html += '</ul>';
        }
        
        if (section.subsecciones) {
            Object.values(section.subsecciones).forEach(sub => {
                if (!sub.titulo) return;
                html += `<h3>${sub.titulo}</h3>`;
                for (const [key, value] of Object.entries(sub)) {
                    if (key === 'titulo') continue;
                    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    html += `<strong>${formattedKey}:</strong>`;
                    if (Array.isArray(value)) {
                        html += `<ul>${value.map(v => `<li>${typeof v === 'object' ? JSON.stringify(v) : v}</li>`).join('')}</ul>`;
                    } else if (typeof value === 'object' && value !== null) {
                        html += `<ul style="list-style-type: none; padding-left: 15px;">`;
                        for(const [subKey, subValue] of Object.entries(value)) {
                            if (subKey === 'calculadorasRecomendadas' && Array.isArray(subValue)) {
                                html += `<li><em>${subKey.replace(/([A-Z])/g, ' $1').trim()}:</em><ul>${subValue.map(item => `<li>${item.nombre} (<a href='${item.link}' target='_blank'>Ir a la calculadora</a>)</li>`).join('')}</ul></li>`;
                            } else if (Array.isArray(subValue)) {
                                html += `<li><em>${subKey.replace(/([A-Z])/g, ' $1').trim()}:</em><ul>${subValue.map(item => `<li>${typeof item === 'object' ? JSON.stringify(item) : item}</li>`).join('')}</ul></li>`;
                            } else {
                                html += `<li><em>${subKey}:</em> ${subValue}</li>`;
                            }
                        }
                        html += `</ul>`;
                    }
                }
            });
        }
        
        if (section.flujogramas) {
            section.flujogramas.forEach((flujo, index) => {
                html += `<h4>${flujo.tituloFigura}</h4>`;
                html += `<div class="mermaid">${flujo.descripcion_mermaid}</div>`;
            });
        }
        
        if (section.items) {
             html += '<table><thead><tr>';
            const headers = Object.keys(section.items[0]);
            headers.forEach(header => html += `<th>${header.charAt(0).toUpperCase() + header.slice(1)}</th>`);
            html += '</tr></thead><tbody>';
            section.items.forEach(item => {
                html += '<tr>';
                headers.forEach(header => html += `<td>${item[header]}</td>`);
                html += '</tr>';
            });
            html += '</tbody></table>';
        }
        
        if (section.referencias) {
            html += '<h4>Referencias</h4><ol>';
            section.referencias.forEach(ref => html += `<li>${ref}</li>`);
            html += '</ol>';
        }
        html += `</section>`;
    });

    outputDiv.innerHTML = html;
    
    // Forzar el renderizado de Mermaid
    setTimeout(() => {
        try {
            window.mermaid.run({nodes: document.querySelectorAll('.mermaid')});
        } catch (e) {
            console.error("Error al renderizar los diagramas de Mermaid:", e);
        }
    }, 100);
}


function createGeminiPromptWithExamples(newTitle, newUnit, example1, example2) {
    return `
    **ROL Y OBJETIVO:**
    Eres un asistente médico experto en la redacción de guías clínicas y protocolos hospitalarios para el Hospital de Especialidades Carlos Andrade Marín (HECAM) en Quito, Ecuador. Tu tarea es generar un protocolo completo, basado en evidencia y adaptado al contexto local.

    **CONTEXTO CLAVE (DEBE APLICARSE A LA NUEVA GENERACIÓN):**
    1.  **CNMB:** Los medicamentos deben priorizar el Cuadro Nacional de Medicamentos Básicos de Ecuador.
    2.  **ALTITUD:** Siempre que sea relevante (cardio, neumo), añade una nota sobre el impacto de la altitud de Quito (2800m).
    3.  **RECURSOS:** Los recursos y escalas deben ser de acceso libre y validados internacionalmente (ej. MDCalc, calculadoras de sociedades médicas).

    **INSTRUCCIÓN:**
    A continuación se presentan dos ejemplos completos de protocolos. Analiza su estructura, nivel de detalle, tono clínico y cómo integran el contexto ecuatoriano. Luego, genera un **NUEVO** protocolo siguiendo **EXACTAMENTE** el mismo formato y calidad.

    ---
    **EJEMPLO 1:**
    ${JSON.stringify(example1, null, 2)}
    ---
    
    ---
    **EJEMPLO 2:**
    ${JSON.stringify(example2, null, 2)}
    ---

    **TAREA FINAL:**
    Ahora, genera un nuevo protocolo en formato JSON válido.
    - **Título del Protocolo:** "${newTitle}"
    - **Unidad Médica Responsable:** "Unidad Técnica de ${newUnit}"

    Tu respuesta debe ser **ÚNICAMENTE el objeto JSON completo y válido** para el nuevo protocolo, sin ningún texto, formato markdown o explicación adicional.
    `;
}
