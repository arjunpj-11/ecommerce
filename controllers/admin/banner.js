const Banner = require('../../models/banner');
const MainCategory = require('../../models/mainCategory');
const SubCategory = require('../../models/subCategory');
const cloudinary = require('../../config/cloudinary');
const mongoose = require('mongoose');

const bannerController = {
    // Get all banners
    getBanners: async (req, res) => {
        try {
            const banners = await Banner.find()
                .sort({ order: 1 })
                .populate({
                    path: 'categoryId',
                    refPath: 'categoryType'
                });
            
            res.json(banners);
        } catch (error) {
            console.error('Error fetching banners:', error);
            res.status(500).json({ 
                error: 'Failed to fetch banners',
                details: error.message 
            });
        }
    },

    // Get banner management page
    getBannerManager: async (req, res) => {
        try {
            const banners = await Banner.find()
                .sort({ order: 1 })
                .populate({
                    path: 'categoryId',
                    refPath: 'categoryType'
                });

            const mainCategories = await MainCategory.find({ status: 'active' });
            const subCategories = await SubCategory.find({ status: 'active' })
                .populate('mainCategory');

            res.render('../views/pages/admin/banner', { 
                banners, 
                mainCategories,
                subCategories 
            });
        } catch (error) {
            console.error('Error loading banner manager:', error);
            res.status(500).render('error', { 
                message: 'Failed to load banner manager',
                error 
            });
        }
    },

    // Create new banner
    createBanner: async (req, res) => {
        try {
            const { 
                title, 
                heading, 
                subtext, 
                buttonText, 
                categoryType,
                categoryId,
                image 
            } = req.body;

            // Validate required fields
            if (!title || !heading || !subtext || !buttonText || !categoryType || !categoryId) {
                return res.status(400).json({ 
                    error: 'Missing required fields' 
                });
            }

            // Validate category exists
            let category;
            if (categoryType === 'MainCategory') {
                category = await MainCategory.findById(categoryId);
            } else {
                category = await SubCategory.findById(categoryId);
            }

            if (!category) {
                return res.status(400).json({
                    error: 'Selected category not found'
                });
            }

            // Upload image to Cloudinary
            const uploadResult = await cloudinary.uploader.upload(image, {
                folder: 'banners',
                resource_type: 'image',
                quality: 'auto'
            });

            // Get the highest order number
            const lastBanner = await Banner.findOne().sort({ order: -1 });
            const newOrder = lastBanner ? lastBanner.order + 1 : 0;

            // Create new banner
            const banner = new Banner({
                title,
                heading,
                subtext,
                buttonText,
                imageUrl: uploadResult.secure_url,
                categoryType,
                categoryId,
                order: newOrder,
                isActive: true
            });

            await banner.save();

            // Populate category information before sending response
            await banner.populate({
                path: 'categoryId',
                refPath: 'categoryType'
            });

            res.status(201).json(banner);
        } catch (error) {
            console.error('Error creating banner:', error);
            res.status(500).json({ 
                error: 'Failed to create banner',
                details: error.message 
            });
        }
    },

    // Update existing banner
    updateBanner: async (req, res) => {
        try {
            const { id } = req.params;
            const { 
                title, 
                heading, 
                subtext, 
                buttonText, 
                categoryType,
                categoryId,
                image 
            } = req.body;

            // Validate required fields
            if (!title || !heading || !subtext || !buttonText || !categoryType || !categoryId) {
                return res.status(400).json({ 
                    error: 'Missing required fields' 
                });
            }

            // Validate banner ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    error: 'Invalid banner ID' 
                });
            }

            const banner = await Banner.findById(id);
            if (!banner) {
                return res.status(404).json({ 
                    error: 'Banner not found' 
                });
            }

            // Validate category exists
            let category;
            if (categoryType === 'MainCategory') {
                category = await MainCategory.findById(categoryId);
            } else {
                category = await SubCategory.findById(categoryId);
            }

            if (!category) {
                return res.status(400).json({
                    error: 'Selected category not found'
                });
            }

            let imageUrl = banner.imageUrl;
            // Handle image update if provided
            if (image) {
                // Delete old image from Cloudinary
                if (banner.imageUrl) {
                    const publicId = banner.imageUrl.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(`banners/${publicId}`);
                }

                // Upload new image
                const uploadResult = await cloudinary.uploader.upload(image, {
                    folder: 'banners',
                    resource_type: 'image',
                    quality: 'auto'
                });

                imageUrl = uploadResult.secure_url;
            }

            // Update banner with all fields
            const updatedBanner = await Banner.findByIdAndUpdate(
                id,
                {
                    title,
                    heading,
                    subtext,
                    buttonText,
                    imageUrl,
                    categoryType,
                    categoryId,
                    isActive: banner.isActive // Preserve the existing isActive state
                },
                { 
                    new: true, 
                    runValidators: true 
                }
            ).populate({
                path: 'categoryId',
                refPath: 'categoryType'
            });

            res.json(updatedBanner);
        } catch (error) {
            console.error('Error updating banner:', error);
            res.status(500).json({ 
                error: 'Failed to update banner',
                details: error.message 
            });
        }
    },

    // Delete banner
    deleteBanner: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate banner ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    error: 'Invalid banner ID' 
                });
            }

            const banner = await Banner.findById(id);
            if (!banner) {
                return res.status(404).json({ 
                    error: 'Banner not found' 
                });
            }

            // Delete image from Cloudinary
            if (banner.imageUrl) {
                const publicId = banner.imageUrl.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`banners/${publicId}`);
            }

            // Delete banner
            await Banner.findByIdAndDelete(id);

            // Reorder remaining banners
            const remainingBanners = await Banner.find().sort({ order: 1 });
            for (let i = 0; i < remainingBanners.length; i++) {
                await Banner.findByIdAndUpdate(remainingBanners[i]._id, { order: i });
            }

            res.json({ message: 'Banner deleted successfully' });
        } catch (error) {
            console.error('Error deleting banner:', error);
            res.status(500).json({ 
                error: 'Failed to delete banner',
                details: error.message 
            });
        }
    },

    // Update banner order
    updateOrder: async (req, res) => {
        try {
            const { orders } = req.body;

            if (!Array.isArray(orders)) {
                return res.status(400).json({ 
                    error: 'Invalid order data format' 
                });
            }

            // Update orders in transaction
            await mongoose.connection.transaction(async (session) => {
                for (const { id, order } of orders) {
                    if (!mongoose.Types.ObjectId.isValid(id)) {
                        throw new Error(`Invalid banner ID: ${id}`);
                    }

                    await Banner.findByIdAndUpdate(
                        id,
                        { order },
                        { session }
                    );
                }
            });

            res.json({ message: 'Banner order updated successfully' });
        } catch (error) {
            console.error('Error updating banner order:', error);
            res.status(500).json({ 
                error: 'Failed to update banner order',
                details: error.message 
            });
        }
    },

    // Toggle banner active status
    toggleBannerStatus: async (req, res) => {
        try {
            const { id } = req.params;

            // Validate banner ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    error: 'Invalid banner ID' 
                });
            }

            const banner = await Banner.findById(id);
            if (!banner) {
                return res.status(404).json({ 
                    error: 'Banner not found' 
                });
            }

            banner.isActive = !banner.isActive;
            await banner.save();

            res.json({ 
                message: 'Banner status updated successfully',
                isActive: banner.isActive 
            });
        } catch (error) {
            console.error('Error toggling banner status:', error);
            res.status(500).json({ 
                error: 'Failed to toggle banner status',
                details: error.message 
            });
        }
    },

    // Get active banners for a specific category
    getCategoryBanners: async (req, res) => {
        try {
            const { categoryType, categoryId } = req.params;

            // Validate category exists
            let category;
            if (categoryType === 'main') {
                category = await MainCategory.findById(categoryId);
            } else {
                category = await SubCategory.findById(categoryId);
            }

            if (!category) {
                return res.status(404).json({
                    error: 'Category not found'
                });
            }

            // Find active banners for the category
            const banners = await Banner.find({
                categoryType,
                categoryId,
                isActive: true
            })
            .sort({ order: 1 })
            .populate({
                path: 'categoryId',
                refPath: 'categoryType'
            });

            res.json(banners);
        } catch (error) {
            console.error('Error fetching category banners:', error);
            res.status(500).json({
                error: 'Failed to fetch category banners',
                details: error.message
            });
        }
    }
};

module.exports = bannerController;