const express = require("express");
const paymentRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const stripeInstance = require("../utils/stripe");

const priceId_silver = "price_1SVhasLiL0Js2Cy2KBLqd41I";
const priceId_gold = "price_1SVhbTLiL0Js2Cy2AbLiVSLs";

paymentRouter.post("/create-checkout-session", userAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    let priceId = null;

    if (plan === "silver") {
      priceId = priceId_silver;
    } else if (plan === "gold") {
      priceId = priceId_gold;
    } else {
      return res.status(400).json({ error: "Invalid plan selected" });
    }

    // Using  origin from request frst and the front-end_url if not then fallback to localhost
    const frontendUrl =
      req.headers.origin || process.env.FRONTEND_URL || "http://localhost:5173";

    console.log(`Creating checkout session for plan: ${plan}`);
    console.log(`Using frontend URL: ${frontendUrl}`);

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      client_reference_id: req.user._id.toString(),
      metadata: { plan },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/success`,
      cancel_url: `${frontendUrl}/cancel`,
    });

    console.log(`Session created successfully: ${session.id}`);

    res.json({
      id: session.id,
      url: session.url,
    });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    res.status(500).json({
      error: "Failed to create checkout session",
      details: err.message,
    });
  }
});

module.exports = paymentRouter;
