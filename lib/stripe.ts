import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// 产品配置
export const STRIPE_CONFIG = {
  products: {
    credits_100: {
      name: 'Credit Pack - 100 Credits',
      description: '100 credits for image generation, valid for 30 days',
      price: 999, // $9.99 in cents
      credits: 100,
      validityDays: 30
    }
  }
};
