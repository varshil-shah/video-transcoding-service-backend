const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const axios = require("axios");
const fs = require("fs");

require("dotenv").config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function generatePresignedUrl(bucketName, key) {
  try {
    console.log("Generating presigned URL for...");

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command);
    return url;
  } catch (error) {
    console.error("Error generating presigned URL");
    console.error(error);
  }
}

async function uploadFileToS3Bucket(filePath, file, bucketName) {
  try {
    const fileName = file.split("/").pop().split(".")[0];
    const fileData = fs.readFileSync(filePath);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `videos/${fileName}/${file}`,
      ContentType: "video/mp4",
    });

    const url = await getSignedUrl(s3Client, command);
    const response = await axios.put(url, fileData);

    console.log("File uploaded successfully", response);
  } catch (error) {
    console.error("Error uploading file");
    console.error(error);
  }
}

module.exports = { uploadFileToS3Bucket, generatePresignedUrl };
