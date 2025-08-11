// =============================================================================
//  SCRIPT.JS - Generador de Protocolos con Estructura Completa tipo Sepsis
// =============================================================================

// Estado global para el protocolo en construcción y el motor local
let protocolData = null;
let localEngine = null;
let modelDownloading = false;
let modelProgress = 0;

// Claves para recordar preferencia de motor en localStorage
const ENGINE_KEY = 'protocolos_engine';
const ENGINE_REMEMBER_KEY = 'protocolos_engine_remember';

// Utilidad: comprobar si el navegador expone la API WebGPU
const hasWebGPU = () => ('gpu' in navigator);

// Mostrar u ocultar avisos de compatibilidad
function showCompatWarning(show, msg) {
    const el = document.getElementById('compatWarning');
    if (!el) return;
    el.style.display = show ? 'block' : 'none';
    if (msg) el.innerHTML = msg;
}

// Actualizar texto del estado del modelo
function setModelStatus(text, visible = true) {
    const st = document.getElementById('modelStatus');
    if (!st) return;
    st.style.display = visible ? 'block' : 'none';
    if (text !== undefined) st.textContent = text;
}

// Actualizar texto de ayuda del modelo
function setModelHint(text, visible = true) {
    const el = document.getElementById('modelHint');
    if (!el) return;
    el.style.display = visible ? 'block' : 'none';
    if (text !== undefined) el.textContent = text;
}

// Actualizar progreso visual de la descarga del modelo
function setProgress(p) {
    const wrap = document.getElementById('modelProgressWrap');
    const bar  = document.getElementById('modelProgressBar');
    if (!wrap || !bar) return;
    if (p == null) {
        wrap.style.display = 'none';
        return;
    }
    wrap.style.display = 'flex';
    const pct = Math.max(0, Math.min(100, Math.round(p * 100)));
    bar.style.width = pct + '%';
}

// Cambiar automáticamente al modo demo si no hay WebGPU disponible
function switchToDemo(reasonText) {
    const sel = document.getElementById('engine');
    if (!sel) return;
    sel.value = 'demo';
    showCompatWarning(true, reasonText || "Tu navegador no soporta WebGPU. Se ha activado el modo Demo.");
    setModelStatus("Modo Demo activado.", true);
    setModelHint("Puedes volver a ‘Gemini’ si deseas usar tu API o reintentar ‘Local’ en un navegador compatible.");
}

// Verificar si el motor local puede usarse o es necesario cambiar a demo
function guardLocalOrFallback() {
    const sel = document.getElementById('engine');
    if (!sel) return false;
    if (sel.value === 'local' && !hasWebGPU()) {
        switchToDemo("Tu navegador no expone la API WebGPU. Modo Demo activado.");
        return false;
    }
    return true;
}

// Asegurar la inicialización del motor local (WebLLM)
async function ensureLocalEngine() {
    if (localEngine) return localEngine;
    // Si no hay soporte WebGPU, se cambia a Demo y no se inicia
    if (!hasWebGPU()) {
        switchToDemo("Tu navegador no soporta WebGPU. Modo Demo activado.");
        return null;
    }
    // Comprueba que webllm esté cargado
    if (!window.webllm) {
        showCompatWarning(true, "Biblioteca WebLLM no cargada. Usa ‘Gemini’ o ‘Demo’.", true);
        return null;
    }
    // Mensajes de progreso
    setModelStatus("Descargando modelo local…", true);
    setModelHint("La descarga puede tardar la primera vez. El modelo se guarda en caché para futuros usos incluso offline.");
    setProgress(0);
    modelDownloading = true;
    try {
        // Nombre del modelo: Qwen2.5-1.5B Instruct en formato MLC (versión comprimida)
        const MODEL = "Qwen2.5-1.5B-Instruct-q4f32_1-MLC";
        localEngine = await window.webllm.CreateMLCEngine(MODEL, {
            gpuMemoryUtilization: 0.85,
            initProgressCallback: (info) => {
                if (info?.text) setModelStatus(`Descargando modelo: ${info.text}`);
                if (typeof info?.progress === 'number') {
                    modelProgress = info.progress;
                    setProgress(modelProgress);
                }
            }
        });
        setModelStatus("Modelo local listo.");
        setModelHint("Modelo cargado correctamente.", false);
        setTimeout(() => setModelStatus("", false), 1500);
        setProgress(null);
        modelDownloading = false;
        return localEngine;
    } catch (e) {
        console.error(e);
        setModelStatus("No se pudo inicializar el modelo local. Usa ‘Gemini’ o ‘Demo’.", true);
        setModelHint("Comprueba tu conexión o intenta en un navegador compatible con WebGPU.");
        setProgress(null);
        modelDownloading = false;
        return null;
    }
}

// Al cargar el documento se configuran eventos y se restaura el motor seleccionado
document.addEventListener('DOMContentLoaded', () => {
    const generateButton = document.getElementById('generateButton');
    if (generateButton) generateButton.addEventListener('click', generateProtocolStructure);

    // Restaurar motor seleccionado y preferencia
    const engineSel = document.getElementById('engine');
    const rememberChk = document.getElementById('rememberEngine');
    try {
        const remembered = localStorage.getItem(ENGINE_REMEMBER_KEY) === '1';
        if (remembered && engineSel) {
            const saved = localStorage.getItem(ENGINE_KEY);
            if (saved) {
                engineSel.value = saved;
                // Si guardó local pero no hay WebGPU, pasar a demo
                if (saved === 'local' && !hasWebGPU()) {
                    switchToDemo("Tu navegador no soporta WebGPU. Se activó Demo.");
                }
            }
            if (rememberChk) rememberChk.checked = true;
        }
    } catch(e) {
        console.error(e);
    }
    // Evento de cambio para selector de motor
    if (engineSel) {
        engineSel.addEventListener('change', () => {
            if (engineSel.value === 'local' && !hasWebGPU()) {
                switchToDemo("Tu navegador no soporta WebGPU o está desactivado. Se activó Demo.");
            } else if (engineSel.value === 'local' && hasWebGPU()) {
                showCompatWarning(false);
                setModelStatus("", false);
                setModelHint("", false);
            }
            // Guardar preferencia si está marcado
            const chk = document.getElementById('rememberEngine');
            if (chk?.checked) {
                try {
                    localStorage.setItem(ENGINE_KEY, engineSel.value);
                    localStorage.setItem(ENGINE_REMEMBER_KEY, '1');
                } catch(e) { console.error(e); }
            }
        });
    }
    // Evento de cambio para recordar motor
    if (rememberChk) {
        rememberChk.addEventListener('change', () => {
            if (!rememberChk.checked) {
                try {
                    localStorage.removeItem(ENGINE_KEY);
                    localStorage.removeItem(ENGINE_REMEMBER_KEY);
                } catch(e) { console.error(e); }
            } else {
                try {
                    localStorage.setItem(ENGINE_REMEMBER_KEY, '1');
                    localStorage.setItem(ENGINE_KEY, document.getElementById('engine').value);
                } catch(e) { console.error(e); }
            }
        });
    }
});

// Generar la estructura base del protocolo y dibujar botones
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

// Crear estructura base con secciones completas según la plantilla de Sepsis
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
            procedimiento: { titulo: "4. Procedimiento (Plan de Acción)", markdownContent: null },
            nivelesEvidencia: { titulo: "5. Niveles de Evidencia (GRADE)", markdownContent: null },
            algoritmosFlujogramas: { titulo: "6. Algoritmo de Actuación", markdownContent: null },
            indicadores: { titulo: "7. Indicadores de Calidad", markdownContent: null },
            bibliografia: { titulo: "8. Bibliografía", markdownContent: null },
            anexos: { titulo: "9. Anexos", markdownContent: null },
            firmas: { titulo: "10. Firmas de los Involucrados", markdownContent: null },
            controlCambios: { titulo: "11. Control de Cambios", markdownContent: null }
        }
    };
}

// Dibujar la lista de secciones con botones para generar cada una y el botón general
function renderStructureUI() {
    const container = document.getElementById('protocolStructure');
    container.innerHTML = '<h3>Estructura del Protocolo (Generar contenido por sección):</h3>';
    for (const key in protocolData.secciones) {
        container.innerHTML += `<div class="section-generator" id="gen-${key}"><span>${protocolData.secciones[key].titulo}</span><button onclick="generateSectionContent('${key}')">Generar</button></div>`;
    }
    container.innerHTML += `<div class="section-generator" id="gen-all"><span><strong>GENERAR TODO EL PROTOCOLO</strong></span><button onclick="generateAllSections()">Generar Todo</button></div>`;
}

// Generar todas las secciones automáticamente
async function generateAllSections() {
    const engineSel = document.getElementById('engine')?.value || 'gemini';
    const allButtons = document.querySelectorAll('.section-generator button');
    allButtons.forEach(btn => btn.disabled = true);
    // Si está en modo demo, rellenar todo con datos de ejemplo
    if (engineSel === 'demo') {
        for (const key of Object.keys(protocolData.secciones)) {
            await generateDemoSection(key, document.getElementById(`gen-${key}`), null);
        }
        allButtons.forEach(btn => btn.disabled = false);
        document.getElementById('protocolOutput').style.display = 'block';
        renderProtocol(protocolData);
        return;
    }
    // Si motor local y no hay WebGPU, abortar y generar Demo
    if (engineSel === 'local' && !guardLocalOrFallback()) {
        allButtons.forEach(btn => btn.disabled = false);
        return;
    }
    for (const sectionKey of Object.keys(protocolData.secciones)) {
        if (!protocolData.secciones[sectionKey].markdownContent) {
            // eslint-disable-next-line no-await-in-loop
            await generateSectionContent(sectionKey);
        }
    }
    allButtons.forEach(btn => btn.disabled = false);
    document.getElementById('gen-all').querySelector('button').textContent = 'Generar Todo';
}

// Generar contenido para una sección específica según el motor seleccionado
async function generateSectionContent(sectionKey) {
    const sectionDiv = document.getElementById(`gen-${sectionKey}`);
    const button = sectionDiv?.querySelector('button');
    if (button) {
        button.disabled = true;
        button.textContent = 'Generando...';
    }

    const engineSel = document.getElementById('engine')?.value || 'gemini';
    const apiKey = document.getElementById('apiKey').value.trim();

    try {
        // Modo Demo
        if (engineSel === 'demo') {
            await generateDemoSection(sectionKey, sectionDiv, button);
            return;
        }
        // Motor local (WebGPU)
        if (engineSel === 'local') {
            if (!guardLocalOrFallback()) {
                await generateDemoSection(sectionKey, sectionDiv, button);
                return;
            }
            // Si el modelo se está descargando, esperar
            if (modelDownloading) {
                setModelStatus("Descargando modelo… espera a que finalice para generar.");
                if (button) { button.disabled = false; button.textContent = 'Generar'; }
                return;
            }
            const engine = await ensureLocalEngine();
            if (!engine) {
                await generateDemoSection(sectionKey, sectionDiv, button);
                return;
            }
            const prompt = getSpecializedPrompt(sectionKey, protocolData.metadata.titulo);
            const chatResp = await engine.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
                stream: false
            });
            const rawText = chatResp?.choices?.[0]?.message?.content || "";
            const generatedContent = extractJson(rawText);
            if (!generatedContent || !generatedContent[sectionKey] || !generatedContent[sectionKey].markdownContent) {
                throw new Error("La respuesta del modelo local no tuvo el JSON esperado. Respuesta: " + rawText);
            }
            protocolData.secciones[sectionKey] = generatedContent[sectionKey];
            if (sectionDiv) sectionDiv.innerHTML = `<span>${protocolData.secciones[sectionKey].titulo}</span> <span class="status">✓ Generado (LOCAL)</span>`;
            document.getElementById('protocolOutput').style.display = 'block';
            renderProtocol(protocolData);
            return;
        }
        // Motor Gemini (API)
        if (engineSel === 'gemini') {
            if (!apiKey) {
                alert("Por favor, ingrese su API Key para usar Gemini.");
                return;
            }
            const prompt = getSpecializedPrompt(sectionKey, protocolData.metadata.titulo);
            const modelName = 'gemini-1.5-flash-latest';
            const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.4, maxOutputTokens: 8192 }
                })
            });
            const responseData = await apiResponse.json();
            if (!apiResponse.ok) throw new Error(responseData.error?.message || `Error ${apiResponse.status}`);
            const rawText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            const generatedContent = extractJson(rawText);
            if (!generatedContent || !generatedContent[sectionKey] || !generatedContent[sectionKey].markdownContent) {
                throw new Error("La respuesta de Gemini no tuvo el JSON esperado. Respuesta: " + rawText);
            }
            protocolData.secciones[sectionKey] = generatedContent[sectionKey];
            if (sectionDiv) sectionDiv.innerHTML = `<span>${protocolData.secciones[sectionKey].titulo}</span> <span class="status">✓ Generado</span>`;
            document.getElementById('protocolOutput').style.display = 'block';
            renderProtocol(protocolData);
            return;
        }
    } catch (error) {
        console.error(`Error generando la sección ${sectionKey}:`, error);
        if (sectionDiv) sectionDiv.innerHTML = `<span>${protocolData.secciones[sectionKey].titulo}</span> <span class="error">✗ Error</span> <button onclick=\"generateSectionContent('${sectionKey}')\">Reintentar</button>`;
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = 'Generar';
        }
    }
}

// Generar contenido de ejemplo para una sección en modo Demo
async function generateDemoSection(sectionKey, sectionDiv, button) {
    const demos = {
        justificacion: {
            titulo: "1. Justificación y Alcance",
            markdownContent: "### Carga Global y Local\nLa sepsis es una causa principal de mortalidad y morbilidad a nivel mundial.\n### Relevancia en HECAM\nEsta sección explica por qué el protocolo es esencial para el hospital y su impacto en la atención.\n### Desafío de la Altitud\nConsidera las particularidades geográficas y fisiológicas de Quito y los Andes."
        },
        objetivos: {
            titulo: "2. Objetivos",
            markdownContent: "### Objetivos Generales\n- Mejorar la atención integral del paciente con sepsis.\n- Reducir la mortalidad relacionada con sepsis en el HECAM.\n### Objetivos Específicos\n- Estandarizar el diagnóstico precoz de sepsis.\n- Optimizar el tratamiento antimicrobiano inicial.\n- Implementar protocolos de soporte hemodinámico.\n- Capacitar al personal de salud en el manejo de sepsis.\n- Evaluar indicadores de calidad y mejora continua."
        },
        glosario: {
            titulo: "3. Glosario y Definiciones",
            markdownContent: "**Sepsis:** Respuesta sistémica a una infección que puede provocar falla orgánica.\n**Choque séptico:** Sepsis con hipotensión persistente que requiere vasopresores.\n**Lactato:** Metabolito indicador de hipoperfusión tisular.\n**MAP:** Presión arterial media.\n**Cultivo:** Procedimiento para identificar microorganismos."
        },
        procedimiento: {
            titulo: "4. Procedimiento (Plan de Acción)",
            markdownContent: "#### 4.1 Diagnóstico y Estratificación\n- Identificar signos y síntomas de sepsis.\n- Usar escalas como SOFA y qSOFA.\n#### 4.2 Tratamiento Antimicrobiano Inicial\n- Iniciar antibióticos de amplio espectro dentro de la primera hora.\n- Ajustar terapia según cultivos.\n#### 4.3 Soporte Hemodinámico y Monitorización\n- Administrar fluidos intravenosos.\n- Uso de vasopresores si persiste la hipotensión.\n#### 4.4 Prevención de Complicaciones\n- Profilaxis para tromboembolismo.\n- Manejo de glucemia y sedación adecuada.\n#### 4.5 Criterios de Alta\n- Resolución de la infección.\n- Estabilidad hemodinámica."
        },
        nivelesEvidencia: {
            titulo: "5. Niveles de Evidencia (GRADE)",
            markdownContent: "| Área | Recomendación | Nivel de Evidencia | Fuerza de Recomendación |\n|------|---------------|--------------------|------------------------|\n| Diagnóstico | Uso de qSOFA para detección temprana | Moderado | Fuerte |\n| Terapia | Antibióticos de amplio espectro en la primera hora | Alto | Fuerte |\n| Soporte Hemodinámico | Cristaloides como primera línea | Bajo | Débil |\n### Interpretación GRADE\n**Alto:** Evidencia sólida proveniente de ensayos controlados.\n**Moderado:** Evidencia razonable pero limitada.\n**Bajo:** Evidencia basada en estudios observacionales o expertos."
        },
        algoritmosFlujogramas: {
            titulo: "6. Algoritmo de Actuación",
            markdownContent: "### Algoritmo de Diagnóstico y Tratamiento\n```mermaid\ngraph TD; A[Inicio] --> B{Signos de sepsis?}; B -- No --> C[Evaluar otras causas]; B -- Sí --> D[Tomar cultivos y lactato]; D --> E[Administrar antibióticos]; E --> F[Fluidoterapia]; F --> G{Respuesta adecuada?}; G -- No --> H[Iniciar vasopresores]; G -- Sí --> I[Monitorización continua];```"
        },
        indicadores: {
            titulo: "7. Indicadores de Calidad",
            markdownContent: "| Nombre | Definición | Cálculo | Meta | Periodo | Responsable |\n|-------|------------|--------|-----|--------|-------------|\n| Tiempo a antibiótico | Tiempo desde el diagnóstico hasta la administración del primer antibiótico | (Horas acumuladas / número de pacientes) | ≤ 1 hora | Mensual | Jefe de Unidad |\n| Tasa de mortalidad por sepsis | Porcentaje de pacientes con sepsis que fallecen | (Muertes por sepsis / total de casos) x 100 | ≤ 10% | Trimestral | Comité de Calidad |\n| Cumplimiento del bundle de sepsis | Porcentaje de pacientes que reciben todas las medidas del bundle | (Casos que cumplen / total de casos) x 100 | ≥ 90% | Mensual | Coordinador clínico |"
        },
        bibliografia: {
            titulo: "8. Bibliografía",
            markdownContent: "1. Singer M, Deutschman CS, Seymour CW, et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis‑3). JAMA. 2016;315(8):801‑810.\n2. Evans L, Rhodes A, Alhazzani W, et al. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021. Intensive Care Med. 2021;47(11):1181‑1247."
        },
        anexos: {
            titulo: "9. Anexos",
            markdownContent: "### Anexo 1: Cronograma de Implementación\n| ID | Tarea | Comienzo | Fin |\n|---|------|---------|-----|\n| 1 | Revisión bibliográfica | 01-09-2025 | 15-09-2025 |\n| 2 | Elaboración del borrador | 16-09-2025 | 30-09-2025 |\n| 3 | Revisión por comité | 01-10-2025 | 15-10-2025 |\n| 4 | Ajustes finales | 16-10-2025 | 31-10-2025 |"
        },
        firmas: {
            titulo: "10. Firmas de los Involucrados",
            markdownContent: "| Rol | Nombre y Cargo | Firma |\n|-----|----------------|-------|\n| Elaborado por | Dr. Juan Pérez – Médico Internista | __________ |\n| Revisado por | Dra. María Gómez – Coordinadora de Calidad | __________ |\n| Aprobado por | Dr. Carlos Ruiz – Director Médico | __________ |"
        },
        controlCambios: {
            titulo: "11. Control de Cambios",
            markdownContent: "| Versión | Fecha | Descripción del Cambio | Autor |\n|--------|------|-------------------------|------|\n| 1.0 | 01-09-2025 | Creación del documento inicial | Comité Sepsis |\n| 1.1 | 15-10-2025 | Actualización de indicadores y algoritmo | Comité Sepsis |"
        }
    };
    if (demos[sectionKey]) {
        protocolData.secciones[sectionKey] = demos[sectionKey];
        if (sectionDiv) {
            sectionDiv.innerHTML = `<span>${protocolData.secciones[sectionKey].titulo}</span> <span class="status">✓ Generado (DEMO)</span>`;
        }
        if (button) {
            button.disabled = false;
            button.textContent = 'Generar';
        }
        document.getElementById('protocolOutput').style.display = 'block';
        renderProtocol(protocolData);
    }
}

// Construir el prompt especializado para cada sección con instrucciones detalladas
function getSpecializedPrompt(sectionKey, protocolTitle) {
    const promptBase = `**Rol:** Eres un experto en redacción de protocolos médicos para el Hospital HECAM en Quito, Ecuador.\n` +
                      `**Tarea:** Genera el contenido para la sección "${sectionKey}" de un protocolo sobre "${protocolTitle}".\n` +
                      `**Formato de Salida:** Debes responder ÚNICAMENTE con un objeto JSON que contenga una sola clave principal: "${sectionKey}". El valor de esta clave debe ser un objeto con dos claves: "titulo" y "markdownContent".\n`;
    let specificInstructions = '';
    switch (sectionKey) {
        case 'justificacion':
            specificInstructions = `En "markdownContent", escribe un texto completo para la justificación y alcance. Usa subtítulos (###) para "Carga Global y Local", "Importancia en HECAM" y "Factores de riesgo en Quito". Incluye datos epidemiológicos cuando sea posible.`;
            break;
        case 'objetivos':
            specificInstructions = `En "markdownContent", crea dos listas con subtítulos (###): "Objetivos Generales" (3 objetivos) y "Objetivos Específicos" (5 objetivos detallados).`;
            break;
        case 'glosario':
            specificInstructions = `En "markdownContent", define 10-15 términos clave relacionados con "${protocolTitle}". Utiliza el formato **Término:** Definición.`;
            break;
        case 'procedimiento':
            specificInstructions = `En "markdownContent", desarrolla un plan de acción estructurado con los siguientes subtítulos (####): \n"4.1 Diagnóstico y Estratificación", "4.2 Tratamiento Antimicrobiano", "4.3 Soporte Hemodinámico y Monitorización", "4.4 Prevención de Complicaciones", "4.5 Criterios de Alta". En cada sección, proporciona indicaciones y listas detalladas. Evita texto superficial.`;
            break;
        case 'nivelesEvidencia':
            specificInstructions = `En "markdownContent", crea una tabla en formato Markdown para las recomendaciones GRADE con columnas: "Área", "Recomendación", "Nivel de Evidencia", "Fuerza de Recomendación". Incluye de 4 a 6 recomendaciones completas. Después de la tabla, añade un subtítulo "### Interpretación GRADE" y explica los diferentes niveles y fuerzas de recomendación.`;
            break;
        case 'algoritmosFlujogramas':
            specificInstructions = `En "markdownContent", crea un subtítulo "### Algoritmo de Diagnóstico y Manejo". Luego incluye un bloque de código Markdown (\`\`\`mermaid) con el diagrama de flujo para el manejo de "${protocolTitle}". El diagrama debe ser coherente y completo, usando nodos y decisiones básicas.`;
            break;
        case 'indicadores':
            specificInstructions = `En "markdownContent", crea una tabla Markdown con los indicadores de calidad. Columnas: "Nombre", "Definición", "Cálculo", "Meta", "Periodo", "Responsable". Incluye 4-5 indicadores específicos y medibles, sin usar 'N/A'.`;
            break;
        case 'bibliografia':
            specificInstructions = `En "markdownContent", escribe una lista numerada (1., 2., 3., etc.) con 10-15 referencias bibliográficas recientes y relevantes en formato Vancouver. No incluyas texto fuera de la lista.`;
            break;
        case 'anexos':
            specificInstructions = `En "markdownContent", crea un subtítulo "### Anexo 1: Cronograma de Implementación" y una tabla Markdown con 8 pasos (ID, Tarea, Comienzo, Fin) que describa el cronograma para implementar el protocolo.`;
            break;
        case 'firmas':
            specificInstructions = `En "markdownContent", genera una tabla Markdown con columnas: "Rol", "Nombre", "Cargo", "Firma" para los participantes clave (Elaborado por, Revisado por, Aprobado por).`;
            break;
        case 'controlCambios':
            specificInstructions = `En "markdownContent", crea una tabla Markdown para el control de cambios con columnas: "Versión", "Fecha", "Descripción del Cambio", "Autor". Incluye de 2 a 3 filas como ejemplo.`;
            break;
        default:
            specificInstructions = `En "markdownContent", redacta contenido coherente y detallado para la sección.`;
            break;
    }
    return `${promptBase}\n${specificInstructions}`;
}

// Extraer el JSON del texto devuelto por los modelos
function extractJson(str) {
    const firstOpen = str.indexOf('{');
    if (firstOpen === -1) return null;
    let openBraces = 0;
    let jsonEnd = -1;
    for (let i = firstOpen; i < str.length; i++) {
        if (str[i] === '{') openBraces++;
        else if (str[i] === '}') openBraces--;
        if (openBraces === 0) {
            jsonEnd = i + 1;
            break;
        }
    }
    if (jsonEnd !== -1) {
        try {
            return JSON.parse(str.substring(firstOpen, jsonEnd));
        } catch (e) {
            console.error("Error parsing JSON", e);
            return null;
        }
    }
    return null;
}

// Renderizar el protocolo en el contenedor de salida usando Markdown y Mermaid
function renderProtocol(data) {
    const outputDiv = document.getElementById("protocolOutput");
    const actionButtonsDiv = document.getElementById("actionButtons");
    if (!data || !data.metadata || !data.secciones) {
        outputDiv.innerHTML = '<p style="color: orange;">El protocolo generado no tiene la estructura esperada.</p>';
        return;
    }
    let html = `<div class="protocol-header"><h1>PROTOCOLO: ${data.metadata.titulo || "Sin Título"}</h1>` +
               `<p><strong>Código:</strong> HECAM-XX-PR-XXX</p>` +
               `<p><strong>Versión:</strong> ${data.metadata.version || "1.0"} | <strong>Unidad Responsable:</strong> ${data.metadata.unidadResponsable.nombre || "N/A"}</p>` +
               `<p><strong>Fecha de Elaboración:</strong> ${data.metadata.fechaElaboracion || "N/A"}</p></div><hr>`;
    Object.keys(data.secciones).forEach(key => {
        const section = protocolData.secciones[key];
        html += `<section><h2>${section.titulo}</h2>`;
        if (section.markdownContent) {
            // Extraer y renderizar diagramas Mermaid
            const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
            let mermaidCodes = [];
            const contentWithPlaceholders = section.markdownContent.replace(mermaidRegex, (match, code) => {
                const mermaidId = `mermaid-${key}-${mermaidCodes.length}`;
                mermaidCodes.push({ id: mermaidId, code: code.trim() });
                return `<div id="${mermaidId}" class="mermaid"></div>`;
            });
            html += marked.parse(contentWithPlaceholders);
            setTimeout(() => {
                mermaidCodes.forEach(async mc => {
                    try {
                        const diagramContainer = document.getElementById(mc.id);
                        if (diagramContainer && window.mermaid) {
                            const { svg } = await mermaid.render(mc.id + '-svg', mc.code);
                            diagramContainer.innerHTML = svg;
                        }
                    } catch(e) {
                        console.error("Error al renderizar Mermaid:", e);
                        const diagramContainer = document.getElementById(mc.id);
                        if (diagramContainer) diagramContainer.innerHTML = `<pre>Error al renderizar el diagrama. Código recibido:\n${mc.code}</pre>`;
                    }
                });
            }, 200);
        } else {
            html += '<p style="color: orange;"><em>Contenido aún no generado.</em></p>';
        }
        html += `</section>`;
    });
    outputDiv.innerHTML = html;
    // Botones para copiar/descargar
    actionButtonsDiv.innerHTML = '<button onclick="copyHtml()">Copiar HTML</button><button onclick="downloadHtml()">Descargar como HTML</button>';
}

// Copiar el HTML generado al portapapeles
function copyHtml() {
    const protocolHtml = document.getElementById('protocolOutput').innerHTML;
    navigator.clipboard.writeText(protocolHtml).then(() => {
        alert('¡HTML del protocolo copiado al portapapeles!');
    }).catch(() => alert('Error al copiar.'));
}

// Descargar el protocolo como un archivo HTML completo
function downloadHtml() {
    const protocolHtml = document.getElementById('protocolOutput').innerHTML;
    const protocolTitle = document.getElementById('protocolTitle').value.trim() || 'protocolo';
    const fullHtml = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${protocolTitle}</title>` +
        `<style>body{font-family:Arial,sans-serif;line-height:1.6;margin:2cm}h1,h2,h3,h4{color:#005a9c}h2{border-bottom:1px solid #eee;padding-bottom:5px;margin-top:30px}` +
        `table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background-color:#f2f2f2}</style>` +
        `</head><body>${protocolHtml}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${protocolTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
