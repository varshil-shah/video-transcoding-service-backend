const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

const userRouter = require("./routes/user.router");
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

app.all("*", (req, res) => {
  res.status(404).send(`Can't find ${req.originalUrl} on this server!`);
});

app.use(globalErrorHandler);

module.exports = app;
