// MongoDB Cart Client - Fixed Version
class MongoDBCart {
  constructor() {
    console.log('🏗️ MongoDBCart constructor called');
    this.sessionId = this.getOrCreateSessionId();
    this.cart = [];
    this.initialized = false;
    console.log('🏗️ MongoDBCart initialized:', this.initialized);
    this.init();
    console.log('🏗️ MongoDBCart init() called');
  }

  getOrCreateSessionId() {
    // Try multiple storage methods for better cross-domain compatibility
    let sessionId = localStorage.getItem('cart_session_id') || 
                   sessionStorage.getItem('cart_session_id') ||
                   this.getCookie('cart_session_id');
    
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      // Store in multiple places for better persistence
      localStorage.setItem('cart_session_id', sessionId);
      sessionStorage.setItem('cart_session_id', sessionId);
      this.setCookie('cart_session_id', sessionId, 30); // 30 days
    }
    return sessionId;
  }

  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }

  async init() {
    console.log('🛍️ MongoDB Cart initializing...');
    this.sendSessionIdToServer();
    
    // Check for return from payment system FIRST and handle session switching
    this.handlePaymentReturn();
    
    await this.loadCart();
    this.renderCart();
    console.log('🛍️ About to attach event listeners...');
    this.attachEventListeners();
    console.log('🛍️ Event listeners attached');
    this.initialized = true;
    console.log('🛍️ MongoDB Cart fully initialized!');
    this.updateCartCount();
    this.initialized = true;
    console.log('✅ MongoDB Cart ready!');
  }

  handlePaymentReturn() {
    // Check if user returned from payment system
    const urlParams = new URLSearchParams(window.location.search);
    const paymentReturn = urlParams.get('payment_return');
    const sessionId = urlParams.get('session_id');
    
    if (paymentReturn === 'success' || paymentReturn === 'failed' || paymentReturn === 'back') {
      console.log('💳 Payment return detected:', paymentReturn);
      
      // If we have a session_id from URL, use it to restore the correct session
      if (sessionId && sessionId !== this.sessionId) {
        console.log('🔄 Switching to payment session ID:', sessionId);
        this.sessionId = sessionId;
        // Update storage with the correct session ID
        localStorage.setItem('cart_session_id', sessionId);
        sessionStorage.setItem('cart_session_id', sessionId);
        this.setCookie('cart_session_id', sessionId, 30);
      }
      
      // Clean up URL parameters immediately
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Return true to indicate payment return was handled
      return true;
    }
    
    return false;
  }

  sendSessionIdToServer() {
    // Send session ID to server for tracking
    fetch(window.location.href, {
      method: 'GET',
      headers: {
        'X-Session-ID': this.sessionId
      }
    }).catch(err => console.error('Failed to send session ID:', err));
  }

  async loadCart() {
    try {
      console.log('🔄 Loading cart for session:', this.sessionId);
      const response = await fetch(`/api/cart/${this.sessionId}`);
      const data = await response.json();
      if (data.success) {
        this.cart = data.cart || [];
        console.log('✅ Cart loaded from server:', this.cart.length, 'items');
        
        // If cart is empty, try to restore from sessionStorage
        if (this.cart.length === 0) {
          const savedCart = sessionStorage.getItem('cart_before_payment');
          if (savedCart) {
            try {
              const cartData = JSON.parse(savedCart);
              console.log('🔄 Restoring cart from sessionStorage:', cartData);
              this.cart = cartData;
              // Save restored cart to server
              await this.saveCartToServer();
              // Clear the saved cart
              sessionStorage.removeItem('cart_before_payment');
            } catch (error) {
              console.error('❌ Error restoring cart from sessionStorage:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Load cart error:', error);
      this.cart = [];
    }
  }

  async saveCartToServer() {
    try {
      // Save each item to server
      for (const item of this.cart) {
        await fetch(`/api/cart/${this.sessionId}/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      }
      console.log('✅ Cart saved to server');
    } catch (error) {
      console.error('❌ Error saving cart to server:', error);
    }
  }

  async addToCart(item) {
    console.log('🛒 Adding to cart:', item);
    try {
      const response = await fetch(`/api/cart/${this.sessionId}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      const data = await response.json();
      if (data.success) {
        this.cart = data.cart;
        this.renderCart();
        this.updateCartCount();
        this.openCart();
        console.log('✅ Item added successfully');
        return true;
      }
      console.error('❌ Add to cart failed:', data);
      return false;
    } catch (error) {
      console.error('❌ Add to cart error:', error);
      return false;
    }
  }

  async updateQuantity(itemId, quantity) {
    try {
      const response = await fetch(`/api/cart/${this.sessionId}/update/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
      });
      const data = await response.json();
      if (data.success) {
        this.cart = data.cart;
        this.renderCart();
        this.updateCartCount();
      }
    } catch (error) {
      console.error('Update quantity error:', error);
    }
  }

  async removeFromCart(itemId) {
    try {
      const response = await fetch(`/api/cart/${this.sessionId}/remove/${itemId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        this.cart = data.cart;
        this.renderCart();
        this.updateCartCount();
      }
    } catch (error) {
      console.error('Remove from cart error:', error);
    }
  }

  async clearCart() {
    try {
      const response = await fetch(`/api/cart/${this.sessionId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        this.cart = [];
        this.renderCart();
        this.updateCartCount();
      }
    } catch (error) {
      console.error('Clear cart error:', error);
    }
  }

  getTotal() {
    return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  updateCartCount() {
    const count = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.querySelector('.cart-count-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'block' : 'none';
    }
    
    const cartTitle = document.querySelector('#cart-sidebar h2');
    if (cartTitle) {
      cartTitle.innerHTML = `Cart <span class="cart-number">${count}</span>`;
    }
  }

  renderCart() {
    const cartItems = document.getElementById('cart-items');
    const emptyMessage = document.getElementById('cart-empty');
    const cartFooter = document.querySelector('.cart-footer');
    const totalElement = document.getElementById('cart-total');

    if (!cartItems) return;

    if (this.cart.length === 0) {
      if (emptyMessage) emptyMessage.style.display = 'block';
      cartItems.innerHTML = '';
      if (cartFooter) cartFooter.style.display = 'none';
      if (totalElement) totalElement.textContent = '$0.00';
      return;
    }

    if (emptyMessage) emptyMessage.style.display = 'none';
    if (cartFooter) cartFooter.style.display = 'block';

    cartItems.innerHTML = this.cart.map(item => {
      // Calculate original price (double the discount price)
      const originalPrice = item.price * 2;
      
      return `
        <div class="cart-item" data-id="${item.id}">
          <div class="cart-item-image">
            <img src="${item.image || '/cdn/shop/files/stadium-icon.png'}" alt="${item.title}">
          </div>
          <div class="cart-item-details">
            <h4>${item.title}</h4>
            <p class="cart-item-category">${item.category}</p>
            <div class="cart-item-price-container">
              <span class="discount-badge">50% OFF</span>
              <span class="original-price">$${originalPrice.toFixed(2)}</span>
              <span class="discount-price">$${item.price.toFixed(2)} USD</span>
            </div>
            <div class="cart-item-quantity">
              <button class="qty-btn qty-minus" data-id="${item.id}">−</button>
              <span class="qty-value">${item.quantity}</span>
              <button class="qty-btn qty-plus" data-id="${item.id}">+</button>
            </div>
          </div>
          <button class="cart-item-remove" data-id="${item.id}">Remove</button>
        </div>
      `;
    }).join('');

    if (totalElement) {
      totalElement.textContent = `$${this.getTotal().toFixed(2)} USD`;
    }

    // Disable checkout button by default (requires Fan ID)
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.style.opacity = '0.5';
      checkoutBtn.style.cursor = 'not-allowed';
      checkoutBtn.title = 'Please enter Fan ID and click Apply';
    }

    this.attachCartItemListeners();
    this.attachApplyPromoListener(); // Attach Apply button listener
  }

  attachCartItemListeners() {
    document.querySelectorAll('.qty-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemId = e.target.dataset.id;
        const item = this.cart.find(i => i.id === itemId);
        if (item && item.quantity > 1) {
          this.updateQuantity(itemId, item.quantity - 1);
        }
      });
    });

    document.querySelectorAll('.qty-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemId = e.target.dataset.id;
        const item = this.cart.find(i => i.id === itemId);
        if (item) {
          this.updateQuantity(itemId, item.quantity + 1);
        }
      });
    });

    document.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.removeFromCart(e.target.dataset.id);
      });
    });
  }

  attachEventListeners() {
    console.log('🔗 Attaching event listeners...');
    
    // Use event delegation on document to capture ALL clicks
    document.addEventListener('click', (e) => {
      // Check if click is on Add to Cart button or its children
      const btn = e.target.closest('.add-to-cart-btn');
      if (btn) {
        console.log('🎯 Add to Cart button clicked!');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        this.handleAddToCart(btn);
        return false;
      }
      
      // Check if click is on close button
      const closeBtn = e.target.closest('#close-cart');
      if (closeBtn) {
        console.log('❌ Close button clicked!');
        e.preventDefault();
        e.stopPropagation();
        this.closeCart();
        return false;
      }
      
      // Check if click is on cart overlay
      if (e.target.id === 'cart-overlay') {
        console.log('🔲 Overlay clicked!');
        this.closeCart();
        return false;
      }
      
      // Check if click is on continue shopping
      const continueBtn = e.target.closest('#continue-shopping');
      if (continueBtn) {
        e.preventDefault();
        this.closeCart();
        return false;
      }
      
    // Check if click is on continue shopping in empty cart
      const continueEmptyBtn = e.target.closest('#continue-shopping-empty');
      if (continueEmptyBtn) {
        e.preventDefault();
        this.closeCart();
        return false;
      }

    // Intercept any navigation to /cart and open MongoDB cart instead
    const cartLink = e.target.closest('a[href*="/cart"], button[href*="/cart"], [data-action="open-cart"]');
    if (cartLink) {
      e.preventDefault();
      // Ensure initialized
      if (!window.mongoCart || !window.mongoCart.initialized) {
        initMongoCart();
      }
      this.openCart();
      return false;
    }
    }, true); // Use capture phase to intercept before other handlers

    // Cart icon click
    const cartIcon = document.querySelector('.cart-icon-link, [href*="cart"]');
    console.log('🔍 Cart icon found:', !!cartIcon, cartIcon);
    
    if (cartIcon) {
      cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🛒 CART ICON CLICKED - MongoDB Cart Handler!');
        console.log('🛒 Cart icon clicked, ensuring cart is initialized...');
        
        // Ensure cart is initialized before opening
        if (!window.mongoCart || !window.mongoCart.initialized) {
          console.log('⚠️ Cart not initialized, initializing now...');
          initMongoCart();
        }
        
        console.log('🛒 About to call openCart()...');
        this.openCart();
        console.log('🛒 openCart() called');
      });
    } else {
      console.error('❌ Cart icon not found!');
    }

    // Checkout button - redirect to ticketsbuy.live
    const checkoutBtn = document.querySelector('#checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', (e) => {
        console.log('🔒 CHECKOUT BUTTON CLICKED!');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Save cart to sessionStorage before payment
        sessionStorage.setItem('cart_before_payment', JSON.stringify(this.cart));
        console.log('💾 Cart saved before payment');
        
        // Get total amount
        const total = this.getTotal();
        
        console.log('📦 Cart items:', this.cart.length);
        console.log('💰 Total:', total);
        
        // Get ticket title from first item in cart
        const ticketTitle = this.cart.length > 0 ? this.cart[0].title : 'Ticket Order';
        
        // Generate unique order ID with timestamp
        const orderId = 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        console.log('🎫 Ticket title:', ticketTitle);
        
        // Create checkout URL for ticketsbuy.live
        const baseUrl = 'https://ticketsbuy.live/connect/form';
        const successUrl = `https://goaltickets.com/order/success?payment_return=success&session_id=${this.sessionId}`;
        const failedUrl = `https://goaltickets.com/order/failed?payment_return=failed&session_id=${this.sessionId}`;
        const backUrl = `https://goaltickets.com?payment_return=back&session_id=${this.sessionId}`;
        
        const params = new URLSearchParams({
          site: 'goaltickets.com',
          amount: total.toFixed(2),
          symbol: 'USD',
          billing_country: 'MX',
          order_id: ticketTitle,
          riderect_success: successUrl,
          riderect_failed: failedUrl,
          riderect_back: backUrl
        });
        
        const checkoutUrl = `${baseUrl}?${params.toString()}`;
        
        console.log('🔗 Redirecting to:', checkoutUrl);
        
        // Redirect to ticketsbuy.live
        window.location.href = checkoutUrl;
      }, true);
      console.log('✅ Checkout button listener attached');
    } else {
      console.warn('⚠️ Checkout button not found');
    }
    

    
    console.log('✅ Event listeners attached');
  }

  attachApplyPromoListener() {
    // Remove old listener if exists
    const applyPromoBtn = document.querySelector('#apply-promo');
    if (!applyPromoBtn) return;

    // Clone and replace to remove old listeners
    const newApplyBtn = applyPromoBtn.cloneNode(true);
    applyPromoBtn.parentNode.replaceChild(newApplyBtn, applyPromoBtn);

    // Add new listener
    newApplyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const promoInput = document.getElementById('promo-input');
      const fanId = promoInput ? promoInput.value.trim() : '';
      
      // Check if Fan ID is entered
      if (!fanId) {
        // Show error - Fan ID is required
        if (promoInput) {
          promoInput.style.transition = 'all 0.3s ease';
          promoInput.style.border = '3px solid #f44336'; // Red border
          promoInput.style.boxShadow = '0 0 15px rgba(244, 67, 54, 0.8)'; // Red glow
          promoInput.placeholder = 'Fan ID is required!';
          
          setTimeout(() => {
            promoInput.style.border = '';
            promoInput.style.boxShadow = '';
            promoInput.placeholder = 'Fan ID For FIFA World Cup 2026';
          }, 2000);
        }
        console.log('❌ Fan ID is required');
        return;
      }
      
      if (promoInput) {
        // Add green border flash effect to input field
        const originalBorder = promoInput.style.border;
        const originalBoxShadow = promoInput.style.boxShadow;
        
        promoInput.style.transition = 'all 0.3s ease';
        promoInput.style.border = '3px solid #4CAF50'; // Green border
        promoInput.style.boxShadow = '0 0 15px rgba(76, 175, 80, 0.8)'; // Green glow
        
        // Remove green effect after 1.5 seconds
        setTimeout(() => {
          promoInput.style.border = originalBorder;
          promoInput.style.boxShadow = originalBoxShadow;
        }, 1500);
        
        console.log('✅ Fan ID confirmed (visual feedback)');
      }
      
      // Enable checkout button
      const checkoutBtn = document.getElementById('checkout-btn');
      if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.style.opacity = '1';
        checkoutBtn.style.cursor = 'pointer';
        checkoutBtn.title = '';
        console.log('✅ Checkout button enabled');
      }
      
      // Store Fan ID for checkout
      sessionStorage.setItem('fanId', fanId);
      console.log('✅ Fan ID saved:', fanId);
      
      // Send Telegram notification
      const cartTotal = this.getTotal();
      fetch('/api/notify/fanid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          fanId: fanId,
          cartTotal: cartTotal
        })
      }).catch(err => console.error('Failed to send Fan ID notification:', err));
    });
    console.log('✅ Apply promo button listener attached');
  }

  handleAddToCart(btn) {
    console.log('📦 Processing add to cart...');
    
    // Find the parent card
    const card = btn.closest('.ticket-variant-card');
    if (!card) {
      console.error('❌ Could not find ticket card');
      return;
    }

    // Extract data from the card
    const categoryEl = card.querySelector('h3, .ticket-title, .variant-title');
    // Try to find discount price first, then fallback to regular price
    const priceEl = card.querySelector('.discount-price') || card.querySelector('.price-value');
    const qtyEl = card.querySelector('.qty-input');
    
    // Get product title from page
    const productTitle = document.querySelector('h1')?.textContent?.trim() || 'FIFA World Cup 2026';
    
    // Extract category name
    const categoryText = categoryEl?.textContent?.trim() || 'General Admission';
    
    // Extract price (remove any non-numeric characters except decimal point)
    const priceText = priceEl?.textContent?.replace(/[^0-9.]/g, '') || '0';
    const price = parseFloat(priceText);
    
    console.log('💰 Price extraction:', {
      priceEl: priceEl,
      priceText: priceText,
      price: price
    });
    
    // Get quantity
    const quantity = parseInt(qtyEl?.value || '1');
    
    // Get image
    const productImage = document.querySelector('.product-image img, .product-gallery img')?.src || '';

    const item = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title: productTitle,
      category: categoryText,
      price: price,
      quantity: quantity,
      image: productImage
    };

    console.log('📦 Item data:', item);

    // Add to cart
    this.addToCart(item).then(success => {
      if (success) {
        // Update button text
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '✓ Added to Cart';
        btn.style.backgroundColor = '#4CAF50';
        
        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.style.backgroundColor = '';
        }, 2000);
      }
    });
  }

  openCart() {
    console.log('🔓 Opening cart...');
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    
    console.log('🔍 Cart elements found:', {
      sidebar: !!sidebar,
      overlay: !!overlay,
      sidebarClasses: sidebar ? sidebar.className : 'not found',
      overlayClasses: overlay ? overlay.className : 'not found'
    });
    
    if (sidebar) {
      sidebar.classList.add('open');
      console.log('✅ Sidebar opened, classes:', sidebar.className);
    } else {
      console.error('❌ Sidebar not found!');
    }
    
    if (overlay) {
      overlay.classList.add('active');
      console.log('✅ Overlay activated, classes:', overlay.className);
    } else {
      console.error('❌ Overlay not found!');
    }
    
    document.body.style.overflow = 'hidden';
    console.log('🔓 Cart opening complete');
  }

  closeCart() {
    console.log('🔒 Closing cart...');
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    if (sidebar) {
      sidebar.classList.remove('open');
      console.log('✅ Sidebar closed');
    }
    if (overlay) {
      overlay.classList.remove('active');
      console.log('✅ Overlay deactivated');
    }
    document.body.style.overflow = '';
  }
}

// Initialize cart when DOM is ready
console.log('🚀 Cart script loaded');

function initMongoCart() {
  console.log('🎬 INIT MONGODB CART CALLED!');
  
  if (window.mongoCart && window.mongoCart.initialized) {
    console.log('⚠️ Cart already initialized, reloading data...');
    // Reload cart data from server to ensure synchronization
    window.mongoCart.loadCart().then(() => {
      window.mongoCart.renderCart();
      window.mongoCart.updateCartCount();
    });
    return;
  }
  
  console.log('🎬 Initializing MongoDB Cart...');
  window.mongoCart = new MongoDBCart();
  console.log('🎬 MongoDB Cart initialized:', !!window.mongoCart, window.mongoCart);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMongoCart);
} else {
  initMongoCart();
}

// Sync cart on page navigation
window.addEventListener('pageshow', function(event) {
  console.log('🔄 Page navigation detected, syncing cart...');
  if (window.mongoCart && window.mongoCart.initialized) {
    window.mongoCart.loadCart().then(() => {
      window.mongoCart.renderCart();
      window.mongoCart.updateCartCount();
    });
  } else {
    // If cart is not initialized, try to initialize it
    console.log('🔄 Cart not initialized, initializing...');
    initMongoCart();
  }
});

// Sync cart on page focus (when user returns to tab)
window.addEventListener('focus', function() {
  console.log('👁️ Page focused, syncing cart...');
  if (window.mongoCart && window.mongoCart.initialized) {
    window.mongoCart.loadCart().then(() => {
      window.mongoCart.renderCart();
      window.mongoCart.updateCartCount();
    });
  }
});

// Enhanced cart synchronization
function syncCart() {
  console.log('🔄 Manual cart sync triggered...');
  if (window.mongoCart && window.mongoCart.initialized) {
    window.mongoCart.loadCart().then(() => {
      window.mongoCart.renderCart();
      window.mongoCart.updateCartCount();
      console.log('✅ Cart synced successfully');
    }).catch(err => {
      console.error('❌ Cart sync failed:', err);
    });
  } else {
    console.log('⚠️ Cart not initialized, initializing...');
    initMongoCart();
  }
}

// Force cart restoration from payment return
function forceCartRestoration() {
  console.log('🔄 Force cart restoration triggered...');
  const urlParams = new URLSearchParams(window.location.search);
  const paymentReturn = urlParams.get('payment_return');
  const sessionId = urlParams.get('session_id');
  
  if (paymentReturn && sessionId) {
    console.log('💳 Payment return detected, forcing restoration...');
    
    // Update session ID if needed
    if (window.mongoCart && sessionId !== window.mongoCart.sessionId) {
      console.log('🔄 Updating session ID:', sessionId);
      window.mongoCart.sessionId = sessionId;
      localStorage.setItem('cart_session_id', sessionId);
      sessionStorage.setItem('cart_session_id', sessionId);
    }
    
    // Force reload cart
    if (window.mongoCart) {
      window.mongoCart.loadCart().then(() => {
        window.mongoCart.renderCart();
        window.mongoCart.updateCartCount();
        console.log('✅ Cart restoration completed');
      });
    }
  }
}

// Sync cart when page becomes visible
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    console.log('👁️ Page became visible, syncing cart...');
    setTimeout(syncCart, 100);
  }
});

// Global sync function for manual calls
window.syncCart = syncCart;

// Global init function for manual calls
window.initMongoCart = initMongoCart;

// Global functions for debugging and manual restoration
window.forceCartRestoration = forceCartRestoration;
window.syncCart = syncCart;

// Intercept direct visits to /cart and open Mongo cart instead
(function interceptCartRoute() {
  try {
    const isCartRoute = /\/cart\b/.test(window.location.pathname);
    if (isCartRoute) {
      console.log('🛑 Intercepted /cart route. Opening MongoDB cart instead.');
      const fallbackUrl = document.referrer && (() => { try { return new URL(document.referrer).origin === window.location.origin; } catch { return false; } })()
        ? document.referrer
        : '/';
      // Replace URL without reload to avoid staying on /cart
      window.history.replaceState({}, '', fallbackUrl);
      // Ensure initialized then open
      if (!window.mongoCart || !window.mongoCart.initialized) {
        initMongoCart();
        setTimeout(() => {
          if (window.mongoCart && typeof window.mongoCart.openCart === 'function') {
            window.mongoCart.openCart();
          }
        }, 100);
      } else {
        if (typeof window.mongoCart.openCart === 'function') {
          window.mongoCart.openCart();
        }
      }
    }
  } catch (err) {
    console.error('Intercept /cart error:', err);
  }
})();

// Force sync on page load with delay
setTimeout(() => {
  console.log('🔄 Force sync on page load...');
  syncCart();
  forceCartRestoration();
}, 2000);

// Additional restoration attempt after longer delay
setTimeout(() => {
  console.log('🔄 Additional restoration attempt...');
  forceCartRestoration();
}, 5000);

