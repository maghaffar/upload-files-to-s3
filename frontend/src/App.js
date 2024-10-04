import "./App.css";
import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { Progress, Upload, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";

const { Dragger } = Upload;

function App() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  async function getFiles() {
    try {
      const res = await axios.get("http://localhost:3001/files");
      setFiles(res.data.Contents ? res.data.Contents : []);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function handleFileUpload(file) {
    if (!file) {
      message.error("Please select a file.");
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

      message.success(`${file.name} uploaded successfully!`);

      setTimeout(() => {
        setUploadProgress(0);
      }, 2000);

      getFiles();
    } catch (error) {
      console.error("Error uploading file:", error);
      message.error(`${file.name} upload failed.`);
      setUploadProgress(0);
    }
  }

  const draggerProps = {
    name: "file",
    multiple: false,
    beforeUpload: (file) => {
      handleFileUpload(file);
      // Prevent the automatic upload by returning false
      return false;
    },
    onChange(info) {
      const { status } = info.file;
      if (status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  useEffect(() => {
    getFiles();
  }, []);

  return (
    <div id="root">
      <h1>Upload File to S3</h1>
      <div className="uploader">
        <Dragger {...draggerProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag file to this area to upload
          </p>
          <p className="ant-upload-hint">Support for a single file upload.</p>
        </Dragger>
      </div>
      <br />
      <div className="progressContainer">
        <Progress percent={uploadProgress} size="small" />
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
