const Product = require('../../models/product');
const Variant = require('../../models/variant');
const mainCategory = require('../../models/mainCategory');
const subCategory = require('../../models/subCategory');
const cloudinary = require('../../config/cloudinary');

// Define all controller functions
const productController = {
    // GET home page
    getHomePage: async (req, res, next) => {
        try {
            req.session.productId = req.query.id;
            const page = 1;
            const limit = 10;
            const query = req.session.productId ? { subCategory: req.session.productId } : {};
            
            const [mainCategories, subCategories, totalProducts, products] = await Promise.all([
                mainCategory.find(),
                subCategory.find(),
                Product.countDocuments(query),
                Product.find(query).limit(limit)
            ]);

            const totalPages = Math.ceil(totalProducts / limit);
            
            // Add pagination array logic
            let pages = [];
            const maxVisiblePages = 5;
            let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            res.render('../views/pages/admin/products', {
                products,
                mainCategories,
                subCategories,
                currentPage: page,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                totalProducts,
                pages
            });
        } catch (error) {
            next(error);
        }
    },

    // GET products table with search and variant images
    getProductsTable: async (req, res, next) => {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = 10;
            const skip = (page - 1) * limit;
            const searchQuery = req.query.search || '';
            
            // Build base query
            let query = req.session.productId ? { subCategory: req.session.productId } : {};
            
            // Add search conditions if search query exists
            if (searchQuery) {
                query = {
                    ...query,
                    $or: [
                        { name: { $regex: searchQuery, $options: 'i' } },
                        { description: { $regex: searchQuery, $options: 'i' } }
                    ]
                };
            }
            
            // Fetch all required data in parallel
            const [mainCategories, subCategories, totalProducts, productsBasic] = await Promise.all([
                mainCategory.find().lean(),
                subCategory.find().lean(),
                Product.countDocuments(query),
                Product.find(query)
                    .skip(skip)
                    .limit(limit)
                    .lean()
            ]);

            // Fetch variant images for each product
            const products = await Promise.all(productsBasic.map(async (product) => {
                const variant = await Variant.findOne({
                    productId: product._id,
                    images: { $exists: true, $ne: [] }
                }).select('images').lean();

                return {
                    ...product,
                    displayImage: variant?.images?.[0] || product.image || '/api/placeholder/48/48'
                };
            }));

            // Calculate pagination
            const totalPages = Math.ceil(totalProducts / limit);
            
            // Generate visible page numbers
            const maxVisiblePages = 5;
            let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }

            const pages = Array.from(
                { length: endPage - startPage + 1 },
                (_, i) => startPage + i
            );

            // Render the table partial
            res.render('../views/partials/admin/productsTable', {
                products,
                mainCategories,
                subCategories,
                currentPage: page,
                totalPages,
                pages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                totalProducts,
                searchQuery,
                query: req.query // Pass query parameters for maintaining state
            });

        } catch (error) {
            console.error('Error in getProductsTable:', error);
            next(error);
        }
    },

    // GET add product page
    getAddProductPage: async (req, res, next) => {
        try {
            const mainCategories = await mainCategory.find();
            const subCategories = await subCategory.find();
            res.render('../views/pages/admin/addProducts', { mainCategories, subCategories });
        } catch (error) {
            next(error);
        }
    },

    // POST add product
    addProduct: async (req, res, next) => {
        try {
            const product = await Product.create({
                name: req.body.name,
                description: req.body.description,
                price: req.body.price,
                subCategory: req.body.category,
                discountPrice: req.body.price
            });

            const variants = req.body.variants;
            for (let variant of variants) {
                let photos = [];
                for (let i of variant.images) {
                    const result = await cloudinary.uploader.upload(i, {
                        folder: 'products'
                    });
                    photos.push(result.secure_url);
                }
                await Variant.create({
                    productId: product._id,
                    color: variant.color,
                    images: photos,
                    sizes: variant.sizes,
                    tags: variant.tags
                });
            }

            res.json({ success: true, message: 'Product added successfully' });
        } catch (error) {
            next(error);
        }
    },

    // POST edit product
    editProduct: async (req, res, next) => {
        try {
            const { id, name, description, price } = req.body;

            const updatedProduct = await Product.findByIdAndUpdate(
                id,
                {
                    name,
                    description,
                    price,
                },
                { new: true, runValidators: true }
            );

            if (!updatedProduct) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Product not found' 
                });
            }

            res.json({ 
                success: true, 
                message: 'Product updated successfully',
                product: updatedProduct 
            });
        } catch (error) {
            next(error);
        }
    },

    // DELETE product
    deleteProduct: async (req, res, next) => {
        try {
            await Product.deleteOne({ _id: req.body.id });
            res.json({ success: true, message: 'Product deleted successfully' });
        } catch (error) {
            next(error);
        }
    },

    // PATCH inactivate product
    inactivateProduct: async (req, res, next) => {
        try {
            await Product.updateOne({ _id: req.body.id }, { status: "inactive" });
            res.json({ success: true, message: 'Product inactivated successfully' });
        } catch (error) {
            next(error);
        }
    },

    // PATCH activate product
    activateProduct: async (req, res, next) => {
        try {
            if (req.session.subCategoryStatus === "inactive") {
                return res.json({ success: false, message: "Please activate the subcategory first" });
            }
            await Product.updateOne({ _id: req.body.id }, { status: "active" });
            res.json({ success: true, message: 'Product activated successfully' });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = productController;