import os
import requests
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# --- Corrected Path Logic ---
# Get the absolute path of the directory where the script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
# Construct the path to the .env file in the parent directory
dotenv_path = os.path.join(script_dir, '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def get_prompt_for_section(section, dci, indication, evidence):
    """
    Constructs a detailed prompt for the AI by loading a JSON template
    and injecting the current context.
    """
    base_prompt = f'Actúa como un farmacólogo y analista experto en HTA para CONASA, Ecuador. Investiga y rellena la siguiente estructura JSON para "{dci}" en la indicación "{indication}". Tu única salida debe ser el objeto JSON puro.'
    rules = "REGLAS CRÍTICAS: Para 'pico.c' y todas las comparaciones, usa la alternativa terapéutica más relevante del Cuadro Nacional de Medicamentos Básico (CNMB) de Ecuador. Si no existe, indícalo. Rellena cada campo; si no encuentras un dato, usa 'No encontrado'."

    section_map = {
        '12': {'ctx': "", 'file': 'section_12.json'},
        '3': {'ctx': "", 'file': 'section_3.json'},
        '4': {'ctx': f"El comparador principal del CNMB es: {evidence.get('therapeutic_indication', {}).get('alternatives_cnmb', 'No definido aún')}.", 'file': 'section_4.json'},
        '5': {'ctx': f"El comparador es: {evidence.get('pico', {}).get('c', 'No definido')}.", 'file': 'section_5.json'},
        '6': {'ctx': "", 'file': 'section_6.json'},
        '7': {'ctx': "Genera también una lista de 'bibliography' en formato Vancouver de las fuentes más importantes que usaste en todo el análisis.", 'file': 'section_7.json'},
        '8': {'ctx': f'Has recibido el siguiente JSON con la evidencia sobre "{dci}". Tu única tarea es redactar un párrafo para la "CONCLUSIÓN DEL REVISOR". Debe ser conciso y balanceado. Tu única salida debe ser un JSON con la clave "conclusion_text".\\n\\nEvidencia: {json.dumps(evidence)}', 'file': 'section_8.json'}
    }

    section_data = section_map.get(section)
    if not section_data:
        raise ValueError(f"Invalid section number: {section}")

    # --- Corrected Path Logic ---
    # Construct the absolute path to the template file
    template_path = os.path.join(script_dir, '..', 'report_templates', section_data['file'])

    try:
        with open(template_path, 'r') as f:
            json_template = f.read()
    except FileNotFoundError:
        raise ValueError(f"Template file not found: {template_path}")

    # Pass comparator alternatives to the PICO prompt
    if section == '4':
        alts = evidence.get('therapeutic_indication', {}).get('alternatives_cnmb', [])
        alt_names = [alt.get('drug', '') for alt in alts if alt.get('drug')]
        comparator_list = ", ".join(alt_names) if alt_names else "ninguna alternativa directa encontrada en el CNMB"
        section_data['ctx'] = f"La lista de comparadores válidos del CNMB es: [{comparator_list}]. Debes escoger el más apropiado."

    # Standard replacements
    comparator = evidence.get('pico', {}).get('c', 'el comparador principal')
    json_template = json_template.replace('${dci}', dci).replace('${indication}', indication).replace('${comparator}', comparator)

    return f"{base_prompt}\\n{rules}\\n{section_data['ctx']}\\n\\nGenera un JSON con la siguiente estructura y contenido:\\n{json_template}"

@app.route('/api/generate_section', methods=['POST'])
def generate_section():
    try:
        data = request.get_json()
        if not data: return jsonify({"error": "Invalid JSON"}), 400
        section, dci, indication, evidence = data.get('section'), data.get('dci'), data.get('indication'), data.get('evidence', {})
        if not all([section, dci, indication]): return jsonify({"error": "Missing required fields"}), 400

        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key or api_key == "YOUR_API_KEY_HERE": return jsonify({"error": "API key not configured on server."}), 500

        prompt = get_prompt_for_section(section, dci, indication, evidence)
        api_url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key={api_key}'
        headers = {'Content-Type': 'application/json'}
        body = {"contents": [{"parts": [{"text": prompt}]}]}

        response = requests.post(api_url, headers=headers, data=json.dumps(body))
        response.raise_for_status()

        ai_response = response.json()
        json_text = ai_response['candidates'][0]['content']['parts'][0]['text'].replace('```json', '').replace('```', '').strip()

        return jsonify(json.loads(json_text))

    except requests.exceptions.RequestException as e:
        app.logger.error(f"API request error: {e}")
        return jsonify({"error": f"Failed to call Google AI API: {e}"}), 502
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        app.logger.error(f"AI response parsing error: {e}")
        return jsonify({"error": "Failed to parse AI response."}), 500
    except ValueError as e:
        app.logger.error(f"Value error: {e}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        app.logger.error(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected server error occurred."}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
