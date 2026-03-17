const mongoose = require('mongoose');

const BlockedUserSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User collection
    required: true
  },
  blockReason: {
    type: String,
    required: true,
    trim: true
  },
  blockedAt: {
    type: Date,
    default: Date.now
  }
});

const BlockedUser = mongoose.model('BlockedUser', BlockedUserSchema);

module.exports = BlockedUser;