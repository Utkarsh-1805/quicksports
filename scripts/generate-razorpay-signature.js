// Usage: node scripts/generate-razorpay-signature.js
// Prints the X-Razorpay-Signature for your webhook payload

const crypto = require("crypto");

// Replace with your actual webhook secret
const webhookSecret = "your_webhook_secret";

// Replace with your actual payload (must match exactly what you send in Postman)
const payload = JSON.stringify({
  event: "payment.captured",
  payload: {
    payment: {
      entity: {
        id: "pay_29QQoUBi66xm2f",
        order_id: "order_9A33XWu170gUtm",
        amount: 50000,
        currency: "INR",
        status: "captured"
      }
    }
  }
});

const signature = crypto
  .createHmac("sha256", webhookSecret)
  .update(payload)
  .digest("hex");

console.log("X-Razorpay-Signature:", signature);
