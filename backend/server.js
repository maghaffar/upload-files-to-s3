const express = require("express");
const multer = require("multer");
const {
  S3Client,
  PutObjectCommand,
  ListObjectsCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { fromCognitoIdentityPool } = require("@aws-sdk/credential-providers");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3001;
app.use(cors());

const s3Client = new S3Client({
  region: "eu-north-1",
  credentials: fromCognitoIdentityPool({
    clientConfig: { region: "eu-north-1" },
    identityPoolId: "eu-north-1:6af67b58-c24a-4d47-8e7c-44888bcbbf2a",
  }),
});

app.get("/generatePresignedUrl", async (req, res) => {
  const fileName = req.query.fileName;
  const params = {
    Bucket: "example-bucket-for-my-remix-app",
    Key: fileName,
  };

  try {
    const presignedUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand(params),
      {
        expiresIn: 3600,
      }
    );
    res.json({ url: presignedUrl });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating presigned URL.");
  }
});

app.get("/files", async (req, res) => {
  const command = new ListObjectsCommand({
    Bucket: "example-bucket-for-my-remix-app",
  });

  try {
    const response = await s3Client.send(command);
    res.json(response);
  } catch (err) {
    console.error(err);
  }
});

// app.use(express.static(path.join(__dirname, "../frontend")));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
