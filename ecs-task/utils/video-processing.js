const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

require("dotenv").config();

const videoFormat = [
  { name: "360P", scale: "w=640:h=360", resolution: "640x360" },
  { name: "480P", scale: "w=842:h=480", resolution: "842x480" },
  { name: "720P", scale: "w=1280:h=720", resolution: "1280x720" },
  { name: "1080P", scale: "w=1920:h=1080", resolution: "1920x1080" },
];

function calculateBandwidth(resolution) {
  switch (resolution) {
    case "640x360":
      return 800000;
    case "842x480":
      return 1400000;
    case "1280x720":
      return 2800000;
    case "1920x1080":
      return 5000000;
    default:
      return 0;
  }
}

const s3Client = new S3Client({
  region: process.env.MY_AWS_REGION,
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  },
});

const allLinks = {};

function convertVideo(format, folderPath, videoPath) {
  return new Promise((resolve, reject) => {
    const outputFolderPath = path.join(folderPath, format.name);
    if (!fs.existsSync(outputFolderPath)) {
      fs.mkdirSync(outputFolderPath, { recursive: true });
    }

    ffmpeg(videoPath)
      .outputOptions([
        "-profile:v baseline",
        "-level 3.0",
        `-vf scale=${format.scale}`,
        "-start_number 0",
        "-hls_time 10",
        "-hls_list_size 0",
        `-hls_segment_filename ${path.join(
          outputFolderPath,
          "segment_%03d.ts"
        )}`,
        "-f hls",
      ])
      .output(path.join(outputFolderPath, "index.m3u8"))
      .on("end", () => {
        console.log(`Video converted to ${format.name} successfully!`);
        resolve();
      })
      .on("error", (error) => {
        console.error(`Error converting video to ${format.name}`);
        console.error(error);
        reject();
      })
      // .on("progress", (progress) => {
      //   console.log(`Processing: ${progress.percent}% done`);
      // })
      .run();
  });
}

async function runParallelTasks(folderPath, videoPath) {
  console.log("Starting video conversion...");

  if (!fs.existsSync(videoPath)) {
    console.error("Unable to find video file at path:", videoPath);
    process.exit(1);
  }

  const tasks = videoFormat.map((format) =>
    convertVideo(format, folderPath, videoPath)
  );

  try {
    await Promise.all(tasks);
    console.log("All videos converted successfully!");
  } catch (error) {
    console.error("Error converting videos");
    console.error(error);
    process.exit(1);
  }
}

function generatePlaylistFile(folderPath) {
  const playlistPath = path.join(folderPath, "playlist.m3u8");

  try {
    let playlistContent = "#EXTM3U\n#EXT-X-VERSION:3\n";

    videoFormat.forEach((format) => {
      const bandwidth = calculateBandwidth(format.resolution);
      playlistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${format.resolution}\n`;
      playlistContent += `${format.name}/index.m3u8\n`;

      fs.writeFileSync(playlistPath, playlistContent);
      console.log("Playlist file generated successfully!");
    });
  } catch (error) {
    console.log("Error generating playlist file");
    console.error(error);
  }
}

async function downloadVideo(objectKey, bucketName, filePath) {
  try {
    const downloadStream = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      })
    );
    const writeStream = fs.createWriteStream(filePath);
    downloadStream.Body.pipe(writeStream);

    return new Promise((resolve, reject) => {
      writeStream.on("error", (error) => {
        console.log("Error writing video to disk");
        console.error(error);
        reject(error);
      });

      writeStream.on("finish", () => {
        console.log("Video downloaded successfully!");
        resolve();
      });
    });
  } catch (error) {
    console.error("Error downloading video from S3 bucket");
    console.error(error);
  }
}

async function uploadFile(filePath, finalBucketName, videoName, prefix = "") {
  try {
    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);
    let key = `${videoName}/`;
    key += prefix ? `${prefix}${fileName}` : fileName;

    const data = await s3Client.send(
      new PutObjectCommand({
        Bucket: finalBucketName,
        Key: key,
        Body: fileStream,
      })
    );

    if (fileName.includes("index.m3u8") || fileName.includes("playlist.m3u8")) {
      const objectLink = `https://s3.ap-south-1.amazonaws.com/${finalBucketName}/${key}`;
      if (key.includes("360P")) {
        allLinks["360p"] = objectLink;
      } else if (key.includes("480P")) {
        allLinks["480p"] = objectLink;
      } else if (key.includes("720P")) {
        allLinks["720p"] = objectLink;
      } else if (key.includes("1080P")) {
        allLinks["1080p"] = objectLink;
      } else if (key.includes("playlist.m3u8")) {
        allLinks["playlist"] = objectLink;
      }
      console.log("Video link for resolution", key, objectLink);
    }

    return data;
  } catch (error) {
    console.log("Error uploading file to S3 bucket");
    console.error(error);
  }
}

async function deleteObjectFromTempBucket(key) {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: "temp-videos.video-transcoding-service",
        Key: key,
      })
    );
    console.log("Object deleted successfully!");
  } catch (error) {
    console.error("Error deleting object from S3 bucket");
    console.error(error);
  }
}

async function uploadFolderToS3Bucket(
  folderPath,
  finalBucketName,
  videoName,
  perfix = ""
) {
  try {
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const fileStats = fs.statSync(filePath);

      if (fileStats.isDirectory()) {
        const currentDir = path.basename(filePath);
        await uploadFolderToS3Bucket(
          filePath,
          finalBucketName,
          videoName,
          `${perfix}${currentDir}/`
        );
      } else {
        await uploadFile(filePath, finalBucketName, videoName, perfix);
      }
    }

    return allLinks;
  } catch (error) {
    console.error("Error uploading folder to S3 bucket");
    console.error(error);
  }
}

module.exports = {
  runParallelTasks,
  downloadVideo,
  generatePlaylistFile,
  uploadFolderToS3Bucket,
  deleteObjectFromTempBucket,
};
