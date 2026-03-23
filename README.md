🛒 Full Stack E-Commerce Web Application

A complete E-Commerce Web Application built using Node.js, Express (Generator), MongoDB, and EJS, featuring advanced admin controls, coupon system, and a full user shopping experience including secure online payments.

🚀 Features

👤 User Side

🔐 User Registration & Login
🏠 Home page with featured products
🔍 Product search functionality
🗂️ Browse by categories & subcategories
📦 Product listing & detailed product view
🛒 Cart management (add/update/remove items)
💳 Secure checkout & payment integration
💰 Razorpay payment gateway integration
🎟️ Apply coupons/discounts
📍 Address management
📦 Order management (My Orders)
👤 User profile management
💼 Wallet system
🔁 Order cancellation / return (if implemented)

🛠️ Admin Side

🔐 Admin authentication
📊 Dashboard (sales analytics & overview)
👥 User management
📦 Order management
🛍️ Product management
📐 Product variant management
🏷️ Category management
🧩 Subcategory management
🎟️ Coupon management
🎨 Banner management
📊 Sales & offer management

🧠 Tech Stack

Backend: Node.js + Express.js (Express Generator)
Frontend: EJS (Embedded JavaScript Templates)
Database: MongoDB
Payment Gateway: Razorpay
Authentication: Session-based authentication

📁 Project Structure (Express Generator)

project-root/
│
├── bin/              # Server startup file (www)
├── routes/           # Route definitions
├── controllers/      # Business logic
├── models/           # Database schemas
├── views/            # EJS templates
├── public/           # Static assets (CSS, JS, images)
├── config/           # Configuration files (DB, etc.)
├── app.js            # Main application file
├── package.json
└── README.md

⚙️ Installation & Setup

1. Clone Repository
git clone https://github.com/arjunpj-11/ecommerce
cd your-repo-name
2. Install Dependencies
npm install
3. Environment Variables

Create a .env file in the root directory:

MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_secret_key

RAZORPAY_KEY_ID=your_key_id
RAZORPAY_SECRET=your_secret_key

PORT=3000
4. Run the Application
npm start

App will run at:
👉 http://localhost:3000

🔄 Application Workflow

🧑‍💻 User Flow
Register/Login
Browse or search products
Add items to cart
Apply coupon (optional)
Checkout & make payment
Place order
Track/manage orders

🧑‍💼 Admin Flow
Login to admin dashboard
Manage products, categories, and variants
Create and manage coupons
Monitor users and orders
Analyze sales data

✨ Key Highlights

🧩 Structured using Express Generator (MVC pattern)
🛍️ Complete e-commerce workflow
💳 Razorpay payment integration
🎟️ Coupon & discount system
📊 Advanced admin dashboard
⚡ Server-side rendering with EJS
📦 Scalable and modular architecture
🔮 Future Enhancements
⭐ Product reviews & ratings
🔔 Real-time notifications
📦 Live order tracking
📱 Fully responsive UI (mobile optimization)
🌐 REST API for React/Next.js frontend
🧾 Invoice generation
📸 Screenshots

Add screenshots of your application here

🤝 Contributing

Contributions are welcome! Feel free to fork this repository and submit pull requests.

📜 License

This project is licensed under the MIT License.

👨‍💻 Author

Arjun PJ
GitHub: https://github.com/arjunpj-11

🙌 Acknowledgment

This project was developed as a full-stack implementation of a real-world e-commerce platform to understand scalable architecture, payment integration, and admin management systems.
