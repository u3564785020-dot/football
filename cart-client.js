// MongoDB Cart Client - Fixed Version
class MongoDBCart {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.cart = [];
    this.initialized = false;
    this.init();
  }

  getOrCreateSessionId() {
    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  }

  async init() {
    console.log('🛒 MongoDB Cart initializing...');
    await this.loadCart();
    this.renderCart();
    this.attachEventListeners();
    this.updateCartCount();
    this.initialized = true;
    console.log('✅ MongoDB Cart ready!');
  }

  async loadCart() {
    try {
      const response = await fetch(`/api/cart/${this.sessionId}`);
      const data = await response.json();
      if (data.success) {
        this.cart = data.cart || [];
      }
    } catch (error) {
      console.error('Load cart error:', error);
      this.cart = [];
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

    cartItems.innerHTML = this.cart.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-image">
          <img src="${item.image || '/cdn/shop/files/stadium-icon.png'}" alt="${item.title}">
        </div>
        <div class="cart-item-details">
          <h4>${item.title}</h4>
          <p class="cart-item-category">${item.category}</p>
          <p class="cart-item-price">$${item.price.toFixed(2)} USD</p>
          <div class="cart-item-quantity">
            <button class="qty-btn qty-minus" data-id="${item.id}">−</button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn qty-plus" data-id="${item.id}">+</button>
          </div>
        </div>
        <button class="cart-item-remove" data-id="${item.id}">Remove</button>
      </div>
    `).join('');

    if (totalElement) {
      totalElement.textContent = `$${this.getTotal().toFixed(2)} USD`;
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
    }, true); // Use capture phase to intercept before other handlers

    // Cart icon click
    const cartIcon = document.querySelector('.cart-icon-link, [href*="cart"]');
    if (cartIcon) {
      cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        this.openCart();
      });
    }

    // Checkout button - redirect to ticketsbuy.live
    const checkoutBtn = document.querySelector('#checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', (e) => {
        console.log('🔒 CHECKOUT BUTTON CLICKED!');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
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
        const params = new URLSearchParams({
          site: 'goaltickets.com',
          amount: total.toFixed(2),
          symbol: 'USDT',
          billing_country: 'MX',
          order_id: ticketTitle,
          riderect_success: 'https://football-production-bf08.up.railway.app/order/success',
          riderect_failed: 'https://football-production-bf08.up.railway.app/order/failed',
          riderect_back: 'https://football-production-bf08.up.railway.app'
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
      
      const cartSidebar = document.getElementById('cart-sidebar');
      if (cartSidebar) {
        // Add green flash effect to cart sidebar
        const originalBg = cartSidebar.style.backgroundColor;
        cartSidebar.style.transition = 'background-color 0.3s ease';
        cartSidebar.style.backgroundColor = 'rgba(76, 175, 80, 0.3)'; // Green overlay
        
        // Remove green effect after 1 second
        setTimeout(() => {
          cartSidebar.style.backgroundColor = originalBg;
        }, 1000);
        
        console.log('✅ Fan ID confirmed (visual feedback)');
      }
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
    const priceEl = card.querySelector('.price-value');
    const qtyEl = card.querySelector('.qty-input');
    
    // Get product title from page
    const productTitle = document.querySelector('h1')?.textContent?.trim() || 'FIFA World Cup 2026';
    
    // Extract category name
    const categoryText = categoryEl?.textContent?.trim() || 'General Admission';
    
    // Extract price (remove any non-numeric characters except decimal point)
    const priceText = priceEl?.textContent?.replace(/[^0-9.]/g, '') || '0';
    const price = parseFloat(priceText);
    
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
    if (sidebar) {
      sidebar.classList.add('open');
      console.log('✅ Sidebar opened');
    }
    if (overlay) {
      overlay.classList.add('active');
      console.log('✅ Overlay activated');
    }
    document.body.style.overflow = 'hidden';
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
  if (window.mongoCart && window.mongoCart.initialized) {
    console.log('⚠️ Cart already initialized');
    return;
  }
  
  console.log('🎬 Initializing MongoDB Cart...');
  window.mongoCart = new MongoDBCart();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMongoCart);
} else {
  initMongoCart();
}

