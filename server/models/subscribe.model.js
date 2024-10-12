const mongoose = require("mongoose");

const subscribeSchema = new mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isSubscribed: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Subscribe = mongoose.model("Subscribe", subscribeSchema);

module.exports = Subscribe;
