# 🛒 Full Stack E-Commerce Web Application

A complete e-commerce web application built with Node.js, Express, MongoDB, and EJS — featuring advanced admin controls, a coupon system, Razorpay payment integration, and a full user shopping experience.

---

## 🚀 Features

### 👤 User Side

* 🔐 User registration & login
* 🏠 Home page with featured products
* 🔍 Product search functionality
* 🗂️ Browse by categories & subcategories
* 📦 Product listing & detailed product view
* 🛒 Cart management (add / update / remove)
* 💳 Secure checkout & payment integration
* 💰 Razorpay payment gateway
* 🎟️ Apply coupons & discounts
* 📍 Address management
* 📦 Order management (My Orders)
* 👤 User profile management
* 💼 Wallet system
* 🔁 Order cancellation & returns

### 🛠️ Admin Side

* 🔐 Admin authentication
* 📊 Dashboard with sales analytics
* 👥 User management
* 📦 Order management
* 🛍️ Product & variant management
* 🏷️ Category & subcategory management
* 🎟️ Coupon management
* 🎨 Banner management
* 📊 Sales & offer management

---

## 🧠 Tech Stack

| Layer          | Technology                               |
| -------------- | ---------------------------------------- |
| Backend        | Node.js + Express.js (Express Generator) |
| Frontend       | EJS (Embedded JavaScript Templates)      |
| Database       | MongoDB                                  |
| Payment        | Razorpay                                 |
| Authentication | Session-based                            |

---

## 📁 Project Structure

```
project-root/
├── bin/           # Server startup (www)
├── routes/        # Route definitions
├── controllers/   # Business logic
├── models/        # MongoDB schemas
├── views/         # EJS templates
├── public/        # Static assets (CSS, JS, images)
├── config/        # DB & app configuration
├── app.js         # Main application file
├── package.json
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/arjunpj-11/Arni
cd Arni
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_secret_key
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_SECRET=your_secret_key
PORT=3000
```

### 4. Start the application

```bash
npm start
```

Visit 👉 **http://localhost:3000**

---

## 🔄 Application Workflow

### 🧑‍💻 User Flow

1. Register / Login
2. Browse or search products
3. Add items to cart
4. Apply coupon (optional)
5. Checkout & make payment via Razorpay
6. Place order & track / manage orders

### 🧑‍💼 Admin Flow

1. Login to admin dashboard
2. Manage products, categories, and variants
3. Create and manage coupons & banners
4. Monitor users and orders
5. Analyze sales data

---

## ✨ Key Highlights

* 🧩 MVC pattern via Express Generator
* 🛍️ Complete end-to-end e-commerce workflow
* 💳 Razorpay payment integration
* 🎟️ Coupon & discount system
* 📊 Advanced admin dashboard
* ⚡ Server-side rendering with EJS
* 📦 Scalable and modular architecture

---

## 🔮 Future Enhancements

* [ ] Product reviews & ratings
* [ ] Real-time notifications
* [ ] Live order tracking
* [ ] Fully responsive mobile UI
* [ ] REST API for React / Next.js frontend
* [ ] Invoice generation

---

## 🖼️ Preview

![E-Commerce Preview](./social-preview.jpeg)


---

## 🤝 Contributing

Contributions are welcome! Feel free to fork this repository and submit a pull request.

---

## 📜 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Arjun PJ** — https://github.com/arjunpj-11

---

> 💡 Built as a full-stack implementation of a real-world e-commerce platform to explore scalable architecture, payment integration, and admin management systems.

