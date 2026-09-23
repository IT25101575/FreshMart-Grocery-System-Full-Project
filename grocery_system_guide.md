# 🛒 Grocery Ordering System — Group Project Architectural & Implementation Blueprint

This document provides a complete guide for developing your **Grocery Ordering System** using **Java (OOP)**, **SQL**, **HTML/CSS**, and **Git/GitHub**, specifically tailored to the OOP topics covered in your curriculum and following strict **CRUD (Create, Read, Update, Delete)** operations for all 6 modules.

---

## 📌 Executive Summary & 1-to-1 Student File Mapping (Zero Shared Files)

**Yes, Student 2 can combine Product and Category into a single `ProductRepository.java` file!** Because Student 2 owns both Product Management and Category Management, putting them in one repository file keeps their code simple and consolidated.

Here is the simplified 1-to-1 file distribution for all 6 group members:

| Member | Main Function | Sub-Functions | Exclusive Repository Class | Exclusive Service Class | Exclusive JS File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Student 1** | **Customer Account Management** | • Create Account<br>• View Profile<br>• Update Profile<br>• Delete Account | `CustomerRepository.java` | `CustomerService.java` | `account.js` |
| **Student 2** | **Product Management** | • Add Product<br>• Update Product<br>• Delete Product<br>• Manage Categories & Stock | `ProductRepository.java` *(Handles Products & Categories)* | `ProductService.java` | `product-admin.js` |
| **Student 3** | **Product Search & Browse** | • View Catalog<br>• Search Products<br>• Filter by Category<br>• View Product Details | `ProductCatalogRepository.java` | `ProductSearchService.java` | `product-browse.js` |
| **Student 4** | **Shopping Cart Management** | • Add Item<br>• View Cart<br>• Update Quantity<br>• Remove Item | `CartRepository.java` | `CartService.java` | `cart.js` |
| **Student 5** | **Order Management** | • Create Order<br>• View Order Details<br>• Update Order Status<br>• Cancel Order / History | `OrderRepository.java` | `OrderService.java` | `order.js` |
| **Student 6** | **Payment & Delivery Management**| • Payment Record<br>• Update Payment Status<br>• Delivery Schedule<br>• Delivery Status & Cancel | `PaymentDeliveryRepository.java` *(Handles Payments & Deliveries)* | `PaymentDeliveryService.java` | `payment-delivery.js` |

---

## ⚡ 1. Standardizing CRUD with Java Generics & DAO Pattern

To enforce clean OOP principles across all 6 group members, use a **Generic Repository Interface** implemented independently by each student:

```java
package com.grocery.repository;

import java.util.List;
import com.grocery.exception.DatabaseException;

/**
 * Generic CRUD Repository Interface
 * @param <T> Entity type (e.g., Customer, Product, Order)
 * @param <ID> Primary Key type (e.g., Integer, String)
 */
public interface Repository<T, ID> {
    // CREATE
    void create(T entity) throws DatabaseException;

    // READ
    T readById(ID id) throws DatabaseException;
    List<T> readAll() throws DatabaseException;

    // UPDATE
    void update(T entity) throws DatabaseException;

    // DELETE
    void delete(ID id) throws DatabaseException;
}
```

---

## 🏗️ 2. Mapping Curriculum OOP Concepts to the Project

Your project strictly leverages the 5 main OOP topics and advanced Java concepts taught in your syllabus:

### A. Classes, Objects, Abstraction & Encapsulation
- **Encapsulation**: All fields (`private`), exposed through public getters and setters. Data validation inside setters (e.g., price cannot be negative, quantity > 0).
- **Constructors & Constructor Chaining (`this(...)`)**: Use default and parameterized constructors, chaining them for flexible object instantiation.
  ```java
  public class Customer extends User {
      private String address;

      public Customer(int id, String name, String email) {
          this(id, name, email, "N/A"); // Constructor chaining
      }

      public Customer(int id, String name, String email, String address) {
          super(id, name, email, "CUSTOMER");
          this.address = address;
      }
  }
  ```

### B. Inheritance & User Hierarchy
- **Abstract Base Class (`User`)**: Generalized attributes for all system users (Customers, Store Managers, Inventory Officers, Delivery Staff, Delivery Supervisors).
- **Polymorphic Behavior**: Overriding methods like `getRolePermissions()` or `getProfileSummary()`.

```
                ┌──────────────────────────────────┐
                │          abstract User           │
                └────────────────┬─────────────────┘
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     │                           │                           │
┌────┴────────┐         ┌────────┴─────────┐       ┌─────────┴────────┐
│  Customer   │         │   StaffUser      │       │ SystemAdmin      │
└─────────────┘         └────────┬─────────┘       └──────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
        ┌────────┴─────────┐           ┌─────────┴──────────┐
        │ InventoryOfficer │           │ DeliverySupervisor │
        └──────────────────┘           └─────────┬──────────┘
                                                 │
                                       ┌─────────┴──────────┐
                                       │   DeliveryStaff    │
                                       └────────────────────┘
```

---

## 🗄️ 3. Database Schema (SQL Blueprint)

```sql
-- 1. Users & Accounts (Student 1 CRUD)
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('CUSTOMER', 'STORE_MANAGER', 'INVENTORY_OFFICER', 'DELIVERY_SUPERVISOR', 'DELIVERY_STAFF', 'ADMIN') NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories & Products (Student 2 Admin CRUD & Student 3 Read/Search)
CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'unit',
    image_url VARCHAR(255),
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

-- 3. Shopping Cart (Student 4 CRUD)
CREATE TABLE shopping_carts (
    cart_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT UNIQUE NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE cart_items (
    cart_item_id INT PRIMARY KEY AUTO_INCREMENT,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    FOREIGN KEY (cart_id) REFERENCES shopping_carts(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 4. Orders (Student 5 CRUD)
CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    order_status ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
    shipping_address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id)
);

CREATE TABLE order_items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- 5. Payment & Delivery (Student 6 CRUD)
CREATE TABLE payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT UNIQUE NOT NULL,
    payment_method ENUM('CARD', 'COD', 'BANK_TRANSFER') NOT NULL,
    payment_status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    amount DECIMAL(10, 2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

CREATE TABLE deliveries (
    delivery_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT UNIQUE NOT NULL,
    assigned_staff_id INT,
    delivery_status ENUM('SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED') DEFAULT 'SCHEDULED',
    scheduled_time DATETIME,
    delivered_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_staff_id) REFERENCES users(user_id) ON DELETE SET NULL
);
```

---

## 📁 4. Simplified Project Directory Architecture (1 Repository per Student)

```
grocery-ordering-system/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/grocery/
│   │   │       ├── model/                     # Shared OOP Entities (User, Product, Order, etc.)
│   │   │       │   ├── User.java
│   │   │       │   ├── Customer.java
│   │   │       │   ├── Product.java
│   │   │       │   ├── Category.java
│   │   │       │   ├── CartItem.java
│   │   │       │   ├── ShoppingCart.java
│   │   │       │   ├── Order.java
│   │   │       │   ├── Payment.java
│   │   │       │   └── Delivery.java
│   │   │       ├── repository/                # 1 Repository File per Student
│   │   │       │   ├── Repository.java        (Shared Generic Interface)
│   │   │       │   ├── CustomerRepository.java       (Student 1)
│   │   │       │   ├── ProductRepository.java        (Student 2 - Products & Categories)
│   │   │       │   ├── ProductCatalogRepository.java (Student 3 - Search & Browse)
│   │   │       │   ├── CartRepository.java           (Student 4)
│   │   │       │   ├── OrderRepository.java          (Student 5)
│   │   │       │   └── PaymentDeliveryRepository.java(Student 6)
│   │   │       ├── service/                   # 1 Service File per Student
│   │   │       │   ├── CustomerService.java          (Student 1)
│   │   │       │   ├── ProductService.java           (Student 2)
│   │   │       │   ├── ProductSearchService.java     (Student 3)
│   │   │       │   ├── CartService.java              (Student 4)
│   │   │       │   ├── OrderService.java             (Student 5)
│   │   │       │   └── PaymentDeliveryService.java   (Student 6)
│   │   │       ├── exception/                 # Custom Exception Handling
│   │   │       │   ├── GroceryAppException.java
│   │   │       │   ├── UserNotFoundException.java
│   │   │       │   └── InsufficientStockException.java
│   │   │       ├── util/                      # Database Connection & Helper Utilities
│   │   │       │   ├── DBConnection.java
│   │   │       │   └── PasswordUtils.java
│   │   │       └── server/                    # Java HTTP Server / Servlets
│   │   │           └── AppServer.java
│   └── web/                                   # Frontend Files (1 JS File per Student)
│       ├── css/
│       │   └── style.css                      # Main Stylesheet
│       ├── js/
│       │   ├── account.js                     (Student 1 JS)
│       │   ├── product-admin.js               (Student 2 JS)
│       │   ├── product-browse.js              (Student 3 JS)
│       │   ├── cart.js                        (Student 4 JS)
│       │   ├── order.js                       (Student 5 JS)
│       │   └── payment-delivery.js            (Student 6 JS)
│       ├── index.html                         # Customer Browse & Search
│       ├── cart.html                          # Customer Shopping Cart
│       ├── checkout.html                      # Payment & Checkout Page
│       ├── orders.html                        # Customer Order History
│       └── admin.html                         # Inventory, Product & Delivery Management
└── README.md
```
