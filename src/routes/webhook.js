const express = require("express");
const Striperouter = express.Router();
const stripe = require("../utils/stripe");
const User = require("../models/user");

const endpointSecret = process.env.END_POINT_SECRET;

Striperouter.get("/test", (req, res) => {
  res.json({ message: "Webhook route is working!" });
});

Striperouter.post("/stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error(" Webhook Error: No stripe-signature header");
    return res.status(400).send("No signature");
  }

  if (!endpointSecret) {
    console.error(" Webhook Error: END_POINT_SECRET not configured");
    return res.status(500).send("Webhook secret not configured");
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(" Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(` Webhook received: ${event.type} [${event.id}]`);

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
        // Silently ignore unhandled events
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error(` Webhook handler error [${event.type}]:`, err.message);
    return res.status(500).send("Webhook handler error");
  }
});

async function handleCheckoutCompleted(session) {
  const userId = session.client_reference_id;
  const plan = session.metadata?.plan;
  const subscriptionId = session.subscription;
  const customerId = session.customer;

  // Validation
  if (!userId || !plan || !subscriptionId || !customerId) {
    console.error(" Checkout completed: Missing required data", {
      hasUserId: !!userId,
      hasPlan: !!plan,
      hasSubscriptionId: !!subscriptionId,
      hasCustomerId: !!customerId,
    });
    return;
  }

  try {
    // Retrieve subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          plan: plan,
          subscriptionId: subscriptionId,
          stripeCustomerId: customerId,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      },
      {
        new: true,
        runValidators: false,
      }
    );

    if (!updatedUser) {
      console.error(` Checkout completed: User not found [${userId}]`);
      return;
    }

    console.log(
      ` User upgraded: ${
        updatedUser.emailId
      } → ${plan.toUpperCase()} [${subscriptionId}]`
    );
  } catch (error) {
    console.error(" Checkout completed error:", error.message);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  const subscriptionId =
    invoice.subscription || invoice.lines?.data?.[0]?.subscription;

  if (!subscriptionId) {
    console.error(" Invoice payment succeeded: No subscription ID");
    return;
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customerId = subscription.customer;

    const user = await User.findOne({ stripeCustomerId: customerId });

    if (!user) {
      console.error(
        ` Invoice payment succeeded: User not found [${customerId}]`
      );
      return;
    }

    user.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    await user.save();

    // Success log
    console.log(
      ` Subscription renewed: ${
        user.emailId
      } → ${user.plan.toUpperCase()} [${subscriptionId}]`
    );
  } catch (error) {
    console.error(" Invoice payment succeeded error:", error.message);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;

  try {
    const user = await User.findOne({ stripeCustomerId: customerId });

    if (!user) {
      console.error(` Subscription deleted: User not found [${customerId}]`);
      return;
    }

    user.plan = "free";
    user.subscriptionId = null;
    user.currentPeriodEnd = null;

    await user.save();

    console.log(
      ` Subscription canceled: ${user.emailId} → FREE [${subscription.id}]`
    );
  } catch (error) {
    console.error(" Subscription deleted error:", error.message);
    throw error;
  }
}

module.exports = Striperouter;
