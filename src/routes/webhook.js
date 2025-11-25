const express = require("express");
const Striperouter = express.Router();
const stripe = require("../utils/stripe");
const User = require("../models/user");

const endpointSecret = process.env.END_POINT_SECRET;

Striperouter.post("/stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (err) {
    console.error("Error while handling webhook:", err);
    return res.status(500).send("Webhook handler error");
  }
  res.json({ received: true });
});

async function handleCheckoutCompleted(session) {
  console.log(" checkout.session.completed received");

  const userId = session.client_reference_id;
  const plan = session.metadata?.plan;
  const subscriptionId = session.subscription;
  const customerId = session.customer;

  if (!userId || !plan || !subscriptionId || !customerId) {
    console.error("Missing data in checkout.session.completed");
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const user = await User.findById(userId);
  if (!user) {
    console.error("User not found for checkout.session.completed");
    return;
  }

  user.plan = plan;
  user.subscriptionId = subscriptionId;
  user.stripeCustomerId = customerId;
  user.currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  await user.save();
  console.log(` User ${user.emailId} is now ${plan.toUpperCase()}`);
}
