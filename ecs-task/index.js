const axios = require("axios");
const path = require("path");

const {
  uploadFileToS3Bucket,
  generatePresignedUrl,
} = require("./utils/s3-helper");

const { runParallelTasks, downloadVideo } = require("./utils/video-processing");
const { VIDEO_PROCESS_STATES } = require("./utils/constants");

require("dotenv").config();

async function markTaskAsCompleted(key, allFilesObjects) {
  try {
    const webhookUrl = process.env.WEBHOOK_URL;
    console.log("Webhook URL => ", webhookUrl);

    const response = await axios.post(webhookUrl, {
      key,
      progress: VIDEO_PROCESS_STATES.COMPLETED,
      videoResolutions: allFilesObjects,
    });

    if (response.status === 200) {
      console.log("Webhook called successfully (completed)!");
    }
  } catch (error) {
    console.log("Error while calling webhook:", error);
    process.exit(1);
  }
}

async function markTaskAsFailed(key) {
  try {
    const webhookUrl = process.env.WEBHOOK_URL;
    console.log("Webhook URL => ", webhookUrl);

    const response = await axios.post(webhookUrl, {
      key,
      progress: VIDEO_PROCESS_STATES.FAILED,
      videoResolutions: {},
    });

    if (response.status === 200) {
      console.log("Webhook called successfully (failed)!");
    }
  } catch (error) {
    console.log("Error while calling webhook:", error);
    process.exit(1);
  }
}

const ffmpegCommands = [];
const allFiles = [];

const videoFormat = [
  { name: "360p", scale: "w=480:h=360" },
  { name: "480p", scale: "w=858:h=480" },
  { name: "720p", scale: "w=1280:h=720" },
  { name: "1080p", scale: "w=1920:h=1080" },
];

(async function () {
  try {
    console.log("Starting video processing...");

    const videoToProcess = process.env.OBJECT_KEY;
    const key = videoToProcess;
    const bucketName = process.env.TEMP_S3_BUCKET_NAME;
    const finalBucketName = process.env.FINAL_S3_BUCKET_NAME;

    if (!videoToProcess) {
      console.error("No video to process");
      process.exit(1);
    }

    const url = await generatePresignedUrl(bucketName, key);
    if (!url) {
      console.error("Error generating presigned URL");
      process.exit(1);
    }

    console.log("Presigned URL => ", url);

    const videoName = key.split("/").pop();
    const outputVideoName = videoName.split(".")[0];

    console.log("Downloading video...");
    const desiredPath = path.join(__dirname, "downloads");
    if (!fs.existsSync(desiredPath)) {
      fs.mkdirSync(desiredPath);
    }

    await downloadVideo(url, desiredPath);

    videoFormat.forEach((format) => {
      ffmpegCommands.push(
        `ffmpeg -i ${path.join(
          desiredPath,
          videoName
        )} -y -acodec aac -vcodec libx264 -filter:v scale=${
          format.scale
        } -f mp4 ${outputVideoName + "-" + format.name}.mp4`
      );
      allFiles.push(outputVideoName + "-" + format.name + ".mp4");
    });

    await runParallelTasks(ffmpegCommands);

    console.log("All files => ", allFiles);

    const uploadPromises = [];
    allFiles.map((file) => {
      uploadPromises.push(
        uploadFileToS3Bucket(desiredPath, file, finalBucketName)
      );
    });

    console.log("Uploading files to S3 bucket...");

    const results = await Promise.allSettled(uploadPromises);

    const allSuccessful = results.every(
      (result) => result.status === "fulfilled"
    );

    if (allSuccessful) {
      console.log("All files uploaded successfully!");

      const allFilesObjects = [];
      allFiles.map((file) => {
        if (file.includes("360p")) {
          allFilesObjects["360p"] = file;
        } else if (file.includes("480p")) {
          allFilesObjects["480p"] = file;
        } else if (file.includes("720p")) {
          allFilesObjects["720p"] = file;
        } else if (file.includes("1080p")) {
          allFilesObjects["1080p"] = file;
        }
      });

      await markTaskAsCompleted(key, allFilesObjects);
    } else {
      console.error("Error uploading files to S3 bucket");

      const failedResults = results.filter(
        (result) => result.status === "rejected"
      );
      const numberOfFailedResults = failedResults.length;

      if (numberOfFailedResults == 1) {
        console.error("One file failed to upload");
        console.error(failedResults[0].reason);
      } else if (numberOfFailedResults > 1) {
        console.error(`${numberOfFailedResults} files failed to upload`);
        failedResults.forEach((result) => {
          console.error(result.reason);
        });
      } else {
        console.log(
          "Unexpected error: Uploads reported failures but results show no rejections"
        );

        await markTaskAsFailed(key);
        process.exit(1);
      }
    }
  } catch (error) {
    console.log("Error:", error);
    process.exit(1);
  }
})();
