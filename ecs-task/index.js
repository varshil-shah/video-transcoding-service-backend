const axios = require("axios");
const path = require("path");
const fs = require("fs");

const {
  runParallelTasks,
  downloadVideo,
  generatePlaylistFile,
  uploadFolderToS3Bucket,
  generateThumbnail,
  generateSubtitle,
  deleteObjectFromTempBucket,
} = require("./utils/video-processing");
const { VIDEO_PROCESS_STATES } = require("./utils/constants");

require("dotenv").config();

async function markTaskAsCompleted(key, allFilesObjects, thumbnailUrl) {
  try {
    const webhookUrl = process.env.WEBHOOK_URL;
    console.log("Webhook URL => ", webhookUrl);

    const response = await axios.post(webhookUrl, {
      key,
      progress: VIDEO_PROCESS_STATES.COMPLETED,
      videoResolutions: allFilesObjects,
      thumbnailUrl,
      subtitleUrl: allFilesObjects.subtitle,
    });

    if (response.status === 200) {
      console.log("Webhook called successfully (completed)!");
    }
  } catch (error) {
    console.log("Error while calling webhook:", error);
    process.exit(1);
  }
}

(async function () {
  try {
    console.log("Starting video processing...");

    const key = process.env.OBJECT_KEY;
    const bucketName = process.env.TEMP_S3_BUCKET_NAME;
    const finalBucketName = process.env.FINAL_S3_BUCKET_NAME;

    if (!key) {
      console.error("No video to process");
      process.exit(1);
    }

    const videoName = key.split("/").pop();
    const videoNameWithoutExtension = videoName.split(".")[0];
    const folderPath = path.join(
      __dirname,
      "downloads",
      videoNameWithoutExtension
    );

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    console.log("Downloading video from S3 bucket...");
    await downloadVideo(key, bucketName, path.join(folderPath, videoName));

    const [thumbnailUrl] = await Promise.all([
      generateThumbnail(key, bucketName),
      generateSubtitle(key, bucketName),
      downloadVideo(key, bucketName, path.join(folderPath, videoName)),
    ]);

    console.log("Thumbnail URL => ", thumbnailUrl);
    console.log("Video downloaded successfully!");

    const downloadedVideoPath = path.join(folderPath, videoName);
    await runParallelTasks(folderPath, downloadedVideoPath);

    generatePlaylistFile(folderPath);

    fs.unlinkSync(downloadedVideoPath);

    const allLinks = await uploadFolderToS3Bucket(
      folderPath,
      finalBucketName,
      videoNameWithoutExtension
    );

    await Promise.all([
      markTaskAsCompleted(key, allLinks, thumbnailUrl),
      deleteObjectFromTempBucket(key),
    ]);

    console.log("Video processing completed successfully!");
    process.exit(0);
  } catch (error) {
    console.log("Error:", error);
    process.exit(1);
  }
})();
