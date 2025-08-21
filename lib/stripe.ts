import Stripe from 'stripe';

// 在构建时允许没有 STRIPE_SECRET_KEY
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_build';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-07-30.basil',
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
