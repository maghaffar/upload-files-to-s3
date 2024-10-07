import "./App.css";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Progress, Upload, message, Button } from "antd";
import { InboxOutlined, DownloadOutlined } from "@ant-design/icons";

const { Dragger } = Upload;

function App() {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadingFile, setDownloadingFile] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingPercent, setDownloadingPercent] = useState(0);

  async function getFiles() {
    try {
      const res = await axios.get("http://localhost:3001/files");
      setFiles(res.data.Contents ? res.data.Contents : []);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function getFile(fileName) {
    try {
      const res = await axios.get(`http://localhost:3001/download/${fileName}`);
      const signedUrl = res.data.url;
      const downloadRes = await axios.get(signedUrl, {
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          const totalLength = progressEvent.total;
          if (totalLength !== null) {
            const percentage = Math.round(
              (progressEvent.loaded * 100) / totalLength
            );
            setDownloadingPercent(percentage);
          }
        },
      });

      // Create a Blob from the response and download the file
      const fileUrl = window.URL.createObjectURL(new Blob([downloadRes.data]));
      const link = document.createElement("a");
      link.href = fileUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link); // Clean up the link element
      setTimeout(() => {
        setDownloadingFile("");
        setIsDownloading(false);
        setDownloadingPercent(0);
      }, 2000);
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
      return false;
    },
    onChange(info) {
      const { status } = info.file;
      if (status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  function isImage(fileKey) {
    const extension = fileKey.split(".").pop().toLowerCase();
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"];
    return imageExtensions.includes(extension);
  }

  useEffect(() => {
    getFiles();
  }, []);

  return (
    <div id="root">
      <h1 className="title">Upload File to S3</h1>
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

      <div className="images">
        {files.map((file) => {
          if (isImage(file.Key)) {
            return (
              <div className="image" key={file.Key}>
                <img
                  src={`https://example-bucket-for-my-remix-app.s3.eu-north-1.amazonaws.com/${file.Key}`}
                  alt={file.Key}
                  key={file.Key}
                  height={200}
                  width={"100%"}
                />
              </div>
            );
          }
        })}
      </div>
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
              <td className="downloadButton">
                {isDownloading && downloadingFile === file.Key ? (
                  <Progress
                    type="circle"
                    percent={downloadingPercent}
                    size={50}
                  />
                ) : (
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    size="large"
                    disabled={isDownloading && downloadingFile != file.Key}
                    onClick={() => {
                      setDownloadingFile(file.Key);
                      setIsDownloading(true);
                      getFile(file.Key);
                    }}
                  >
                    Download
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
