function renderProtocol(data) {
    const outputDiv = document.getElementById('protocolOutput');
    // Comprobación inicial más robusta
    if (!data || !data.metadata || !data.secciones) {
        outputDiv.innerHTML = `<p style="color: orange;">El protocolo generado no tiene la estructura esperada o está incompleto.</p>`;
        console.error("Datos del protocolo inválidos:", data);
        return;
    }

    // Construcción segura del encabezado
    let html = `<div class="protocol-header"><h1>PROTOCOLO: ${data.metadata.titulo || 'Sin Título'}</h1>`;
    html += `<p><strong>Código:</strong> ${data.metadata.protocoloCodigo || 'N/A'}</p>`;
    if (data.metadata.unidadResponsable) {
        html += `<p><strong>Versión:</strong> ${data.metadata.version || '1.0'} | <strong>Unidad Responsable:</strong> ${data.metadata.unidadResponsable.nombre || 'N/A'}</p>`;
    }
    html += `<p><strong>Fecha de Elaboración:</strong> ${data.metadata.fechaElaboracion || 'N/A'}</p></div><hr>`;

    // Iteración segura de las secciones
    Object.values(data.secciones).forEach(section => {
        if (!section || !section.titulo) return; // Salta secciones inválidas

        html += `<section><h2>${section.titulo}</h2>`;

        // Contenido de la justificación
        if (section.contenido) {
            if (section.contenido.problemaSaludPublica) html += `<p>${section.contenido.problemaSaludPublica}</p>`;
            if (section.contenido.prevalencia && section.contenido.prevalencia.institucional_hecam) html += `<p><strong>Prevalencia Institucional:</strong> ${section.contenido.prevalencia.institucional_hecam}</p>`;
            if (section.contenido.poblacionObjetivo) html += `<p><strong>Población Objetivo:</strong> ${section.contenido.poblacionObjetivo}</p>`;
            if (Array.isArray(section.contenido.unidadesInvolucradas)) html += `<p><strong>Unidades Involucradas:</strong> ${section.contenido.unidadesInvolucradas.join(', ')}</p>`;
            if (Array.isArray(section.contenido.resultadosEsperados)) { html += `<strong>Resultados Esperados:</strong><ul>${section.contenido.resultadosEsperados.map(item => `<li>${item}</li>`).join('')}</ul>`; }
        }

        // Objetivos
        if (section.general) html += `<p><strong>Objetivo General:</strong> ${section.general}</p>`;
        if (Array.isArray(section.especificos)) { html += `<strong>Objetivos Específicos:</strong><ul>${section.especificos.map(obj => `<li>${obj}</li>`).join('')}</ul>`; }
        
        // Glosario
        if (Array.isArray(section.terminos)) { html += '<ul>'; section.terminos.forEach(term => html += `<li><strong>${term.abreviatura}:</strong> ${term.definicion}</li>`); html += '</ul>'; }
        
        // Procedimiento y subsecciones
        if (section.subsecciones) {
            Object.values(section.subsecciones).forEach(sub => {
                if (!sub || !sub.titulo) return;
                html += `<h3>${sub.titulo}</h3>`;
                for (const [key, value] of Object.entries(sub)) {
                    if (key === 'titulo') continue;
                    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    html += `<strong>${formattedKey}:</strong>`;
                    if (Array.isArray(value)) {
                         // Manejo específico y seguro para calculadorasRecomendadas
                        if (key === 'calculadorasRecomendadas' && value.length > 0) {
                            html += `<ul>${value.map(item => `<li>${item.nombre} (<a href='${item.link}' target='_blank'>Ir a la calculadora</a>)</li>`).join('')}</ul>`;
                        } else {
                            html += `<ul>${value.map(v => `<li>${typeof v === 'object' ? JSON.stringify(v) : v}</li>`).join('')}</ul>`;
                        }
                    } else if (typeof value === 'object' && value !== null) {
                        html += `<ul style="list-style-type: none; padding-left: 15px;">`;
                        for (const [subKey, subValue] of Object.entries(value)) {
                             html += `<li><em>${subKey.replace(/([A-Z])/g, ' $1').trim()}:</em> ${subValue}</li>`;
                        }
                        html += `</ul>`;
                    }
                }
            });
        }
        
        // Algoritmos
        if (Array.isArray(section.flujogramas)) { section.flujogramas.forEach((flujo) => { html += `<h4>${flujo.tituloFigura}</h4>`; html += `<div class="mermaid">${flujo.descripcion_mermaid}</div>`; }); }
        
        // Indicadores
        if (Array.isArray(section.items) && section.items.length > 0) {
            html += '<table><thead><tr>';
            const headers = Object.keys(section.items[0]);
            headers.forEach(header => html += `<th>${header.charAt(0).toUpperCase() + header.slice(1)}</th>`);
            html += '</tr></thead><tbody>';
            section.items.forEach(item => { html += '<tr>'; headers.forEach(header => html += `<td>${item[header] || 'N/A'}</td>`); html += '</tr>'; });
            html += '</tbody></table>';
        }

        // Bibliografía
        if (Array.isArray(section.referencias)) { html += '<h4>Referencias</h4><ol>'; section.referencias.forEach(ref => html += `<li>${ref}</li>`); html += '</ol>'; }

        html += `</section>`;
    });

    outputDiv.innerHTML = html;
    // El renderizado de Mermaid debe estar en un try-catch para no detener la app
    setTimeout(() => { try { if (window.mermaid) window.mermaid.run(); } catch (e) { console.error("Error al renderizar Mermaid:", e); } }, 100);
}
