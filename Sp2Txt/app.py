from fastapi import FastAPI, WebSocket, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import subprocess
import os
import logging
import asyncio
from datetime import datetime
from transformers import pipeline

app = FastAPI()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the Whisper speech-to-text model
stt_pipeline = pipeline(
    "automatic-speech-recognition",
    model="openai/whisper-small",
    device_map="auto"
)

async def convert_audio(input_path: str, output_path: str):
    """Convert audio to 16kHz mono WAV format using FFmpeg."""
    try:
        result = subprocess.run(
            [
                "ffmpeg",
                "-i", input_path,
                "-ar", "16000",
                "-ac", "1",
                "-y", output_path
            ],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg error: {e.stderr.decode()}")
        return False

@app.websocket("/ws/transcribe")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time audio transcription."""
    await websocket.accept()
    buffer = bytearray()
    
    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_bytes(), timeout=10.0)
                buffer.extend(data)
                
                if len(buffer) >= 16000 * 2:  # Process about 1 second of audio
                    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as webm_file:
                        webm_file.write(buffer)
                        webm_path = webm_file.name
                    
                    wav_path = f"temp_{datetime.now().timestamp()}.wav"
                    
                    if await convert_audio(webm_path, wav_path):
                        try:
                            result = stt_pipeline(
                                wav_path,
                                generate_kwargs={"language": "en"}
                            )
                            transcription = result.get("text", "").strip()
                            
                            if transcription:
                                await websocket.send_json({
                                    "transcription": transcription
                                })
                        except Exception as e:
                            logger.error(f"Transcription error: {str(e)}")
                        finally:
                            os.remove(webm_path)
                            os.remove(wav_path)
                        
                        buffer = bytearray()  # Reset buffer after processing
                else:
                    await asyncio.sleep(0.1)

            except asyncio.TimeoutError:
                await websocket.send_json({"status": "ping"})
                
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        await websocket.close(code=1000)
        logger.info("Connection closed")

@app.post("/transcribe/")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe an uploaded audio file."""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            content = await file.read()
            temp_audio.write(content)
            temp_audio_path = temp_audio.name

        result = stt_pipeline(
            temp_audio_path,
            generate_kwargs={"language": "en"}
        )
        return {"transcription": result.get("text", "")}
    except Exception as e:
        logger.error(f"File transcription error: {str(e)}")
        return {"error": str(e)}
    finally:
        os.remove(temp_audio_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        ws_ping_interval=10,
        ws_ping_timeout=30,
        reload=True
    )
