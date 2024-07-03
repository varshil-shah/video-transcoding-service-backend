const { parentPort, workerData } = require("worker_threads");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);

const convertVideo = (format, folderPath, videoPath) => {
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
        "-f hls",
      ])
      .output(path.join(outputFolderPath, "index.m3u8"))
      .on("end", () => {
        console.log(`Video converted to ${format.name} successfully!`);
        resolve();
      })
      .on("error", (err) => {
        console.error(`Error converting video to ${format.name}`);
        reject(err);
      })
      .run();
  });
};

const { format, folderPath, videoPath } = workerData;

convertVideo(format, folderPath, videoPath)
  .then(() => {
    parentPort.postMessage({ status: "success" });
  })
  .catch((error) => {
    parentPort.postMessage({ status: "error", error: error.message });
  });
