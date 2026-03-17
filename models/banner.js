// models/banner.js
const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    heading: {
        type: String,
        required: true,
        trim: true
    },
    subtext: {
        type: String,
        required: true,
        trim: true
    },
    buttonText: {
        type: String,
        required: true,
        trim: true
    },
    imageUrl: {
        type: String,
        required: true,
        trim: true
    },
    categoryType: {
        type: String,
        enum: ['MainCategory', 'SubCategory'], 
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'categoryType'
    },
    order: {
        type: Number,
        required: true,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});



const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;