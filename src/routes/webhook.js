const express = require("express");
const Striperouter = express.Router();
const stripe = require("../utils/stripe");
const User = require("../models/user");

const endpointSecret = process.env.END_POINT_SECRET;

Striperouter.post("/stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // req.body is already raw because of express.raw() middleware
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
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

    // Fixed: return proper success response
    res.json({ received: true });
  } catch (err) {
    console.error("Error while handling webhook:", err);
    return res.status(500).send("Webhook handler error");
  }
});

async function handleCheckoutCompleted(session) {
  console.log("checkout.session.completed received");

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
  console.log(`User ${user.emailId} is now ${plan.toUpperCase()}`);
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log("invoice.payment_succeeded received");

  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    console.error("No subscriptionId on invoice");
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = subscription.customer;
  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) {
    console.error("User not found for invoice.payment_succeeded");
    return;
  }

  user.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  await user.save();

  console.log(`Subscription renewed for ${user.emailId}, plan = ${user.plan}`);
}

async function handleSubscriptionDeleted(subscription) {
  console.log("customer.subscription.deleted received");
  const customerId = subscription.customer;

  const user = await User.findOne({ stripeCustomerId: customerId });

  if (!user) {
    console.error("User not found for subscription.deleted");
    return;
  }

  user.plan = "free";
  user.subscriptionId = null;
  user.currentPeriodEnd = null;

  await user.save();

  console.log(`Subscription canceled, user downgraded: ${user.emailId}`);
}

module.exports = Striperouter;
