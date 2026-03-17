const mongoose = require('mongoose');

// Define the Variant schema
const variantSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to Product collection
    ref: 'Product',
    required: [true, 'Product reference is required'],
  },
  color: {
    type: String,
    required: [true, 'Color is required'],
    trim: true,
  },
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function (value) {
        return value.every((url) => /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(url));
      },
      message: 'One or more image URLs are invalid.',
    },
  },
  sizes: {
    type: Object,
    of: {
      type: Number,
      min: [0, 'Stock count must be non-negative'],
    },
    validate: {
      validator: function(sizes) {
        return Object.values(sizes).every(count => count >= 0);

      },
      message: 'All sizes must have non-negative stock counts.'
    }
  },
  tags: {
    type: [String],
    default: [],
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
});

// Middleware to auto-update the updatedAt field on document save
variantSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Middleware to auto-update the updatedAt field on findOneAndUpdate
variantSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Variant = mongoose.model('Variant', variantSchema);

module.exports = Variant;
