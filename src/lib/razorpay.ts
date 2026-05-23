// ============================================================
// Razorpay Payment Integration Utility
// ============================================================

// NOTE: This requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local
// Install: npm install razorpay

interface RazorpayOrderOptions {
  amount: number; // in INR (will be converted to paise)
  receiptId: string;
  notes?: Record<string, string>;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

interface RazorpayOrder {
  id: string;
  amount: number;
  amount_paid: number;
  status: string;
  receipt: string;
}

// Create a Razorpay order
export async function createRazorpayOrder(options: RazorpayOrderOptions): Promise<RazorpayOrder> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local');
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const payload = {
    amount: Math.round(options.amount * 100), // Convert to paise
    currency: 'INR',
    receipt: options.receiptId,
    notes: {
      ...options.notes,
      customer_name: options.customerName || '',
      customer_email: options.customerEmail || '',
      customer_phone: options.customerPhone || '',
    },
  };

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Razorpay order creation failed: ${error}`);
  }

  return response.json();
}

// Verify Razorpay payment signature
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;

  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return expectedSignature === signature;
  } catch {
    return false;
  }
}

// Generate a payment link for an invoice
export function generatePaymentLink(invoiceId: string, amount: number, customerName: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/pay/${invoiceId}?amount=${amount}&name=${encodeURIComponent(customerName)}`;
}

// Get Razorpay public key for frontend
export function getRazorpayKeyId(): string {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
}

export function isRazorpayConfigured(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}
