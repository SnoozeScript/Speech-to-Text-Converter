# Speech-to-Text Converter (React + Flask + Whisper AI)

This project converts speech to text using **OpenAI Whisper** with a **Flask API** and a **React.js** frontend.

## 🚀 Features
- Upload audio files (.wav, .mp3, .flac, etc.)
- Transcribe speech using **Whisper AI**

## 🛠️ Installation  

### 📌 Prerequisites  
- **Node.js**, **Python 3**, **pip**, **FFmpeg**  

### 🔹 Backend (Flask API)  
```sh
git clone https://github.com/your-repo/speech-to-text.git
cd speech-to-text/backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
> Runs at `http://127.0.0.1:8000 |http://127.0.0.1:8000/docs#`


### 🔹 Frontend (React.js)  
```sh
cd ../client
npm install
npm run dev
```
> Runs at `http://localhost:5173`

---

## 📝 Usage  
1. Open the app, upload an audio file, and click **Transcribe**.  
2. View the transcribed text.
