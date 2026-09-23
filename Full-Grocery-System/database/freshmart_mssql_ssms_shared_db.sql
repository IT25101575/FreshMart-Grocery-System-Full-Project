-- ============================================================================
-- SRI LANKA INSTITUTE OF INFORMATION TECHNOLOGY (SLIIT)
-- Faculty of Computing | Department of Information Technology
-- Course Unit: Database Management Systems / Object Oriented Programming
-- Project: Online Grocery Ordering & Delivery Management System (FreshMart)
-- Target Platform: Microsoft SQL Server / SQL Server Management Studio (SSMS)
-- Script Type: Complete Shared Database Creation, Schema, Seed Data & T-SQL Logic
-- ============================================================================

-- STEP 1: CREATE OR RECREATE SHARED DATABASE
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'FreshMartDB')
BEGIN
    CREATE DATABASE FreshMartDB;
    PRINT '>> Database [FreshMartDB] created successfully.';
END
ELSE
BEGIN
    PRINT '>> Database [FreshMartDB] already exists. Proceeding with schema update.';
END
GO

USE FreshMartDB;
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ============================================================================
-- STEP 2: DROP EXISTING TABLES IN REVERSE DEPENDENCY ORDER (CLEAN RESET)
-- ============================================================================
IF OBJECT_ID('dbo.inventory_audit_log', 'U') IS NOT NULL DROP TABLE dbo.inventory_audit_log;
IF OBJECT_ID('dbo.user_inquiries', 'U') IS NOT NULL DROP TABLE dbo.user_inquiries;
IF OBJECT_ID('dbo.product_reviews', 'U') IS NOT NULL DROP TABLE dbo.product_reviews;
IF OBJECT_ID('dbo.deliveries', 'U') IS NOT NULL DROP TABLE dbo.deliveries;
IF OBJECT_ID('dbo.delivery_config', 'U') IS NOT NULL DROP TABLE dbo.delivery_config;
IF OBJECT_ID('dbo.payments', 'U') IS NOT NULL DROP TABLE dbo.payments;
IF OBJECT_ID('dbo.order_items', 'U') IS NOT NULL DROP TABLE dbo.order_items;
IF OBJECT_ID('dbo.orders', 'U') IS NOT NULL DROP TABLE dbo.orders;
IF OBJECT_ID('dbo.cart_items', 'U') IS NOT NULL DROP TABLE dbo.cart_items;
IF OBJECT_ID('dbo.shopping_carts', 'U') IS NOT NULL DROP TABLE dbo.shopping_carts;
IF OBJECT_ID('dbo.products', 'U') IS NOT NULL DROP TABLE dbo.products;
IF OBJECT_ID('dbo.suppliers', 'U') IS NOT NULL DROP TABLE dbo.suppliers;
IF OBJECT_ID('dbo.categories', 'U') IS NOT NULL DROP TABLE dbo.categories;
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL DROP TABLE dbo.users;
GO

-- ============================================================================
-- STEP 3: CREATE TABLES WITH T-SQL CONSTRAINTS & DATA TYPES
-- ============================================================================

-- 1. Table: users (Shared by: Student 1 - Customer Account, Student 2 - Staff, Student 6 - Drivers)
CREATE TABLE users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20) NOT NULL,
    role NVARCHAR(50) NOT NULL DEFAULT 'CUSTOMER' 
        CONSTRAINT chk_user_role CHECK (role IN ('CUSTOMER', 'STORE_MANAGER', 'INVENTORY_OFFICER', 'DELIVERY_SUPERVISOR', 'DELIVERY_STAFF', 'ADMIN', 'DEPT_DELIVERY', 'DEPT_PRODUCT', 'DEPT_ORDER', 'DEPT_RATING')),
    address NVARCHAR(MAX),
    city NVARCHAR(50) DEFAULT 'Colombo',
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE()
);
GO

-- 2. Table: categories (Shared by: Student 2 - Product Management, Student 3 - Catalog)
CREATE TABLE categories (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    category_name NVARCHAR(50) NOT NULL UNIQUE,
    description NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE()
);
GO

-- 3. Table: suppliers (Wholesale vendors and grocery distributors)
CREATE TABLE suppliers (
    supplier_id INT IDENTITY(1,1) PRIMARY KEY,
    company_name NVARCHAR(100) NOT NULL UNIQUE,
    contact_person NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    phone NVARCHAR(20) NOT NULL,
    address NVARCHAR(MAX) NOT NULL,
    contract_terms NVARCHAR(MAX),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE()
);
GO

-- 4. Table: products (Shared by: Student 2 - Stock/Admin, Student 3 - Browse & Search)
CREATE TABLE products (
    product_id INT IDENTITY(1,1) PRIMARY KEY,
    category_id INT NULL,
    supplier_id INT NULL,
    product_name NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX),
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2) NULL,
    stock_quantity DECIMAL(10, 3) NOT NULL DEFAULT 0.000, -- Supports weight/volume decimals (kg/liters)
    unit NVARCHAR(20) DEFAULT 'unit',
    image_url NVARCHAR(MAX),
    is_available BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT chk_product_price CHECK (unit_price > 0),
    CONSTRAINT chk_product_stock CHECK (stock_quantity >= 0),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL
);
GO

-- 5. Table: shopping_carts (Shared by: Student 4 - Cart Management)
CREATE TABLE shopping_carts (
    cart_id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL UNIQUE,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_cart_customer FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE
);
GO

-- 6. Table: cart_items (Line items within active shopping cart)
CREATE TABLE cart_items (
    cart_item_id INT IDENTITY(1,1) PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL DEFAULT 1.000,
    added_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT chk_cart_quantity CHECK (quantity > 0),
    CONSTRAINT uq_cart_product UNIQUE (cart_id, product_id),
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES shopping_carts(cart_id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);
GO

-- 7. Table: orders (Shared by: Student 5 - Order Management)
CREATE TABLE orders (
    order_id INT IDENTITY(1,1) PRIMARY KEY,
    order_code NVARCHAR(50) NULL, -- Formatted e.g. ORD-00001
    customer_id INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    order_status NVARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CONSTRAINT chk_order_status CHECK (order_status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    shipping_address NVARCHAR(MAX) NOT NULL,
    order_date DATETIME2 DEFAULT GETDATE(),
    delivered_at DATETIME2 NULL,
    CONSTRAINT chk_order_total CHECK (total_amount >= 0),
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users(user_id)
);
GO

-- 8. Table: order_items (Ordered line items snapshot)
CREATE TABLE order_items (
    order_item_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal AS (quantity * unit_price) PERSISTED,
    CONSTRAINT chk_order_item_qty CHECK (quantity > 0),
    CONSTRAINT chk_order_item_price CHECK (unit_price >= 0),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(product_id)
);
GO

-- 9. Table: payments (Shared by: Student 6 - Payment & Delivery)
CREATE TABLE payments (
    payment_id INT IDENTITY(1,1) PRIMARY KEY,
    payment_code NVARCHAR(50) NULL, -- Formatted e.g. PAY-00001
    order_id INT NOT NULL UNIQUE,
    payment_method NVARCHAR(20) NOT NULL
        CONSTRAINT chk_payment_method CHECK (payment_method IN ('CARD', 'COD', 'BANK_TRANSFER')),
    payment_status NVARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CONSTRAINT chk_payment_status CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    amount DECIMAL(10, 2) NOT NULL,
    transaction_date DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT chk_payment_amount CHECK (amount > 0),
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);
GO

-- 10. Table: delivery_config (Fixed Flat Delivery Price Configuration & Reason Management)
CREATE TABLE delivery_config (
    config_id INT IDENTITY(1,1) PRIMARY KEY,
    standard_fee DECIMAL(10, 2) NOT NULL DEFAULT 2.99,
    express_fee DECIMAL(10, 2) NOT NULL DEFAULT 4.99,
    scheduled_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    free_threshold DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
    is_fixed_distance BIT NOT NULL DEFAULT 1, -- Fixed amount regardless of km
    reason NVARCHAR(255) NOT NULL DEFAULT 'Standard flat rate for all delivery zones (fixed fee regardless of distance)',
    updated_at DATETIME2 DEFAULT GETDATE(),
    updated_by NVARCHAR(100) DEFAULT 'Delivery Head'
);
GO

-- 11. Table: deliveries (Shared by: Student 6 - Payment & Delivery)
CREATE TABLE deliveries (
    delivery_id INT IDENTITY(1,1) PRIMARY KEY,
    delivery_code NVARCHAR(50) NULL, -- Formatted e.g. DEL-00001
    order_id INT NOT NULL UNIQUE,
    assigned_staff_id INT NULL,
    delivery_status NVARCHAR(20) NOT NULL DEFAULT 'SCHEDULED'
        CONSTRAINT chk_delivery_status CHECK (delivery_status IN ('SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')),
    scheduled_time DATETIME2 NULL,
    delivered_at DATETIME2 NULL,
    delivery_notes NVARCHAR(255) NULL,
    CONSTRAINT fk_deliveries_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_deliveries_staff FOREIGN KEY (assigned_staff_id) REFERENCES users(user_id) ON DELETE SET NULL
);
GO

-- 12. Table: product_reviews (Customer ratings and feedback)
CREATE TABLE product_reviews (
    review_id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    customer_id INT NOT NULL,
    rating INT NOT NULL,
    review_text NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE
);
GO

-- 13. Table: user_inquiries (Customer support and ticket management)
CREATE TABLE user_inquiries (
    inquiry_id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    subject NVARCHAR(150) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    department NVARCHAR(30) NOT NULL DEFAULT 'GENERAL'
        CONSTRAINT chk_inquiry_dept CHECK (department IN ('ORDER_SUPPORT', 'BILLING', 'DELIVERY', 'PRODUCT_QUALITY', 'GENERAL', 'ORDER', 'PRODUCT', 'RATING')),
    status NVARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CONSTRAINT chk_inquiry_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'PENDING', 'FORWARDED', 'ANSWERED')),
    admin_response NVARCHAR(MAX) NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_inquiries_customer FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE
);
GO

-- 14. Table: inventory_audit_log (Audit trail for automated stock triggers)
CREATE TABLE inventory_audit_log (
    log_id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    action_type NVARCHAR(50) NOT NULL,
    old_quantity DECIMAL(10, 3),
    new_quantity DECIMAL(10, 3),
    change_reason NVARCHAR(255),
    changed_at DATETIME2 DEFAULT GETDATE()
);
GO

-- 15. Table: promotions (Student 2/Admin: Product Promotion & Discounts)
CREATE TABLE promotions (
    promotion_id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    discount_percentage DECIMAL(5, 2) NOT NULL,
    discount_price DECIMAL(10, 2) NOT NULL,
    start_date DATETIME2 DEFAULT GETDATE(),
    end_date DATETIME2 NULL,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_promotions_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);
GO

-- ============================================================================
-- STEP 4: INSERT SHARED SEED DATA (SSMS / IDENTITY_INSERT)
-- ============================================================================

-- 1. Users
SET IDENTITY_INSERT users ON;
INSERT INTO users (user_id, name, email, password_hash, phone, role, address, city) VALUES
(1001, 'System Admin', 'admin@freshmart.com', 'admin123', '0709988776', 'ADMIN', '01 Corporate Tower, Colombo 03', 'Colombo'),
(1002, 'Delivery Head', 'delivery@freshmart.com', 'delivery123', '0785566778', 'DEPT_DELIVERY', '23 Delivery Terminal, Dehiwala', 'Colombo'),
(1003, 'Mike Customer', 'mike@example.com', 'pass123', '0771234567', 'CUSTOMER', '88 Lake Drive, Colombo 07', 'Colombo'),
(1004, 'Order Head', 'order@freshmart.com', 'order123', '0719876543', 'DEPT_ORDER', '12 Orders Center, Kadawatha', 'Gampaha'),
(1005, 'Product Head', 'product@freshmart.com', 'product123', '0754433221', 'DEPT_PRODUCT', '10 Warehouse Ave, Maharagama', 'Colombo'),
(1006, 'Rating Head', 'rating@freshmart.com', 'rating123', '0761122334', 'DEPT_RATING', '55 Quality Dept, Colombo 04', 'Colombo'),
(1007, 'John Driver', 'driver@freshmart.com', 'driver123', '0723344556', 'DELIVERY_STAFF', '12 Main Road, Colombo 01', 'Colombo');
SET IDENTITY_INSERT users OFF;
GO

-- 2. Categories
SET IDENTITY_INSERT categories ON;
INSERT INTO categories (category_id, category_name, description) VALUES
(1, 'Fruits', 'Fresh organic and seasonal tropical fruits'),
(2, 'Vegetables', 'Locally sourced farm-fresh vegetables and greens'),
(3, 'Dairy', 'Pasteurized fresh milk, farm eggs, cheese, and butter'),
(4, 'Bakery', 'Freshly baked bread, buns, pastries, and snacks'),
(5, 'Meat', 'Quality meats and seafood'),
(6, 'Beverages', 'Bottled cold brew, fresh juices, tea, and drinks');
SET IDENTITY_INSERT categories OFF;
GO

-- 3. Suppliers
SET IDENTITY_INSERT suppliers ON;
INSERT INTO suppliers (supplier_id, company_name, contact_person, email, phone, address, contract_terms) VALUES
(1, 'Lanka Agri Farms Ltd', 'Sunil Wickrama', 'supply@lankaagri.lk', '0112345678', 'Nuwara Eliya Road, Welimada', 'Net 30 Days, Direct farm delivery'),
(2, 'Highland Dairies Co', 'Kamal Silva', 'orders@highland.lk', '0112876543', 'Industrial Zone, Ambewela', 'Weekly delivery with cold chain storage'),
(3, 'Ceylon Bakers Guild', 'Amara Perera', 'sales@ceylonbakers.lk', '0112765432', 'Station Road, Moratuwa', 'Daily morning stock refresh'),
(4, 'Tropical Fruit Exporters', 'Mahesh Fernando', 'contact@tropicalfruits.lk', '0332244556', 'Negombo Road, Kurunegala', 'Bi-weekly seasonal fruit bulk delivery'),
(5, 'Pure Ceylon Beverages', 'Nimal Rathnayake', 'info@ceylonbeverages.lk', '0112998877', 'Kaduwela Road, Biyagama', 'Consignment inventory model'),
(6, 'Ocean Catch & Poultry Co', 'David Fernando', 'sales@oceancatch.lk', '0112445566', 'Harbour Road, Colombo 15', 'Direct farm and dock supplier');
SET IDENTITY_INSERT suppliers OFF;
GO

-- 4. Products (Includes weights in kg/g and liquids in liters/ml - 18 items matching frontend)
SET IDENTITY_INSERT products ON;
INSERT INTO products (product_id, category_id, supplier_id, product_name, description, unit_price, stock_quantity, unit, image_url) VALUES
(1, 1, 4, 'Organic Avocados', 'Creamy Hass avocados, perfectly ripe. Great for guacamole, toast, or salads.', 3.99, 50.000, 'kg', 'images/products/avocados.jpg'),
(2, 1, 4, 'Fresh Strawberries', 'Sweet, juicy strawberries picked at peak ripeness. Perfect for smoothies and desserts.', 5.49, 35.000, 'kg', 'images/products/strawberries.jpg'),
(3, 1, 4, 'Navel Oranges', 'Sun-ripened navel oranges, hand-picked for quality. Seedless and bursting with citrus flavor.', 4.29, 60.000, 'kg', 'images/products/oranges.jpg'),
(4, 1, 4, 'Red Apples', 'Crisp and sweet Gala apples, perfect for snacking or baking.', 3.79, 80.000, 'kg', 'images/products/apples.jpg'),
(5, 2, 1, 'Broccoli Crown', 'Fresh, green broccoli crowns. Steamed, roasted, or stir-fried — nutritious and delicious.', 2.99, 40.000, 'kg', 'images/products/broccoli.jpg'),
(6, 2, 1, 'Baby Spinach', 'Tender baby spinach leaves, triple-washed and ready to eat. Perfect for salads.', 3.49, 30.000, 'kg', 'images/products/spinach.jpg'),
(7, 2, 1, 'Cherry Tomatoes', 'Vine-ripened cherry tomatoes bursting with sweetness.', 3.29, 45.000, 'kg', 'images/products/tomatoes.jpg'),
(8, 3, 2, 'Organic Whole Milk', 'Farm-fresh organic whole milk from grass-fed cows. Rich and creamy.', 4.99, 25.000, 'liter', 'images/products/milk.jpg'),
(9, 3, 2, 'Free-Range Eggs', 'Farm-fresh free-range eggs. Large, golden yolks perfect for any recipe.', 5.99, 40.000, 'pack', 'images/products/eggs.jpg'),
(10, 4, 3, 'Sourdough Loaf', 'Artisan sourdough bread with a crispy crust and tangy, airy interior.', 6.49, 20.000, 'unit', 'images/products/sourdough.jpg'),
(11, 4, 3, 'Croissants (4-pack)', 'Buttery, flaky French croissants. Golden brown and perfect with morning coffee.', 7.99, 15.000, 'pack', 'images/products/croissants.jpg'),
(12, 5, 6, 'Atlantic Salmon', 'Fresh Atlantic salmon fillet, rich in omega-3. Perfect for grilling or baking.', 12.99, 20.000, 'kg', 'images/products/salmon.jpg'),
(13, 5, 6, 'Chicken Breast', 'Boneless, skinless chicken breasts. Lean protein for healthy meals.', 8.99, 35.000, 'kg', 'images/products/chicken.jpg'),
(14, 6, 5, 'Cold Brew Coffee', 'Smooth, rich cold brew coffee. Low acidity and naturally sweet.', 5.49, 30.000, 'liter', 'images/products/coffee.jpg'),
(15, 6, 5, 'Green Juice Blend', 'Cold-pressed green juice with kale, apple, cucumber, and ginger.', 6.99, 25.000, 'liter', 'images/products/greenjuice.jpg'),
(16, 2, 1, 'Sweet Potatoes', 'Organic sweet potatoes, perfect for roasting or mashing.', 2.49, 55.000, 'kg', 'images/products/sweetpotatoes.jpg'),
(17, 3, 2, 'Greek Yogurt', 'Thick and creamy Greek yogurt. High protein, plain or vanilla.', 4.49, 30.000, 'pack', 'images/products/yogurt.jpg'),
(18, 1, 4, 'Banana Bunch', 'Sweet, ripe bananas. Perfect for smoothies, baking, or a quick snack.', 1.99, 100.000, 'kg', 'images/products/bananas.jpg');
SET IDENTITY_INSERT products OFF;
GO

-- 5. Delivery Configuration (Fixed Flat Rate Settings)
SET IDENTITY_INSERT delivery_config ON;
INSERT INTO delivery_config (config_id, standard_fee, express_fee, scheduled_fee, free_threshold, is_fixed_distance, reason, updated_by) VALUES
(1, 2.99, 4.99, 0.00, 50.00, 1, 'Standard flat rate for all delivery zones (fixed fee regardless of distance)', 'Delivery Head');
SET IDENTITY_INSERT delivery_config OFF;
GO

-- 6. Orders (Matches Frontend Orders Dashboard)
SET IDENTITY_INSERT orders ON;
INSERT INTO orders (order_id, order_code, customer_id, subtotal, delivery_fee, tax, total_amount, order_status, shipping_address, order_date, delivered_at) VALUES
(101, 'ORD-00001', 1003, 29.94, 0.00, 2.98, 34.92, 'DELIVERED', '88 Lake Drive, Colombo 07', '2026-09-02 10:30:00', '2026-09-02 11:45:00'),
(102, 'ORD-00002', 1003, 18.96, 0.00, 1.52, 22.46, 'DELIVERED', '88 Lake Drive, Colombo 07', '2026-09-06 14:15:00', '2026-09-06 15:20:00'),
(103, 'ORD-00003', 1003, 44.46, 0.00, 3.56, 51.88, 'DELIVERED', '15 Temple Road, Negombo', '2026-09-09 09:00:00', '2026-09-09 10:10:00'),
(104, 'ORD-00004', 1003, 12.98, 2.99, 1.04, 15.97, 'SHIPPED', '88 Lake Drive, Colombo 07', '2026-09-14 16:45:00', NULL),
(105, 'ORD-00005', 1003, 23.46, 0.00, 1.88, 27.44, 'PENDING', '88 Lake Drive, Colombo 07', '2026-09-15 11:20:00', NULL);
SET IDENTITY_INSERT orders OFF;
GO

-- 7. Order Items
SET IDENTITY_INSERT order_items ON;
INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price) VALUES
(1, 101, 1, 2.000, 3.49),
(2, 101, 5, 2.000, 4.50),
(3, 101, 6, 1.000, 5.99),
(4, 102, 3, 2.000, 2.49),
(5, 102, 4, 3.000, 1.99),
(6, 103, 2, 4.000, 4.99),
(7, 104, 5, 1.000, 4.50),
(8, 105, 1, 1.500, 3.49);
SET IDENTITY_INSERT order_items OFF;
GO

-- 8. Payments
SET IDENTITY_INSERT payments ON;
INSERT INTO payments (payment_id, payment_code, order_id, payment_method, payment_status, amount, transaction_date) VALUES
(1, 'PAY-00001', 101, 'CARD', 'COMPLETED', 34.92, '2026-09-02 10:32:00'),
(2, 'PAY-00002', 102, 'CARD', 'COMPLETED', 22.46, '2026-09-06 14:16:00'),
(3, 'PAY-00003', 103, 'CARD', 'COMPLETED', 51.88, '2026-09-09 09:05:00'),
(4, 'PAY-00004', 104, 'COD', 'PENDING', 15.97, '2026-09-14 16:50:00'),
(5, 'PAY-00005', 105, 'CARD', 'PENDING', 27.44, '2026-09-15 11:22:00');
SET IDENTITY_INSERT payments OFF;
GO

-- 9. Deliveries (Directly synced with orders to match Delivery Dashboard)
SET IDENTITY_INSERT deliveries ON;
INSERT INTO deliveries (delivery_id, delivery_code, order_id, assigned_staff_id, delivery_status, scheduled_time, delivered_at, delivery_notes) VALUES
(1, 'DEL-00001', 101, 1007, 'DELIVERED', '2026-09-02 11:30:00', '2026-09-02 11:45:00', 'Handed to customer'),
(2, 'DEL-00002', 102, 1007, 'DELIVERED', '2026-09-06 15:00:00', '2026-09-06 15:20:00', 'Gate drop-off confirmed'),
(3, 'DEL-00003', 103, 1007, 'DELIVERED', '2026-09-09 10:00:00', '2026-09-09 10:10:00', 'Delivered on priority express'),
(4, 'DEL-00004', 104, 1007, 'IN_TRANSIT', '2026-09-14 17:30:00', NULL, 'Rider out for delivery'),
(5, 'DEL-00005', 105, NULL, 'SCHEDULED', '2026-09-15 12:30:00', NULL, 'Awaiting driver assignment');
SET IDENTITY_INSERT deliveries OFF;
GO

-- 10. Reviews
SET IDENTITY_INSERT product_reviews ON;
INSERT INTO product_reviews (review_id, product_id, customer_id, rating, review_text) VALUES
(1, 1, 1003, 5, 'Super fresh and juicy oranges! Weight was exact.'),
(2, 5, 1003, 4, 'Pasteurized milk delivered cold and fresh.'),
(3, 7, 1003, 5, 'Best artisan sourdough loaf in town.'),
(4, 2, 1003, 5, 'Crisp apples, perfect sweetness.'),
(5, 8, 1003, 4, 'Very smooth cold brew coffee flavor.');
SET IDENTITY_INSERT product_reviews OFF;
GO

-- 11. Inquiries
SET IDENTITY_INSERT user_inquiries ON;
INSERT INTO user_inquiries (inquiry_id, customer_id, subject, message, department, status, admin_response) VALUES
(1, 1003, 'Order Delivery Time', 'Can I request early morning delivery for my milk orders?', 'DELIVERY', 'ANSWERED', 'Yes, our 2-hour delivery window starts from 7:00 AM daily.'),
(2, 1003, 'Organic Freshness Guarantee', 'Are the oranges sourced directly from organic orchards?', 'PRODUCT', 'RESOLVED', 'All organic fruits are verified farm-to-table.');
SET IDENTITY_INSERT user_inquiries OFF;
GO

-- ============================================================================
-- STEP 5: T-SQL STORED PROCEDURES, FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Calculate Customer Total Spending
IF OBJECT_ID('dbo.fn_CalculateCustomerTotalSpend', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_CalculateCustomerTotalSpend;
GO

CREATE FUNCTION dbo.fn_CalculateCustomerTotalSpend (@p_customer_id INT)
RETURNS DECIMAL(10, 2)
AS
BEGIN
    DECLARE @v_total_spend DECIMAL(10, 2);
    
    SELECT @v_total_spend = ISNULL(SUM(total_amount), 0.00)
    FROM orders
    WHERE customer_id = @p_customer_id AND order_status <> 'CANCELLED';
    
    RETURN @v_total_spend;
END;
GO

-- Stored Procedure: Place New Order with Stock Check
IF OBJECT_ID('dbo.sp_ProcessNewOrder', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ProcessNewOrder;
GO

CREATE PROCEDURE dbo.sp_ProcessNewOrder
    @p_customer_id INT,
    @p_product_id INT,
    @p_quantity DECIMAL(10, 3),
    @p_shipping_address NVARCHAR(MAX),
    @p_payment_method NVARCHAR(20),
    @p_generated_order_id INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @v_unit_price DECIMAL(10, 2);
    DECLARE @v_current_stock DECIMAL(10, 3);
    DECLARE @v_order_total DECIMAL(10, 2);

    -- 1. Check Product availability and stock
    SELECT @v_unit_price = unit_price, @v_current_stock = stock_quantity
    FROM products
    WHERE product_id = @p_product_id;

    IF @v_unit_price IS NULL
    BEGIN
        RAISERROR('Error: Product does not exist!', 16, 1);
        RETURN;
    END

    IF @v_current_stock < @p_quantity
    BEGIN
        RAISERROR('Error: Insufficient stock available!', 16, 1);
        RETURN;
    END

    -- 2. Calculate Total
    SET @v_order_total = @v_unit_price * @p_quantity;

    -- 3. Create Order
    INSERT INTO orders (customer_id, subtotal, delivery_fee, tax, total_amount, order_status, shipping_address)
    VALUES (@p_customer_id, @v_order_total, 2.99, (@v_order_total * 0.08), (@v_order_total + 2.99 + (@v_order_total * 0.08)), 'CONFIRMED', @p_shipping_address);

    SET @p_generated_order_id = SCOPE_IDENTITY();
    UPDATE orders SET order_code = 'ORD-' + RIGHT('00000' + CAST(@p_generated_order_id AS VARCHAR(10)), 5) WHERE order_id = @p_generated_order_id;

    -- 4. Create Order Item
    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
    VALUES (@p_generated_order_id, @p_product_id, @p_quantity, @v_unit_price);

    -- 5. Create Payment
    INSERT INTO payments (payment_code, order_id, payment_method, payment_status, amount)
    VALUES ('PAY-' + RIGHT('00000' + CAST(@p_generated_order_id AS VARCHAR(10)), 5), @p_generated_order_id, @p_payment_method, 'COMPLETED', (@v_order_total + 2.99 + (@v_order_total * 0.08)));

    -- 6. Create Delivery
    INSERT INTO deliveries (delivery_code, order_id, assigned_staff_id, delivery_status, scheduled_time)
    VALUES ('DEL-' + RIGHT('00000' + CAST(@p_generated_order_id AS VARCHAR(10)), 5), @p_generated_order_id, 1007, 'SCHEDULED', DATEADD(HOUR, 2, GETDATE()));
END;
GO

-- Trigger: Automatically Deduct Stock and Log in Audit Trail
IF OBJECT_ID('dbo.trg_AfterOrderItemInsert_DeductStock', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_AfterOrderItemInsert_DeductStock;
GO

CREATE TRIGGER dbo.trg_AfterOrderItemInsert_DeductStock
ON order_items
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Deduct stock
    UPDATE p
    SET p.stock_quantity = p.stock_quantity - i.quantity
    FROM products p
    INNER JOIN inserted i ON p.product_id = i.product_id;

    -- Audit log
    INSERT INTO inventory_audit_log (product_id, action_type, old_quantity, new_quantity, change_reason)
    SELECT 
        i.product_id,
        'STOCK_DEDUCT_SALE',
        p.stock_quantity + i.quantity,
        p.stock_quantity,
        'Order ID: ' + CAST(i.order_id AS NVARCHAR(20)) + ' placed for quantity ' + CAST(i.quantity AS NVARCHAR(20))
    FROM inserted i
    INNER JOIN products p ON i.product_id = p.product_id;
END;
GO

-- ============================================================================
-- STEP 6: VERIFICATION SELECT STATEMENTS (TEST IN SSMS)
-- ============================================================================
PRINT '>> Verifying [FreshMartDB] Tables in SSMS:';
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_products FROM products;
SELECT COUNT(*) AS total_orders FROM orders;
SELECT COUNT(*) AS total_deliveries FROM deliveries;
SELECT * FROM delivery_config;
GO
