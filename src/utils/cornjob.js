const cron = require("node-cron");
const { subDays, startOfDay, endOfDay } = require("date-fns");
const sendEmail = require("./sendEmail");
const ConnectionRequest = require("../models/connectionRequest");

cron.schedule("52 10 * * *", async () => {
  // Send emails to all people who got requests the previous day

  try {
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

    for (const email of listOfEmails) {
      //send Emails

      try {
        const res = await sendEmail.run(
          "New Friend Requests pending for " +
            "There are many friedn Requests pending, please login to DevTinder.org and accect or reject the request"
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
