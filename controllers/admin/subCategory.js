// controllers/subcategoryController.js
const mongoose = require('mongoose');
const cloudinary = require('../../config/cloudinary');
const mainCategory = require('../../models/mainCategory');
const subCategory = require('../../models/subCategory');
const productDB = require('../../models/product');

exports.getHomePage = async (req, res, next) => {
    req.session.mainCategoryId = req.query.id;
    console.log("id:", req.query.id);
    try {
        let mainCategories = await mainCategory.find({});
        res.render('../views/pages/admin/subCategory', { mainCategories });
    } catch (error) {
        console.error("Error fetching home page:", error);
        next(error); // Forward error to the next middleware
    }
};

exports.getTableData = async (req, res, next) => {
    try {
        let status = await mainCategory.findOne({ _id: req.session.mainCategoryId });
        req.session.mainCategoryStatus = status.status;
        let subCategories = await subCategory.find({ mainCategory: req.session.mainCategoryId });
        let mainCategories = await mainCategory.find({}, '_id mainCategoryName');
        let products = await productDB.aggregate([
            { $group: { _id: "$subCategory", count: { $sum: 1 } } }
        ]).exec();
        res.render('../views/partials/admin/subCategoryTable', { mainCategories, subCategories, products });
    } catch (error) {
        console.error("Error fetching table data:", error);
        next(error); // Forward error to the next middleware
    }
};

exports.updateOffer = async (req, res, next) => {
    let offer = req.body.offer;
    let Id = req.body.Id;
    console.log(offer);
    try {
        await subCategory.updateOne({ _id: Id }, { $set: { offerPercentage: offer } });
        let products = await productDB.find({ subCategory: Id });
        await Promise.all(products.map(async (product) => {
            await productDB.updateOne(
                { _id: product._id },
                {
                    $set: {
                        discountPrice: parseFloat((product.discountPrice - (product.discountPrice * offer / 100)).toFixed(0))
                    }
                }
            );
        }));
        res.send("ok");
    } catch (error) {
        console.error('Error updating offer:', error);
        next(error); // Forward error to the next middleware
    }
};

exports.searchSubCategories = async (req, res, next) => {
    try {
        let subCategories = await subCategory.find({
            mainCategory: req.session.mainCategoryId,
            subCategoryName: { $regex: `${req.query.value}`, $options: 'i' }
        });
        let mainCategories = await mainCategory.find({}, '_id mainCategoryName');
        let products = await productDB.aggregate([
            { $group: { _id: "$subCategory", count: { $sum: 1 } } }
        ]).exec();
        console.log(subCategories, mainCategories, products);
        res.render('adminSubcategory/table', { mainCategories, subCategories, products });
    } catch (error) {
        console.error('Error searching subcategories:', error);
        next(error); // Forward error to the next middleware
    }
};

exports.createSubCategory = async (req, res, next) => {
    try {
        let name = req.body.name.toLowerCase();
        const exist = await subCategory.findOne({ subCategoryName: name, mainCategory: req.session.mainCategoryId });
        console.log(exist);
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
        await subCategory.create({ subCategoryName: name, image: result.secure_url, mainCategory: req.session.mainCategoryId, status: req.session.mainCategoryStatus });
        return res.send("done");
    } catch (error) {
        console.error('Error creating subcategory:', error);
        next(error); // Forward error to the next middleware
    }
};

exports.editSubCategory = async (req, res, next) => {
    try {
        console.log(req.body);
        let { croppedImage, name, id } = req.body;
        name = name.toLowerCase();
        const exist = await subCategory.findOne({ subCategoryName: name, _id: { $ne: id }  });
        console.log(exist);
        if (exist) {
            return res.send("exists");
        }
        if (!id || !name) {
            return res.status(400).json({ error: 'ID and Name are required fields.' });
        }
        if (!croppedImage) {
            console.log('No image provided, updating name only');
            await subCategory.updateOne({ _id: id }, { subCategoryName: name });
            return res.send("done");
        }
        const result = await cloudinary.uploader.upload(croppedImage, {
            folder: 'adminCategory'
        });
        await subCategory.updateOne(
            { _id: id },
            { subCategoryName: name, image: result.secure_url }
        );
        res.send('done');
    } catch (error) {
        console.error('Error editing subcategory:', error);
        next(error); // Forward error to the next middleware
    }
};

exports.inactivateSubCategory = async (req, res, next) => {
    try {
        const id = req.body.id;
        await subCategory.updateOne({ _id: id }, { status: "inactive" });
        await productDB.updateOne({ subCategory: id }, { status: "inactive" });
        res.send("ok");
    } catch (error) {
        console.error('Error inactivating subcategory:', error);
        next(error); // Forward error to the next middleware
    }
};

exports.activateSubCategory = async (req, res, next) => {
    console.log(req.session.mainCategoryStatus);
    if (req.session.mainCategoryStatus === "inactive") {
        console.log("main");
        return res.send("main");
    }
    try {
        const id = req.body.id;
        await subCategory.updateOne({ _id: id }, { status: "active" });
        await productDB.updateOne({ subCategory: id }, { status: "active" });
        res.send("done");
    } catch (error) {
        console.error('Error activating subcategory:', error);
        next(error); // Forward error to the next middleware
    }
};

exports.deleteSubCategory = async (req, res, next) => {
    try {
        const id = req.body.id;
        await subCategory.deleteOne({ _id: id });
        res.send("ok");
    } catch (error) {
        console.error('Error deleting subcategory:', error);
        next(error); // Forward error to the next middleware
    }
};