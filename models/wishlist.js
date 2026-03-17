const mongoose = require('mongoose');

const WishlistItemSchema = new mongoose.Schema({
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
            },
          },
        ],
    updatedAt: {
      type: Date,
      default: Date.now, // Timestamp of the last update
    }
});

module.exports = mongoose.model('Wishlist', WishlistItemSchema);