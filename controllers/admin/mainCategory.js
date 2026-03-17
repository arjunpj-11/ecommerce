const mongoose = require('mongoose');
const cloudinary = require('../../config/cloudinary');
const Product = require('../../models/product');
const MainCategory = require('../../models/mainCategory');
const SubCategory = require('../../models/subCategory');

const ObjectId = mongoose.Types.ObjectId;

// Render the admin main category page
exports.getAdminCategory = async (req, res, next) => {
    try {
        res.render('../views/pages/admin/mainCategory');
    } catch (error) {
        console.error('Error rendering admin category:', error);
        next(error); // Forward error to the next middleware
    }
};

// Fetch and render the admin category table
exports.postAdminCategoryTable = async (req, res, next) => {
    try {
        let mainCategories = await MainCategory.find();
        let subcategoriesCount = await SubCategory.aggregate([{ $group: { _id: "$mainCategory", count: { $sum: 1 } } }]).exec();
        res.render('../views/partials/admin/mainCategoryTable', { mainCategories, subcategoriesCount });
    } catch (error) {
        console.error('Error fetching admin category table:', error);
        next(error); // Forward error to the next middleware
    }
};

// Update the offer percentage for a main category and its subcategories
exports.patchMainCategoryOffer = async (req, res, next) => {
    try {
        let offer = req.body.offer;
        let Id = req.body.Id;

        await MainCategory.updateOne({ _id: Id }, { $set: { offerPercentage: offer } });
        let subcategories = await SubCategory.find({ mainCategory: Id });
        await SubCategory.updateMany({ mainCategory: Id }, { $set: { offerPercentage: 0 } });

        for (const category of subcategories) {
            let products = await Product.find({ subCategory: category._id });
            for (const product of products) {
                await Product.updateOne(
                    { _id: product._id },
                    {
                        $set: {
                            discountPrice: parseFloat((product.price - (product.price * offer / 100)).toFixed(0))
                        }
                    }
                );
            }
        }
        res.send("ok");
    } catch (error) {
        console.error('Error updating main category offer:', error);
        next(error); // Forward error to the next middleware
    }
};

// Search for main categories based on a query
exports.getAdminCategorySearch = async (req, res, next) => {
    try {
        let mainCategories = await MainCategory.find({ mainCategoryName: { $regex: `${req.query.value}`, $options: 'i' } });
        let subcategoriesCount = await SubCategory.aggregate([{ $group: { _id: "$mainCategory", count: { $sum: 1 } } }]).exec();
        res.render('adminCategory/table', { mainCategories, subcategoriesCount });
    } catch (error) {
        console.error('Error searching admin categories:', error);
        next(error); // Forward error to the next middleware
    }
};

// Create a new main category
exports.postAdminCategoryCreate = async (req, res, next) => {
    try {
        let name = req.body.name
        name = name.toLowerCase();
        const exist = await MainCategory.findOne({ mainCategoryName: name });
        if (exist) {
            return res.send("exists");
        }

        const { croppedImage } = req.body;
      

        if (!croppedImage) {
            return res.status(400).json({ error: 'No image provided in the request body' });
        }

        const result = await cloudinary.uploader.upload(croppedImage, {
            folder: 'adminCategory'
        });
        await MainCategory.create({ mainCategoryName: name, image: result.secure_url });
        return res.send('done');
    } catch (error) {
        console.error('Error creating admin category:', error);
        next(error); // Forward error to the next middleware
    }
};

// Edit an existing main category
exports.postAdminCategoryEdit = async (req, res, next) => {
    try {
        let { croppedImage, name, id } = req.body;
        name = name.toLowerCase();

        const exist = await MainCategory.findOne({ mainCategoryName: name, _id: { $ne: id } });
        if (exist) {
            return res.send("exists");
        }

        if (!id || !name) {
            return res.status(400).json({ error: 'ID and Name are required fields.' });
        }

        if (!croppedImage) {
            await MainCategory.updateOne({ _id: id }, { mainCategoryName: name });
            return res.send("done");
        }

        const result = await cloudinary.uploader.upload(croppedImage, {
            folder: 'adminCategory'
        });

        await MainCategory.updateOne(
            { _id: id },
            { mainCategoryName: name, image: result.secure_url }
        );

        res.send('done');
    } catch (error) {
        console.error('Error editing admin category:', error);
        next(error); // Forward error to the next middleware
    }
};

// Inactivate a main category and its subcategories
exports.patchInactivate = async (req, res, next) => {
    try {
        const id = req.body.id;
        await MainCategory.updateOne({ _id: id }, { status: "inactive" });
        await SubCategory.updateMany({ mainCategory: id }, { status: "inactive" });
        let subcategories = await SubCategory.find({ mainCategory: id });
        for (const category of subcategories) {
            await Product.updateMany({ subCategory: category._id }, { $set: { "status": "inactive" } });
        }
        res.send("ok");
    } catch (error) {
        console.error('Error inactivating category:', error);
        next(error); // Forward error to the next middleware
    }
};

// Activate a main category and its subcategories
exports.patchActivate = async (req, res, next) => {
    try {
        const id = req.body.id;
        await MainCategory.updateOne({ _id: id }, { status: "active" });
        await SubCategory.updateMany({ mainCategory: id }, { status: "active" });
        let subcategories = await SubCategory.find({ mainCategory: id });
        for (const category of subcategories) {
            await Product.updateMany({ subCategory: category._id }, { $set: { "status": "active" } });
        }
        res.send("ok");
    } catch (error) {
        console.error('Error activating category:', error);
        next(error); // Forward error to the next middleware
    }
};

// Delete a main category and its subcategories
exports.deleteCategory = async (req, res, next) => {
    try {
        const id = req.body.id;
        await MainCategory.deleteOne({ _id: id });
        await SubCategory.deleteMany({ mainCategory: id });
        let subcategories = await SubCategory.find({ mainCategory: id });
        for (const category of subcategories) {
            await Product.deleteMany({ subCategory: category._id });
        }
        res.send("ok");
    } catch (error) {
        console.error('Error deleting category:', error);
        next(error); // Forward error to the next middleware
    }
};