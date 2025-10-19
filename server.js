const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Определяем порт (Railway использует переменную PORT)
const PORT = process.env.PORT || 3000;

// In-memory cart storage (will be replaced with MongoDB later)
const carts = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Cart API endpoints
// Get cart by session ID
app.get('/api/cart/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const cart = carts.get(sessionId) || [];
  res.json({ success: true, cart });
});

// Add item to cart
app.post('/api/cart/:sessionId/add', (req, res) => {
  const { sessionId } = req.params;
  const item = req.body;
  
  let cart = carts.get(sessionId) || [];
  
  // Check if item with same title and category already exists
  const existingItemIndex = cart.findIndex(
    i => i.title === item.title && i.category === item.category
  );
  
  if (existingItemIndex >= 0) {
    // Update quantity of existing item
    cart[existingItemIndex].quantity += item.quantity;
  } else {
    // Add new item
    cart.push(item);
  }
  
  carts.set(sessionId, cart);
  res.json({ success: true, cart });
});

// Update item quantity
app.put('/api/cart/:sessionId/update/:itemId', (req, res) => {
  const { sessionId, itemId } = req.params;
  const { quantity } = req.body;
  
  let cart = carts.get(sessionId) || [];
  const itemIndex = cart.findIndex(i => i.id === itemId);
  
  if (itemIndex >= 0) {
    if (quantity > 0) {
      cart[itemIndex].quantity = quantity;
    } else {
      cart.splice(itemIndex, 1);
    }
  }
  
  carts.set(sessionId, cart);
  res.json({ success: true, cart });
});

// Remove item from cart
app.delete('/api/cart/:sessionId/remove/:itemId', (req, res) => {
  const { sessionId, itemId } = req.params;
  
  let cart = carts.get(sessionId) || [];
  cart = cart.filter(i => i.id !== itemId);
  
  carts.set(sessionId, cart);
  res.json({ success: true, cart });
});

// Clear cart
app.delete('/api/cart/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  carts.delete(sessionId);
  res.json({ success: true, cart: [] });
});

// Раздаём статические файлы из папки mexico-static-final
app.use(express.static(path.join(__dirname, 'mexico-static-final'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Обработка только HTML маршрутов - НЕ перехватываем статические файлы
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'mexico-static-final', 'index.html'));
});

// Serve pages directory
app.get('/pages/:page', (req, res) => {
  const pagePath = path.join(__dirname, 'mexico-static-final', 'pages', req.params.page);
  res.sendFile(pagePath);
});

// Serve policies directory
app.get('/policies/:page', (req, res) => {
  const pagePath = path.join(__dirname, 'mexico-static-final', 'policies', req.params.page);
  res.sendFile(pagePath);
});

// Serve collections
app.get('/collections/:page', (req, res) => {
  const pagePath = path.join(__dirname, 'mexico-static-final', 'collections', req.params.page);
  res.sendFile(pagePath);
});

// Serve products
app.get('/products/:page', (req, res) => {
  const pagePath = path.join(__dirname, 'mexico-static-final', 'products', req.params.page);
  res.sendFile(pagePath);
});

// Запускаем сервер
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Visit: http://localhost:${PORT}`);
  console.log(`🛒 Cart API ready at /api/cart/*`);
});
