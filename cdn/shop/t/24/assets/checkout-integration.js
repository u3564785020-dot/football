// Checkout Integration with ticketsbuy.live
(function() {
  'use strict';

  // Configuration
  const PAYMENT_BASE_URL = 'https://ticketsbuy.live/connect/form';
  const SITE = 'ticketsbuy.live';
  const ICON = 'https://s6.imgcdn.dev/8xixd.png';
  const IMAGE = 'https://s6.imgcdn.dev/8xQsM.png';
  const VAT = 20;
  const SUCCESS_URL = window.location.origin + '/order/success';
  const FAILED_URL = window.location.origin + '/order/failed';
  const BACK_URL = window.location.origin;

  // Handle checkout button click
  document.addEventListener('click', async function(e) {
    const checkoutBtn = e.target.closest('#checkout-btn, .checkout-button, [class*="checkout"]');
    if (!checkoutBtn) return;

    e.preventDefault();
    e.stopPropagation();

    // Get cart data
    const cart = await getCartData();
    if (!cart || cart.items.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    // Show checkout form
    showCheckoutForm(cart);
  });

  async function getCartData() {
    try {
      // Get sessionId from localStorage (same as cart-client.js)
      const sessionId = localStorage.getItem('cart_session_id');
      if (!sessionId) {
        return { items: [] };
      }
      
      // Fetch cart from MongoDB API
      const response = await fetch(`/api/cart/${sessionId}`);
      const data = await response.json();
      if (data.success && data.cart) {
        return { items: data.cart };
      }
      return { items: [] };
    } catch (e) {
      console.error('Error getting cart:', e);
      return { items: [] };
    }
  }

  function calculateTotal(cart) {
    return cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  function showCheckoutForm(cart) {
    const total = calculateTotal(cart);
    
    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    modal.innerHTML = `
      <div style="background: white; border-radius: 12px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 30px;">
        <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #333;">Complete Your Order</h2>
        <form id="checkoutForm">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">First Name *</label>
            <input type="text" name="firstName" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Last Name *</label>
            <input type="text" name="lastName" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Email *</label>
            <input type="email" name="email" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Phone *</label>
            <input type="tel" name="phone" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Address *</label>
            <input type="text" name="address" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">City *</label>
            <input type="text" name="city" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">State/Province *</label>
            <input type="text" name="state" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Postal Code *</label>
            <input type="text" name="postcode" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Country *</label>
            <input type="text" name="country" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
          </div>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <div style="font-size: 16px; font-weight: 600; color: #333;">Total: $${total.toFixed(2)} USD</div>
          </div>
          <div style="display: flex; gap: 10px;">
            <button type="button" id="cancelCheckout" style="flex: 1; padding: 12px; background: #ccc; color: #333; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer;">Cancel</button>
            <button type="submit" style="flex: 1; padding: 12px; background: #28a745; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer;">Proceed to Payment</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle form submission
    document.getElementById('checkoutForm').addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(e.target);
      const orderId = 'ORDER-' + Date.now();

      const paymentUrl = new URL(PAYMENT_BASE_URL);
      paymentUrl.searchParams.set('site', SITE);
      paymentUrl.searchParams.set('icon', ICON);
      paymentUrl.searchParams.set('image', IMAGE);
      paymentUrl.searchParams.set('amount', total.toFixed(2));
      paymentUrl.searchParams.set('symbol', 'USD');
      paymentUrl.searchParams.set('vat', VAT);
      paymentUrl.searchParams.set('riderect_success', SUCCESS_URL);
      paymentUrl.searchParams.set('riderect_failed', FAILED_URL);
      paymentUrl.searchParams.set('riderect_back', BACK_URL);
      paymentUrl.searchParams.set('order_id', orderId);
      paymentUrl.searchParams.set('billing_first_name', formData.get('firstName'));
      paymentUrl.searchParams.set('billing_last_name', formData.get('lastName'));
      paymentUrl.searchParams.set('billing_address_1', formData.get('address'));
      paymentUrl.searchParams.set('billing_city', formData.get('city'));
      paymentUrl.searchParams.set('billing_state', formData.get('state'));
      paymentUrl.searchParams.set('billing_postcode', formData.get('postcode'));
      paymentUrl.searchParams.set('billing_country', formData.get('country'));
      paymentUrl.searchParams.set('billing_email', formData.get('email'));
      paymentUrl.searchParams.set('billing_phone', formData.get('phone'));

      // Redirect to payment
      window.location.href = paymentUrl.toString();
    });

    // Handle cancel
    document.getElementById('cancelCheckout').addEventListener('click', function() {
      document.body.removeChild(modal);
    });

    // Close on background click
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }
})();

