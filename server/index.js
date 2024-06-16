const serverless = require("serverless-http");
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB database! 🚀");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB! 😢");
    console.log(err);
  });

const app = express();

const userRouter = require("./routes/user.router");
const videoRouter = require("./routes/video.router");
const globalErrorHandler = require("./controllers/error-controller");

app.use(morgan("dev"));

app.use(cors());
app.options("*", cors());

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).send("Server is up and running! 🚀");
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);

app.all("*", (req, res) => {
  res.status(404).send(`Can't find ${req.originalUrl} on this server!`);
});

app.use(globalErrorHandler);

module.exports.handler = serverless(app);
