const Stripe = require('stripe');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = req.headers.origin || 'https://1p-checker.vercel.app';

  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'token is required' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.email) return res.status(400).json({ error: 'invalid token' });

    const customers = await stripe.customers.list({ email: payload.email, limit: 1 });
    if (!customers.data.length) {
      return res.status(404).json({ error: 'お客様情報が見つかりませんでした' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: origin,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
