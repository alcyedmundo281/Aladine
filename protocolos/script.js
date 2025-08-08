// En tu archivo script.js, reemplaza esta función completa:

async function generateProtocol() {
    console.log("Botón presionado. Iniciando generación de protocolo.");
    
    // **NO HAY CAMBIOS AQUÍ**
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

    // *** NUEVO: Definir modelName aquí para evitar el ReferenceError ***
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
                    "maxOutputTokens": 8192,
                    "responseMimeType": "application/json",
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
        
        // --- INICIO DE LA SECCIÓN CRÍTICA CORREGIDA ---
        
        // Obtenemos el texto crudo de la respuesta
        const rawText = responseData.candidates[0].content.parts[0].text;
        
        // **NUEVA LÓGICA DE PARSEO ROBUSTA**
        // Buscamos el inicio '{' y el final '}' del JSON.
        // Esto ignora cualquier texto o caracteres extra antes o después.
        const startIndex = rawText.indexOf('{');
        const endIndex = rawText.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1) {
            console.error("No se pudo encontrar un objeto JSON válido en la respuesta:", rawText);
            throw new Error("La respuesta de la API no contenía un formato JSON reconocible.");
        }
        
        // Extraemos la subcadena que es (probablemente) el JSON puro.
        const jsonString = rawText.substring(startIndex, endIndex + 1);

        // Ahora intentamos parsear esta cadena limpia.
        const protocolData = JSON.parse(jsonString);

        // --- FIN DE LA SECCIÓN CRÍTICA CORREGIDA ---

        localStorage.setItem('lastGeneratedProtocol', JSON.stringify(protocolData));
        renderProtocol(protocolData);

    } catch (error) {
        // El ReferenceError de modelName se soluciona definiéndolo antes del try.
        console.error('Error detallado en generateProtocol:', error);
        outputDiv.innerHTML = `<p style="color: red;"><strong>Ocurrió un error:</strong> ${error.message}. <br><strong>Posibles causas:</strong><br>1. La API Key es inválida, no tiene permisos para el modelo '${modelName}', o tiene restricciones.<br>2. Los archivos JSON de ejemplo no se encuentran en la misma carpeta.<br>3. Problema de red.<br><strong>Revisa la consola del navegador (F12) para más detalles.</strong></p>`;
    } finally {
        loader.style.display = 'none';
    }
}
