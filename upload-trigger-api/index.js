const axios = require("axios");
require("dotenv").config();

module.exports.handler = async (event) => {
  try {
    console.log("S3 trigger received!");
    console.log(JSON.stringify(event));

    const s3EventData = event.Records[0].s3;

    const response = await axios.post(process.env.API_ENDPOINT, {
      s3EventData,
    });

    console.log("API response received!");
    console.log(`Status: ${response.status} | Data: ${response.data}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "success",
        message: "S3 event trigger processed successfully!",
        body: response?.data,
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: "error",
        message: "Error processing S3 event trigger!",
        error: error,
      }),
    };
  }
};
