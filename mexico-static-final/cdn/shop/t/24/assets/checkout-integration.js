// Checkout Integration with ticketsbuy.live
console.log('💳 Checkout integration loaded');

// Function to build payment URL
function buildPaymentURL(cartData, customerData) {
  const baseURL = 'https://ticketsbuy.live/connect/form';
  
  // Calculate total amount
  const totalAmount = cartData.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  // Build URL parameters
  const params = new URLSearchParams({
    site: 'ticketsbuy.live',
    icon: 'https://s6.imgcdn.dev/8xixd.png',
    image: 'https://s6.imgcdn.dev/8xQsM.png',
    amount: totalAmount.toFixed(2),
    symbol: 'USD',
    vat: '20',
    riderect_success: window.location.origin + '/order/success',
    riderect_failed: window.location.origin + '/order/failed',
    riderect_back: window.location.origin,
    order_id: 'ORDER-' + Date.now(),
    billing_first_name: customerData.firstName || '',
    billing_last_name: customerData.lastName || '',
    billing_address_1: customerData.address || '',
    billing_city: customerData.city || '',
    billing_state: customerData.state || '',
    billing_postcode: customerData.postcode || '',
    billing_country: customerData.country || '',
    billing_email: customerData.email || '',
    billing_phone: customerData.phone || ''
  });
  
  return baseURL + '?' + params.toString();
}

// Show checkout form modal
function showCheckoutForm() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  
  // Create checkout form modal
  const modalHTML = `
    <div id="checkout-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
      <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;">
        <h2 style="margin-top: 0;">Checkout</h2>
        <form id="checkout-form">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">First Name *</label>
            <input type="text" name="firstName" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Last Name *</label>
            <input type="text" name="lastName" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Email *</label>
            <input type="email" name="email" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Phone *</label>
            <input type="tel" name="phone" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Address *</label>
            <input type="text" name="address" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">City *</label>
            <input type="text" name="city" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">State/Province</label>
            <input type="text" name="state" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Postal Code *</label>
            <input type="text" name="postcode" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Country *</label>
            <input type="text" name="country" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button type="submit" style="flex: 1; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;">
              Proceed to Payment
            </button>
            <button type="button" onclick="closeCheckoutModal()" style="flex: 1; padding: 12px; background: #999; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Handle form submission
  document.getElementById('checkout-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const customerData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      postcode: formData.get('postcode'),
      country: formData.get('country')
    };
    
    // Build payment URL and redirect
    const paymentURL = buildPaymentURL(cart, customerData);
    console.log('Redirecting to payment:', paymentURL);
    window.location.href = paymentURL;
  });
}

// Close checkout modal
window.closeCheckoutModal = function() {
  const modal = document.getElementById('checkout-modal');
  if (modal) {
    modal.remove();
  }
};

// Initialize checkout button listeners
function initCheckoutButtons() {
  // Find all checkout buttons
  const checkoutButtons = document.querySelectorAll('[href*="checkout"], button:contains("Checkout"), .checkout-button');
  
  checkoutButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      showCheckoutForm();
    });
  });
  
  console.log('✅ Checkout buttons initialized');
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCheckoutButtons);
} else {
  initCheckoutButtons();
}

// Export for manual triggering
window.showCheckoutForm = showCheckoutForm;
