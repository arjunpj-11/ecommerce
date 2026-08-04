require("dotenv").config();

const crypto = require("crypto");
const mongoose = require("mongoose");
const cloudinary = require("./config/cloudinary");

const MainCategory = require("./models/mainCategory");
const SubCategory = require("./models/subCategory");
const Product = require("./models/product");
const Variant = require("./models/variant");
const Banner = require("./models/banner");
const Coupon = require("./models/coupon");
const User = require("./models/user");
const Order = require("./models/order");
const Cart = require("./models/cart");
const Wishlist = require("./models/wishlist");
const Wallet = require("./models/wallet");
const Address = require("./models/address");
const RefundRequest = require("./models/refund");

const mongoUri = process.env.MONGO_URI || process.env.MongoDB_url;

const pexels = (photoId, width = 1800) =>
  `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;

const variant = (color, photoId, sizes, tags) => ({
  color,
  imageSource: pexels(photoId),
  sizes,
  tags,
});

const categories = [
  {
    name: "Men",
    photoId: "16680474",
    offerPercentage: 15,
  },
  {
    name: "Women",
    photoId: "15130137",
    offerPercentage: 20,
  },
  {
    name: "Kids",
    photoId: "1620760",
    offerPercentage: 12,
  },
  {
    name: "Footwear",
    photoId: "6050912",
    offerPercentage: 18,
  },
];

const subcategories = [
  ["T-Shirts", "Men", "16680474", 15],
  ["Shirts", "Men", "5082975", 12],
  ["Jeans", "Men", "8442859", 14],
  ["Jackets", "Men", "17783372", 18],
  ["Dresses", "Women", "13690142", 20],
  ["Tops", "Women", "1036620", 15],
  ["Sarees", "Women", "35586011", 22],
  ["Sets", "Kids", "1620760", 12],
  ["Sneakers", "Footwear", "6050912", 18],
  ["Boots", "Footwear", "35654955", 16],
].map(([name, mainCategory, photoId, offerPercentage]) => ({
  name,
  mainCategory,
  photoId,
  offerPercentage,
}));

const products = [
  {
    name: "Core Supima Cotton Tee",
    description:
      "A clean everyday crew neck cut from soft, breathable Supima cotton with a smooth premium finish and shape-retaining neckline.",
    price: 1499,
    discountPrice: 1199,
    subcategory: "T-Shirts",
    review: 5,
    variants: [
      variant("White", "1040945", { S: 28, M: 40, L: 34, XL: 22 }, [
        "supima",
        "cotton",
        "white",
        "essential",
      ]),
      variant("Black", "16680474", { S: 24, M: 38, L: 32, XL: 20 }, [
        "supima",
        "cotton",
        "black",
        "essential",
      ]),
    ],
  },
  {
    name: "Studio Heavyweight Tee",
    description:
      "A structured 280 GSM cotton tee with dropped shoulders, a relaxed silhouette, and a substantial hand feel for modern streetwear styling.",
    price: 1899,
    discountPrice: 1499,
    subcategory: "T-Shirts",
    review: 5,
    variants: [
      variant("Charcoal", "16701781", { S: 18, M: 30, L: 28, XL: 16 }, [
        "heavyweight",
        "charcoal",
        "streetwear",
      ]),
      variant("Green", "15888763", { S: 16, M: 27, L: 24, XL: 14 }, [
        "heavyweight",
        "green",
        "streetwear",
      ]),
    ],
  },
  {
    name: "Tailored Oxford Shirt",
    description:
      "A refined Oxford shirt with a crisp button-down collar, reinforced placket, and an easy tailored fit that moves from work to weekend.",
    price: 2499,
    discountPrice: 1999,
    subcategory: "Shirts",
    review: 4,
    variants: [
      variant("White", "5082975", { S: 16, M: 28, L: 25, XL: 14 }, [
        "oxford",
        "white",
        "formal",
      ]),
      variant("SkyBlue", "18730822", { S: 14, M: 25, L: 22, XL: 12 }, [
        "oxford",
        "blue",
        "formal",
      ]),
    ],
  },
  {
    name: "Stratos Tapered Denim",
    description:
      "Premium stretch denim with a comfortable mid rise, clean tapered leg, durable hardware, and carefully finished wash details.",
    price: 3499,
    discountPrice: 2799,
    subcategory: "Jeans",
    review: 5,
    variants: [
      variant("Indigo", "8442859", { 30: 18, 32: 32, 34: 27, 36: 14 }, [
        "denim",
        "indigo",
        "tapered",
      ]),
      variant("LightBlue", "6634687", { 30: 15, 32: 28, 34: 24, 36: 12 }, [
        "denim",
        "light wash",
        "tapered",
      ]),
    ],
  },
  {
    name: "Verona Leather Moto Jacket",
    description:
      "A sharply cut moto jacket in supple leather with asymmetric hardware, reinforced shoulders, and a smooth quilted lining.",
    price: 9999,
    discountPrice: 7999,
    subcategory: "Jackets",
    review: 5,
    variants: [
      variant("Black", "17783372", { S: 9, M: 18, L: 20, XL: 11 }, [
        "leather",
        "black",
        "moto",
      ]),
      variant("Brown", "10274665", { S: 8, M: 15, L: 17, XL: 10 }, [
        "leather",
        "brown",
        "moto",
      ]),
    ],
  },
  {
    name: "Siren Satin Wrap Dress",
    description:
      "An elegant wrap midi with a softly draped neckline, adjustable waist tie, fluid satin finish, and a graceful side slit.",
    price: 4999,
    discountPrice: 3899,
    subcategory: "Dresses",
    review: 5,
    variants: [
      variant("Red", "13690142", { XS: 10, S: 22, M: 27, L: 18 }, [
        "dress",
        "red",
        "satin",
        "occasion",
      ]),
      variant("Black", "15130137", { XS: 12, S: 25, M: 30, L: 20 }, [
        "dress",
        "black",
        "satin",
        "occasion",
      ]),
    ],
  },
  {
    name: "Venice Linen Corset Top",
    description:
      "A breathable linen-blend top with flexible internal structure, a softly shaped neckline, and a clean fitted silhouette.",
    price: 2199,
    discountPrice: 1699,
    subcategory: "Tops",
    review: 4,
    variants: [
      variant("Ivory", "994523", { XS: 14, S: 24, M: 27, L: 15 }, [
        "linen",
        "ivory",
        "corset",
      ]),
      variant("Pink", "1036620", { XS: 12, S: 22, M: 24, L: 13 }, [
        "linen",
        "pink",
        "corset",
      ]),
    ],
  },
  {
    name: "Heritage Kanjivaram Silk Saree",
    description:
      "A rich silk saree woven with traditional temple-inspired motifs, contrast borders, and luminous zari work, supplied with a blouse piece.",
    price: 12999,
    discountPrice: 9999,
    subcategory: "Sarees",
    review: 5,
    variants: [
      variant("Green", "35586011", { FreeSize: 24 }, [
        "silk",
        "saree",
        "green",
        "zari",
      ]),
      variant("Teal", "34324429", { FreeSize: 21 }, [
        "silk",
        "saree",
        "teal",
        "zari",
      ]),
    ],
  },
  {
    name: "Explorer Organic Kids Set",
    description:
      "A soft organic-cotton sweatshirt and jogger set with an easy stretch waist, gentle seams, and room for active everyday movement.",
    price: 1799,
    discountPrice: 1399,
    subcategory: "Sets",
    review: 5,
    variants: [
      variant(
        "Yellow",
        "1620760",
        { "2-3Y": 18, "3-4Y": 23, "4-5Y": 19, "5-6Y": 14 },
        ["kids", "organic", "yellow", "set"],
      ),
      variant(
        "Green",
        "31913975",
        { "2-3Y": 16, "3-4Y": 21, "4-5Y": 17, "5-6Y": 12 },
        ["kids", "organic", "green", "set"],
      ),
    ],
  },
  {
    name: "Quantum Leather Court Sneakers",
    description:
      "Minimal court sneakers with a smooth leather upper, padded collar, cushioned footbed, and a durable low-profile cupsole.",
    price: 5999,
    discountPrice: 4499,
    subcategory: "Sneakers",
    review: 5,
    variants: [
      variant("White", "6050912", { 39: 10, 40: 19, 41: 27, 42: 24, 43: 14 }, [
        "sneakers",
        "white",
        "leather",
      ]),
      variant("Black", "7857502", { 39: 8, 40: 17, 41: 24, 42: 21, 43: 12 }, [
        "sneakers",
        "black",
        "leather",
      ]),
    ],
  },
  {
    name: "Velocity Knit Trainers",
    description:
      "Lightweight knit trainers with a sock-like collar, responsive foam cushioning, and a sculpted rubber tread for everyday movement.",
    price: 4999,
    discountPrice: 3699,
    subcategory: "Sneakers",
    review: 4,
    variants: [
      variant("Black", "11962269", { 40: 14, 41: 23, 42: 20, 43: 11 }, [
        "trainers",
        "knit",
        "black",
      ]),
      variant("Blue", "6540985", { 40: 11, 41: 20, 42: 17, 43: 9 }, [
        "trainers",
        "knit",
        "blue",
      ]),
    ],
  },
  {
    name: "Alden Suede Chelsea Boots",
    description:
      "Streamlined Chelsea boots with a soft suede upper, elastic side panels, pull tab, cushioned lining, and a dependable rubber sole.",
    price: 6999,
    discountPrice: 5299,
    subcategory: "Boots",
    review: 5,
    variants: [
      variant("Brown", "9241608", { 40: 10, 41: 17, 42: 18, 43: 12, 44: 8 }, [
        "boots",
        "suede",
        "brown",
        "chelsea",
      ]),
      variant("Black", "35654955", { 40: 9, 41: 15, 42: 17, 43: 11, 44: 7 }, [
        "boots",
        "black",
        "chelsea",
      ]),
    ],
  },
];

const banners = [
  {
    title: "THE ESSENTIALS EDIT",
    heading: "Quiet Luxury, Made Easy",
    subtext:
      "Premium everyday layers, clean tailoring, and dependable wardrobe foundations.",
    buttonText: "Shop Men",
    category: "Men",
    photoId: "17783372",
  },
  {
    title: "THE OCCASION COLLECTION",
    heading: "Modern Elegance in Motion",
    subtext:
      "Satin, silk, and linen silhouettes selected for effortless statement dressing.",
    buttonText: "Shop Women",
    category: "Women",
    photoId: "13690142",
  },
  {
    title: "FOOTWEAR, REFINED",
    heading: "Built for Every Step",
    subtext:
      "Versatile sneakers and boots with considered materials and all-day comfort.",
    buttonText: "Shop Footwear",
    category: "Footwear",
    photoId: "6050912",
  },
];

const coupons = [
  ["Welcome Reward", "WELCOME150", 150, 999, 365],
  ["Style Upgrade", "STYLE300", 300, 2499, 240],
  ["Luxury Edit", "LUXE500", 500, 4999, 180],
].map(([couponName, couponCode, discount, minAmount, validDays]) => ({
  couponName,
  couponCode,
  discount,
  minAmount,
  validity: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000),
  status: "Active",
}));

const users = [
  {
    userId: "qa_admin_2026",
    username: "ARNI QA Admin",
    email: "qa.admin@arni.test",
    phone: "9000000002",
    password: "ArniAdminQA@2026",
    role: "Admin",
    gender: "Other",
    profileImage: "/images/avatars/avatar-8.svg",
  },
  {
    userId: "qa_customer_2026",
    username: "ARNI QA Customer",
    email: "qa.customer@arni.test",
    phone: "9000000001",
    password: "ArniQA@2026",
    role: "User",
    gender: "Other",
    profileImage: "/images/avatars/avatar-1.svg",
  },
];

function imageSources() {
  return [
    ...categories.map((item) => pexels(item.photoId)),
    ...subcategories.map((item) => pexels(item.photoId)),
    ...products.flatMap((product) =>
      product.variants.map((item) => item.imageSource),
    ),
    ...banners.map((item) => pexels(item.photoId)),
  ];
}

function assetKey(source) {
  return crypto.createHash("sha256").update(source).digest("hex").slice(0, 18);
}

async function uploadCatalogAssets() {
  const sources = [...new Set(imageSources())];
  const assets = new Map();
  const batchSize = 4;

  console.log(`Preparing ${sources.length} curated CDN assets...`);

  for (let index = 0; index < sources.length; index += batchSize) {
    const batch = sources.slice(index, index + batchSize);
    const uploaded = await Promise.all(
      batch.map(async (source) => {
        const result = await cloudinary.uploader.upload(source, {
          public_id: assetKey(source),
          folder: "arni-seed",
          overwrite: true,
          invalidate: true,
          resource_type: "image",
        });

        if (!result.secure_url || !result.width || !result.height) {
          throw new Error(`CDN rejected catalog image: ${source}`);
        }

        return [source, result.public_id];
      }),
    );

    uploaded.forEach(([source, publicId]) => assets.set(source, publicId));
    console.log(
      `CDN assets ready: ${Math.min(index + batch.length, sources.length)}/${sources.length}`,
    );
  }

  return assets;
}

function deliveryUrl(publicId, width, height, crop = "fill") {
  return cloudinary.url(publicId, {
    secure: true,
    fetch_format: "auto",
    quality: "auto:good",
    transformation: [
      {
        width,
        height,
        crop,
        gravity: "auto",
      },
    ],
  });
}

function productImages(publicId) {
  return [
    deliveryUrl(publicId, 900, 1100),
    deliveryUrl(publicId, 900, 900),
    deliveryUrl(publicId, 720, 900),
  ];
}

async function seedDatabase(assets) {
  console.log(
    "All CDN assets validated. Resetting the application database...",
  );
  await mongoose.connection.db.dropDatabase();

  const mainCategoryIds = new Map();
  for (const item of categories) {
    const source = pexels(item.photoId);
    const category = await MainCategory.create({
      mainCategoryName: item.name,
      image: deliveryUrl(assets.get(source), 900, 1100),
      offerPercentage: item.offerPercentage,
      status: "active",
    });
    mainCategoryIds.set(item.name, category._id);
  }

  const subcategoryIds = new Map();
  for (const item of subcategories) {
    const source = pexels(item.photoId);
    const subcategory = await SubCategory.create({
      subCategoryName: item.name,
      mainCategory: mainCategoryIds.get(item.mainCategory),
      image: deliveryUrl(assets.get(source), 900, 1100),
      offerPercentage: item.offerPercentage,
      status: "active",
    });
    subcategoryIds.set(item.name, subcategory._id);
  }

  let variantCount = 0;
  for (const item of products) {
    const firstSource = item.variants[0].imageSource;
    const product = await Product.create({
      name: item.name,
      description: item.description,
      price: item.price,
      discountPrice: item.discountPrice,
      subCategory: subcategoryIds.get(item.subcategory),
      image: productImages(assets.get(firstSource))[0],
      review: item.review,
      status: "active",
    });

    for (const option of item.variants) {
      await Variant.create({
        productId: product._id,
        color: option.color,
        images: productImages(assets.get(option.imageSource)),
        sizes: option.sizes,
        tags: option.tags,
      });
      variantCount += 1;
    }
  }

  for (const [index, item] of banners.entries()) {
    const source = pexels(item.photoId);
    await Banner.create({
      title: item.title,
      heading: item.heading,
      subtext: item.subtext,
      buttonText: item.buttonText,
      imageUrl: deliveryUrl(assets.get(source), 1800, 900),
      categoryType: "MainCategory",
      categoryId: mainCategoryIds.get(item.category),
      order: index + 1,
      isActive: true,
    });
  }

  await Coupon.insertMany(coupons);

  const createdUsers = {};
  for (const userData of users) {
    const user = await User.create({ ...userData, status: "Active" });
    createdUsers[userData.role] = user;
  }

  const customer = createdUsers.User;
  await Promise.all([
    Cart.create({ user: customer._id, items: [], couponApplied: null }),
    Wishlist.create({ user: customer._id, items: [] }),
    Wallet.create({
      user: customer._id,
      balance: 5000,
      transactions: [
        {
          type: "credited",
          amount: 5000,
          reason: "QA opening balance",
        },
      ],
    }),
    Address.create({
      userId: customer._id,
      name: customer.username,
      phone: customer.phone,
      street: "QA House, Marine Drive",
      city: "Kochi",
      state: "Kerala",
      postalCode: "682001",
      country: "India",
      isPrimary: true,
    }),
  ]);

  const models = [
    MainCategory,
    SubCategory,
    Product,
    Variant,
    Banner,
    Coupon,
    User,
    Order,
    Cart,
    Wishlist,
    Wallet,
    Address,
    RefundRequest,
  ];
  await Promise.all(models.map((model) => model.syncIndexes()));

  console.table([
    { collection: "Main categories", count: categories.length },
    { collection: "Subcategories", count: subcategories.length },
    { collection: "Products", count: products.length },
    { collection: "Color variants", count: variantCount },
    { collection: "Banners", count: banners.length },
    { collection: "Coupons", count: coupons.length },
    { collection: "Users", count: users.length },
  ]);
}

async function main() {
  if (!process.argv.includes("--fresh")) {
    throw new Error(
      "Refusing to erase data without the explicit --fresh flag.",
    );
  }
  if (!mongoUri) {
    throw new Error("MONGO_URI or MongoDB_url must be configured.");
  }
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error("Cloudinary credentials must be configured.");
  }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 30000 });
  const assets = await uploadCatalogAssets();
  await seedDatabase(assets);
  console.log("Fresh ARNI catalog seeded successfully.");
}

main()
  .catch((error) => {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
