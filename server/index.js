const mongoose = require("mongoose");
const dotenv = require("dotenv");

process.on("uncaughtException", (err) => {
  console.log("Ungaught Exception! Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB! 🚀");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB! 😢");
    console.log(err);
  });

const app = require("./app");
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}! 🚀`);
});

process.on("unhandledRejection", (err) => {
  console.log("Unhandled Rejection! Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
