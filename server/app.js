const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

app.use(morgan("dev"));

app.use(cors());
app.options("*", cors());

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).send("Server is up and running! 🚀");
});

app.all("*", (req, res) => {
  res.status(404).send(`Can't find ${req.originalUrl} on this server!`);
});

module.exports = app;
