const Queue = require("bull");
const config = require("./index");

// const sendRegistrationEmailJob = require("../jobs/sendRegistrationEmail");
// const sendVerificationEmailJob = require("../jobs/sendVerificationEmail");

// const registrationEmailQueue = new Queue("registrationEmail", {
//   redis: {
//     host: config.redisHost || "localhost",
//     port: config.redisPort || 6379,
//     db: config.redisIndex || 0,
//     password: config.redisPassword || null
//   },
//   prefix: config.jobsPrefix || "bull"
// });

// const verificationEmailQueue = new Queue("verificationEmail", {
//   redis: {
//     host: config.redisHost || "localhost",
//     port: config.redisPort || 6379,
//     db: config.redisIndex || 0,
//     password: config.redisPassword || null
//   },
//   prefix: config.jobsPrefix || "bull"
// });

// registrationEmailQueue.process(async (job, done) => {
//   await sendRegistrationEmailJob({ email: job.data.email });
//   done();
// });

// verificationEmailQueue.process(async (job, done) => {
//   await sendVerificationEmailJob({ email: job.data.email });
//   done();
// });

// const sendRegistrationEmail = email => registrationEmailQueue.add({ email });
// const sendVerificationEmail = email => verificationEmailQueue.add({ email });

module.exports = {
  // sendRegistrationEmail,
  // sendVerificationEmail,
};
