const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const compression = require('compression');
const app = express();
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
  updatedAt: { type: Date, default: Date.now }
});

const Cart = mongoose.model('Cart', cartSchema);

// Middleware
app.use(compression()); // Enable gzip compression
app.use(express.json());
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
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
