// Espera a que el DOM esté completamente cargado antes de ejecutar cualquier script.
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM listo. Inicializando la aplicación...");

    const generateButton = document.getElementById('generateButton');
    
    // Asocia el evento 'click' al botón.
    if (generateButton) {
        console.log("Botón 'Generar Protocolo' encontrado. Asociando evento.");
        generateButton.addEventListener('click', generateProtocol);
    } else {
        console.error("Error CRÍTICO: No se encontró el botón con id='generateButton'.");
        alert("Error de inicialización. El botón de generar no se encuentra.");
        return;
    }

    // Intenta cargar el último protocolo guardado para conveniencia del usuario.
    try {
        const savedProtocol = localStorage.getItem('lastGeneratedProtocol');
        if (savedProtocol) {
            console.log("Protocolo guardado encontrado. Renderizando...");
            const protocolData = JSON.parse(savedProtocol);
            renderProtocol(protocolData);
            document.getElementById('protocolTitle').value = protocolData.metadata.titulo;
            document.getElementById('medicalUnit').value = protocolData.metadata.unidadResponsable.nombre.replace('Unidad Técnica de ', '');
        }
    } catch (e) {
        console.error("Error al cargar datos desde Local Storage:", e);
        localStorage.removeItem('lastGeneratedProtocol'); // Limpia datos corruptos.
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

    if (!protocolTitle || !medicalUnit || !apiKey) {
        alert("Por favor, complete todos los campos: Título, Unidad Médica y API Key.");
        return;
    }

    loader.style.display = 'block';
    outputDiv.innerHTML = '';

    try {
        // 1. Cargar los archivos JSON de ejemplo de forma asíncrona.
        const [htaResponse, nacResponse] = await Promise.all([
            fetch('hipertension_arterial_example.json'),
            fetch('neumonia_comunitaria_example.json')
        ]);

        if (!htaResponse.ok) throw new Error(`Fallo al cargar 'hipertension_arterial_example.json' (Estado: ${htaResponse.status})`);
        if (!nacResponse.ok) throw new Error(`Fallo al cargar 'neumonia_comunitaria_example.json' (Estado: ${nacResponse.status})`);
        
        const htaExample = await htaResponse.json();
        const nacExample = await nacResponse.json();
        
        // 2. Crear el prompt dinámico.
        const prompt = createGeminiPromptWithExamples(protocolTitle, medicalUnit, htaExample, nacExample);
        
        // 3. Llamar a la API de Gemini con el nuevo modelo.
        // El nombre oficial del último modelo Flash es 'gemini-1.5-flash-latest'
        const modelName = 'gemini-1.5-flash-latest';
        const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                "generationConfig": {
                    "temperature": 0.4,
                    "maxOutputTokens": 8192,
                    "responseMimeType": "application/json", // Forzar salida JSON
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
        
        const jsonString = responseData.candidates[0].content.parts[0].text;
        const protocolData = JSON.parse(jsonString);

        // 4. Guardar y renderizar el resultado.
        localStorage.setItem('lastGeneratedProtocol', JSON.stringify(protocolData));
        renderProtocol(protocolData);

    } catch (error) {
        console.error('Error detallado en generateProtocol:', error);
        outputDiv.innerHTML = `<p style="color: red;"><strong>Ocurrió un error:</strong> ${error.message}. <br><strong>Posibles causas:</strong><br>1. La API Key es inválida, no tiene permisos para el modelo '${modelName}', o tiene restricciones.<br>2. Los archivos JSON de ejemplo no se encuentran en la misma carpeta.<br>3. Problema de red.<br><strong>Revisa la consola del navegador (F12) para más detalles.</strong></p>`;
    } finally {
        loader.style.display = 'none';
    }
}

/**
 * Renderiza el objeto de protocolo en el DOM.
 * @param {object} data - El objeto JSON completo del protocolo.
 */
function renderProtocol(data) {
    const outputDiv = document.getElementById('protocolOutput');
    if (!data || !data.metadata || !data.secciones) {
        outputDiv.innerHTML = `<p style="color: orange;">El protocolo generado no tiene la estructura esperada.</p>`;
        return;
    }
    let html = `<div class="protocol-header"><h1>PROTOCOLO: ${data.metadata.titulo || 'Sin Título'}</h1><p><strong>Código:</strong> ${data.metadata.protocoloCodigo || 'HECAM-XX-PR-XXX'}</p><p><strong>Versión:</strong> ${data.metadata.version || '1.0'} | <strong>Unidad Responsable:</strong> ${data.metadata.unidadResponsable.nombre || 'N/A'}</p><p><strong>Fecha de Elaboración:</strong> ${data.metadata.fechaElaboracion || 'N/A'}</p></div><hr>`;
    Object.values(data.secciones).forEach(section => {
        if (!section || !section.titulo) return;
        html += `<section><h2>${section.titulo}</h2>`;
        if (section.contenido) {
            if (section.contenido.problemaSaludPublica) html += `<p>${section.contenido.problemaSaludPublica}</p>`;
            if (section.contenido.prevalencia && section.contenido.prevalencia.institucional_hecam) html += `<p><strong>Prevalencia Institucional:</strong> ${section.contenido.prevalencia.institucional_hecam}</p>`;
            if (section.contenido.poblacionObjetivo) html += `<p><strong>Población Objetivo:</strong> ${section.contenido.poblacionObjetivo}</p>`;
            if (Array.isArray(section.contenido.unidadesInvolucradas)) html += `<p><strong>Unidades Involucradas:</strong> ${section.contenido.unidadesInvolucradas.join(', ')}</p>`;
            if (Array.isArray(section.contenido.resultadosEsperados)) { html += `<strong>Resultados Esperados:</strong><ul>${section.contenido.resultadosEsperados.map(item => `<li>${item}</li>`).join('')}</ul>`; }
        }
        if (section.general) html += `<p><strong>Objetivo General:</strong> ${section.general}</p>`;
        if (Array.isArray(section.especificos)) { html += `<strong>Objetivos Específicos:</strong><ul>${section.especificos.map(obj => `<li>${obj}</li>`).join('')}</ul>`; }
        if (Array.isArray(section.terminos)) { html += '<ul>'; section.terminos.forEach(term => html += `<li><strong>${term.abreviatura}:</strong> ${term.definicion}</li>`); html += '</ul>'; }
        if (section.subsecciones) {
            Object.values(section.subsecciones).forEach(sub => {
                if (!sub || !sub.titulo) return;
                html += `<h3>${sub.titulo}</h3>`;
                for (const [key, value] of Object.entries(sub)) {
                    if (key === 'titulo') continue;
                    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    html += `<strong>${formattedKey}:</strong>`;
                    if (Array.isArray(value)) {
                        html += `<ul>`;
                        value.forEach(item => {
                            let listItem = '';
                            if (typeof item === 'object' && item !== null && item.nombre && item.link) { listItem = `${item.nombre} (<a href='${item.link}' target='_blank' rel='noopener noreferrer'>Ir a la calculadora</a>)`;}
                            else if (typeof item === 'object' && item !== null) { listItem = JSON.stringify(item); }
                            else { listItem = item; }
                            html += `<li>${listItem}</li>`;
                        });
                        html += `</ul>`;
                    } else if (typeof value === 'object' && value !== null) {
                        html += `<ul style="list-style-type: none; padding-left: 15px;">`;
                        for (const [subKey, subValue] of Object.entries(value)) {
                            const formattedSubKey = subKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                            let formattedSubValue = typeof subValue === 'object' ? JSON.stringify(subValue) : subValue;
                            html += `<li><em>${formattedSubKey}:</em> ${formattedSubValue}</li>`;
                        }
                        html += `</ul>`;
                    }
                }
            });
        }
        if (Array.isArray(section.flujogramas)) { section.flujogramas.forEach((flujo) => { html += `<h4>${flujo.tituloFigura || 'Flujograma'}</h4>`; html += `<div class="mermaid">${flujo.descripcion_mermaid}</div>`; }); }
        if (Array.isArray(section.items) && section.items.length > 0) {
            html += '<table><thead><tr>';
            const headers = Object.keys(section.items[0]);
            headers.forEach(header => html += `<th>${header.charAt(0).toUpperCase() + header.slice(1)}</th>`);
            html += '</tr></thead><tbody>';
            section.items.forEach(item => { html += '<tr>'; headers.forEach(header => html += `<td>${item[header] || 'N/A'}</td>`); html += '</tr>'; });
            html += '</tbody></table>';
        }
        if (Array.isArray(section.referencias)) { html += '<h4>Referencias</h4><ol>'; section.referencias.forEach(ref => html += `<li>${ref}</li>`); html += '</ol>'; }
        html += `</section>`;
    });
    outputDiv.innerHTML = html;
    setTimeout(() => { try { if (window.mermaid) { document.querySelectorAll('.mermaid').forEach(el => { el.removeAttribute('data-processed'); }); window.mermaid.run(); } } catch (e) { console.error("Error al renderizar Mermaid:", e); } }, 100);
}

/**
 * Crea el prompt para la API de Gemini, incluyendo los ejemplos.
 * @param {string} newTitle - El título del nuevo protocolo.
 * @param {string} newUnit - La unidad médica responsable.
 * @param {object} example1 - El objeto JSON del primer ejemplo.
 * @param {object} example2 - El objeto JSON del segundo ejemplo.
 * @returns {string} - El prompt completo.
 */
function createGeminiPromptWithExamples(newTitle, newUnit, example1, example2) {
    return `**ROL Y OBJETIVO:**\nEres un asistente médico experto en la redacción de guías clínicas y protocolos hospitalarios para el Hospital de Especialidades Carlos Andrade Marín (HECAM) en Quito, Ecuador. Tu tarea es generar un protocolo completo, basado en evidencia y adaptado al contexto local.\n\n**CONTEXTO CLAVE (DEBE APLICARSE A LA NUEVA GENERACIÓN):**\n1.  **CNMB:** Los medicamentos deben priorizar el Cuadro Nacional de Medicamentos Básicos de Ecuador.\n2.  **ALTITUD:** Siempre que sea relevante (cardio, neumo), añade una nota sobre el impacto de la altitud de Quito (2800m).\n3.  **RECURSOS:** Los recursos y escalas deben ser de acceso libre y validados internacionalmente (ej. MDCalc, calculadoras de sociedades médicas).\n\n**INSTRUCCIÓN:**\nA continuación se presentan dos ejemplos completos de protocolos. Analiza su estructura, nivel de detalle, tono clínico y cómo integran el contexto ecuatoriano. Luego, genera un **NUEVO** protocolo siguiendo **EXACTAMENTE** el mismo formato y calidad.\n\n---\n**EJEMPLO 1:**\n${JSON.stringify(example1, null, 2)}\n---\n\n---\n**EJEMPLO 2:**\n${JSON.stringify(example2, null, 2)}\n---\n\n**TAREA FINAL:**\nAhora, genera un nuevo protocolo en formato JSON válido.\n- **Título del Protocolo:** "${newTitle}"\n- **Unidad Médica Responsable:** "Unidad Técnica de ${newUnit}"\n\nTu respuesta debe ser **ÚNICAMENTE el objeto JSON completo y válido** para el nuevo protocolo, sin ningún texto, formato markdown o explicación adicional.`;
}
