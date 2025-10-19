// Shopping Cart System - Works with existing Add to Cart buttons
// Manages cart state, localStorage persistence, and UI updates

class ShoppingCart {
  constructor() {
    this.cart = this.loadCart();
    this.init();
  }

  init() {
    console.log('🛒 Cart system initialized');
    this.updateCartCount();
    this.bindEvents();
  }

  bindEvents() {
    // Listen for clicks on Add to Cart buttons
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.add-to-cart-btn');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        this.handleAddToCart(btn);
      }
    });

    // Cart icon click
    const cartLinks = document.querySelectorAll('a[href="/cart"], a[href="#cart"]');
    cartLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.openCart();
      });
    });
  }

  handleAddToCart(button) {
    // Get product data from button's parent card
    const card = button.closest('.ticket-variant-card');
    if (!card) {
      console.error('Could not find ticket variant card');
      return;
    }

    // Extract data
    const variantId = button.dataset.variantId || card.dataset.variantId;
    const productId = button.dataset.productId;
    
    // Get title from page
    const pageTitle = document.querySelector('h1')?.textContent?.trim() || 'Product';
    
    // Get category from card
    const categoryLabel = card.querySelector('.category-label')?.textContent?.trim() || card.querySelector('.ticket-title')?.textContent?.trim() || '';
    
    // Get price from card
    const priceElement = card.querySelector('.price-value');
    let price = 0;
    if (priceElement) {
      const priceText = priceElement.textContent.replace(/[^0-9.]/g, '');
      price = parseFloat(priceText) || 0;
    }

    // Get quantity selector value
    const qtySelect = card.querySelector('select');
    const quantity = qtySelect ? parseInt(qtySelect.value) || 1 : 1;

    // Get image
    const productImage = document.querySelector('.product-image img')?.src || '';

    const productData = {
      id: variantId,
      productId: productId,
      title: pageTitle,
      category: categoryLabel,
      price: price,
      quantity: quantity,
      image: productImage
    };

    console.log('Adding to cart:', productData);

    // Check if already in cart
    const existingIndex = this.cart.findIndex(item => 
      item.id === productData.id
    );

    if (existingIndex >= 0) {
      this.cart[existingIndex].quantity += productData.quantity;
    } else {
      this.cart.push(productData);
    }

    this.saveCart();
    this.openCart();
    this.showFeedback(button);
  }

  showFeedback(button) {
    const originalText = button.innerHTML;
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      Added to Cart
    `;
    button.style.backgroundColor = '#10b981';
    
    setTimeout(() => {
      button.innerHTML = originalText;
      button.style.backgroundColor = '';
    }, 2000);
  }

  loadCart() {
    try {
      const saved = localStorage.getItem('goaltickets_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading cart:', e);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem('goaltickets_cart', JSON.stringify(this.cart));
      this.updateCartCount();
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }

  removeFromCart(index) {
    this.cart.splice(index, 1);
    this.saveCart();
    this.renderCart();
  }

  updateQuantity(index, newQuantity) {
    if (newQuantity < 1) {
      this.removeFromCart(index);
      return;
    }
    
    this.cart[index].quantity = newQuantity;
    this.saveCart();
    this.renderCart();
  }

  getTotal() {
    return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  updateCartCount() {
    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Update all cart count badges
    const badges = document.querySelectorAll('.cart-count, .cart-badge');
    badges.forEach(badge => {
      badge.textContent = totalItems;
      badge.style.display = totalItems > 0 ? 'inline-flex' : 'none';
    });
  }

  openCart() {
    let overlay = document.getElementById('cart-overlay');
    
    if (!overlay) {
      overlay = this.createCartOverlay();
      document.body.appendChild(overlay);
    }

    this.renderCart();
    
    setTimeout(() => {
      overlay.classList.add('active');
    }, 10);
    
    document.body.style.overflow = 'hidden';
  }

  closeCart() {
    const overlay = document.getElementById('cart-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => {
        document.body.style.overflow = '';
      }, 300);
    }
  }

  createCartOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'cart-overlay';
    overlay.className = 'cart-overlay';
    overlay.innerHTML = `
      <div class="cart-sidebar">
        <div class="cart-header">
          <h2>Cart <span class="cart-badge">0</span></h2>
          <button class="cart-close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="cart-items" id="cart-items-container"></div>
        <div class="cart-footer">
          <div class="cart-promo">
            <input type="text" placeholder="Enter promo code" id="promo-code-input">
            <button class="promo-apply-btn">Apply</button>
          </div>
          <div class="cart-total">
            <span>Total</span>
            <span class="cart-total-amount">$0.00 USD</span>
          </div>
          <button class="cart-view-btn">View cart</button>
          <button class="cart-checkout-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            CHECKOUT
          </button>
          <button class="cart-continue-btn">Continue shopping</button>
          <div class="cart-security">
            🔒 Secure Checkout · ✓ 100% Guaranteed
          </div>
        </div>
      </div>
    `;

    // Bind events
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeCart();
      }
    });

    overlay.querySelector('.cart-close').addEventListener('click', () => {
      this.closeCart();
    });

    overlay.querySelector('.cart-continue-btn').addEventListener('click', () => {
      this.closeCart();
    });

    overlay.querySelector('.cart-view-btn').addEventListener('click', () => {
      window.location.href = '/cart';
    });

    overlay.querySelector('.cart-checkout-btn').addEventListener('click', () => {
      if (this.cart.length > 0) {
        window.location.href = '/checkout';
      } else {
        alert('Your cart is empty');
      }
    });

    return overlay;
  }

  renderCart() {
    const container = document.getElementById('cart-items-container');
    const badge = document.querySelector('.cart-sidebar .cart-badge');
    const totalAmount = document.querySelector('.cart-total-amount');

    if (!container) return;

    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = this.getTotal();

    if (badge) {
      badge.textContent = totalItems;
    }

    if (totalAmount) {
      totalAmount.textContent = `$${total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD`;
    }

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <p>Your cart is empty</p>
          <button onclick="window.cart.closeCart()">Continue shopping</button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.cart.map((item, index) => `
      <div class="cart-item">
        <div class="cart-item-image">
          ${item.image ? `<img src="${item.image}" alt="${item.title}">` : 
            `<div class="cart-item-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>`
          }
        </div>
        <div class="cart-item-details">
          <h3>${item.title}</h3>
          <p class="cart-item-price">$${item.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD</p>
          ${item.category ? `<p class="cart-item-category">${item.category}</p>` : ''}
        </div>
        <div class="cart-item-actions">
          <div class="cart-item-quantity">
            <button onclick="window.cart.updateQuantity(${index}, ${item.quantity - 1})">−</button>
            <span>${item.quantity}</span>
            <button onclick="window.cart.updateQuantity(${index}, ${item.quantity + 1})">+</button>
          </div>
          <button class="cart-item-remove" onclick="window.cart.removeFromCart(${index})">Remove</button>
        </div>
      </div>
    `).join('');
  }
}

// Initialize cart
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.cart = new ShoppingCart();
  });
} else {
  window.cart = new ShoppingCart();
}

