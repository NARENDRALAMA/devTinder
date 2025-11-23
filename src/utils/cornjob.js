const cron = require("node-cron");
const { subDays, startOfDay, endOfDay } = require("date-fns");
const sendEmail = require("./sendEmail");
const ConnectionRequest = require("../models/connectionRequest");

//This job will run every day at 8 AM every day
cron.schedule("0 8 * * *", async () => {
  // Send emails to all people who got requests the previous day

  try {
    console.log("Hello");
    const yesterday = subDays(new Date(), 1);
    const yesterdayStart = startOfDay(yesterday);

    const yesterdayEnd = endOfDay(yesterday);

    const pendingRequests = await ConnectionRequest.find({
      status: "interested",
      createdAt: {
        $gte: yesterdayStart,
        $lte: yesterdayEnd,
      },
    }).populate("fromUserId toUserId");

    const listOfEmails = [
      ...new Set(pendingRequests.map((req) => req.toUserId.emailId)),
    ];

    console.log(listOfEmails);

    for (const email of listOfEmails) {
      //send Emails

      try {
        const res = await sendEmail.run(
          "New Friend Requests pending for " + email,
          "There are many friend Requests pending, please login to DevTinder.org and accect or reject the request"
        );
        console.log(res);
      } catch (err) {
        console.log("Error in sending email to ", email, ":", err.message);
      }
    }
  } catch (err) {
    console.log("Error in cornjob: ", err.message);
  }
});
