// STANDALONE CART SYSTEM - NO SHOPIFY DEPENDENCIES
(function() {
  'use strict';
  
  console.log('🛒 Standalone Cart System Loading...');

  // Cart state
  let cart = [];
  
  // Load cart from localStorage
  function loadCart() {
    try {
      const saved = localStorage.getItem('standalone_cart');
      cart = saved ? JSON.parse(saved) : [];
      console.log('Cart loaded:', cart);
      updateCartUI();
    } catch (e) {
      console.error('Error loading cart:', e);
      cart = [];
    }
  }
  
  // Save cart to localStorage
  function saveCart() {
    try {
      localStorage.setItem('standalone_cart', JSON.stringify(cart));
      console.log('Cart saved:', cart);
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }
  
  // Add item to cart
  function addToCart(productData) {
    console.log('Adding to cart:', productData);
    
    const existingIndex = cart.findIndex(item => item.id === productData.id);
    
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += productData.quantity;
    } else {
      cart.push(productData);
    }
    
    saveCart();
    updateCartUI();
    openCart();
    return true;
  }
  
  // Remove item from cart
  function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    updateCartUI();
  }
  
  // Update item quantity
  function updateQuantity(itemId, newQuantity) {
    const item = cart.find(i => i.id === itemId);
    if (item) {
      item.quantity = Math.max(1, parseInt(newQuantity) || 1);
      saveCart();
      updateCartUI();
    }
  }
  
  // Calculate total
  function calculateTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
  
  // Update cart UI
  function updateCartUI() {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = calculateTotal();
    
    // Update count badge
    const countEl = document.getElementById('cart-count');
    if (countEl) {
      countEl.textContent = cartCount;
    }
    
    // Update cart header
    const headerEl = document.querySelector('.cart-header h2');
    if (headerEl) {
      headerEl.textContent = `Cart ${cartCount}`;
    }
    
    // Update total
    const totalEl = document.querySelector('.cart-total-amount');
    if (totalEl) {
      totalEl.textContent = `$${total.toFixed(2)} USD`;
    }
    
    // Update cart items
    const itemsContainer = document.querySelector('.cart-items');
    if (itemsContainer) {
      if (cart.length === 0) {
        itemsContainer.innerHTML = '<p class="cart-empty">Your cart is empty</p>';
      } else {
        itemsContainer.innerHTML = cart.map(item => `
          <div class="cart-item" data-item-id="${item.id}">
            <div class="cart-item-image">
              <img src="${item.image || '/cdn/shop/files/stadium-placeholder.jpg'}" alt="${item.title}">
            </div>
            <div class="cart-item-details">
              <h4>${item.title}</h4>
              <p>${item.category}</p>
              <p class="cart-item-price">$${item.price.toFixed(2)} USD</p>
            </div>
            <div class="cart-item-controls">
              <button class="qty-btn qty-minus" data-item-id="${item.id}">−</button>
              <span class="qty-display">${item.quantity}</span>
              <button class="qty-btn qty-plus" data-item-id="${item.id}">+</button>
            </div>
            <button class="cart-item-remove" data-item-id="${item.id}">Remove</button>
          </div>
        `).join('');
        
        // Add event listeners for quantity buttons
        document.querySelectorAll('.qty-minus').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const itemId = e.target.dataset.itemId;
            const item = cart.find(i => i.id === itemId);
            if (item && item.quantity > 1) {
              updateQuantity(itemId, item.quantity - 1);
            }
          });
        });
        
        document.querySelectorAll('.qty-plus').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const itemId = e.target.dataset.itemId;
            const item = cart.find(i => i.id === itemId);
            if (item) {
              updateQuantity(itemId, item.quantity + 1);
            }
          });
        });
        
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
          btn.addEventListener('click', (e) => {
            removeFromCart(e.target.dataset.itemId);
          });
        });
      }
    }
  }
  
  // Open cart
  function openCart() {
    const cartDrawer = document.getElementById('cart-drawer');
    if (cartDrawer) {
      cartDrawer.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
  
  // Close cart
  function closeCart() {
    const cartDrawer = document.getElementById('cart-drawer');
    if (cartDrawer) {
      cartDrawer.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
  
  // Initialize when DOM is ready
  function init() {
    console.log('🛒 Initializing Standalone Cart...');
    
    loadCart();
    
    // Handle Add to Cart buttons
    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.add-to-cart-btn');
      if (addBtn) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Add to Cart clicked');
        
        // Get product data from the card
        const card = addBtn.closest('.ticket-variant-card');
        if (!card) {
          console.error('No ticket card found');
          showError('Failed to add to cart');
          return;
        }
        
        // Extract data
        const variantId = card.dataset.variantId || `variant-${Date.now()}`;
        const categoryLabel = card.querySelector('.category-label, .ticket-title')?.textContent?.trim() || 'Ticket';
        const priceValue = card.querySelector('.price-value')?.textContent?.trim();
        const price = priceValue ? parseFloat(priceValue.replace(/[^0-9.]/g, '')) : 0;
        const qtySelect = card.querySelector('select, .qty-input');
        const quantity = qtySelect ? parseInt(qtySelect.value) || 1 : 1;
        const pageTitle = document.querySelector('h1')?.textContent?.trim() || 'Product';
        const productImage = document.querySelector('.product-image img')?.src || '';
        
        if (!price || price === 0) {
          console.error('Invalid price');
          showError('Failed to add to cart');
          return;
        }
        
        const productData = {
          id: variantId,
          title: pageTitle,
          category: categoryLabel,
          price: price,
          quantity: quantity,
          image: productImage
        };
        
        console.log('Product data:', productData);
        
        if (addToCart(productData)) {
          showSuccess(addBtn);
        } else {
          showError('Failed to add to cart');
        }
      }
    });
    
    // Handle cart icon click
    const cartIcon = document.querySelector('a[href="/cart"], .cart-icon');
    if (cartIcon) {
      cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        openCart();
      });
    }
    
    // Handle close cart button
    const closeBtn = document.querySelector('.cart-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeCart);
    }
    
    // Handle continue shopping
    const continueBtn = document.querySelector('.cart-continue');
    if (continueBtn) {
      continueBtn.addEventListener('click', closeCart);
    }
    
    // Handle checkout button
    const checkoutBtn = document.querySelector('.cart-checkout');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        alert('Checkout functionality - integrate with your payment system');
      });
    }
    
    console.log('✅ Standalone Cart Initialized!');
  }
  
  // Show success feedback
  function showSuccess(button) {
    const originalHTML = button.innerHTML;
    button.innerHTML = '✓ Added to Cart';
    button.style.backgroundColor = '#10b981';
    
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.style.backgroundColor = '';
    }, 2000);
  }
  
  // Show error feedback
  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'cart-error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:#ef4444;color:white;padding:15px 20px;border-radius:8px;z-index:10000;';
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 3000);
  }
  
  // Run init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Expose to window for debugging
  window.StandaloneCart = {
    addToCart,
    removeFromCart,
    updateQuantity,
    openCart,
    closeCart,
    getCart: () => cart
  };
  
})();

