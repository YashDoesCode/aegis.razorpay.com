import Razorpay from "razorpay";

/**
 * Razorpay SDK client helper for server-side operations.
 *
 * All disputes and payment operations must route through this client.
 * Key credentials are read strictly from server-side environment variables.
 */
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export default razorpay;
