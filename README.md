![Arni E-Commerce Preview](./social-preview.jpeg)

# Arni – Full-Stack E-Commerce Web Application

Arni is the first complete full-stack web application I built.

I developed it while learning full-stack development at Brototype. Before this project, I had worked with frontend and backend concepts separately, but Arni was the first project where I connected everything and built a complete application from beginning to end.

The application includes the main features expected from an e-commerce platform, including product browsing, cart and checkout flows, online payments, coupons, orders, returns, a wallet system, and an admin dashboard.

The frontend is rendered using EJS, while Node.js, Express.js, and MongoDB handle the backend and data management.

---

## Why I Built It

The main purpose of Arni was to understand how a complete full-stack application works in practice: how browser interactions reach controllers, how business rules shape database operations, and how authentication, payments, inventory, and order state fit together.

Building it gave me hands-on experience with:

- Designing separate customer and administrator workflows
- Structuring a large Express application with routes, controllers, models, and views
- Maintaining authenticated sessions and protected routes
- Modelling products, variants, inventory, carts, orders, coupons, refunds, and wallets
- Integrating Razorpay, Cloudinary, email OTPs, and social authentication
- Handling validation, responsive interfaces, errors, and user feedback across a multi-step purchase journey

---

## Main Features

### User Features

- User registration and login
- Session-based authentication
- Home page with featured products
- Product search
- Category and subcategory browsing
- Product listing and product details
- Product variant selection
- Shopping-cart management
- Address management
- Checkout flow
- Razorpay payment integration
- Cash-on-delivery support, where available
- Coupon and discount application
- Order placement and order history
- Order cancellation
- Product return requests
- User profile management
- Wallet system

### Admin Features

- Separate admin authentication
- Sales and order dashboard
- User management
- Order management
- Product management
- Product variant management
- Category and subcategory management
- Coupon management
- Offer management
- Banner management
- Sales analytics

---

## Application Workflow

### User Flow

1. Create an account or log in
2. Browse or search for products
3. View product information and available variants
4. Add products to the cart
5. Add or select a delivery address
6. Apply a coupon, when available
7. Complete the checkout
8. Pay through Razorpay or another supported method
9. View and manage placed orders
10. Request cancellation or return when applicable

### Admin Flow

1. Log in to the admin dashboard
2. Add and manage products
3. Manage product variants and stock
4. Create categories and subcategories
5. Configure coupons, offers, and banners
6. View users and customer orders
7. Update order status
8. Monitor sales information through the dashboard

---

## Tech Stack

| Layer              | Technology                   |
| ------------------ | ---------------------------- |
| Server             | Node.js                      |
| Backend Framework  | Express.js                   |
| Frontend Rendering | EJS                          |
| Database           | MongoDB                      |
| Payment Gateway    | Razorpay                     |
| Authentication     | Session-based authentication |
| Architecture       | MVC-style project structure  |
| Project Setup      | Express Generator            |

---

## Project Structure

```text
Arni/
├── bin/             # Server startup configuration
├── config/          # Database and application configuration
├── controllers/     # Application and business logic
├── models/          # MongoDB schemas
├── public/          # CSS, JavaScript, images, and static files
├── routes/          # User and admin routes
├── views/           # EJS templates
├── app.js           # Express application setup
├── package.json
└── README.md
```

The project follows an MVC-style structure to keep routes, application logic, database models, and user-interface templates separated.

---

## Key Technical Work

### Authentication and Sessions

The application uses session-based authentication for both users and administrators.

Sessions are used to keep users logged in and protect routes that should only be accessed by authenticated users.

### Product and Variant Management

Administrators can create products and manage their related information, including categories, subcategories, variants, pricing, images, and availability.

### Cart and Checkout

Users can add products to the cart, update quantities, remove items, choose an address, apply coupons, and complete the checkout process.

### Razorpay Integration

Razorpay is integrated into the checkout flow to support online payments.

The application handles payment creation, payment verification, and order confirmation.

### Coupons and Offers

Administrators can create and manage coupons and offers. Eligible users can apply them during checkout to receive discounts.

### Orders, Cancellations, and Returns

Users can view their order history and request cancellations or returns based on the current order status.

Administrators can review orders and update their progress.

### Wallet System

The application includes a wallet system that can be used for eligible refunds and future purchases.

### Admin Dashboard

The admin dashboard provides controls for products, users, categories, coupons, banners, offers, and orders, along with an overview of sales activity.

---

## Installation and Setup

### Prerequisites

Make sure the following are installed:

- Node.js
- npm
- MongoDB, either locally or through MongoDB Atlas

### 1. Clone the Repository

```bash
git clone https://github.com/arjunpj-11/Arni
cd Arni
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_SECRET=your_razorpay_secret
PORT=3000
```

Do not commit real credentials or secrets to the repository.

### 4. Start the Application

```bash
npm start
```

Open the application in your browser:

```text
http://localhost:3000
```

---

## What I Learned

Arni was an important project in my development journey because it was the first time I built and connected all the major parts of a full-stack application.

Through this project, I gained practical experience with:

- Node.js and Express.js
- MongoDB schemas and database operations
- EJS server-side rendering
- MVC-style application structure
- User and admin authentication
- Session management
- Frontend and backend integration
- Payment-gateway integration
- Cart and checkout logic
- Coupon and discount calculations
- Order-management workflows
- Debugging a large application
- Organizing code into reusable modules

This project gave me the foundation I needed to move into React, TypeScript, modern frontend development, and larger projects such as Imminiq.

---

## Project Scope

Arni is a portfolio-grade, end-to-end e-commerce application built as a learning project. It includes a complete purchase workflow, a separate administration surface, responsive server-rendered pages, payment and media integrations, and modular MVC-style organization.

Before use as a real commercial store, the deployment should also include a persistent production session store, centralized monitoring, backups, payment-provider production credentials, and a formal security review.

---

## Possible Improvements

- Product reviews and ratings
- Real-time order notifications
- Live delivery tracking
- Broader automated unit and integration test coverage
- Centralized logs and operational monitoring
- REST API for a React or Next.js frontend
- Better product recommendation features
- Improved reporting and sales analytics

---

## Repository Purpose

This repository is shared to showcase my first complete full-stack project and document what I learned while building it.

---

> Arni was the project that helped me understand how frontend, backend, databases, authentication, payments, and business logic come together inside a complete application.

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Arjun PJ** — https://github.com/arjunpj-11

---

> 💡 Built as a full-stack implementation of a real-world e-commerce platform to explore scalable architecture, payment integration, and admin management systems.
