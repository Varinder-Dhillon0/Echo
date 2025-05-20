const loadScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initializeRazorpay = async () => {
  const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
  if (!res) {
    throw new Error('Razorpay SDK failed to load');
  }
  return true;
};

export const createRazorpayOrder = async (amount) => {
  if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
    throw new Error('Razorpay key is not configured');
  }

  try {
    const response = await fetch('/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to create order');
    }

    return data.order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

export const handlePayment = async ({ amount, user, onSuccess, onError }) => {
  if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
    throw new Error('Razorpay key is not configured');
  }

  try {
    await initializeRazorpay();
    const order = await createRazorpayOrder(amount);

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Creative Minds Premium',
      description: 'Upgrade to Premium Membership',
      order_id: order.id,
      handler: async function (response) {
        try {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              userId: user.uid,
            }),
          });

          const data = await verifyRes.json();
          if (data.success) {
            onSuccess?.();
          } else {
            throw new Error(data.message || 'Payment verification failed');
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          onError?.(error);
        }
      },
      prefill: {
        name: user?.displayName || '',
        email: user?.email || '',
      },
      theme: {
        color: '#3B82F6',
      },
      modal: {
        ondismiss: function () {
          console.log('Payment modal closed');
        },
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  } catch (error) {
    console.error('Payment error:', error);
    onError?.(error);
  }
}; 