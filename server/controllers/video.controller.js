const Video = require("../models/video.model");
const catchAsync = require("../utils/catch-async");
const AppError = require("../utils/app-error");

const { generateUrlToPutObject } = require("../utils/s3-signed-url");

exports.uploadVideo = catchAsync(async (req, res, next) => {
  const { fileName, contentType, title, description } = req.body;

  if (!fileName || !contentType || !title || !description) {
    return next(
      new AppError(
        "Please provide a file name, content type, title & description",
        400
      )
    );
  }

  const signedUrl = await generateUrlToPutObject(
    req.user.id,
    title,
    description,
    fileName,
    contentType
  );

  res.status(200).json({
    status: "success",
    url: signedUrl,
  });
});

exports.getVideo = catchAsync(async (req, res, next) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    return next(new AppError("No video found with that ID!", 404));
  }

  video.views += 1;
  await video.save();

  res.status(200).json({
    status: "success",
    data: {
      video,
    },
  });
});

exports.getVideoStatus = catchAsync(async (req, res, next) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    return next(new AppError("No video found with that ID!", 404));
  }

  res.status(200).json({
    status: "success",
    progress: video.progress,
  });
});

exports.getVideos = catchAsync(async (req, res, next) => {
  const videos = await Video.find().select(
    "-__v -updatedAt -fileName -videoResolutions -objectKey -type"
  );

  res.status(200).json({
    status: "success",
    results: videos.length,
    data: {
      videos,
    },
  });
});

exports.getAllVideosByMe = catchAsync(async (req, res, next) => {
  const videos = await Video.find({ user: req.user._id });

  res.status(200).json({
    status: "success",
    results: videos.length,
    data: {
      videos,
    },
  });
});
