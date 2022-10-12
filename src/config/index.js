const { resolve } = require("path");
require("dotenv").config({ path: resolve(__dirname, "../../.env") });

module.exports = {
  mode: process.env.NODE_ENV,
  host: process.env.HOST,
  port: process.env.PORT,
  corsOrigin: process.env.CORS_ORIGIN.split(","),
  dbHost: process.env.DB_HOST,
  dbPort: process.env.DB_PORT,
  dbName: process.env.DB_NAME,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  redisHost: process.env.REDIS_HOST,
  redisPort: process.env.REDIS_PORT,
  redisIndex: process.env.REDIS_DATABASE,
  redisPassword: process.env.REDIS_PASSWORD,
  sessionName: process.env.SESSION_NAME,
  sessionPassword: process.env.SESSION_PASSWORD,
  sessionPrefix: process.env.SESSION_PREFIX,
  jobsPrefix: process.env.JOBS_PREFIX,
  s3Bucket: process.env.S3_BUCKET,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  heartbeatInterval: process.env.WS_HEARTBEAT_INTERVAL,
  cseApiKey: process.env.CSE_API_KEY,
  cseCxYoutube: process.env.CSE_CX_YOUTUBE,
  youtubeApiKey: process.env.YOUTUBE_API_KEY,
  giphyApiKey: process.env.GIPHY_API_KEY
};
