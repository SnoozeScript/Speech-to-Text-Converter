import React, { useState } from "react";
import axios from "axios";
import "./SpeechToText.css"; // Import CSS file

const SpeechToText = () => {
  const [file, setFile] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const response = await axios.post("http://127.0.0.1:8000/transcribe/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Response Data:", response.data);

      if (response.data.error) {
        setError(response.data.error);
      } else {
        setTranscription(response.data.transcription || "No transcription found.");
      }
    } catch (error) {
      console.error("Error transcribing:", error);
      setError("Failed to transcribe audio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Speech-to-Text Converter</h2>
      <input type="file" accept="audio/*" onChange={handleFileChange} className="file-input" />
      <button onClick={handleUpload} disabled={loading} className="upload-btn">
        {loading ? "Transcribing..." : "Transcribe"}
      </button>

      {error && <p className="error">Error: {error}</p>}
      {transcription && <p className="transcription">Transcription:{transcription}</p>}
    </div>
  );
};

export default SpeechToText;
