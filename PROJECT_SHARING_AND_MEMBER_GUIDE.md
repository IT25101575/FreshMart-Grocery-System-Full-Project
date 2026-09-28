# 🛒 FreshMart Grocery System — Complete Project Architecture & Team Distribution Guide

**Project Name:** FreshMart Online Grocery Ordering & Management System  
**Architecture:** 3-Tier Layered Architecture (Frontend HTML5/CSS3/Vanilla JS + Backend Java HTTP Server with DAO/Repository Pattern + MS SQL Server / MySQL Database)

---

## 👥 1. Group Member File Ownership & Contribution Matrix

| Member Name | Assigned Module / Feature Domain | Frontend Files (`frontend/`) | Backend Models (`model/`) | Backend Repositories (`repository/`) & Services (`service/`) | Server Endpoints (`FreshMartServer.java`) | Database Tables |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Shashini** | **User Account & Inquiry Handling** | `js/account.js`<br>`js/inquiry.js`<br>`inquiries.html`<br>`index.html` (Auth Modals)<br>`admin.html` (Users & Inquiries tabs) | `User.java`<br>`Inquiry.java` | `UserRepository.java`<br>`UserInquiryRepository.java`<br>`UserInquiryService.java` | `/api/signup`<br>`/api/login`<br>`/api/users`<br>`/api/inquiries`<br>`/api/inquiries/respond`<br>`/api/inquiries/forward` | `users`<br>`user_inquiries` |
| **Dulwin** | **Shopping Cart Management** | `js/cart.js`<br>`cart.html`<br>`index.html` (Cart Drawer, Badge) | `Cart.java`<br>`CartItem.java` | `CartRepository.java`<br>`CartService.java` | `/api/cart` (GET, POST, PUT, DELETE item, DELETE clear) | `shopping_carts`<br>`cart_items` |
| **Shakya** | **Delivery & Payment Management** | `js/payment-delivery.js`<br>`checkout.html`<br>`admin.html` (Deliveries tab)<br>`orders.html` (Tracking badge) | `Payment.java`<br>`Delivery.java`<br>`Supplier.java` | `PaymentRepository.java`<br>`DeliveryRepository.java`<br>`SupplierRepository.java`<br>`PaymentService.java`<br>`DeliveryService.java`<br>`SupplierService.java` | Handled during order submission & `/api/suppliers` | `payments`<br>`deliveries`<br>`delivery_config`<br>`suppliers` |
| **Ahamed R.R** | **Rating, Reviews & Promotions** | `js/review.js`<br>`index.html` (Reviews modal, stars)<br>`admin.html` (Reviews tab, Promo banner) | `RatingReview.java`<br>`Promotion.java` | `RatingReviewRepository.java`<br>`PromotionRepository.java`<br>`RatingReviewService.java`<br>`PromotionService.java` | `/api/promotions`<br>`/api/reviews` | `product_reviews`<br>`promotions` |
| **Kaveen** | **Order Management** | `js/order.js`<br>`orders.html`<br>`index.html` (Order Tracker)<br>`admin.html` (Orders & Revenue tabs) | `Order.java`<br>`OrderItem.java` | `OrderRepository.java`<br>`OrderService.java` | `/api/orders` (GET all, GET by user, GET by ID, POST create, PUT status) | `orders`<br>`order_items` |
| **Ashwin** | **Product Management** | `js/product-admin.js`<br>`js/product-browse.js`<br>`index.html` (Product Grid, Categories)<br>`admin.html` (Products & Categories) | `Product.java`<br>`Category.java` | `ProductRepository.java`<br>`CategoryRepository.java`<br>`ProductService.java` | `/api/products`<br>`/api/categories`<br>`/images/*` | `products`<br>`categories` |

### 🌐 Shared Core Components
- **Server Entrypoint & Dispatcher:** `backend/src/com/grocery/FreshMartServer.java`
- **Database Connection & Pools:** `backend/src/com/grocery/util/DBConnection.java`
- **JSON Utility Serialization:** `backend/src/com/grocery/util/JsonUtil.java`
- **Generic Base Repository Interface:** `backend/src/com/grocery/repository/Repository.java`
- **Exception Hierarchy:** `backend/src/com/grocery/exception/DatabaseException.java`
- **Universal Frontend API Client:** `frontend/js/api.js`
- **Form Validator:** `frontend/js/validator.js`
- **Global CSS Themes:** `frontend/css/style.css`, `frontend/css/admin.css`
- **Database Scripts:** `database/freshmart_mssql_ssms_shared_db.sql`, `database/freshmart_database_script.sql`

---

## 🗂️ 2. Clean Project Repository Structure

```
FreshMart-Grocery-System-Full-Project/
│
├── START_DOCKER_SILENT.vbs         <-- [1-Click Silent Docker Start - Zero CMD Windows]
├── STOP_DOCKER_SILENT.vbs          <-- [1-Click Silent Docker Stopper]
├── .gitignore                      <-- [Git Ignore Rulefile]
├── README.md                       <-- [GitHub Project Overview & Setup]
├── PROJECT_SHARING_AND_MEMBER_GUIDE.md
├── Group_Report_Use_Case_Specification.md
├── Group_Use_Case_Scenarios_Word_Ready.md
│
└── Full-Grocery-System/            <-- [Core Application Directory]
    ├── docker-compose.yml          <-- Full-Stack Multi-Container Orchestration
    │
    ├── backend/
    │   ├── lib/
    │   │   └── mssql-jdbc.jar      <-- Official Microsoft JDBC Driver (Included)
    │   └── src/com/grocery/
    │       ├── FreshMartServer.java
    │       ├── exception/
    │       │   └── DatabaseException.java
    │       ├── model/
    │       │   ├── Cart.java & CartItem.java (Dulwin)
    │       │   ├── Category.java & Product.java (Ashwin)
    │       │   ├── Delivery.java, Payment.java, Supplier.java (Shakya)
    │       │   ├── Inquiry.java & User.java (Shashini)
    │       │   ├── Order.java & OrderItem.java (Kaveen)
    │       │   └── Promotion.java & RatingReview.java (Ahamed R.R)
    │       ├── repository/
    │       │   ├── Repository.java
    │       │   ├── CartRepository.java (Dulwin)
    │       │   ├── CategoryRepository.java & ProductRepository.java (Ashwin)
    │       │   ├── DeliveryRepository.java, PaymentRepository.java, SupplierRepository.java (Shakya)
    │       │   ├── OrderRepository.java (Kaveen)
    │       │   ├── PromotionRepository.java & RatingReviewRepository.java (Ahamed R.R)
    │       │   └── UserRepository.java & UserInquiryRepository.java (Shashini)
    │       ├── service/
    │       │   ├── CartService.java (Dulwin)
    │       │   ├── DeliveryService.java, PaymentService.java, SupplierService.java (Shakya)
    │       │   ├── OrderService.java (Kaveen)
    │       │   ├── ProductService.java (Ashwin)
    │       │   ├── PromotionService.java & RatingReviewService.java (Ahamed R.R)
    │       │   └── UserInquiryService.java (Shashini)
    │       └── util/
    │           ├── DBConnection.java
    │           └── JsonUtil.java
    │
    ├── database/
    │   ├── Database_Report_Parts_B_to_F.md
    │   ├── freshmart_database_script.sql
    │   └── freshmart_mssql_ssms_shared_db.sql
    │
    └── frontend/
        ├── index.html              <-- Customer Storefront Home
        ├── cart.html               <-- Shopping Cart
        ├── checkout.html           <-- Checkout & Payment
        ├── orders.html             <-- Order History & Tracking
        ├── inquiries.html          <-- Customer Support Tickets
        ├── admin.html              <-- Complete Admin Dashboard
        ├── css/
        │   ├── style.css
        │   └── admin.css
        ├── js/
        │   ├── api.js, validator.js (Shared)
        │   ├── account.js, inquiry.js (Shashini)
        │   ├── cart.js (Dulwin)
        │   ├── payment-delivery.js, supplier.js (Shakya)
        │   ├── review.js (Ahamed R.R)
        │   ├── order.js (Kaveen)
        │   └── product-admin.js, product-browse.js (Ashwin)
        └── images/
            └── products/           <-- 18 Local Grocery Product Images
```

---

## 🚀 3. How to Run the Project (Without Any Background Task)

The project is completely self-contained and does NOT require any IDE or external background runner:

1. **Step 1: Ensure MS SQL Server is Running**
   - If using Docker: Double-click `start-all.bat` (it automatically starts the `freshmart-sql` container if Docker is running), OR run `docker compose up -d` inside `Full-Grocery-System`.
   - If using SSMS / Native SQL Server: Ensure SQL Server service is running with database `FreshMartDB`.

2. **Step 2: Start Everything with 1 Click**
   - Double-click **`RUN_FRESHMART.bat`** (or `Full-Grocery-System/start-all.bat`).
   - The launcher will:
     1. Automatically compile all Java source files using `javac` into `backend/bin`.
     2. Launch the Java HTTP server on `http://localhost:8080`.
     3. Launch the web server on `http://localhost:8000`.
     4. Open your browser directly to `http://localhost:8000/index.html`.

3. **Step 3: Stopping the Servers**
   - Double-click **`STOP_FRESHMART.bat`** (or `Full-Grocery-System/stop-all.bat`).
   - It will cleanly terminate both port 8080 and port 8000 background listeners.

---

## 📤 4. How to Upload the Project to GitHub (Step-by-Step)

Follow these exact steps in your Windows terminal / PowerShell to upload to GitHub:

```bash
# 1. Open Terminal in the root folder:
cd "c:\Users\LENOVO\Desktop\SE 3.0\FreshMart-Grocery-System-Full-Project"

# 2. Initialize Git:
git init

# 3. Add all project files (the .gitignore will automatically skip out/, bin/, .idea/, etc.):
git add .

# 4. Commit the files:
git commit -m "FreshMart Grocery System: Complete 3-Tier Implementation & Team Distribution"

# 5. Set main branch:
git branch -M main

# 6. Add your GitHub repository remote URL (create a new empty repo on github.com first):
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/FreshMart-Grocery-System.git

# 7. Push to GitHub:
git push -u origin main
```
