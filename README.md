# 🛒 FreshMart — Online Grocery Ordering & Management System

FreshMart is a full-featured, 3-tier e-commerce grocery ordering and inventory management system built with **Java (DAO Pattern)**, **MS SQL Server / MySQL**, and a modern **Vanilla JavaScript / HTML5 / CSS3** web frontend.

---

## 👥 Team Members & Domain Allocation

| Member Name | Assigned Module / Feature Domain | Frontend Files | Backend Java Files | Database Tables |
| :--- | :--- | :--- | :--- | :--- |
| **Shashini** | **User Account & Inquiry Handling** | `account.js`, `inquiry.js`, `inquiries.html` | `User.java`, `Inquiry.java`, `UserRepository.java`, `UserInquiryRepository.java`, `UserInquiryService.java` | `users`, `user_inquiries` |
| **Dulwin** | **Shopping Cart Management** | `cart.js`, `cart.html`, Cart drawer | `Cart.java`, `CartItem.java`, `CartRepository.java`, `CartService.java` | `shopping_carts`, `cart_items` |
| **Shakya** | **Delivery & Payment Management** | `payment-delivery.js`, `checkout.html` | `Payment.java`, `Delivery.java`, `Supplier.java`, `PaymentRepository.java`, `DeliveryRepository.java`, `SupplierRepository.java` | `payments`, `deliveries`, `delivery_config`, `suppliers` |
| **Ahamed R.R** | **Rating, Reviews & Promotions** | `review.js`, Review modal, Promo UI | `RatingReview.java`, `Promotion.java`, `RatingReviewRepository.java`, `PromotionRepository.java` | `product_reviews`, `promotions` |
| **Kaveen** | **Order Management** | `order.js`, `orders.html`, Order Tracker | `Order.java`, `OrderItem.java`, `OrderRepository.java`, `OrderService.java` | `orders`, `order_items` |
| **Ashwin** | **Product Management** | `product-admin.js`, `product-browse.js` | `Product.java`, `Category.java`, `ProductRepository.java`, `CategoryRepository.java`, `ProductService.java` | `products`, `categories` |

---

## ⚡ Quick Start (1-Click Run)

No complex build setup or IDE needed:

1. **Start the System**: Double-click **`RUN_FRESHMART.bat`** (or `Full-Grocery-System/start-all.bat`).
   - Automatically starts the database container (if Docker is used).
   - Compiles all Java sources with `javac`.
   - Starts the Java backend on `http://localhost:8080`.
   - Starts the web server on `http://localhost:8000`.
   - Opens `http://localhost:8000/index.html` in your default browser.
2. **Stop the System**: Double-click **`STOP_FRESHMART.bat`** (or `Full-Grocery-System/stop-all.bat`).

---

## 🛠️ Technology Stack

- **Frontend:** HTML5, CSS3 (Responsive UI), Vanilla JavaScript (Modular ES6+ architecture), Fetch API.
- **Backend:** Java SE (Standard Library HTTP Server `com.sun.net.httpserver`), Repository / DAO Design Pattern.
- **Database:** Microsoft SQL Server 2022 (Docker or SSMS) / MySQL compatible schema.
- **Communication:** RESTful JSON APIs across all operations (Cart, Orders, Products, Reviews, Inquiries, Payments, Users).

---

## 📂 Project Structure

```
├── RUN_FRESHMART.bat               # 1-Click Launch Script
├── STOP_FRESHMART.bat              # Clean Process Shutdown Script
├── .gitignore                      # Git Ignore Configuration
├── README.md                       # Repository Documentation
├── PROJECT_SHARING_AND_MEMBER_GUIDE.md # Detailed Member Matrix & Guide
├── Group_Report_Use_Case_Specification.md
├── Group_Use_Case_Scenarios_Word_Ready.md
└── Full-Grocery-System/
    ├── backend/                    # Java Backend (Controllers, Services, Repositories, Models)
    ├── frontend/                   # HTML, CSS, JavaScript, and Product Images
    ├── database/                   # SQL Scripts (MS SQL & MySQL) and Database Reports
    ├── docker-compose.yml          # MS SQL Server Container Setup
    ├── start-all.bat               # All-in-one Launcher
    ├── start-backend.bat           # Backend Only Launcher
    ├── start-frontend.bat          # Frontend Only Launcher
    └── stop-all.bat                # Server Killer
```
