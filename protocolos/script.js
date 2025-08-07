document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('generateButton').addEventListener('click', generateProtocol);
    
    // Cargar último protocolo
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
    const medicalUnit = document.getElementById('medicalUnit').value; // NUEVO
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
        // Cargar los ejemplos para el "few-shot learning"
        const [htaResponse, nacResponse] = await Promise.all([
            fetch('hipertension_arterial_example.json'),
            fetch('neumonia_comunitaria_example.json')
        ]);
        const htaExample = await htaResponse.json();
        const nacExample = await nacResponse.json();

        // Crear el prompt mejorado
        const prompt = createGeminiPromptWithExamples(protocolTitle, medicalUnit, htaExample, nacExample);
        
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                "generationConfig": {"temperature": 0.4, "maxOutputTokens": 8192}
            })
        });

        if (!geminiResponse.ok) {
            throw new Error(`Error en la API: ${geminiResponse.statusText}`);
        }

        const geminiData = await geminiResponse.json();
        const jsonString = geminiData.candidates[0].content.parts[0].text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        
        const protocolData = JSON.parse(jsonString);

        localStorage.setItem('lastGeneratedProtocol', JSON.stringify(protocolData));
        renderProtocol(protocolData);

    } catch (error) {
        console.error('Error:', error);
        outputDiv.innerHTML = `<p style="color: red;"><strong>Ocurrió un error:</strong> ${error.message}. Verifique la consola para más detalles.</p>`;
    } finally {
        loader.style.display = 'none';
    }
}

function renderProtocol(data) {
    const outputDiv = document.getElementById('protocolOutput');
    // Implementación de renderizado más robusta
    // (Puedes pegar la función renderProtocol de la respuesta anterior aquí, es compatible)
    // ...
    let html = `<h1>PROTOCOLO: ${data.metadata.titulo}</h1>`;
    html += `<p><strong>Versión:</strong> ${data.metadata.version} | <strong>Unidad:</strong> ${data.metadata.unidadResponsable.nombre}</p>`;
    // ...resto de la lógica de renderizado...
    outputDiv.innerHTML = html;

    window.mermaid.run({ nodes: document.querySelectorAll('.mermaid') });
}


function createGeminiPromptWithExamples(newTitle, newUnit, example1, example2) {
    return `
    **ROL Y OBJETIVO:**
    Eres un asistente experto en la redacción de protocolos médicos para el Hospital de Especialidades Carlos Andrade Marín (HECAM) en Quito, Ecuador. Tu tarea es generar un protocolo completo, basado en evidencia y adaptado al contexto local.

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
