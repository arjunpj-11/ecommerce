const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the User schema
const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    required: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    default: null,
  },
  phone: {
    type: String,
    default: null,
  },
  password: {
    type: String,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: null,
  },
  role: {
    type: String,
    enum: ['User', 'Admin', 'Manager'],
    default: 'User',
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});



// Pre-save hook to generate userId and hash password
userSchema.pre('save', async function (next) {
  try {
    // Generate a unique userId if it doesn't exist
    if (!this.userId) {
      this.userId = await generateUniqueUserId();
    }

    // Hash password only if modified
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords during login
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Create the model for the User schema
const User = mongoose.model('User', userSchema);

module.exports = User;
