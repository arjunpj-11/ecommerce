const Order = require('../../models/order');
const Product = require('../../models/product');
const Variant = require('../../models/variant');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

const salesController = {
    // Render the sales report page
    renderSalesReport: async (req, res) => {
        try {
            // Get default date range (current month)
            const today = new Date();
            const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            const endDate = today;

            // Get initial sales data
            const salesData = await salesController.getProductSales({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });

            res.render('../views/pages/admin/sales', {
                title: 'Sales Report',
                path: '/sales-report',
                products: salesData.products,
                stats: salesData.stats,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
            });
        } catch (error) {
            console.error('Error rendering sales report:', error);
            res.status(500).render('error', { 
                message: 'Error loading sales report',
                error: error
            });
        }
    },

    // Get product sales data within a date range
    getProductSales: async ({ startDate, endDate }) => {
        try {
            const dateFilter = {
                orderDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(new Date(endDate).setUTCDate(new Date(endDate).getUTCDate() + 1))
                },
                status: 'Delivered'                
            };

            // Aggregate sales data
            const salesData = await Order.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: {
                            productId: "$productId",
                            variant: "$variant"
                        },
                        quantity: { $sum: "$quantity" },
                        totalAmount: { $sum: { $multiply: ["$price", "$quantity"] } }
                    }
                }
            ]);

            // Get unique product IDs
            const productIds = [...new Set(salesData.map(item => item._id.productId))];

            // Fetch product and variant details
            const products = await Product.find({ productId: { $in: productIds } });
            const variants = await Variant.find({ 
                _id: { $in: salesData.map(item => item._id.variant) }
            });

            // Transform data for frontend
            const transformedData = products.map(product => {
                const productSales = salesData.filter(
                    sale => sale._id.productId === product.productId
                );

                const productVariants = variants.filter(variant => 
                    productSales.some(sale => 
                        sale._id.variant.toString() === variant._id.toString()
                    )
                );

                return {
                    productId: product.productId,
                    name: product.name,
                    image: productVariants.length > 0 ? productVariants[0].images[0] : null,
                    totalQuantity: productSales.reduce((sum, sale) => sum + sale.quantity, 0),
                    totalAmount: productSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
                    variants: productVariants.map(variant => {
                        const variantSale = productSales.find(
                            sale => sale._id.variant.toString() === variant._id.toString()
                        );
                        return {
                            color: variant.color,
                            image: variant.images[0] || product.image,
                            quantitySold: variantSale ? variantSale.quantity : 0,
                            revenue: variantSale ? variantSale.totalAmount : 0
                        };
                    })
                };
            });

            // Calculate statistics
            const stats = {
                totalProducts: products.length,
                totalSales: transformedData.reduce((sum, product) => sum + product.totalAmount, 0),
                totalUnits: transformedData.reduce((sum, product) => sum + product.totalQuantity, 0)
            };

            return {
                products: transformedData,
                stats
            };
        } catch (error) {
            console.error('Error in getProductSales:', error);
            throw error;
        }
    },

    // Download the sales report in specified format
    downloadReport: async (req, res) => {
        try {
            const { startDate, endDate, format } = req.query;
            const salesData = await salesController.getProductSales({ startDate, endDate });

            if (format === 'csv') {
                await salesController.downloadCSV(res, salesData, startDate, endDate);
            } else if (format === 'pdf') {
                await salesController.downloadPDF(res, salesData, startDate, endDate);
            } else {
                throw new Error('Invalid format specified');
            }
        } catch (error) {
            console.error('Error downloading report:', error);
            res.status(500).json({ error: 'Failed to download report' });
        }
    },

    // Download sales data as CSV
    downloadCSV: async (res, salesData, startDate, endDate) => {
        const flattenedData = salesController.flattenSalesData(salesData, startDate, endDate);
        const parser = new Parser();
        const csv = parser.parse(flattenedData);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    },

    // Download sales data as PDF
    downloadPDF: async (res, salesData, startDate, endDate) => {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${new Date().toISOString().split('T')[0]}.pdf`);
        doc.pipe(res);

        // Add title
        doc.fontSize(20).text('Sales Report', { align: 'center' });
        doc.moveDown();
        
        // Add date range
        doc.fontSize(12).text(`Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`);
        doc.moveDown();

        // Add statistics
        doc.fontSize(14).text('Summary Statistics');
        doc.fontSize(12)
            .text(`Total Products: ${salesData.stats.totalProducts}`)
            .text(`Total Sales: ₹${salesData.stats.totalSales.toLocaleString()}`)
            .text(`Total Units Sold: ${salesData.stats.totalUnits}`);
        doc.moveDown();

        // Add products table
        doc.fontSize(14).text('Product Details');
        doc.moveDown();

        const tableTop = doc.y;
        const columns = {
            productId: { x: 50, width: 80 },
            name: { x: 130, width: 200 },
            quantity: { x: 330, width: 80 },
            amount: { x: 410, width: 100 }
        };

        // Add table headers
        Object.entries(columns).forEach(([key, col]) => {
            doc.text(key.charAt(0).toUpperCase() + key.slice(1), col.x, tableTop);
        });

        let y = tableTop + 20;
        salesData.products.forEach(product => {
            if (y > doc.page.height - 100) {
                doc.addPage();
                y = 50;
            }

            doc.text(product.productId, columns.productId.x, y)
               .text(product.name, columns.name.x, y)
               .text(product.totalQuantity.toString(), columns.quantity.x, y)
               .text(`₹${product.totalAmount.toLocaleString()}`, columns.amount.x, y);

            y += 20;

            // Add variant details
            product.variants.forEach(variant => {
                if (y > doc.page.height - 100) {
                    doc.addPage();
                    y = 50;
                }

                doc.text('', columns.productId.x, y)
                   .text(`  ${variant.color}`, columns.name.x, y)
                   .text(variant.quantitySold.toString(), columns.quantity.x, y)
                   .text(`₹${variant.revenue.toLocaleString()}`, columns.amount.x, y);

                y += 20;
            });
        });

        doc.end();
    },

    // Flatten sales data for CSV export
    flattenSalesData: (salesData, startDate, endDate) => {
        return salesData.products.reduce((acc, product) => {
            acc.push({
                'Product ID': product.productId,
                'Product Name': product.name,
                'Variant': 'All Variants',
                'Quantity Sold': product.totalQuantity,
                'Total Amount': product.totalAmount,
                'Report Period': `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
            });

            product.variants.forEach(variant => {
                acc.push({
                    'Product ID': product.productId,
                    'Product Name': product.name,
                    'Variant': variant.color,
                    'Quantity Sold': variant.quantitySold,
                    'Total Amount': variant.revenue,
                    'Report Period': `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                });
            });

            return acc;
        }, []);
    }
};

module.exports = salesController;