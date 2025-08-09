// ===============================================================
//  SCRIPT JAVASCRIPT COMPLETO (ARQUITECTURA MULTI-PROMPT REFACTORIZADA)
// ===============================================================

let protocolData = null; // Estado global para el protocolo en construcción

// --- SECCIÓN 1: DATOS JSON PARA "FEW-SHOT LEARNING" ---
const htaExample = {"metadata":{"protocoloCodigo":"HECAM-MI-PR-001","titulo":"Manejo de la Hipertensión Arterial y Urgencia Hipertensiva en Adultos","version":"1.0","fechaElaboracion":"2024-10-26","fechaVigencia":"2026-10-26","unidadResponsable":{"nombre":"Unidad Técnica de Medicina Interna"},"autores":[{"nombre":"Dr. Alcy Edmundo Torres Guerrero","rol":"Médico Especialista en Medicina Interna"}],"revisores":[{"cargo":"Coordinador General de Investigación","nombre":""},{"cargo":"Coordinador General de Control de Calidad","nombre":""},{"cargo":"Jefe de la Unidad Técnica de Medicina Interna","nombre":""}],"aprobador":{"cargo":"Director Técnico","nombre":""}},"secciones":{"justificacion":{"titulo":"1. Justificación y Alcance","contenido":{"problemaSaludPublica":"La hipertensión arterial (HTA) es un problema de salud pública global y nacional, con una prevalencia en Ecuador cercana al 20% en adultos. Es el principal factor de riesgo modificable para enfermedades cardiovasculares, cerebrovasculares y renales.","prevalencia":{"institucional_hecam":"En el HECAM, la HTA y sus complicaciones, como la urgencia hipertensiva, son una de las principales causas de consulta y hospitalización en Medicina Interna, generando una alta carga asistencial y la necesidad de estandarizar su manejo para prevenir eventos adversos."},"poblacionObjetivo":"Pacientes adultos (>18 años) con diagnóstico de HTA o que presenten una urgencia hipertensiva, atendidos en el HECAM.","contextoAplicacion":"Consulta ambulatoria, hospitalización y atención de urgencias.","unidadesInvolucradas":["Medicina Interna","Cardiología","Nefrología","Emergencia","Farmacia"],"resultadosEsperados":["Mejorar el control de la PA en pacientes tratados.","Reducir la progresión de urgencia a emergencia hipertensiva.","Optimizar el uso de antihipertensivos del CNMB.","Disminuir la variabilidad en la práctica clínica."]}},"objetivos":{"titulo":"2. Objetivos","general":"Establecer un protocolo basado en evidencia para el manejo integral de la HTA y la urgencia hipertensiva en adultos atendidos en el HECAM.","especificos":["Definir criterios diagnósticos de HTA y urgencia hipertensiva, considerando la altitud de Quito.","Establecer un algoritmo de tratamiento farmacológico basado en el CNMB.","Definir un plan de manejo para la urgencia hipertensiva que evite reducciones bruscas de la PA.","Establecer criterios claros de seguimiento y egreso."]},"glosario":{"titulo":"3. Glosario y Definiciones","terminos":[{"abreviatura":"HTA","definicion":"Hipertensión Arterial"},{"abreviatura":"UH","definicion":"Urgencia Hipertensiva"}]},"procedimiento":{"titulo":"4. Procedimiento (Plan de Acción/Actuación)","subsecciones":{}},"nivelesEvidencia":{"titulo":"5. Niveles de Evidencia (GRADE)","interpretacion":{"titulo":"Interpretación de la Metodología GRADE:","nivelEvidencia":{"titulo":"Nivel de Evidencia:","items":[{"nivel":"Alto","descripcion":"Existe una alta confianza en que el efecto estimado se encuentra cercano al efecto real."}]},"fuerzaRecomendacion":{"titulo":"Fuerza de Recomendación:","items":[{"fuerza":"Fuerte","descripcion":"Los beneficios de la intervención superan claramente los riesgos."}]}},"tablaRecomendaciones":[{"area":"Diagnóstico","recomendacion":"Confirmar el diagnóstico de HTA con mediciones fuera de la consulta (MAPA o AMPA).","nivelEvidencia":"Alto","fuerzaRecomendacion":"Fuerte"}]},"algoritmosFlujogramas":{"titulo":"6. Algoritmo de Actuación","flujogramas":[{"tituloFigura":"Figura 1. Manejo de la Urgencia Hipertensiva en HECAM","descripcion_mermaid":"graph TD; A[Paciente con PA ≥ 180/120 mmHg] --> B{¿Signos/Síntomas de DAOD agudo?}; B -- Sí --> C[Manejo como EMERGENCIA HIPERTENSIVA]; B -- No --> D[Diagnóstico: URGENCIA HIPERTENSIVA];"}]},"indicadores":{"titulo":"7. Indicadores de Calidad","items":[{"nombre":"Tasa de progresión de UH a EH","definicion":"Porcentaje de pacientes con UH que desarrollan DAOD durante la hospitalización.","calculo":"(N° de progresiones a EH / N° total de UH) x 100","meta":"< 2%","periodo":"Semestral","responsable":"Jefe de Unidad de Medicina Interna"}]},"bibliografia":{"titulo":"8. Bibliografía","referencias":["Williams B, Mancia G, et al. 2018 ESC/ESH Guidelines for the management of arterial hypertension. Eur Heart J. 2018;39(33):3021-3104."]},"anexos":{"titulo":"9. Anexos","items":[{"tituloAnexo":"Anexo 1: Cronograma de Implementación","tipo":"tabla_gantt","tareas":[{"id":1,"nombre":"Elaboración y Redacción Final del Protocolo","inicio":"2025-10-28","fin":"2025-11-15"}]}]}}};
const nacExample = {"metadata":{},"secciones":{"procedimiento":{"titulo":"4. Procedimiento","subsecciones":{"diagnostico":{"titulo":"4.1. Diagnóstico y Estratificación","criteriosDiagnosticos":["Presencia de un infiltrado nuevo en la radiografía de tórax más al menos dos de los siguientes: fiebre/hipotermia, tos (con o sin esputo), disnea, leucocitosis/leucopenia, dolor pleurítico."],"estratificacionRiesgo":{"descripcion":"Utilizar la escala CURB-65 para decidir el lugar de tratamiento.","calculadorasRecomendadas":[{"nombre":"Calculadora CURB-65","link":"https://www.mdcalc.com/calc/390/curb-65-score-pneumonia-severity"}]}},"planTerapeutico":{"titulo":"4.2. Plan Terapéutico","tratamientoFarmacologico":{"algoritmoTerapeutico":[{"paso":"CURB-65: 0-1 (Manejo Ambulatorio)","descripcion":"Monoterapia oral.","medicamentos_cnmb":[{"nombre":"Amoxicilina","dosis_tipica":"1g VO cada 8h"},{"nombre":"Doxiciclina","dosis_tipica":"100mg VO cada 12h"}]},{"paso":"CURB-65: 2 (Manejo Hospitalario)","descripcion":"Terapia combinada IV.","medicamentos_cnmb":[{"nombre":"Ceftriaxona","dosis_tipica":"1-2g IV cada 24h"},{"nombre":"Claritromicina","dosis_tipica":"500mg IV/VO cada 12h"}]}]}}}}}; //JSON simplificado para brevedad

// --- SECCIÓN 2: LÓGICA DE LA APLICACIÓN ---

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('generateButton').addEventListener('click', generateProtocolStructure);
});

function generateProtocolStructure() {
    const protocolTitle = document.getElementById('protocolTitle').value.trim();
    if (!protocolTitle) { alert("Por favor, ingrese un título."); return; }
    
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
            fechaElaboracion: new Date().toISOString().slice(0, 10),
            protocoloCodigo: "HECAM-XX-PR-XXX"
        },
        // NUEVA ESTRUCTURA: Solo título y un campo 'markdownContent' para el texto
        secciones: {
            justificacion: { titulo: "1. Justificación y Alcance", markdownContent: null },
            objetivos: { titulo: "2. Objetivos", markdownContent: null },
            glosario: { titulo: "3. Glosario y Definiciones", markdownContent: null },
            procedimiento: { titulo: "4. Procedimiento (Plan de Acción/Actuación)", markdownContent: null },
            nivelesEvidencia: { titulo: "5. Nivel de Evidencia (GRADE)", tablaRecomendaciones: null, interpretacion: null }, // Mantenemos estructura para tablas
            algoritmosFlujogramas: { titulo: "6. Algoritmo de Actuación", flujogramas: null },
            indicadores: { titulo: "7. Indicadores de Calidad", items: null },
            bibliografia: { titulo: "8. Bibliografía", referencias: null },
            anexos: { titulo: "9. Anexos", items: null }
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

// --- LÓGICA DE GENERACIÓN (REFACTORIZADA) ---

/**
 * Función "controladora" que maneja la UI para la generación de una sola sección.
 * @param {string} sectionKey - La clave de la sección a generar.
 */
async function generateSectionContent(sectionKey) {
    const sectionDiv = document.getElementById(`gen-${sectionKey}`);
    const button = sectionDiv.querySelector('button');
    if (button) {
        button.disabled = true;
        button.textContent = 'Generando...';
    }
    
    try {
        await fetchSectionData(sectionKey); // Llama a la función núcleo
        sectionDiv.innerHTML = `<span>${protocolData.secciones[sectionKey].titulo}</span> <span class="status">✓ Generado</span>`;
    } catch (error) {
        console.error(`Error generando la sección ${sectionKey}:`, error);
        sectionDiv.innerHTML = `<span>${protocolData.secciones[sectionKey].titulo}</span> <span class="error">✗ Error</span> <button onclick="generateSectionContent('${sectionKey}')">Reintentar</button>`;
        // No mostramos alerta aquí para no interrumpir el flujo de "Generar Todo"
    } finally {
        if(button) {
             button.disabled = false;
             button.textContent = 'Generar';
        }
    }
}

/**
 * Función "controladora" para generar todas las secciones.
 */
async function generateAllSections() {
    const allButtons = document.querySelectorAll('.section-generator button');
    allButtons.forEach(btn => btn.disabled = true);
    
    for (const sectionKey of Object.keys(protocolData.secciones)) {
        const sectionDiv = document.getElementById(`gen-${sectionKey}`);
        const statusSpan = sectionDiv.querySelector('.status');
        if (statusSpan) continue; // Si ya está generado, saltar

        const button = sectionDiv.querySelector('button');
        if (button) button.textContent = 'Generando...';

        try {
            await fetchSectionData(sectionKey);
            sectionDiv.innerHTML = `<span>${protocolData.secciones[sectionKey].titulo}</span> <span class="status">✓ Generado</span>`;
        } catch (error) {
            sectionDiv.innerHTML = `<span>${protocolData.secciones[sectionKey].titulo}</span> <span class="error">✗ Error</span> <button onclick="generateSectionContent('${sectionKey}')">Reintentar</button>`;
        }
    }
    alert('¡Generación de todas las secciones completada!');
}

/**
 * Función "núcleo" que se encarga ÚNICAMENTE de la lógica de la API.
 * @param {string} sectionKey - La clave de la sección a obtener.
 */
async function fetchSectionData(sectionKey) {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) {
        throw new Error("API Key no proporcionada.");
    }
    
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
    if (!apiResponse.ok) throw new Error(responseData.error.message || 'Error desconocido en la API');

    const rawText = responseData.candidates[0].content.parts[0].text;
    const generatedContent = extractJson(rawText);

    if (!generatedContent || !generatedContent[sectionKey]) {
        throw new Error("La respuesta del modelo no tuvo el formato JSON esperado. Respuesta: " + rawText);
    }
    
    // Actualiza el estado global y renderiza la vista previa
    protocolData.secciones[sectionKey] = generatedContent[sectionKey];
    document.getElementById('protocolOutput').style.display = 'block';
    renderProtocol(protocolData);
}


// --- SECCIÓN 3: FUNCIONES DE UTILIDAD (SIN CAMBIOS) ---

function getSpecializedPrompt(sectionKey, protocolTitle, htaExample, nacExample) {
    const mermaidExample = "graph TD; A[Sospecha] --> B{Criterios?}; B -- Si --> C[Tratamiento]; B -- No --> D[Reevaluar];";
    
    // Simplificamos los ejemplos, ya no son necesarios para la estructura
    const promptBase = `**Rol:** Eres un experto en redacción de protocolos médicos para el Hospital HECAM en Quito, Ecuador.\n` +
                     `**Tarea:** Genera el contenido para la sección "${sectionKey}" de un protocolo sobre "${protocolTitle}".\n` +
                     `**Formato de Salida:** Debes responder ÚNICAMENTE con un objeto JSON que contenga una sola clave principal: "${sectionKey}".\n`;

    let specificInstructions = '';

    // Instrucciones para las secciones que mantienen su estructura JSON
    if (['nivelesEvidencia', 'indicadores', 'anexos', 'algoritmosFlujogramas', 'bibliografia'].includes(sectionKey)) {
        specificInstructions = `El valor de la clave "${sectionKey}" debe ser un objeto con el contenido estructurado como en los ejemplos anteriores. Para "${protocolTitle}", genera el contenido apropiado.`;
    } 
    // Instrucciones para las secciones que ahora usarán Markdown
    else {
        specificInstructions = `El valor de la clave "${sectionKey}" debe ser un objeto que contenga "titulo" y "markdownContent". En "markdownContent", escribe el texto completo y detallado para esta sección usando formato Markdown (ej. ### Título, * Cursiva, ** Negrita, - Elemento de lista). Incluye todos los sub-puntos relevantes como se ve en el documento de Sepsis de ejemplo.`;
    }

    // Simplificamos los ejemplos drásticamente
    const examplePrompt = `\n**Ejemplo de formato para 'justificacion':**\n` +
                        `{"justificacion": {"titulo": "1. Justificación y Alcance", "markdownContent": "### Carga Global\\nLa enfermedad X es un problema...\\n### Impacto en HECAM\\nEn nuestro hospital..."}}`;

    return `${promptBase}\n${specificInstructions}\n${examplePrompt}`;
}

function extractJson(str) {
    let firstOpen = str.indexOf('{'); if (firstOpen === -1) return null;
    let openBraces = 0, jsonEnd = -1;
    for (let i = firstOpen; i < str.length; i++) { if (str[i] === '{') openBraces++; else if (str[i] === '}') openBraces--; if (openBraces === 0) { jsonEnd = i + 1; break; } }
    if (jsonEnd !== -1) { try { return JSON.parse(str.substring(firstOpen, jsonEnd)); } catch (e) { return null; } } return null;
}

function renderProtocol(data) {
    const outputDiv = document.getElementById("protocolOutput");
    // ... (resto de la lógica de renderizado que ya tienes)
    
    sectionKeys.forEach(key => {
        const section = data.secciones[key];
        // ...
        html += `<section><h2>${section.titulo}</h2>`;

        if (!section.markdownContent && !section.tablaRecomendaciones && !section.flujogramas && !section.items && !section.referencias) {
             html += `<p style="color: orange;"><em>Contenido aún no generado.</em></p>`;
        } else {
            // **NUEVO: Renderizar el Markdown**
            if (section.markdownContent) {
                // Usamos la librería 'marked' que importaremos en el HTML
                html += marked.parse(section.markdownContent);
            }
            // ... (resto de la lógica para renderizar tablas, mermaid, etc., que ya funciona bien)
        }
        html += `</section>`;
    });

    outputDiv.innerHTML = html;
    // ...
}
