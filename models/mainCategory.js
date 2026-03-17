const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Import UUID library

// Define the Main Category schema
const mainCategorySchema = new mongoose.Schema({
  mainCategoryName: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    default: '/default-image.png', // Provide a default image path
    trim: true,
  },
  offerPercentage: {
    type: Number,
    default: 0, // Default offer percentage
    min: 0,
    max: 100,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'], // Only allows 'active' or 'inactive'
    default: 'active', // Default status is 'active'
    trim: true,
  }
});


// Middleware to set `updatedAt` on each update
mainCategorySchema.pre('save', function (next) {
  this.updatedAt = Date.now(); // Update the `updatedAt` field
  next();
});

// Static method to find Active categories
mainCategorySchema.statics.findActiveCategories = async function () {
  return await this.find({ status: 'Active' });
};

// Create the model for the Main Category schema
const MainCategory = mongoose.model('MainCategory', mainCategorySchema);

module.exports = MainCategory;
