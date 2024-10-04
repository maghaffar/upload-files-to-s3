import "./App.css";
import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { Progress } from "antd";

function App() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  async function getFiles() {
    try {
      const res = await axios.get("http://localhost:3001/files");
      setFiles(res.data.Contents ? res.data.Contents : []);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function handleFileUpload() {
    const file = fileInputRef.current.files[0];
    if (!file) {
      setStatus("Please select a file.");
      return;
    }

    try {
      const { data } = await axios.get(
        `http://localhost:3001/generatePresignedUrl?fileName=${file.name}`
      );

      const url = data.url;

      await axios.put(url, file, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      setStatus("File uploaded successfully!");
      fileInputRef.current.value = "";

      setTimeout(() => {
        setUploadProgress(0);
        setStatus("");
      }, 2000);

      getFiles();
    } catch (error) {
      console.error("Error uploading file:", error);
      setStatus("Error uploading file.");
      setUploadProgress(0);
    }
  }

  useEffect(() => {
    getFiles();
  }, []);

  return (
    <div id="root">
      <h1>Upload File to S3</h1>
      <input type="file" ref={fileInputRef} />
      <button onClick={handleFileUpload}>Upload</button>
      <br />
      <div className="progressContainer">
        <Progress
          percent={uploadProgress}
          percentPosition={{ align: "center", type: "outer" }}
          size="small"
        />
      </div>
      <p className="status">{status}</p>

      <h2>Uploaded Files</h2>
      <table id="filesTable">
        <thead>
          <tr>
            <th>File Name</th>
            <th>File URL</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.Key}>
              <td>{file.Key}</td>
              <td>
                <a
                  href={`https://example-bucket-for-my-remix-app.s3.eu-north-1.amazonaws.com/${file.Key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
