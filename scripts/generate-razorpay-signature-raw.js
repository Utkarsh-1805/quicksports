const crypto = require('crypto');

const webhookSecret = 'whsec_quickcourt_dev_webhook_2026';
const payload = '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"ORDER_SKB8AG1A_1770226148845_4NCTB","order_id":"order_SC9RJjZbcmR6BP","amount":41411,"currency":"INR","status":"captured","method":"card"}}}}';

console.log('Secret:', webhookSecret);
console.log('Payload:', payload);

const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(payload, 'utf8')
  .digest('hex');

console.log('Generated Signature:', signature);
