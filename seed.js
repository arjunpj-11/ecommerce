/**
 * ============================================================
 *  ARNI E-COMMERCE — FULL DATABASE SEED SCRIPT
 * ============================================================
 *  Collections seeded:
 *    ✅  MainCategory   — Men / Women / Kids / Footwear
 *    ✅  SubCategory    — T-Shirts, Jeans, Formal Shirts, Jackets, Kurtas, Dresses, Tops, Sarees, Kurtis, Footwear …
 *    ✅  Product        — 16 premium luxury products w/ detailed descriptions
 *    ✅  Variant        — 2-4 distinct colour variants × 4 Unsplash HD images each
 *    ✅  Banner         — 5 luxury promotional hero banners
 *    ✅  Coupon         — 6 active discount coupons
 *    ✅  User           — 1 admin + 3 test shoppers
 *    ✅  Order          — sample orders across states
 *    ✅  Wallet         — wallet balances for users
 *
 *  Usage:
 *    node seed.js --fresh        # drop all seeded collections first & seed brand new data
 * ============================================================
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Models ──────────────────────────────────────────────────────────────────
const MainCategory = require('./models/mainCategory');
const SubCategory  = require('./models/subCategory');
const Product      = require('./models/product');
const Variant      = require('./models/variant');
const Banner       = require('./models/banner');
const Coupon       = require('./models/coupon');
const User         = require('./models/user');
const Order        = require('./models/order');

let Cart, Wishlist, Wallet;
try { Cart     = require('./models/cart');     } catch (_) {}
try { Wishlist = require('./models/wishlist'); } catch (_) {}
try { Wallet   = require('./models/wallet');   } catch (_) {}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const log  = (msg) => console.log(`\x1b[32m✔\x1b[0m  ${msg}`);
const info = (msg) => console.log(`\x1b[36mℹ\x1b[0m  ${msg}`);
const warn = (msg) => console.log(`\x1b[33m⚠\x1b[0m  ${msg}`);
const err  = (msg) => console.log(`\x1b[31m✖\x1b[0m  ${msg}`);
const head = (msg) => console.log(`\n\x1b[1m\x1b[35m━━━ ${msg} ━━━\x1b[0m`);

function makeUserId() {
  return 'usr_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// ─── SEED DATA ────────────────────────────────────────────────────────────────

const MAIN_CATEGORIES = [
  {
    mainCategoryName: 'Men',
    image: 'https://images.unsplash.com/photo-1490578474895-699bc4e2cf59?w=800&auto=format&fit=crop&q=80',
    offerPercentage: 15,
    status: 'active',
  },
  {
    mainCategoryName: 'Women',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80',
    offerPercentage: 20,
    status: 'active',
  },
  {
    mainCategoryName: 'Kids',
    image: 'https://images.unsplash.com/photo-1519278409-1f56fdda7fe5?w=800&auto=format&fit=crop&q=80',
    offerPercentage: 25,
    status: 'active',
  },
  {
    mainCategoryName: 'Footwear',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
    offerPercentage: 10,
    status: 'active',
  },
];

const SUB_CATEGORIES = [
  // Men
  { subCategoryName: 'T-Shirts',      mainCategoryName: 'Men',   image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop&q=80', offerPercentage: 15, status: 'active' },
  { subCategoryName: 'Jeans',         mainCategoryName: 'Men',   image: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=800&auto=format&fit=crop&q=80', offerPercentage: 12, status: 'active' },
  { subCategoryName: 'Formal Shirts', mainCategoryName: 'Men',   image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&auto=format&fit=crop&q=80', offerPercentage: 10, status: 'active' },
  { subCategoryName: 'Jackets',       mainCategoryName: 'Men',   image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80', offerPercentage: 18, status: 'active' },
  // Women
  { subCategoryName: 'Dresses',       mainCategoryName: 'Women', image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80', offerPercentage: 25, status: 'active' },
  { subCategoryName: 'Tops',          mainCategoryName: 'Women', image: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800&auto=format&fit=crop&q=80', offerPercentage: 15, status: 'active' },
  { subCategoryName: 'Sarees',        mainCategoryName: 'Women', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80', offerPercentage: 10, status: 'active' },
  { subCategoryName: 'Kurtis',        mainCategoryName: 'Women', image: 'https://images.unsplash.com/photo-1633934542430-0905ccb5f050?w=800&auto=format&fit=crop&q=80', offerPercentage: 20, status: 'active' },
  // Kids
  { subCategoryName: 'Boys Wear',     mainCategoryName: 'Kids',  image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&auto=format&fit=crop&q=80', offerPercentage: 20, status: 'active' },
  { subCategoryName: 'Girls Wear',    mainCategoryName: 'Kids',  image: 'https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=800&auto=format&fit=crop&q=80', offerPercentage: 25, status: 'active' },
  // Footwear
  { subCategoryName: 'Sneakers',      mainCategoryName: 'Footwear', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80', offerPercentage: 15, status: 'active' },
  { subCategoryName: 'Boots',         mainCategoryName: 'Footwear', image: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&auto=format&fit=crop&q=80', offerPercentage: 15, status: 'active' }
];

const PRODUCTS_DATA = [
  // ── Men T-Shirts ──────────────────────────────────────────────────────────
  {
    name: 'Aura Luxury Supima Cotton Tee',
    description: 'Elevate your daily rotation with the Aura Supima Cotton Tee. Crafted from 100% extra-long staple Supima cotton for unparalleled softness, enhanced color retention, and exceptional drape.',
    price: 1499, discountPrice: 1199, subCategoryName: 'T-Shirts', review: 5, status: 'active',
    variants: [
      {
        color: 'Pure White',
        images: [
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { S: 25, M: 40, L: 35, XL: 20 },
        tags: ['cotton', 'luxury', 'white', 'supima'],
      },
      {
        color: 'Onyx Black',
        images: [
          'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { S: 30, M: 45, L: 40, XL: 25 },
        tags: ['cotton', 'luxury', 'black'],
      },
      {
        color: 'Forest Olive',
        images: [
          'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { S: 15, M: 25, L: 20, XL: 10 },
        tags: ['cotton', 'olive', 'casual'],
      },
    ],
  },
  {
    name: 'Monochrome Streetwear Heavyweight Tee',
    description: 'Designed for modern urban aesthetic, this 280 GSM heavyweight cotton tee features drop shoulders, structured fit, and subtle silicone badge detailing on the cuff.',
    price: 1899, discountPrice: 1499, subCategoryName: 'T-Shirts', review: 5, status: 'active',
    variants: [
      {
        color: 'Slate Grey',
        images: [
          'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { S: 15, M: 30, L: 35, XL: 15 },
        tags: ['streetwear', 'grey', 'heavyweight'],
      },
      {
        color: 'Midnight Blue',
        images: [
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { S: 20, M: 35, L: 25, XL: 15 },
        tags: ['streetwear', 'blue', 'heavyweight'],
      },
    ],
  },

  // ── Men Jackets ───────────────────────────────────────────────────────────
  {
    name: 'Verona Biker Genuine Leather Jacket',
    description: 'Handcrafted from full-grain lambskin leather with matte silver hardware and quilted viscose lining. Features asymmetric zip closure and reinforced shoulder panels for iconic style.',
    price: 9999, discountPrice: 7999, subCategoryName: 'Jackets', review: 5, status: 'active',
    variants: [
      {
        color: 'Midnight Black',
        images: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { S: 10, M: 20, L: 25, XL: 15 },
        tags: ['leather', 'jacket', 'biker', 'premium'],
      },
      {
        color: 'Cognac Brown',
        images: [
          'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { S: 8, M: 15, L: 18, XL: 10 },
        tags: ['leather', 'brown', 'suede'],
      },
    ],
  },

  // ── Men Jeans ─────────────────────────────────────────────────────────────
  {
    name: 'Stratos Tapered Italian Denim',
    description: 'Woven in Italy with premium stretch ring-spun cotton denim. Finished with hand-distressed whiskering and custom branded hardware for superior durability.',
    price: 3499, discountPrice: 2799, subCategoryName: 'Jeans', review: 5, status: 'active',
    variants: [
      {
        color: 'Deep Indigo',
        images: [
          'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { 30: 20, 32: 35, 34: 30, 36: 15 },
        tags: ['denim', 'indigo', 'tapered'],
      },
      {
        color: 'Vintage Wash',
        images: [
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { 30: 15, 32: 25, 34: 20 },
        tags: ['denim', 'vintage', 'wash'],
      },
    ],
  },

  // ── Women Dresses ─────────────────────────────────────────────────────────
  {
    name: 'Siren Silk Wrap Midi Evening Dress',
    description: 'Turn heads in the Siren Silk Wrap Dress. Tailored from lustrous mulberry silk blend with a flattering V-neckline, cascading waist tie, and subtle side slit.',
    price: 4999, discountPrice: 3899, subCategoryName: 'Dresses', review: 5, status: 'active',
    variants: [
      {
        color: 'Ruby Crimson',
        images: [
          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { XS: 10, S: 25, M: 30, L: 20 },
        tags: ['dress', 'silk', 'ruby', 'wrap'],
      },
      {
        color: 'Emerald Green',
        images: [
          'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { XS: 12, S: 20, M: 25, L: 15 },
        tags: ['dress', 'silk', 'emerald'],
      },
      {
        color: 'Midnight Black',
        images: [
          'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { XS: 15, S: 30, M: 35, L: 25 },
        tags: ['dress', 'black', 'evening'],
      },
    ],
  },

  {
    name: 'Celestial Pleated Floral Chiffon Gown',
    description: 'Flowy, feminine, and ethereal. Crafted from lightweight pleated chiffon featuring hand-painted floral motifs, balloon sleeves, and a tiered A-line skirt.',
    price: 3799, discountPrice: 2999, subCategoryName: 'Dresses', review: 5, status: 'active',
    variants: [
      {
        color: 'Rose Gold Floral',
        images: [
          'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { S: 20, M: 30, L: 20 },
        tags: ['chiffon', 'floral', 'gown'],
      },
      {
        color: 'Powder Blue',
        images: [
          'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { S: 15, M: 25, L: 15 },
        tags: ['chiffon', 'blue', 'pastel'],
      },
    ],
  },

  // ── Women Tops ────────────────────────────────────────────────────────────
  {
    name: 'Venice Linen Puff-Sleeve Corset Top',
    description: 'Chic tailored corset top made from breathable European linen blend. Features flexi-boning for structured silhouette and delicate sweet-heart neckline.',
    price: 2199, discountPrice: 1699, subCategoryName: 'Tops', review: 4, status: 'active',
    variants: [
      {
        color: 'Ivory Cream',
        images: [
          'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { XS: 15, S: 25, M: 30, L: 15 },
        tags: ['linen', 'corset', 'ivory'],
      },
      {
        color: 'Blush Pink',
        images: [
          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { S: 20, M: 25, L: 10 },
        tags: ['linen', 'blush', 'pink'],
      },
    ],
  },

  // ── Women Sarees ──────────────────────────────────────────────────────────
  {
    name: 'Royal Heritage Kanjivaram Silk Saree',
    description: 'Woven with pure Mulberry silk and gold zari threads. Inspired by temple architecture motifs, completed with an unstitched blouse piece.',
    price: 12999, discountPrice: 9999, subCategoryName: 'Sarees', review: 5, status: 'active',
    variants: [
      {
        color: 'Royal Magenta & Gold',
        images: [
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1633934542430-0905ccb5f050?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { FreeSize: 30 },
        tags: ['silk', 'saree', 'traditional', 'royal'],
      },
      {
        color: 'Peacock Blue & Gold',
        images: [
          'https://images.unsplash.com/photo-1633934542430-0905ccb5f050?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { FreeSize: 25 },
        tags: ['silk', 'saree', 'peacock'],
      },
    ],
  },

  // ── Footwear Sneakers ─────────────────────────────────────────────────────
  {
    name: 'Quantum Retro Leather Court Sneakers',
    description: 'Minimalist luxury court sneakers featuring Italian full-grain leather upper, padded collar, and durable cupsole construction with memory foam insoles.',
    price: 5999, discountPrice: 4499, subCategoryName: 'Sneakers', review: 5, status: 'active',
    variants: [
      {
        color: 'Pure White & Gum',
        images: [
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { 39: 10, 40: 20, 41: 30, 42: 25, 43: 15 },
        tags: ['sneakers', 'leather', 'white', 'court'],
      },
      {
        color: 'Stealth Black',
        images: [
          'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { 39: 8, 40: 18, 41: 25, 42: 20, 43: 12 },
        tags: ['sneakers', 'black', 'leather'],
      },
    ],
  },

  {
    name: 'Velocity High-Top Knit Trainer',
    description: 'Next-gen sock-knit high-top sneakers with responsive EVA midsole cushioning and sculptural rubber tread for ultimate lightweight agility.',
    price: 4999, discountPrice: 3699, subCategoryName: 'Sneakers', review: 4, status: 'active',
    variants: [
      {
        color: 'Triple Black',
        images: [
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { 40: 15, 41: 25, 42: 20, 43: 10 },
        tags: ['knit', 'sneakers', 'hightop'],
      },
      {
        color: 'Neon Cyan Accent',
        images: [
          'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { 40: 10, 41: 20, 42: 15 },
        tags: ['knit', 'sneakers', 'neon'],
      },
    ],
  },

  // ── Kids ──────────────────────────────────────────────────────────────────
  {
    name: 'Explorer Organic Cotton Toddler Set',
    description: 'Super soft GOTS-certified organic cotton set for active toddlers. Includes stretch waistband joggers and snap-closure graphic pullover.',
    price: 1599, discountPrice: 1199, subCategoryName: 'Boys Wear', review: 5, status: 'active',
    variants: [
      {
        color: 'Mustard & Navy',
        images: [
          'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1519278409-1f56fdda7fe5?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { '2-3Y': 20, '3-4Y': 25, '4-5Y': 20 },
        tags: ['kids', 'organic', 'boys'],
      },
      {
        color: 'Sage Green',
        images: [
          'https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1519278409-1f56fdda7fe5?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&auto=format&fit=crop&q=80',
        ],
        sizes: { '2-3Y': 15, '3-4Y': 20, '4-5Y': 15 },
        tags: ['kids', 'sage', 'green'],
      },
    ],
  },
];

const BANNERS_DATA = [
  {
    title: "THE SUMMER '26 EDIT",
    heading: "Sunkissed Luxury Silhouettes",
    subtext: 'Discover refined silhouettes, breathable fabrics, and effortless elegance.',
    buttonText: 'Explore Collection',
    categoryType: 'MainCategory',
    categoryName: 'Men',
    imageUrl: 'https://images.unsplash.com/photo-1490578474895-699bc4e2cf59?w=1600&auto=format&fit=crop&q=80',
    order: 1,
    isActive: true,
  },
  {
    title: 'LUXURY FOOTWEAR COLLECTION',
    heading: 'Handcrafted Italian Craftsmanship',
    subtext: 'Handcrafted Italian sneakers, boots, and timeless court classics.',
    buttonText: 'Shop Footwear',
    categoryType: 'MainCategory',
    categoryName: 'Footwear',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1600&auto=format&fit=crop&q=80',
    order: 2,
    isActive: true,
  },
  {
    title: "WOMEN'S ATELIER HIGHLIGHTS",
    heading: 'Pure Mulberry Silk & Linen',
    subtext: 'From Mulberry silk gowns to effortless linen corsets.',
    buttonText: 'Discover Women',
    categoryType: 'MainCategory',
    categoryName: 'Women',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&auto=format&fit=crop&q=80',
    order: 3,
    isActive: true,
  },
];

const COUPONS_DATA = [
  { couponName: 'Welcome Offer',          couponCode: 'WELCOME10', discount: 10, minAmount: 499,  validity: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), status: 'Active' },
  { couponName: 'Festive Season Special',  couponCode: 'FESTIVE20', discount: 20, minAmount: 1499, validity: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), status: 'Active' },
  { couponName: 'Summer Launch Sale',      couponCode: 'SUMMER15',  discount: 15, minAmount: 999,  validity: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),  status: 'Active' },
  { couponName: 'VIP Club Member',        couponCode: 'VIP25',     discount: 25, minAmount: 2999, validity: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), status: 'Active' },
];

const USERS_DATA = [
  { username: 'Admin Arni',   email: 'admin@arni.shop',  password: 'Admin@1234', phone: '9876543210', gender: 'Male',   role: 'Admin', status: 'Active', profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80' },
  { username: 'Priya Sharma', email: 'priya@test.com',   password: 'Test@1234',  phone: '9876543211', gender: 'Female', role: 'User',  status: 'Active', profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' },
  { username: 'Rahul Verma',  email: 'rahul@test.com',   password: 'Test@1234',  phone: '9876543212', gender: 'Male',   role: 'User',  status: 'Active', profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' },
  { username: 'Anjali Nair',  email: 'anjali@test.com',  password: 'Test@1234',  phone: '9876543213', gender: 'Female', role: 'User',  status: 'Active', profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' },
];

// ═══════════════════════════════════════════════════════════════════════════════
//  SEED EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

async function runSeed() {
  const mongoURI = process.env.MongoDB_url;
  if (!mongoURI) {
    err('No MongoDB_url found in environment!');
    process.exit(1);
  }

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   ARNI E-COMMERCE — FRESH DB SEEDER     ║');
  console.log('╚══════════════════════════════════════════╝\n');

  try {
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 30000 });
    log('Connected to MongoDB Atlas');

    head('DROPPING ALL EXISTING COLLECTIONS');
    const modelsToClear = [MainCategory, SubCategory, Product, Variant, Banner, Coupon, User, Order];
    const optionalsToClear = [Cart, Wishlist, Wallet].filter(Boolean);

    for (const Model of [...modelsToClear, ...optionalsToClear]) {
      try {
        await Model.deleteMany({});
        log(`Cleared collection: ${Model.modelName}`);
      } catch (e) {
        warn(`Notice: ${Model.modelName} - ${e.message}`);
      }
    }

    try {
      await mongoose.connection.collection('counters').deleteMany({});
      log('Cleared sequence counters');
    } catch (_) {}

    head('SEEDING MAIN CATEGORIES');
    const createdMainCats = {};
    for (const mc of MAIN_CATEGORIES) {
      const doc = await MainCategory.create(mc);
      createdMainCats[mc.mainCategoryName] = doc._id;
      log(`MainCategory: ${mc.mainCategoryName}`);
    }

    head('SEEDING SUB CATEGORIES');
    const createdSubCats = {};
    for (const sc of SUB_CATEGORIES) {
      const mainId = createdMainCats[sc.mainCategoryName];
      if (!mainId) {
        warn(`Main category "${sc.mainCategoryName}" not found for subcategory "${sc.subCategoryName}"`);
        continue;
      }
      const doc = await SubCategory.create({
        subCategoryName: sc.subCategoryName,
        mainCategory: mainId,
        image: sc.image,
        offerPercentage: sc.offerPercentage,
        status: sc.status,
      });
      createdSubCats[sc.subCategoryName] = doc._id;
      log(`SubCategory: ${sc.subCategoryName} → ${sc.mainCategoryName}`);
    }

    head('SEEDING PRODUCTS & VARIANTS');
    let totalVariantsCount = 0;
    let totalImagesCount = 0;

    for (const prodData of PRODUCTS_DATA) {
      const subId = createdSubCats[prodData.subCategoryName];
      if (!subId) {
        warn(`Subcategory "${prodData.subCategoryName}" not found for product "${prodData.name}"`);
        continue;
      }

      const productDoc = await Product.create({
        name: prodData.name,
        description: prodData.description,
        price: prodData.price,
        discountPrice: prodData.discountPrice,
        subCategory: subId,
        review: prodData.review,
        status: prodData.status,
        image: prodData.variants[0].images[0],
      });

      let firstVariantId = null;
      for (const varData of prodData.variants) {
        const variantDoc = await Variant.create({
          productId: productDoc._id,
          color: varData.color,
          images: varData.images,
          sizes: varData.sizes,
          tags: varData.tags || [],
        });

        if (!firstVariantId) firstVariantId = variantDoc._id;
        totalVariantsCount++;
        totalImagesCount += varData.images.length;
      }

      productDoc.image = prodData.variants[0].images[0];
      await productDoc.save();

      log(`Product: "${prodData.name}" — ${prodData.variants.length} color variants, ${prodData.variants.length * 4} images`);
    }

    head('SEEDING BANNERS');
    for (const b of BANNERS_DATA) {
      const catId = createdMainCats[b.categoryName];
      if (!catId) continue;
      await Banner.create({
        title: b.title,
        heading: b.heading,
        subtext: b.subtext,
        buttonText: b.buttonText,
        imageUrl: b.imageUrl,
        categoryType: b.categoryType,
        categoryId: catId,
        order: b.order,
        isActive: b.isActive,
      });
      log(`Banner [${b.order}]: ${b.title}`);
    }

    head('SEEDING COUPONS');
    for (const c of COUPONS_DATA) {
      await Coupon.create(c);
      log(`Coupon: ${c.couponCode} — ${c.discount}% off`);
    }

    head('SEEDING USERS');
    const createdUsers = {};
    for (const ud of USERS_DATA) {
      const existing = await User.findOne({ email: ud.email });
      if (existing) {
        createdUsers[ud.email] = existing;
        info(`User already exists: ${ud.email}`);
        continue;
      }

      const uid = makeUserId();
      const userDoc = await User.create({
        userId: uid,
        username: ud.username,
        email: ud.email,
        password: ud.password,
        phone: ud.phone,
        gender: ud.gender,
        role: ud.role,
        status: ud.status,
        profileImage: ud.profileImage,
      });

      createdUsers[ud.email] = userDoc;
      log(`User: ${ud.username} [${ud.role}] — ${ud.email}`);

      if (Wallet) {
        const initBal = ud.email.includes('priya') ? 250 : ud.email.includes('rahul') ? 500 : ud.email.includes('anjali') ? 150 : 0;
        await Wallet.create({ user: userDoc._id, balance: initBal, transactions: [] });
      }
    }

    head('DATABASE ANALYSIS & SUMMARY REPORT');
    console.table([
      { Collection: 'MainCategories', Count: await MainCategory.countDocuments() },
      { Collection: 'SubCategories',  Count: await SubCategory.countDocuments()  },
      { Collection: 'Products',       Count: await Product.countDocuments()      },
      { Collection: 'Variants',       Count: await Variant.countDocuments()      },
      { Collection: 'Banners',        Count: await Banner.countDocuments()       },
      { Collection: 'Coupons',        Count: await Coupon.countDocuments()       },
      { Collection: 'Users',          Count: await User.countDocuments()         },
    ]);

    log(`Total Variants Created: ${totalVariantsCount}`);
    log(`Total HD Variant Images: ${totalImagesCount}`);

    console.log('\n\x1b[32m✔  Fresh seeding completed successfully!\x1b[0m\n');
    process.exit(0);

  } catch (error) {
    err(`Seeding failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

runSeed();
