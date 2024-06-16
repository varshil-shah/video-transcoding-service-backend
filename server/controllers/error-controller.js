const AppError = require("../utils/app-error");

const handleCastErrorDB = (error) => {
  const message = `Invalid value ${error.value} for attribute ${error.path}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (error) => {
  const value = error.keyValue;
  const message = `Duplicate field value(s) for ${JSON.stringify(
    value
  )}.Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (error) => {
  const errors = Object.values(error.errors).map(
    (ele, index) => `${index + 1}) ${ele.message}`
  );
  const message = `Invalid input data for: ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = (error) =>
  new AppError(`Invalid token! Please login in again`, 401);

const handleTokenExpiredError = (error) =>
  new AppError(`Your token has been expired! please log in again`, 401);

const sendErrorDevelopment = (error, req, res) => {
  return res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    stack: error.stack,
    error: error,
  });
};

const sendErrorProduction = (error, req, res) => {
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }

  console.error(`ERROR 💣 ${error}`);
  return res.status(500).json({
    status: "error",
    message: "Something went very wrong :(",
  });
};

module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDevelopment(error, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let err = { ...error };
    err.name = error.name;
    err.message = error.message;

    if (err.code === 11000) err = handleDuplicateFieldsDB(err);

    switch (err.name) {
      case "CastError":
        err = handleCastErrorDB(err);
        break;
      case "TokenExpiredError":
        err = handleTokenExpiredError(err);
        break;
      case "ValidationError":
        err = handleValidationErrorDB(err);
        break;
      case "JsonWebTokenError":
        err = handleJWTError(err);
        break;
    }

    sendErrorProduction(err, req, res);
  }
  next();
};
