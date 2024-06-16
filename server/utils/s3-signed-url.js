const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function generateUrlToPutObject(userId, fileName, contentType) {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.TEMP_S3_BUCKET_NAME,
      Key: `uploads/videos/${fileName}`,
      ContentType: contentType,
      Metadata: {
        userId,
      },
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return signedUrl;
  } catch (error) {
    console.log("Error occured while generating signed URL to put object");
    console.log(error);
  }
}

module.exports = { generateUrlToPutObject };
