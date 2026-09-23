-- ============================================================================
-- SRI LANKA INSTITUTE OF INFORMATION TECHNOLOGY (SLIIT)
-- Faculty of Computing | Department of Information Technology
-- Course Unit: Database Management Systems / Object Oriented Programming
-- Project: Online Grocery Ordering & Delivery Management System (FreshMart)
-- Database Script: Complete Parts B, C, D, E, and F Implementation
-- ============================================================================

DROP DATABASE IF EXISTS freshmart_db;
CREATE DATABASE freshmart_db;
USE freshmart_db;

-- ============================================================================
-- PART B: SQL DDL IMPLEMENTATION (20%)
-- 1. CREATE TABLE statements for all system entities
-- 2. Primary Keys, Foreign Keys, Referential Actions & Integrity Constraints
-- 3. Normalized 3NF Schema Refinement
-- ============================================================================

-- 1. Table: users (Handles Customers, Store Managers, Inventory Officers, Delivery Staff, System Admins)
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role ENUM('CUSTOMER', 'STORE_MANAGER', 'INVENTORY_OFFICER', 'DELIVERY_SUPERVISOR', 'DELIVERY_STAFF', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    address TEXT,
    city VARCHAR(50) DEFAULT 'Colombo',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table: categories (Grocery product classification)
CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table: suppliers (Wholesale vendors and grocery distributors)
CREATE TABLE suppliers (
    supplier_id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(100) NOT NULL UNIQUE,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    contract_terms TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table: products (Grocery catalog inventory items)
CREATE TABLE products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT,
    supplier_id INT,
    product_name VARCHAR(100) NOT NULL,
    description TEXT,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2) NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'unit',
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_product_price CHECK (unit_price > 0),
    CONSTRAINT chk_product_stock CHECK (stock_quantity >= 0),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL
);

-- 5. Table: shopping_carts (Active persistent carts per customer)
CREATE TABLE shopping_carts (
    cart_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_customer FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 6. Table: cart_items (Line items within customer cart)
CREATE TABLE cart_items (
    cart_item_id INT PRIMARY KEY AUTO_INCREMENT,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_cart_quantity CHECK (quantity > 0),
    CONSTRAINT uq_cart_product UNIQUE (cart_id, product_id),
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES shopping_carts(cart_id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 7. Table: orders (Customer placed checkout orders)
CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    order_status ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    shipping_address TEXT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_order_total CHECK (total_amount >= 0),
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users(user_id)
);

-- 8. Table: order_items (Ordered line items snapshot)
CREATE TABLE order_items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    CONSTRAINT chk_order_item_qty CHECK (quantity > 0),
    CONSTRAINT chk_order_item_price CHECK (unit_price >= 0),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- 9. Table: payments (Financial transactions for orders)
CREATE TABLE payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL UNIQUE,
    payment_method ENUM('CARD', 'COD', 'BANK_TRANSFER') NOT NULL,
    payment_status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    amount DECIMAL(10, 2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_payment_amount CHECK (amount > 0),
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- 10. Table: deliveries (Logistics dispatch and rider assignment)
CREATE TABLE deliveries (
    delivery_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL UNIQUE,
    assigned_staff_id INT,
    delivery_status ENUM('SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    scheduled_time DATETIME,
    delivered_at DATETIME,
    delivery_notes VARCHAR(255),
    CONSTRAINT fk_deliveries_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_deliveries_staff FOREIGN KEY (assigned_staff_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 11. Table: product_reviews (Customer ratings and feedback)
CREATE TABLE product_reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    customer_id INT NOT NULL,
    rating INT NOT NULL,
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 12. Table: user_inquiries (Customer support and ticket management)
CREATE TABLE user_inquiries (
    inquiry_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    subject VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    department ENUM('ORDER_SUPPORT', 'BILLING', 'DELIVERY', 'PRODUCT_QUALITY', 'GENERAL') NOT NULL DEFAULT 'GENERAL',
    status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inquiries_customer FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 13. Table: inventory_audit_log (Audit trail for automated triggers)
CREATE TABLE inventory_audit_log (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    old_quantity INT,
    new_quantity INT,
    change_reason VARCHAR(255),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================================
-- PART C: INSERT SAMPLE DATA (10%)
-- Insert at least 5 valid records per table respecting integrity constraints
-- ============================================================================

-- 1. Insert into users (6 records: 3 Customers, 1 Admin, 1 Inventory Officer, 1 Delivery Staff)
INSERT INTO users (user_id, name, email, password_hash, phone, role, address, city) VALUES
(1, 'Kavindu Wickramasinghe', 'kavindu@freshmart.lk', 'hashed_pwd_001', '0771234567', 'CUSTOMER', '45 Galle Road, Bambalapitiya', 'Colombo'),
(2, 'Dinithi Perera', 'dinithi@freshmart.lk', 'hashed_pwd_002', '0719876543', 'CUSTOMER', '12 Kandy Road, Kadawatha', 'Gampaha'),
(3, 'Ravindu Jayasuriya', 'ravindu@freshmart.lk', 'hashed_pwd_003', '0754433221', 'CUSTOMER', '88 Main Street, Nugegoda', 'Colombo'),
(4, 'Nimesha Sandamini', 'nimesha@freshmart.lk', 'hashed_pwd_004', '0761122334', 'INVENTORY_OFFICER', '10 Store Ave, Maharagama', 'Colombo'),
(5, 'Sachini Fernando', 'sachini@freshmart.lk', 'hashed_pwd_005', '0785566778', 'DELIVERY_STAFF', '23 Temple Rd, Dehiwala', 'Colombo'),
(6, 'Tharindu Deshan', 'tharindu@freshmart.lk', 'hashed_pwd_006', '0709988776', 'ADMIN', '01 Corporate Tower, Colombo 03', 'Colombo');

-- 2. Insert into categories (5 records)
INSERT INTO categories (category_id, category_name, description) VALUES
(1, 'Fresh Vegetables', 'Locally sourced farm-fresh vegetables and greens'),
(2, 'Fresh Fruits', 'Fresh organic and seasonal tropical fruits'),
(3, 'Dairy & Eggs', 'Pasteurized fresh milk, farm eggs, cheese, and butter'),
(4, 'Bakery & Snacks', 'Freshly baked bread, buns, pastries, and packaged biscuits'),
(5, 'Beverages & Drinks', 'Bottled juices, tea, coffee, and mineral water');

-- 3. Insert into suppliers (5 records)
INSERT INTO suppliers (supplier_id, company_name, contact_person, email, phone, address, contract_terms) VALUES
(1, 'Lanka Agri Farms Ltd', 'Sunil Wickrama', 'supply@lankaagri.lk', '0112345678', 'Nuwara Eliya Road, Welimada', 'Net 30 Days, Direct farm delivery'),
(2, 'Highland Dairies Co', 'Kamal Silva', 'orders@highland.lk', '0112876543', 'Industrial Zone, Ambewela', 'Weekly delivery with cold chain storage'),
(3, 'Ceylon Bakers Guild', 'Amara Perera', 'sales@ceylonbakers.lk', '0112765432', 'Station Road, Moratuwa', 'Daily morning stock refresh'),
(4, 'Tropical Fruit Exporters', 'Mahesh Fernando', 'contact@tropicalfruits.lk', '0332244556', 'Negombo Road, Kurunegala', 'Bi-weekly seasonal fruit bulk delivery'),
(5, 'Pure Ceylon Beverages', 'Nimal Rathnayake', 'info@ceylonbeverages.lk', '0112998877', 'Kaduwela Road, Biyagama', 'Consignment inventory model');

-- 4. Insert into products (6 records)
INSERT INTO products (product_id, category_id, supplier_id, product_name, description, unit_price, stock_quantity, unit, image_url) VALUES
(1, 1, 1, 'Organic Carrots 500g', 'Farm fresh organic carrots from Nuwara Eliya', 250.00, 80, 'pack', 'carrots.jpg'),
(2, 1, 1, 'Fresh Red Onions 1kg', 'Locally harvested dry red onions', 550.00, 120, 'kg', 'onions.jpg'),
(3, 2, 4, 'Cavendish Bananas 1kg', 'Sweet naturally ripened bananas', 320.00, 60, 'kg', 'bananas.jpg'),
(4, 3, 2, 'Fresh Pasteurized Milk 1L', 'Full cream fresh dairy milk in carton', 480.00, 45, 'bottle', 'milk.jpg'),
(5, 4, 3, 'Whole Wheat Sandwich Bread', 'Nutritious fiber-rich loaf bread', 220.00, 30, 'loaf', 'bread.jpg'),
(6, 5, 5, 'Ceylon Green Tea 100g', 'Premium pure Ceylon green tea leaves in box', 750.00, 50, 'box', 'greentea.jpg');

-- 5. Insert into shopping_carts (5 records)
INSERT INTO shopping_carts (cart_id, customer_id) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5);

-- 6. Insert into cart_items (5 records)
INSERT INTO cart_items (cart_item_id, cart_id, product_id, quantity) VALUES
(1, 1, 1, 2),
(2, 1, 4, 1),
(3, 2, 2, 1),
(4, 2, 5, 3),
(5, 3, 6, 2);

-- 7. Insert into orders (5 records)
INSERT INTO orders (order_id, customer_id, total_amount, order_status, shipping_address, order_date) VALUES
(101, 1, 980.00, 'DELIVERED', '45 Galle Road, Bambalapitiya, Colombo', '2026-08-20 10:30:00'),
(102, 2, 1210.00, 'SHIPPED', '12 Kandy Road, Kadawatha, Gampaha', '2026-08-22 14:15:00'),
(103, 3, 1500.00, 'CONFIRMED', '88 Main Street, Nugegoda, Colombo', '2026-08-24 09:00:00'),
(104, 1, 800.00, 'PROCESSING', '45 Galle Road, Bambalapitiya, Colombo', '2026-08-25 16:45:00'),
(105, 2, 2400.00, 'PENDING', '12 Kandy Road, Kadawatha, Gampaha', '2026-08-26 11:20:00');

-- 8. Insert into order_items (8 records)
INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price) VALUES
(1, 101, 1, 2, 250.00), -- 500.00
(2, 101, 4, 1, 480.00), -- 480.00 (Total = 980.00)
(3, 102, 2, 1, 550.00), -- 550.00
(4, 102, 5, 3, 220.00), -- 660.00 (Total = 1210.00)
(5, 103, 6, 2, 750.00), -- 1500.00 (Total = 1500.00)
(6, 104, 3, 2, 320.00), -- 640.00
(7, 104, 1, 1, 250.00), -- 250.00
(8, 105, 4, 5, 480.00); -- 2400.00 (Total = 2400.00)

-- 9. Insert into payments (5 records)
INSERT INTO payments (payment_id, order_id, payment_method, payment_status, amount, transaction_date) VALUES
(1, 101, 'CARD', 'COMPLETED', 980.00, '2026-08-20 10:32:00'),
(2, 102, 'COD', 'PENDING', 1210.00, '2026-08-22 14:16:00'),
(3, 103, 'CARD', 'COMPLETED', 1500.00, '2026-08-24 09:05:00'),
(4, 104, 'BANK_TRANSFER', 'COMPLETED', 800.00, '2026-08-25 16:50:00'),
(5, 105, 'CARD', 'PENDING', 2400.00, '2026-08-26 11:22:00');

-- 10. Insert into deliveries (5 records)
INSERT INTO deliveries (delivery_id, order_id, assigned_staff_id, delivery_status, scheduled_time, delivered_at, delivery_notes) VALUES
(1, 101, 5, 'DELIVERED', '2026-08-20 12:00:00', '2026-08-20 11:45:00', 'Delivered to gate security'),
(2, 102, 5, 'IN_TRANSIT', '2026-08-22 16:00:00', NULL, 'Customer requested call before arrival'),
(3, 103, 5, 'SCHEDULED', '2026-08-24 13:00:00', NULL, 'Standard morning delivery route'),
(4, 104, 5, 'SCHEDULED', '2026-08-25 18:00:00', NULL, 'Fragile packaging required'),
(5, 105, NULL, 'SCHEDULED', '2026-08-26 14:00:00', NULL, 'Awaiting payment confirmation');

-- 11. Insert into product_reviews (5 records)
INSERT INTO product_reviews (review_id, product_id, customer_id, rating, review_text) VALUES
(1, 1, 1, 5, 'Very fresh and crispy carrots! Excellent quality.'),
(2, 4, 1, 4, 'Good quality pasteurized milk, delivered cold.'),
(3, 2, 2, 4, 'Onions were dry and clean. Fair price.'),
(4, 5, 2, 5, 'Soft and fresh whole wheat bread. Loved it.'),
(5, 6, 3, 5, 'Authentic Ceylon green tea aroma. Highly recommended.');

-- 12. Insert into user_inquiries (5 records)
INSERT INTO user_inquiries (inquiry_id, customer_id, subject, message, department, status) VALUES
(1, 1, 'Delivery Tracking Issue', 'My delivery status was not updated immediately.', 'DELIVERY', 'RESOLVED'),
(2, 2, 'Organic Certification Inquiry', 'Are the carrots certified organic by SLAAS?', 'PRODUCT_QUALITY', 'RESOLVED'),
(3, 3, 'Bulk Order Discounts', 'Do you offer bulk discounts for green tea boxes?', 'ORDER_SUPPORT', 'IN_PROGRESS'),
(4, 1, 'Payment Receipt Request', 'Please resend the PDF invoice for Order 101.', 'BILLING', 'CLOSED'),
(5, 2, 'Vegetable Freshness Guarantee', 'Great service! Would like to know daily supply times.', 'GENERAL', 'OPEN');

-- Verification Queries (For SLIIT Viva & Report Screenshots):
SELECT * FROM users;
SELECT * FROM categories;
SELECT * FROM suppliers;
SELECT * FROM products;
SELECT * FROM shopping_carts;
SELECT * FROM cart_items;
SELECT * FROM orders;
SELECT * FROM order_items;
SELECT * FROM payments;
SELECT * FROM deliveries;
SELECT * FROM product_reviews;
SELECT * FROM user_inquiries;


-- ============================================================================
-- PART D: SQL QUERIES & OUTPUTS (20%)
-- 5 Queries: Simple SELECT, Multi-Table JOIN, Aggregation, GROUP BY / HAVING, Subquery
-- ============================================================================

-- Query 1: Simple SELECT with Filtering and Sorting
-- Purpose: Retrieve all active grocery products having stock greater than 40, sorted by unit price descending.
SELECT 
    product_id, 
    product_name, 
    unit_price, 
    stock_quantity, 
    unit 
FROM products 
WHERE is_available = TRUE AND stock_quantity > 40
ORDER BY unit_price DESC;

-- Query 2: Multi-Table JOIN Query (4 Tables)
-- Purpose: Generate a comprehensive Customer Order Dispatch Summary linking Orders, Users (Customer), Payments, and Deliveries.
SELECT 
    o.order_id,
    u.name AS customer_name,
    u.phone AS customer_phone,
    o.total_amount,
    p.payment_method,
    p.payment_status,
    d.delivery_status,
    d.scheduled_time
FROM orders o
INNER JOIN users u ON o.customer_id = u.user_id
INNER JOIN payments p ON o.order_id = p.order_id
LEFT JOIN deliveries d ON o.order_id = d.order_id
ORDER BY o.order_id ASC;

-- Query 3: Aggregation Query
-- Purpose: Calculate overall sales performance metrics across all completed/processed orders.
SELECT 
    COUNT(order_id) AS total_orders_placed,
    SUM(total_amount) AS gross_revenue,
    AVG(total_amount) AS average_order_value,
    MIN(total_amount) AS lowest_order_amount,
    MAX(total_amount) AS highest_order_amount
FROM orders;

-- Query 4: GROUP BY and HAVING Query
-- Purpose: Categorize product sales volume and total revenue per category, filtering only categories that generated more than Rs. 1,000 in revenue.
SELECT 
    c.category_name,
    COUNT(DISTINCT p.product_id) AS total_distinct_products,
    SUM(oi.quantity) AS total_units_sold,
    SUM(oi.quantity * oi.unit_price) AS total_category_revenue
FROM categories c
INNER JOIN products p ON c.category_id = p.category_id
INNER JOIN order_items oi ON p.product_id = oi.product_id
GROUP BY c.category_id, c.category_name
HAVING total_category_revenue > 1000.00
ORDER BY total_category_revenue DESC;

-- Query 5: Subquery / Nested Query
-- Purpose: Find all products whose unit price is strictly higher than the average unit price of all products across the entire grocery store.
SELECT 
    p.product_id,
    p.product_name,
    c.category_name,
    p.unit_price,
    (SELECT ROUND(AVG(unit_price), 2) FROM products) AS overall_store_avg_price
FROM products p
LEFT JOIN categories c ON p.category_id = c.category_id
WHERE p.unit_price > (SELECT AVG(unit_price) FROM products)
ORDER BY p.unit_price DESC;


-- ============================================================================
-- PART E: STORED FUNCTION / STORED PROCEDURE (15%)
-- ============================================================================

-- Stored Function: fn_CalculateCustomerTotalSpend
-- Purpose: Calculates and returns the cumulative lifetime spending for any given customer ID.
DELIMITER //
DROP FUNCTION IF EXISTS fn_CalculateCustomerTotalSpend //
CREATE FUNCTION fn_CalculateCustomerTotalSpend(p_customer_id INT)
RETURNS DECIMAL(10, 2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total_spend DECIMAL(10, 2) DEFAULT 0.00;
    
    SELECT IFNULL(SUM(total_amount), 0.00)
    INTO v_total_spend
    FROM orders
    WHERE customer_id = p_customer_id AND order_status != 'CANCELLED';
    
    RETURN v_total_spend;
END //
DELIMITER ;

-- Stored Procedure: sp_ProcessNewOrder
-- Purpose: Stored procedure to place an order, create order item, and calculate order total safely.
DELIMITER //
DROP PROCEDURE IF EXISTS sp_ProcessNewOrder //
CREATE PROCEDURE sp_ProcessNewOrder(
    IN p_customer_id INT,
    IN p_product_id INT,
    IN p_quantity INT,
    IN p_shipping_address TEXT,
    IN p_payment_method VARCHAR(20),
    OUT p_generated_order_id INT
)
BEGIN
    DECLARE v_unit_price DECIMAL(10, 2);
    DECLARE v_current_stock INT;
    DECLARE v_order_total DECIMAL(10, 2);

    -- 1. Check product availability and price
    SELECT unit_price, stock_quantity 
    INTO v_unit_price, v_current_stock
    FROM products 
    WHERE product_id = p_product_id;

    IF v_unit_price IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Product does not exist!';
    END IF;

    IF v_current_stock < p_quantity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Insufficient stock available!';
    END IF;

    -- 2. Calculate Total
    SET v_order_total = v_unit_price * p_quantity;

    -- 3. Insert into orders table
    INSERT INTO orders (customer_id, total_amount, order_status, shipping_address)
    VALUES (p_customer_id, v_order_total, 'CONFIRMED', p_shipping_address);

    SET p_generated_order_id = LAST_INSERT_ID();

    -- 4. Insert into order_items table
    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
    VALUES (p_generated_order_id, p_product_id, p_quantity, v_unit_price);

    -- 5. Insert into payments table
    INSERT INTO payments (order_id, payment_method, payment_status, amount)
    VALUES (p_generated_order_id, p_payment_method, 'COMPLETED', v_order_total);

    -- 6. Insert initial delivery entry
    INSERT INTO deliveries (order_id, assigned_staff_id, delivery_status, scheduled_time)
    VALUES (p_generated_order_id, 5, 'SCHEDULED', DATE_ADD(NOW(), INTERVAL 2 HOUR));

END //
DELIMITER ;

-- Test Execution of Stored Function:
SELECT 
    user_id, 
    name, 
    email, 
    fn_CalculateCustomerTotalSpend(user_id) AS lifetime_spending
FROM users 
WHERE role = 'CUSTOMER';

-- Test Execution of Stored Procedure:
CALL sp_ProcessNewOrder(1, 2, 2, '45 Galle Road, Colombo', 'CARD', @new_order_id);
SELECT @new_order_id AS generated_order_id;
SELECT * FROM orders WHERE order_id = @new_order_id;
SELECT * FROM order_items WHERE order_id = @new_order_id;


-- ============================================================================
-- PART F: TRIGGERS (15%)
-- Trigger 1: Data Audit & Automatic Stock Deduction Trigger
-- Trigger 2: Data Validation Trigger (Prevent negative or zero product price)
-- ============================================================================

-- Trigger 1: trg_AfterOrderItemInsert_DeductStock
-- Purpose: Automatically deducts product inventory stock upon order placement and logs transaction in inventory_audit_log
DELIMITER //
DROP TRIGGER IF EXISTS trg_AfterOrderItemInsert_DeductStock //
CREATE TRIGGER trg_AfterOrderItemInsert_DeductStock
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    DECLARE v_prev_stock INT;
    
    -- Get previous stock level
    SELECT stock_quantity INTO v_prev_stock
    FROM products
    WHERE product_id = NEW.product_id;
    
    -- Update product stock
    UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE product_id = NEW.product_id;
    
    -- Log into inventory audit trail
    INSERT INTO inventory_audit_log (product_id, action_type, old_quantity, new_quantity, change_reason)
    VALUES (
        NEW.product_id, 
        'STOCK_DEDUCT_SALE', 
        v_prev_stock, 
        (v_prev_stock - NEW.quantity), 
        CONCAT('Order ID: ', NEW.order_id, ' placed for quantity ', NEW.quantity)
    );
END //
DELIMITER ;

-- Trigger 2: trg_BeforeProductInsert_ValidatePrice
-- Purpose: Validates that unit price and stock are valid before insertion
DELIMITER //
DROP TRIGGER IF EXISTS trg_BeforeProductInsert_ValidatePrice //
CREATE TRIGGER trg_BeforeProductInsert_ValidatePrice
BEFORE INSERT ON products
FOR EACH ROW
BEGIN
    IF NEW.unit_price <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Trigger Validation Error: Product unit price must be strictly positive!';
    END IF;
    
    IF NEW.stock_quantity < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Trigger Validation Error: Initial stock quantity cannot be negative!';
    END IF;
END //
DELIMITER ;

-- Demonstration and Verification of Triggers:
-- 1. Check stock of product 1 before transaction
SELECT product_id, product_name, stock_quantity FROM products WHERE product_id = 1;

-- 2. Insert test order item which fires the AFTER INSERT trigger
INSERT INTO orders (order_id, customer_id, total_amount, order_status, shipping_address)
VALUES (999, 1, 500.00, 'CONFIRMED', 'Test Address, Colombo');

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
VALUES (999, 1, 2, 250.00);

-- 3. Verify stock was automatically reduced (from 80 to 78) and audit log record was created:
SELECT product_id, product_name, stock_quantity FROM products WHERE product_id = 1;
SELECT * FROM inventory_audit_log;

-- ============================================================================
-- END OF SQL SCRIPT
-- ============================================================================
