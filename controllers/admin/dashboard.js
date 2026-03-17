// controllers/admin/dashboard.js
const Product = require('../../models/product');
const Order = require('../../models/order');
const User = require('../../models/user');
const MainCategory = require('../../models/mainCategory');
const SubCategory = require('../../models/subCategory');

// Render the admin dashboard with statistics and data
exports.getDashboard = async (req, res) => {
    try {
        const [stats, mostSoldItems, topCategories, count] = await Promise.all([
            getDashboardStats(),
            getMostSoldItems(),
            getTopCategories(),
            User.estimatedDocumentCount()
        ]);
        
        res.render('../views/pages/admin/dashboard', {
            title: 'Dashboard',
            admin: req.session.admin || { name: 'Admin' },
            ...stats,
            mostSoldItems,
            topCategories,
            count
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).render('error', { 
            message: 'Error loading dashboard',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// Fetch dashboard statistics
async function getDashboardStats() {
    try {
        const [totalSalesAgg, totalProducts, totalCustomers, totalOrders] = await Promise.all([
            Order.aggregate([
                { $match: { status: 'Delivered' } },
                { $group: { _id: null, total: { $sum: { $multiply: ['$price', '$quantity'] } } } }
            ]),
            Product.countDocuments({ status: 'active' }),
            User.countDocuments({ status: 'active' }),
            Order.countDocuments()
        ]);

        return {
            totalSales: totalSalesAgg[0]?.total || 0,
            totalProducts,
            totalCustomers,
            totalOrders
        };
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        return {
            totalSales: 0,
            totalProducts: 0,
            totalCustomers: 0,
            totalOrders: 0
        };
    }
}

// Get the top categories based on sales
async function getTopCategories() {
    try {
        const categories = await MainCategory.aggregate([
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'mainCategory',
                    as: 'orders'
                }
            },
            {
                $lookup: {
                    from: 'subcategories',
                    localField: '_id',
                    foreignField: 'mainCategory',
                    as: 'subcategories'
                }
            },
            {
                $project: {
                    name: '$mainCategoryName',
                    totalSales: { $sum: '$orders.price' },
                    subcategories: {
                        $map: {
                            input: '$subcategories',
                            as: 'sub',
                            in: {
                                name: '$$sub.subCategoryName',
                                sales: {
                                    $sum: {
                                        $filter: {
                                            input: '$orders',
                                            as: 'order',
                                            cond: { $eq: ['$$order.subCategory', '$$sub._id'] }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 3 }
        ]);

        const maxSales = Math.max(...categories.map(cat => cat.totalSales));
        return categories.map(cat => ({
            ...cat,
            percentage: Math.round((cat.totalSales / maxSales) * 100),
            subcategories: cat.subcategories.map(sub => ({
                ...sub,
                percentage: Math.round((sub.sales / cat.totalSales) * 100)
            }))
        }));
    } catch (error) {
        console.error('Error getting top categories:', error);
        return [];
    }
}

// Get the most sold items
async function getMostSoldItems() {
    try {
        const mostSold = await Order.aggregate([
            { $match: { status: 'Delivered' } },
            {
                $lookup: {
                    from: 'variants',
                    localField: 'variant',
                    foreignField: '_id',
                    as: 'variantDetails'
                }
            },
            { $unwind: '$variantDetails' },
            {
                $group: {
                    _id: '$productId',
                    count: { $sum: '$quantity' },
                    productName: { $first: '$name' },
                    productImage: { $first: { $arrayElemAt: ['$variantDetails.images', 0] } }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 4 }
        ]);

        if (!mostSold.length) {
            return [{
                name: 'No products sold yet',
                percentage: 0,
                image: '/default-image.png'
            }];
        }

        const totalQuantity = mostSold.reduce((acc, item) => acc + item.count, 0);
        return mostSold.map(item => ({
            name: item.productName || 'Product Not Found',
            percentage: Math.round((item.count / totalQuantity) * 100),
            count: item.count,
            image: item.productImage || '/default-image.png'
        }));
    } catch (error) {
        console.error('Error getting most sold items:', error);
        return [{
            name: 'Error loading products',
            percentage: 0,
            image: '/default-image.png'
        }];
    }
}

// Get sales chart data based on timeframe
async function getSalesChartData(timeframe = 'month') {
    try {
        const groupBy = {
            day: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } }
            },
            month: {
                year: { $year: '$orderDate' },
                month: { $month: '$orderDate' }
            },
            year: {
                year: { $year: '$orderDate' }
            }
        };

        const data = await Order.aggregate([
            { $match: { status: 'Delivered' } },
            {
                $group: {
                    _id: groupBy[timeframe],
                    total: { $sum: '$price' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        return data.map(item => ({
            label: timeframe === 'day' ? item._id.date :
                   timeframe === 'month' ? `${item._id.year}-${item._id.month}` :
                   item._id.year.toString(),
            value: item.total
        }));
    } catch (error) {
        console.error('Error getting sales chart data:', error);
        return [];
    }
}

// API endpoint to get dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const stats = await getDashboardStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Error fetching dashboard stats' });
    }
};

// API endpoint to get sales chart data
exports.getSalesChartData = async (req, res) => {
    try {
        const timeframe = req.query.timeframe || 'month';
        const data = await getSalesChartData(timeframe);
        res.json(data);
    } catch (error) {
        console.error('Error fetching sales chart data:', error);
        res.status(500).json({ error: 'Error fetching sales chart data' });
    }
};

// API endpoint to get top categories based on sales
exports.getTopCategories = async (req, res) => {
    try {
        const categories = await Order.aggregate([
            { 
                $match: { 
                    status: 'Delivered',
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productId',
                    foreignField: 'productId',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $lookup: {
                    from: 'subcategories',
                    localField: 'product.subCategory',
                    foreignField: '_id',
                    as: 'subCategory'
                }
            },
            { $unwind: '$subCategory' },
            {
                $lookup: {
                    from: 'maincategories',
                    localField: 'subCategory.mainCategory',
                    foreignField: '_id',
                    as: 'mainCategory'
                }
            },
            { $unwind: '$mainCategory' },
            {
                $addFields: {
                    salesAmount: { $multiply: ['$price', '$quantity'] }
                }
            },
            {
                $group: {
                    _id: {
                        mainCategoryId: '$mainCategory._id',
                        mainCategoryName: '$mainCategory.mainCategoryName',
                        subCategoryId: '$subCategory._id',
                        subCategoryName: '$subCategory.subCategoryName'
                    },
                    subCategorySales: { $sum: '$salesAmount' }
                }
            },
            {
                $group: {
                    _id: {
                        mainCategoryId: '$_id.mainCategoryId',
                        mainCategoryName: '$_id.mainCategoryName'
                    },
                    totalSales: { $sum: '$subCategorySales' },
                    subcategories: {
                        $push: {
                            name: '$_id.subCategoryName',
                            sales: '$subCategorySales'
                        }
                    }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 3 },
            {
                $project: {
                    _id: 0,
                    name: '$_id.mainCategoryName',
                    totalSales: 1,
                    subcategories: {
                        $map: {
                            input: '$subcategories',
                            as: 'sub',
                            in: {
                                name: '$$sub.name',
                                sales: '$$sub.sales',
                                percentage: {
                                    $multiply: [
                                        { $divide: ['$$sub.sales', '$totalSales'] },
                                        100
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        ]);

        const totalSales = categories.reduce((sum, cat) => sum + cat.totalSales, 0);
        const categoriesWithPercentages = categories.map(category => ({
            ...category,
            percentage: ((category.totalSales / totalSales) * 100).toFixed(1),
            subcategories: category.subcategories.map(sub => ({
                ...sub,
                percentage: sub.percentage.toFixed(1)
            }))
        }));

        res.json(categoriesWithPercentages);
    } catch (error) {
        console.error('Error getting top categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Logout the admin user
exports.logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) throw err;
            res.json({ success: true, redirect: '/auth/login' });
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, message: 'Logout failed' });
    }
};