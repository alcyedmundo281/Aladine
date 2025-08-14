# CONAMEI Report Generator (High Fidelity)

This project is a web-based tool for generating high-fidelity technical medical reports that conform to the CONAMEI format. It uses a Python backend to securely interact with the Google AI API and a vanilla JavaScript frontend to provide a step-by-step user interface for building the report.

## How It Works

The application has two main components:
1. **Frontend**: An HTML file (`web-conamei-maestra.html`) that provides the user interface. The user inputs a drug name and indication, then generates the report section by section.
2. **Backend**: A Python Flask server (`api/main.py`) that receives requests from the frontend, securely calls the Google AI API with the user's API key, and returns the generated content for each section.

This architecture ensures that your Google AI API key is never exposed in the browser.

## Prerequisites

- Python 3.6+
- `pip` for installing Python packages

## Setup and Running the Application

Follow these steps to get the application running locally.

### 1. Configure your API Key

Your secret Google AI API key must be stored in an environment file.

1. Rename the file `.env.example` to `.env`.
2. Open the new `.env` file in a text editor.
3.  Replace the placeholder `YOUR_API_KEY_HERE` with your actual Google AI API key.

```
.env file
GOOGLE_API_KEY="AIz..........................."
```

### 2. Install Dependencies

Open your terminal and navigate to the project's root directory. Install the necessary Python packages using the `requirements.txt` file.

```bash
pip install -r api/requirements.txt
```

### 3. Run the Backend Server
Once the dependencies are installed, you can start the Python backend server.

```bash
python3 api/main.py
```

You should see output indicating that the server is running, typically on http://127.0.0.1:5000. Keep this terminal window open; the server needs to be running for the application to work.

### 4. Open the Frontend

In your file explorer, find the `web-conamei-maestra.html` file and open it with your preferred web browser (e.g., Chrome, Firefox, Safari).

The application is now ready to use. Enter a drug name and indication, and follow the step-by-step buttons to generate your report.

