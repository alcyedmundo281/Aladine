let protocolData = null;
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('generateButton').addEventListener('click', generateProtocolStructure);
});
function generateProtocolStructure(){
  const title = document.getElementById('protocolTitle').value.trim();
  if(!title){ alert("Ingrese título"); return; }
  protocolData = { metadata:{titulo:title}, secciones:{
    justificacion:{titulo:"1. Justificación y Alcance", markdownContent:null},
    objetivos:{titulo:"2. Objetivos", markdownContent:null},
    indicadores:{titulo:"7. Indicadores de Calidad", markdownContent:null},
    bibliografia:{titulo:"8. Bibliografía", markdownContent:null}
  }};
  renderStructureUI();
}
function renderStructureUI(){
  const cont = document.getElementById('protocolStructure');
  cont.innerHTML = '';
  for(const key in protocolData.secciones){
    cont.innerHTML += `<div class='section-generator' id='gen-${key}'>
      <span>${protocolData.secciones[key].titulo}</span>
      <button onclick="generateSectionContent('${key}')">Generar</button></div>`;
  }
}
async function generateSectionContent(key){
  if(document.getElementById('engine').value==='demo'){
    if(key==='indicadores'){
      protocolData.secciones[key].markdownContent = `| Nombre | Definición | Cálculo | Meta | Periodo | Responsable |
|--------|------------|---------|------|---------|-------------|
| Tiempo inicio tratamiento | Tiempo desde diagnóstico hasta inicio | (Horas acumuladas / casos) | ≤ 2h | Mensual | Jefe de Unidad |
| Adherencia al protocolo | % casos cumplen etapas | (Casos adherentes / total)*100 | ≥95% | Trimestral | Comité Calidad |`;
    }
    if(key==='bibliografia'){
      protocolData.secciones[key].markdownContent = `1. Autor AA. Título. Rev Ejemplo. 2023;10(2):123-130.
2. Autor BB. Otro título. Libro Ejemplo. 2022;45(1):50-60.`;
    }
  }
  document.getElementById(`gen-${key}`).innerHTML = `<span>${protocolData.secciones[key].titulo}</span><span class='status'>✓ Generado</span>`;
  renderProtocol();
}
function renderProtocol(){
  let html = `<h1>${protocolData.metadata.titulo}</h1>`;
  for(const key in protocolData.secciones){
    html += `<h2>${protocolData.secciones[key].titulo}</h2>`;
    if(protocolData.secciones[key].markdownContent){
      html += marked.parse(protocolData.secciones[key].markdownContent);
    }
  }
  document.getElementById('protocolOutput').innerHTML = html;
  document.getElementById('protocolOutput').style.display = 'block';
}
