const axios = require("axios");
require("dotenv").config();

module.exports.handler = async (event) => {
  try {
    console.log("S3 trigger received!");
    console.log(event);

    const response = await axios.post(process.env.API_ENDPOINT, {
      s3EventData: event,
    });

    console.log("API response received!");
    console.log(`Status: ${response.status} | Data: ${response.data}`);

    return {
      statusCode: response.status,
      body: JSON.stringify("S3 event trigger processed successfully!"),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify("Error while processing S3 event trigger!"),
    };
  }
};
