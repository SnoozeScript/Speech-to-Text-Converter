from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import tempfile
from transformers import pipeline

app = FastAPI()

# Enable CORS for all domains (Allow frontend to communicate with the backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this to specific frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the ASR model
stt_pipeline = pipeline("automatic-speech-recognition", model="openai/whisper-small")

@app.post("/transcribe/")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        print(f"Received file: {file.filename}")
        
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            temp_audio.write(await file.read())
            temp_audio_path = temp_audio.name

        print(f"Saved audio file to: {temp_audio_path}")

        # Run transcription (force English transcription)
        result = stt_pipeline(temp_audio_path, generate_kwargs={"language": "en"})

        transcription_text = result.get("text", "")
        print("Transcription:", transcription_text)

        return {"transcription": transcription_text}
    except Exception as e:
        print("Error:", str(e))
        return {"error": str(e)}
