const mongoose = require('mongoose');

// Define the Address schema
const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to User collection
    ref: 'User',
    required: [true, 'User reference is required'],
  },
  street: {
    type: String,
    required: [true, 'Street address is required'],
    trim: true,
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
  },
  postalCode: {
    type: String,
    required: [true, 'Postal code is required'],
  },
  country: {
    type: String,
    trim: true,
  },
  isPrimary: {
    type: Boolean,
    default: false,
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
addressSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Middleware to auto-update the updatedAt field on findOneAndUpdate
addressSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
