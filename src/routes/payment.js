const express = require("express");
const paymentRouter = express.Router();
const { userAuth } = require("../middlewares/auth");

const stripeInstance = require("../utils/stripe");

priceId_silver = "price_1SVhasLiL0Js2Cy2KBLqd41I";
priceId_gold = "price_1SVhbTLiL0Js2Cy2AbLiVSLs";

paymentRouter.post("/create-checkout-session", userAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    let priceId = null;
    let productName = "";
    if (plan === "silver") {
      priceId = priceId_silver; // $4.99
      productName = "DevTinder Silver";
    } else if (plan === "gold") {
      priceId = priceId_gold; // $9.99
      productName = "DevTinder Gold";
    } else {
      return res.status(400).json({ error: "Invalid plan selected" });
    }

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: "http://localhost:5173/success",
      cancel_url: "http://localhost:5173/cancel",
    });

    res.json({ id: session.id });
  } catch (err) {}
});

paymentRouter.post("payment/create", userAuth, async (req, res) => {});

module.exports = paymentRouter;
