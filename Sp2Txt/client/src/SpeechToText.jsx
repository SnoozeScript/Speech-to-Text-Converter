import React, { useState, useEffect } from "react";
import axios from "axios";
import "./SpeechToText.css";

const SpeechToText = () => {
  const [file, setFile] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [socket, setSocket] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  useEffect(() => {
    if (isLive) {
      const newSocket = new WebSocket("ws://localhost:8000/ws/transcribe");

      newSocket.onopen = () => {
        console.log("WebSocket connected");
        setError("");
      };

      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.transcription) {
            setTranscription(prev => prev ? `${prev} ${data.transcription}` : data.transcription);
          }
        } catch (e) {
          console.error("Error handling message:", e);
        }
      };

      newSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Live transcription connection error");
        setIsLive(false);
      };

      newSocket.onclose = () => {
        console.log("WebSocket closed");
        setIsLive(false);
      };

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isLive]);

  const startLiveTranscription = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket?.readyState === WebSocket.OPEN) {
          socket.send(event.data);
        }
      };

      recorder.start(1000);
      setMediaRecorder(recorder);
      setIsLive(true);
    } catch (err) {
      setError("Microphone access required for live transcription");
      setIsLive(false);
    }
  };

  const stopLiveTranscription = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    setIsLive(false);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError("");
    setTranscription("");

    try {
      const response = await axios.post(
        "http://localhost:8000/transcribe/",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setTranscription(response.data.transcription || "No transcription found.");
    } catch (error) {
      setError("Failed to transcribe audio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Speech-to-Text Converter</h2>

      <div className="section">
        <h3>File Transcription</h3>
        <input type="file" accept="audio/*" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Transcribing..." : "Transcribe File"}
        </button>
      </div>

      <div className="section">
        <h3>Live Transcription</h3>
        <button onClick={isLive ? stopLiveTranscription : startLiveTranscription}>
          {isLive ? "Stop Live Transcription" : "Start Live Transcription"}
        </button>
      </div>

      {error && <p className="error">Error: {error}</p>}
      {transcription && <div><h3>Transcription:</h3><p>{transcription}</p></div>}
    </div>
  );
};

export default SpeechToText;
