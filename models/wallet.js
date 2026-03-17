const mongoose = require('mongoose');

const WalletTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['credited', 'debited'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const WalletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true  // Only keep unique index on the user field
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  transactions: [WalletTransactionSchema]
}, {
  timestamps: true
});



module.exports = mongoose.model('Wallet', WalletSchema);