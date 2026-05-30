const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const Payment = require('../models/Payment');

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys are missing from environment variables');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const CREDIT_PACKS = {
  starter: { credits: 5,  amount: 9900,  label: 'Starter Pack' },
  pro:     { credits: 15, amount: 24900, label: 'Pro Pack' },
  elite:   { credits: 30, amount: 44900, label: 'Elite Pack' },
};

exports.createOrder = async (req, res) => {
  try {
    const { pack } = req.body;
    const selected = CREDIT_PACKS[pack];
    if (!selected) return res.status(400).json({ message: 'Invalid pack selected' });

    const razorpay = getRazorpay();
    const options = {
      amount: selected.amount,
      currency: 'INR',
      receipt: `r_${Date.now().toString().slice(-10)}_${String(req.user.userId).slice(-8)}`,
      notes: { pack, userId: String(req.user.userId) },
    };

    const order = await razorpay.orders.create(options);

    // Save to DB
    await Payment.create({
      userId: req.user.userId,
      orderId: order.id,
      pack,
      credits: selected.credits,
      amount: selected.amount,
      status: 'created'
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, pack, credits: selected.credits });
  } catch (err) {
    console.error('Razorpay order error:', err);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Check payment record
    const payment = await Payment.findOne({ orderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ message: 'Order not found in system' });
    }
    if (payment.status === 'paid') {
      return res.status(400).json({ message: 'Payment already processed' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Update payment
    payment.paymentId = razorpay_payment_id;
    payment.signature = razorpay_signature;
    payment.status = 'paid';
    await payment.save();

    // Update user credits
    const user = await User.findByIdAndUpdate(
      payment.userId,
      { $inc: { credits: payment.credits } },
      { new: true }
    );

    res.json({ success: true, credits: user.credits, message: `${payment.credits} credits added!` });
  } catch (err) {
    console.error('Payment verify error:', err);
    res.status(500).json({ message: 'Payment verification error' });
  }
};

exports.webhookHandler = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.warn('Webhook received but RAZORPAY_WEBHOOK_SECRET is not set');
      return res.status(500).send('Webhook secret not configured');
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(req.body) // req.body must be the raw body buffer from express.raw()
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).send('Invalid signature');
    }

    const payload = JSON.parse(req.body.toString());
    const event = payload.event;

    if (event === 'payment.captured') {
      const paymentData = payload.payload.payment.entity;
      const orderId = paymentData.order_id;
      
      const payment = await Payment.findOne({ orderId });
      if (payment && payment.status !== 'paid') {
        payment.status = 'paid';
        payment.paymentId = paymentData.id;
        await payment.save();
        
        await User.findByIdAndUpdate(
          payment.userId,
          { $inc: { credits: payment.credits } }
        );
        console.log(`Webhook: Processed payment for order ${orderId}`);
      }
    } else if (event === 'payment.failed') {
      const paymentData = payload.payload.payment.entity;
      const orderId = paymentData.order_id;
      
      const payment = await Payment.findOne({ orderId });
      if (payment && payment.status === 'created') {
        payment.status = 'failed';
        payment.paymentId = paymentData.id;
        await payment.save();
        console.log(`Webhook: Logged failed payment for order ${orderId}`);
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Webhook error');
  }
};
