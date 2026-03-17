const mongoose = require('mongoose');

// Counter Schema for auto-incrementing productId
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 1000000 }
});

const Counter = mongoose.model('Counter', counterSchema);

// Define the Product schema
const productSchema = new mongoose.Schema({
  productId: {
    type: Number,
    unique: true,
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative'],
    validate: {
      validator: function (value) {
        return value <= this.price;
      },
      message: 'Discount price must be less than the original price',
    },
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required'],
  },
  image: {
    type: String,
    default: '/default-image.png', // Provide a default image path
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'], // Only allows 'active' or 'inactive'
    default: 'active', // Default status is 'active'
    trim: true,
  },
  review: {
    type: Number,
    min: [1, 'Review must be at least 1'],
    max: [5, 'Review cannot exceed 5'],
    default: 1, // Default review value
  }
});

// Middleware to auto-increment productId
productSchema.pre('save', async function (next) {
  if (!this.productId) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'productId' },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );
    this.productId = counter.sequence_value;
  }
  this.updatedAt = Date.now();
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
