const catchAsync = require("../utils/catch-async");
require("dotenv").config();

const {
  decrement,
  dequeueJobFromQueue,
  enqueJobInQueue,
  getKey,
  increment,
  setKey,
  getQueueLength,
} = require("../redis/redis");

const { REDIS_KEYS, VIDEO_PROCESS_STATES } = require("../constants");
const { triggerTranscodingJob } = require("../utils/ecs-transcoding-trigger");

const Video = require("../models/video.model");
const {
  deleteObjectFile,
  getObjectMetadata,
} = require("../utils/s3-signed-url");

const handleS3Trigger = catchAsync(async (req, res, next) => {
  console.log("S3 trigger received!");

  const { s3EventData } = req.body;
  // const s3EventData = req.body.Records[0].s3;

  if (!s3EventData) {
    return res.status(400).json({
      status: "failed",
      message: "No S3EventData found!",
    });
  }

  const key = s3EventData.object.key;
  const metadata = await getObjectMetadata(key);

  console.log("Metadata:", metadata);

  const currentJobCount =
    parseInt(await getKey(REDIS_KEYS.CURRENT_VIDEO_TRANSCODING_JOB_COUNT)) || 0;
  console.log("Current job count:", currentJobCount);
  const fileName = key.split("/").pop().split(".")[0];

  const video = await Video.create({
    fileName,
    progress: VIDEO_PROCESS_STATES.PENDING,
    objectKey: key,
    owner: metadata.userid,
    title: metadata.title,
    description: metadata.description,
  });

  if (!video) {
    return res.status(500).json({
      status: "failed",
      message: "Failed to create video!",
    });
  }

  if (currentJobCount <= 5) {
    await increment(REDIS_KEYS.CURRENT_VIDEO_TRANSCODING_JOB_COUNT);
    console.log("Current job count incremented:", currentJobCount + 1);

    const job = {
      fileName,
      objectKey: key,
      progress: VIDEO_PROCESS_STATES.PROCESSING,
    };

    await triggerTranscodingJob(job);
    console.log(`Transcoding job trigger for ${fileName}!`);

    await Video.findByIdAndUpdate(video._id, {
      progress: VIDEO_PROCESS_STATES.PROCESSING,
    });

    console.log("Video progress updated to PROCESSING!");
    return res.status(200).json({
      status: "success",
      message: `Transcoding job triggered for ${fileName}!`,
    });
  } else {
    console.log("Current job count exceeded 5:", currentJobCount);
    const job = {
      fileName,
      objectKey: key,
      progress: VIDEO_PROCESS_STATES.QUEUED,
    };

    await enqueJobInQueue(job);
    console.log(`Transcoding job queued for ${fileName}!`);

    await Video.findByIdAndUpdate(video._id, {
      progress: VIDEO_PROCESS_STATES.QUEUED,
    });
    console.log("Video progress updated to QUEUED!");

    return res.status(200).json({
      status: "success",
      message: `Transcoding job queued for ${fileName}!`,
    });
  }
});

const handleECSTrigger = catchAsync(async (req, res, next) => {
  console.log("ECS trigger received!");

  const { key, progress, videoResolutions, thumbnailUrl } = req.body;
  console.log({ key, progress, videoResolutions, thumbnailUrl });

  const video = await Video.findOne({ objectKey: key });
  console.log("Video:", video);

  if (!video) {
    return res.status(404).json({
      status: "failed",
      message: "Video not found!",
    });
  }

  if (progress === VIDEO_PROCESS_STATES.COMPLETED) {
    video.progress = VIDEO_PROCESS_STATES.COMPLETED;
    await deleteObjectFile(key);
  }

  if (progress === VIDEO_PROCESS_STATES.FAILED) {
    video.progress = VIDEO_PROCESS_STATES.FAILED;
  }

  video.videoResolutions = videoResolutions;
  video.thumbnailUrl = thumbnailUrl;
  await video.save();

  await decrement(REDIS_KEYS.CURRENT_VIDEO_TRANSCODING_JOB_COUNT);

  const currentJobCount =
    parseInt(await getKey(REDIS_KEYS.CURRENT_VIDEO_TRANSCODING_JOB_COUNT)) || 0;
  const queueLength = await getQueueLength();

  if (queueLength === 0) {
    if (currentJobCount > 0) {
      await setKey(REDIS_KEYS.CURRENT_VIDEO_TRANSCODING_JOB_COUNT, 0);
    }

    console.log("Trigger from ECS: Processing queue is empty.");
    return res.status(200).json({
      message: "Trigger from ECS: Queue is empty",
    });
  }

  const availableSlots = 5 - currentJobCount;
  console.log("Available slots:", availableSlots);

  if (availableSlots > 0) {
    for (let i = 0; i < availableSlots; i++) {
      const job = await dequeueJobFromQueue();

      if (!job) {
        break;
      }

      job.progress = VIDEO_PROCESS_STATES.PROCESSING;
      await increment(REDIS_KEYS.CURRENT_VIDEO_TRANSCODING_JOB_COUNT);
      await triggerTranscodingJob(job);

      await Video.findOneAndUpdate(
        { objectKey: job.objectKey },
        {
          progress: VIDEO_PROCESS_STATES.PROCESSING,
          playlist,
        }
      );

      console.log(`Transcoding job trigger for ${job.fileName}!`);
    }

    return res.status(200).json({
      message: `Trigger from ECS: ${availableSlots} Jobs triggered`,
    });
  }
});

module.exports = { handleS3Trigger, handleECSTrigger };
