const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");

const ecsClient = new ECSClient({
  region: process.env.MY_AWS_REGION,
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  },
});

const config = {
  CLUSTER: process.env.CLUSTER,
  TASK: process.env.TASK,
};

const listOfSubnets = process.env.SUBNET_IDS.split(",");
const listOfSecurityGroups = process.env.SECURITY_GROUP_IDS.split(",");

async function triggerTranscodingJob(job) {
  try {
    const command = new RunTaskCommand({
      cluster: config.CLUSTER,
      taskDefinition: config.TASK,
      launchType: "FARGATE",
      count: 1,
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: listOfSubnets,
          assignPublicIp: "ENABLED",
          securityGroups: listOfSecurityGroups,
        },
      },
      overrides: {
        containerOverrides: [
          {
            name: "video-transcoding-service-image",
            environment: [
              { name: "OBJECT_KEY", value: job.objectKey },
              {
                name: "TEMP_S3_BUCKET_NAME",
                value: process.env.TEMP_S3_BUCKET_NAME,
              },
              {
                name: "FINAL_S3_BUCKET_NAME",
                value: process.env.FINAL_S3_BUCKET_NAME,
              },
              {
                name: "MY_AWS_REGION",
                value: process.env.MY_AWS_REGION,
              },
              {
                name: "MY_AWS_ACCESS_KEY_ID",
                value: process.env.MY_AWS_ACCESS_KEY_ID,
              },
              {
                name: "MY_AWS_SECRET_ACCESS_KEY",
                value: process.env.MY_AWS_SECRET_ACCESS_KEY,
              },
              { name: "WEBHOOK_URL", value: process.env.WEBHOOK_URL },
              {
                name: "THUMBNAIL_API_ENDPOINT",
                value: process.env.THUMBNAIL_API_ENDPOINT,
              },
            ],
          },
        ],
      },
    });

    await ecsClient.send(command);
  } catch (error) {
    console.log("Error occured while triggering transcoding job");
    console.log(error);
    throw error;
  }
}

module.exports = { triggerTranscodingJob };
