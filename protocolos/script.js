// script.js - VERSIÓN MEJORADA Y A PRUEBA DE ERRORES

// 1. Incrustar los JSON directamente para evitar problemas de 'fetch' en GitHub Pages
const htaExample = {
    // ... Pega aquí el contenido COMPLETO de tu archivo hipertension_arterial_example.json ...
    "metadata": { "protocoloCodigo": "HECAM-MI-PR-001", "titulo": "Manejo de la Hipertensión Arterial y Urgencia Hipertensiva en Adultos", "version": "1.0", "fechaElaboracion": "2024-10-26", "fechaVigencia": "2026-10-26", "unidadResponsable": { "nombre": "Unidad Técnica de Medicina Interna" }, "autores": [{ "nombre": "Dr. Alcy Edmundo Torres Guerrero", "rol": "Médico Especialista en Medicina Interna" }], "revisores": [{"cargo": "Coordinador General de Investigación", "nombre": ""}, {"cargo": "Coordinador General de Control de Calidad", "nombre": ""}, {"cargo": "Jefe de la Unidad Técnica de Medicina Interna", "nombre": ""}], "aprobador": {"cargo": "Director Técnico", "nombre": ""}}, "secciones": { "justificacion": { "titulo": "1. Justificación", "contenido": { "problemaSaludPublica": "La hipertensión arterial (HTA) es un problema de salud pública global y nacional, con una prevalencia en Ecuador cercana al 20% en adultos. Es el principal factor de riesgo modificable para enfermedades cardiovasculares, cerebrovasculares y renales.", "prevalencia": { "institucional_hecam": "En el HECAM, la HTA y sus complicaciones, como la urgencia hipertensiva, son una de las principales causas de consulta y hospitalización en Medicina Interna, generando una alta carga asistencial y la necesidad de estandarizar su manejo para prevenir eventos adversos." }, "poblacionObjetivo": "Pacientes adultos (>18 años) con diagnóstico de HTA o que presenten una urgencia hipertensiva, atendidos en el HECAM.", "contextoAplicacion": "Consulta ambulatoria, hospitalización y atención de urgencias.", "unidadesInvolucradas": ["Medicina Interna", "Cardiología", "Nefrología", "Emergencia", "Farmacia"], "resultadosEsperados": ["Mejorar el control de la PA en pacientes tratados.", "Reducir la progresión de urgencia a emergencia hipertensiva.", "Optimizar el uso de antihipertensivos del CNMB.", "Disminuir la variabilidad en la práctica clínica."]}}, "objetivos": { "titulo": "2. Objetivos", "general": "Establecer un protocolo basado en evidencia para el manejo integral de la HTA y la urgencia hipertensiva en adultos atendidos en el HECAM.", "especificos": ["Definir criterios diagnósticos de HTA y urgencia hipertensiva, considerando la altitud de Quito.", "Establecer un algoritmo de tratamiento farmacológico basado en el CNMB.", "Definir un plan de manejo para la urgencia hipertensiva que evite reducciones bruscas de la PA.", "Establecer criterios claros de seguimiento y egreso."] }, "glosario": { "titulo": "3. Glosario de Términos / Abreviaturas", "terminos": [{"abreviatura": "HTA", "definicion": "Hipertensión Arterial"}, {"abreviatura": "UH", "definicion": "Urgencia Hipertensiva"}, {"abreviatura": "DAOD", "definicion": "Daño Agudo de Órgano Diana"}, {"abreviatura": "CNMB", "definicion": "Cuadro Nacional de Medicamentos Básicos"}, {"abreviatura": "IECA", "definicion": "Inhibidor de la Enzima Convertidora de Angiotensina"}, {"abreviatura": "ARA II", "definicion": "Antagonista del Receptor de Angiotensina II"}, {"abreviatura": "CCB", "definicion": "Bloqueador de Canales de Calcio (Calcioantagonista)"}, {"abreviatura": "PAM", "definicion": "Presión Arterial Media"}] }, "procedimiento": { "titulo": "4. Procedimiento (Plan de Acción/Actuación)", "subsecciones": { "evaluacionInicial": { "titulo": "4.1. Evaluación Inicial del Paciente con HTA severa", "historiaClinica": ["Antecedentes de HTA, tratamiento y adherencia.", "Comorbilidades (ERC, DM, ECV).", "Uso de fármacos que elevan la PA.", "Búsqueda activa de síntomas de DAOD (dolor torácico, disnea, déficit neurológico)."], "examenFisico": ["Medición de PA en ambos brazos.", "Examen neurológico completo.", "Auscultación cardiopulmonar.", "Fondo de ojo para descartar papiledema."], "examenesComplementarios": { "obligatorios": ["ECG de 12 derivaciones.", "Creatinina sérica y electrolitos.", "Biometría hemática.", "Examen de orina."], "opcionales": ["Troponinas (si hay dolor torácico).", "Radiografía de tórax (si hay disnea).", "TAC de cráneo (si hay déficit neurológico)."]}}, "diagnostico": { "titulo": "4.2. Diagnóstico Diferencial: Urgencia vs. Emergencia Hipertensiva", "criteriosDiagnosticos": ["Urgencia Hipertensiva (UH): PAS ≥ 180 mmHg y/o PAD ≥ 120 mmHg SIN evidencia de DAOD agudo.", "Emergencia Hipertensiva (EH): Cifras tensionales elevadas CON evidencia de DAOD agudo (EVC, SCA, EAP, disección aórtica, eclampsia, IRA)."], "estratificacionRiesgo": { "descripcion": "En pacientes con HTA crónica, estratificar el riesgo cardiovascular a 10 años.", "calculadorasRecomendadas": [{"nombre": "Calculadora de Riesgo Cardiovascular PREVENT™ de la AHA", "link": "https://professional.heart.org/en/guidelines-and-statements/prevent-calculator"}]}}, "planTerapeutico": { "titulo": "4.3. Plan Terapéutico de la Urgencia Hipertensiva", "intervencionesNoFarmacologicas": ["Proporcionar un ambiente tranquilo.", "Reposo en cama con cabecera elevada.", "Identificar y tratar causas desencadenantes (dolor, ansiedad)."], "tratamientoFarmacologico": { "principiosGenerales": "El objetivo es reducir la PA gradualmente en 24-48 horas. La meta inicial es ≤160/100 mmHg. Evitar reducciones de la PAM >25% en las primeras horas para no causar hipoperfusión.", "algoritmoTerapeutico": [{"paso": "Pacientes con tratamiento previo", "descripcion": "Reinstaurar su medicación oral si hubo mala adherencia. Considerar aumentar la dosis o añadir un segundo fármaco.", "medicamentos_cnmb": [{"nombre": "Reinstaurar Enalapril/Losartán/Amlodipino", "dosis_tipica": "Según esquema previo"}]}, {"paso": "Pacientes sin tratamiento previo", "descripcion": "Iniciar tratamiento oral con un fármaco de acción relativamente rápida pero controlada.", "medicamentos_cnmb": [{"nombre": "Captopril", "dosis_tipica": "6.25-25 mg VO"}, {"nombre": "Labetalol", "dosis_tipica": "100-200 mg VO"}, {"nombre": "Clonidina", "dosis_tipica": "0.1-0.2 mg VO"}]}, {"paso": "Fármacos a Evitar", "descripcion": "Nifedipino sublingual está contraindicado por el riesgo de caídas bruscas e incontroladas de la PA."}]}}}}, "algoritmosFlujogramas": { "titulo": "5. Algoritmo de Actuación", "flujogramas": [{"tituloFigura": "Figura 1. Manejo de la Urgencia Hipertensiva en HECAM", "descripcion_mermaid": "graph TD; A[Paciente con PA ≥ 180/120 mmHg] --> B{¿Signos/Síntomas de DAOD agudo?}; B -- Sí --> C[Manejo como EMERGENCIA HIPERTENSIVA (Otro protocolo)]; B -- No --> D[Diagnóstico: URGENCIA HIPERTENSIVA]; D --> E[Ambiente tranquilo, reposo, VVP]; E --> F{¿Paciente con tratamiento previo?}; F -- Sí --> G[Reinstaurar/ajustar medicación oral]; F -- No --> H[Iniciar fármaco oral (ej. Captopril, Labetalol)]; G & H --> I[Monitorizar PA cada 30-60 min]; I --> J{¿PA desciende gradualmente hacia ≤160/100 mmHg en 24h?}; J -- Sí --> K[Ajustar tratamiento crónico y planificar alta]; J -- No --> L[Reevaluar, considerar segundo fármaco o causa secundaria];"}]}, "indicadores": { "titulo": "6. Indicadores de Calidad", "items": [{"nombre": "Tasa de progresión de UH a EH", "definicion": "Porcentaje de pacientes con UH que desarrollan DAOD durante la hospitalización.", "calculo": "(N° de progresiones a EH / N° total de UH) x 100", "meta": "< 2%", "periodo": "Semestral", "responsable": "Jefe de Unidad de Medicina Interna"}, {"nombre": "Uso de Nifedipino sublingual en UH", "definicion": "Porcentaje de pacientes con UH que reciben nifedipino sublingual.", "calculo": "(N° de pacientes con nifedipino SL / N° total de UH) x 100", "meta": "0%", "periodo": "Trimestral", "responsable": "Comité de Farmacia"}]}, "bibliografia": { "titulo": "7. Bibliografía", "referencias": ["Williams B, Mancia G, et al. 2018 ESC/ESH Guidelines for the management of arterial hypertension. Eur Heart J. 2018;39(33):3021-3104.", "Whelton PK, Carey RM, et al. 2017 ACC/AHA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults. J Am Coll Cardiol. 2018;71(19):e127-e248.", "Unger T, Borghi C, et al. 2020 International Society of Hypertension Global Hypertension Practice Guidelines. Hypertension. 2020;75(6):1334-1357.", "Varon J, Elliot W. Management of severe asymptomatic hypertension (hypertensive urgencies) in adults. UpToDate. 2023."]}}
};

const nacExample = {
    // ... Pega aquí el contenido COMPLETO de tu archivo neumonia_comunitaria_example.json ...
    "metadata": { "protocoloCodigo": "HECAM-MI-PR-002", "titulo": "Manejo de la Neumonía Adquirida en la Comunidad (NAC) en Adultos", "version": "1.0", "fechaElaboracion": "2024-10-26", "fechaVigencia": "2026-10-26", "unidadResponsable": { "nombre": "Unidad Técnica de Medicina Interna" }, "autores": [{"nombre": "Dr. Juan Pérez", "rol": "Médico Especialista en Neumología"}], "revisores": [], "aprobador": {}}, "secciones": { "justificacion": { "titulo": "1. Justificación", "contenido": { "problemaSaludPublica": "La Neumonía Adquirida en la Comunidad (NAC) es una de las principales causas de morbimortalidad por enfermedades infecciosas a nivel mundial y una causa frecuente de hospitalización.", "prevalencia": { "institucional_hecam": "En el HECAM, la NAC representa un porcentaje significativo de los ingresos al servicio de Medicina Interna, especialmente durante los picos estacionales. Un manejo estandarizado es clave para mejorar los desenlaces y optimizar el uso de antibióticos." }, "poblacionObjetivo": "Pacientes adultos inmunocompetentes con diagnóstico de NAC.", "unidadesInvolucradas": ["Medicina Interna", "Neumología", "Emergencia", "Laboratorio Clínico", "Imagenología", "Farmacia"]}}, "objetivos": { "titulo": "2. Objetivos", "general": "Establecer un protocolo para el diagnóstico, estratificación de riesgo y tratamiento de la NAC en adultos en el HECAM, promoviendo el uso racional de antibióticos.", "especificos": ["Definir criterios diagnósticos y de ingreso hospitalario.", "Implementar el uso de escalas de riesgo como CURB-65 para guiar el manejo.", "Establecer esquemas antibióticos empíricos basados en la estratificación de riesgo y el CNMB.", "Definir criterios de cambio a terapia oral y de alta hospitalaria."] }, "glosario": { "titulo": "3. Glosario", "terminos": [{"abreviatura": "NAC", "definicion": "Neumonía Adquirida en la Comunidad"}, {"abreviatura": "CURB-65", "definicion": "Escala de riesgo (Confusión, Urea, Frecuencia Respiratoria, Presión Arterial, Edad ≥ 65)"}, {"abreviatura": "PSI", "definicion": "Pneumonia Severity Index"}, {"abreviatura": "UCI", "definicion": "Unidad de Cuidados Intensivos"}, {"abreviatura": "EPOC", "definicion": "Enfermedad Pulmonar Obstructiva Crónica"}] }, "procedimiento": { "titulo": "4. Procedimiento", "subsecciones": { "diagnostico": { "titulo": "4.1. Diagnóstico y Estratificación", "criteriosDiagnosticos": ["Presencia de un infiltrado nuevo en la radiografía de tórax más al menos dos de los siguientes: fiebre/hipotermia, tos (con o sin esputo), disnea, leucocitosis/leucopenia, dolor pleurítico."], "estratificacionRiesgo": { "descripcion": "Utilizar la escala CURB-65 para decidir el lugar de tratamiento.", "calculadorasRecomendadas": [{"nombre": "Calculadora CURB-65", "link": "https://www.mdcalc.com/calc/390/curb-65-score-pneumonia-severity"}]}}, "planTerapeutico": { "titulo": "4.2. Plan Terapéutico", "tratamientoFarmacologico": { "algoritmoTerapeutico": [{"paso": "CURB-65: 0-1 (Manejo Ambulatorio)", "descripcion": "Monoterapia oral.", "medicamentos_cnmb": [{"nombre": "Amoxicilina", "dosis_tipica": "1g VO cada 8h"} , {"nombre": "Doxiciclina", "dosis_tipica": "100mg VO cada 12h"}]}, {"paso": "CURB-65: 2 (Manejo Hospitalario)", "descripcion": "Terapia combinada IV.", "medicamentos_cnmb": [{"nombre": "Ceftriaxona", "dosis_tipica": "1-2g IV cada 24h"} , {"nombre": "Claritromicina", "dosis_tipica": "500mg IV/VO cada 12h"}]}, {"paso": "CURB-65: ≥3 (Considerar UCI)", "descripcion": "Terapia combinada IV de amplio espectro.", "medicamentos_cnmb": [{"nombre": "Ceftriaxona + Claritromicina", "dosis_tipica": "Ver dosis previas"}]}]}}}}
};


document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('generateButton').addEventListener('click', generateProtocol);
    const savedProtocol = localStorage.getItem('lastGeneratedProtocol');
    if (savedProtocol) {
        try {
            const protocolData = JSON.parse(savedProtocol);
            renderProtocol(protocolData);
            document.getElementById('protocolTitle').value = protocolData.metadata.titulo;
            document.getElementById('medicalUnit').value = protocolData.metadata.unidadResponsable.nombre;
        } catch (e) {
            console.error("Error al cargar protocolo guardado:", e);
            localStorage.removeItem('lastGeneratedProtocol');
        }
    }
});

async function generateProtocol() {
    const protocolTitle = document.getElementById('protocolTitle').value.trim();
    const medicalUnit = document.getElementById('medicalUnit').value;
    const apiKey = document.getElementById('apiKey').value.trim();
    const loader = document.getElementById('loader');
    const outputDiv = document.getElementById('protocolOutput');

    if (!protocolTitle || !medicalUnit || !apiKey) {
        alert("Por favor, complete todos los campos.");
        return;
    }

    loader.style.display = 'block';
    outputDiv.innerHTML = '';

    try {
        const prompt = createGeminiPromptWithExamples(protocolTitle, medicalUnit, htaExample, nacExample);
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                "generationConfig": {"temperature": 0.4, "maxOutputTokens": 8192}
            })
        });

        const responseData = await response.json();

        // **2. Manejo de errores mejorado**
        if (!response.ok) {
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            if (responseData && responseData.error && responseData.error.message) {
                errorMessage += ` - ${responseData.error.message}`;
            }
            throw new Error(errorMessage);
        }

        const jsonString = responseData.candidates[0].content.parts[0].text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        
        // **3. Try-catch para el parseo del JSON**
        let protocolData;
        try {
            protocolData = JSON.parse(jsonString);
        } catch (parseError) {
            console.error("Error al parsear la respuesta JSON de Gemini:", parseError);
            console.log("Respuesta recibida:", jsonString);
            throw new Error("La respuesta de la API no es un JSON válido. Revisa la consola para ver la respuesta cruda.");
        }

        localStorage.setItem('lastGeneratedProtocol', JSON.stringify(protocolData));
        renderProtocol(protocolData);

    } catch (error) {
        console.error('Error detallado:', error);
        outputDiv.innerHTML = `<p style="color: red;"><strong>Ocurrió un error:</strong> ${error.message}. Por favor, verifica tu API Key, la conexión a internet y la consola del navegador para más detalles.</p>`;
    } finally {
        loader.style.display = 'none';
    }
}

// ... Pega aquí la función renderProtocol de la respuesta anterior ...
function renderProtocol(data) {
    const outputDiv = document.getElementById('protocolOutput');
    let html = `<h1>PROTOCOLO: ${data.metadata.titulo}</h1>`;
    html += `<p><strong>Versión:</strong> ${data.metadata.version} | <strong>Unidad:</strong> ${data.metadata.unidadResponsable.nombre}</p><hr>`;

    // Renderizar cada sección
    Object.values(data.secciones).forEach(section => {
        if (!section || !section.titulo) return;
        html += `<h2>${section.titulo}</h2>`;

        // Lógica de renderizado específica para cada sección
        if (section.contenido) {
            Object.values(section.contenido).forEach(content => {
                if (typeof content === 'string') {
                    html += `<p>${content}</p>`;
                } else if (Array.isArray(content)) {
                    html += '<ul>';
                    content.forEach(item => html += `<li>${item}</li>`);
                    html += '</ul>';
                }
            });
        }
        
        if(section.general) html += `<p><strong>General:</strong> ${section.general}</p>`;
        if(section.especificos) {
            html += `<h3>Objetivos Específicos</h3><ul>`;
            section.especificos.forEach(obj => html += `<li>${obj}</li>`);
            html += `</ul>`;
        }

        if (section.terminos) {
            html += '<ul>';
            section.terminos.forEach(term => html += `<li><strong>${term.abreviatura}:</strong> ${term.definicion}</li>`);
            html += '</ul>';
        }
        
        if (section.subsecciones) {
            Object.values(section.subsecciones).forEach(sub => {
                html += `<h3>${sub.titulo}</h3>`;
                Object.entries(sub).forEach(([key, value]) => {
                    if (key !== 'titulo') {
                       if (Array.isArray(value)) {
                           html += `<strong>${key.replace(/([A-Z])/g, ' $1').trim()}:</strong><ul>${value.map(v => `<li>${v}</li>`).join('')}</ul>`;
                       } else if (typeof value === 'object' && value !== null) {
                           // Renderizado más profundo para objetos anidados
                           html += `<strong>${key.replace(/([A-Z])/g, ' $1').trim()}:</strong><br>`;
                           Object.entries(value).forEach(([subKey, subValue]) => {
                               if (Array.isArray(subValue)) {
                                   html += `<em>${subKey}:</em><ul>${subValue.map(item => `<li>${typeof item === 'object' ? JSON.stringify(item) : item}</li>`).join('')}</ul>`;
                               } else {
                                   html += `<p><em>${subKey}:</em> ${JSON.stringify(subValue)}</p>`;
                               }
                           });
                       }
                    }
                });
            });
        }
        
        if (section.flujogramas) {
            section.flujogramas.forEach((flujo, index) => {
                html += `<h4>${flujo.tituloFigura}</h4>`;
                html += `<div class="mermaid" id="mermaid-${index}">${flujo.descripcion_mermaid}</div>`;
            });
        }
        
        if (section.items) {
             html += '<table><tr>';
            const headers = Object.keys(section.items[0]);
            headers.forEach(header => html += `<th>${header.charAt(0).toUpperCase() + header.slice(1)}</th>`);
            html += '</tr>';
            section.items.forEach(item => {
                html += '<tr>';
                headers.forEach(header => html += `<td>${item[header]}</td>`);
                html += '</tr>';
            });
            html += '</table>';
        }
        
        if (section.referencias) {
            html += '<ol>';
            section.referencias.forEach(ref => html += `<li>${ref}</li>`);
            html += '</ol>';
        }
    });

    outputDiv.innerHTML = html;
    
    // Es crucial inicializar y renderizar mermaid DESPUÉS de que el HTML esté en el DOM
    setTimeout(() => {
        try {
            window.mermaid.run();
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
    - **Unidad Médica Responsable:** "${newUnit}"

    Tu respuesta debe ser **ÚNICAMENTE el objeto JSON completo y válido** para el nuevo protocolo, sin ningún texto o explicación adicional.
    `;
}
