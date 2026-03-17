const mongoose = require('mongoose');

// Define the Cart schema
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  items: [
        {
          variantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Variant', // Reference to the Variant model
            required: true,
          },
          size: {
            type: String,
            required: true, // Making size a required field
          },
          quantity: {
            type: Number,
            required: true,
            min: 1, // Minimum quantity for each variant
            default: 1,
          },
        },
      ],
  updatedAt: {
    type: Date,
    default: Date.now, // Timestamp of the last update
  },
  couponApplied: {
    type: String, 
    default: null
},
});

// Create the model for the Cart schema
const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;