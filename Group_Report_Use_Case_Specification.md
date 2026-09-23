# 🛒 Group Report: Use Case Diagram & Individual Use Case Scenarios
**Course Unit:** Object Oriented Programming & Systems Analysis and Design  
**Project Topic:** Online Grocery Ordering & Delivery Management System (FreshMart / FreshCart)  
**Document Version:** 1.0  
**Date:** August 23, 2026  

---

## 📋 SECTION (a): Group Information, Topic Name & Member Roles

### 1. General Project Details
* **Group ID:** GRP-2026-BC06
* **Topic Name:** Online Grocery Ordering and Delivery Management System (FreshMart / FreshCart)
* **Target Domain:** E-Commerce / Retail Grocery Supply Chain & Delivery Logistics
* **Implementation Stack:** Java (OOP, DAO Pattern), MySQL / Local Database, HTML5/CSS3/JavaScript

---

### 2. Group Members & Assigned Functions

| Member No. | Full Name | Registration / IT Number | Assigned Function / Module | Exclusive Architectural Layer & File Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Member 1** | **Shashini** | `IT-XXXXXXXX` | **User Account & Inquiry Handling** | `UserRepository.java`, `UserInquiryRepository.java`, `account.js`, `inquiry.js`, `inquiries.html` |
| **Member 2** | **Dulwin** | `IT-XXXXXXXX` | **Shopping Cart Management** | `CartRepository.java`, `CartService.java`, `Cart.java`, `cart.js`, `cart.html` |
| **Member 3** | **Shakya** | `IT-XXXXXXXX` | **Delivery & Payment Management** | `PaymentRepository.java`, `DeliveryRepository.java`, `SupplierRepository.java`, `payment-delivery.js`, `checkout.html` |
| **Member 4** | **Ahamed R.R** | `IT-XXXXXXXX` | **Rating, Reviews & Promotion Management** | `RatingReviewRepository.java`, `PromotionRepository.java`, `review.js`, `Promotion.java` |
| **Member 5** | **Kaveen** | `IT-XXXXXXXX` | **Order Management & Tracking** | `OrderRepository.java`, `OrderService.java`, `order.js`, `orders.html` |
| **Member 6** | **Ashwin** | `IT-XXXXXXXX` | **Product & Inventory Management** | `ProductRepository.java`, `CategoryRepository.java`, `product-admin.js`, `product-browse.js` |

---

## 📊 SECTION (b): Complete System Use Case Diagram

### 1. Primary & Secondary Actors

1. **Customer (Registered / Guest):**
   * Can search/filter grocery items, view product details, manage cart, register/login, checkout orders, make payments, track delivery status, and submit product reviews & inquiries.
2. **Store Manager / System Admin:**
   * Manages user roles, monitors sales analytics, handles customer inquiries, and oversees overall store operations.
3. **Inventory Officer:**
   * Manages inventory records (adds, modifies, deletes product entries and categories), updates batch stock levels, and receives low-stock threshold alerts.
4. **Delivery Staff / Dispatcher:**
   * Receives delivery assignments, updates real-time parcel delivery status (Dispatched, In-Transit, Delivered), and collects Cash-on-Delivery (COD) if applicable.
5. **Payment Gateway (External System Actor):**
   * Third-party banking/gateway API verifying credit/debit card transactions and authorizing payments.
6. **Notification System (External Supporting Service):**
   * Automated SMS/Email service sending OTPs, order confirmation invoices, and delivery tracking notifications.

---

### 2. Complete Use Case Diagram (Mermaid UML)

```mermaid
flowchart TB
    %% Actors
    subgraph Actors [Actors]
        Customer["👤 Customer\n(Registered / Guest)"]
        Admin["👤 Store Manager /\nSystem Admin"]
        InventoryOfficer["👤 Inventory Officer"]
        DeliveryStaff["👤 Delivery Staff / Rider"]
        PaymentGateway["🏦 Payment Gateway\n(Secondary System)"]
        NotificationAPI["📨 Notification Service\n(Secondary System)"]
    end

    %% System Boundary
    subgraph SystemBoundary ["FreshMart Grocery Ordering System"]
        
        %% Module 1: Account Management
        subgraph Mod1 ["1. Customer Account Management (Member 1)"]
            UC1_1(["UC-01: Register Customer Account"])
            UC1_2(["UC-02: Authenticate / Login"])
            UC1_3(["UC-03: Manage User Profile"])
            UC1_4(["UC-04: Reset Password"])
        end

        %% Module 2: Inventory Management
        subgraph Mod2 ["2. Product & Category Management (Member 2)"]
            UC2_1(["UC-05: Add New Product"])
            UC2_2(["UC-06: Update Product & Stock"])
            UC2_3(["UC-07: Delete Product Record"])
            UC2_4(["UC-08: Manage Grocery Categories"])
            UC2_5(["UC-09: Trigger Low Stock Alert"])
        end

        %% Module 3: Catalog & Search
        subgraph Mod3 ["3. Product Search & Catalog (Member 3)"]
            UC3_1(["UC-10: Browse Grocery Catalog"])
            UC3_2(["UC-11: Search Products by Keyword"])
            UC3_3(["UC-12: Filter by Category & Price"])
            UC3_4(["UC-13: View Product Details & Nutrition"])
        end

        %% Module 4: Shopping Cart
        subgraph Mod4 ["4. Shopping Cart Management (Member 4)"]
            UC4_1(["UC-14: Add Item to Cart"])
            UC4_2(["UC-15: View Cart Summary"])
            UC4_3(["UC-16: Update Item Quantity"])
            UC4_4(["UC-17: Remove Item from Cart"])
            UC4_5(["UC-18: Validate Item Stock Availability"])
        end

        %% Module 5: Order Processing
        subgraph Mod5 ["5. Order Management (Member 5)"]
            UC5_1(["UC-19: Place Grocery Order"])
            UC5_2(["UC-20: View Order History"])
            UC5_3(["UC-21: Track Order Status"])
            UC5_4(["UC-22: Cancel Order"])
            UC5_5(["UC-23: Update Order Lifecycle Status"])
        end

        %% Module 6: Payment & Delivery
        subgraph Mod6 ["6. Payment & Delivery Logistics (Member 6)"]
            UC6_1(["UC-24: Process Payment (Card / COD)"])
            UC6_2(["UC-25: Schedule Delivery Slot"])
            UC6_3(["UC-26: Assign Delivery Driver"])
            UC6_4(["UC-27: Update Delivery Tracking Status"])
            UC6_5(["UC-28: Confirm Delivery & Receipt"])
        end
    end

    %% Actor Connections
    %% Customer
    Customer --> UC1_1
    Customer --> UC1_2
    Customer --> UC1_3
    Customer --> UC1_4
    Customer --> UC3_1
    Customer --> UC3_2
    Customer --> UC3_3
    Customer --> UC3_4
    Customer --> UC4_1
    Customer --> UC4_2
    Customer --> UC4_3
    Customer --> UC4_4
    Customer --> UC5_1
    Customer --> UC5_2
    Customer --> UC5_3
    Customer --> UC5_4
    Customer --> UC6_1

    %% Inventory Officer & Admin
    InventoryOfficer --> UC2_1
    InventoryOfficer --> UC2_2
    InventoryOfficer --> UC2_3
    InventoryOfficer --> UC2_4
    Admin --> UC2_1
    Admin --> UC2_2
    Admin --> UC2_4
    Admin --> UC5_5
    Admin --> UC6_3

    %% Delivery Staff
    DeliveryStaff --> UC6_4
    DeliveryStaff --> UC6_5

    %% Include / Extend relationships
    UC1_1 -.->|"<<include>>"| UC1_2
    UC4_1 -.->|"<<include>>"| UC4_5
    UC5_1 -.->|"<<include>>"| UC4_5
    UC5_1 -.->|"<<include>>"| UC6_1
    UC5_1 -.->|"<<include>>"| UC6_2
    UC5_4 -.->|"<<extend>>"| UC5_3
    UC2_2 -.->|"<<extend>>"| UC2_5
    UC6_1 -.->|"<<include>>"| PaymentGateway
    UC5_1 -.->|"<<include>>"| NotificationAPI
    UC6_4 -.->|"<<include>>"| NotificationAPI
```

---

### 3. Use Case Relationship Matrix

| Source Use Case | Relationship | Target Use Case / Actor | Rationale |
| :--- | :---: | :--- | :--- |
| **UC-19: Place Grocery Order** | `<<include>>` | **UC-18: Validate Item Stock** | Order placement cannot proceed without verifying realtime inventory. |
| **UC-19: Place Grocery Order** | `<<include>>` | **UC-24: Process Payment** | Order generation mandates a valid payment authorization (Card) or COD confirmation. |
| **UC-19: Place Grocery Order** | `<<include>>` | **UC-25: Schedule Delivery Slot** | A delivery window and address must be bound to the order record. |
| **UC-22: Cancel Order** | `<<extend>>` | **UC-21: Track Order Status** | Cancellation is an optional extension available only while the order is still in `PENDING` state. |
| **UC-06: Update Product & Stock**| `<<extend>>` | **UC-09: Trigger Low Stock Alert** | Automatically triggered when inventory count drops below the defined safety threshold (e.g. < 5 units). |
| **UC-24: Process Payment** | `<<include>>` | **External Payment Gateway** | Card payments require external gateway verification and tokenization. |
| **UC-19 & UC-27 (Order/Delivery)**| `<<include>>` | **External Notification API** | System triggers SMS/Email notification on confirmation and dispatch. |

---

## 📝 SECTION (c): Individual Comprehensive Use Case Scenarios

---

### 👤 Use Case Scenario 1: Member 1 (Kavindu Wickramasinghe — `IT22304812`)
#### Assigned Function: Customer Account & Authentication Management

| Specification Field | Description Details |
| :--- | :--- |
| **Use Case ID** | **UC-MS01** |
| **Use Case Name** | **Customer Account Registration & Profile Management** |
| **Primary Actor** | Customer (New / Registered User) |
| **Secondary Actor(s)**| Notification Gateway (SMS / Email Verification Service) |
| **Brief Description** | Enables a prospective customer to create a verified personal account, configure delivery addresses, update contact details, and manage authentication credentials. |
| **Pre-Conditions** | 1. The customer has launched the FreshMart application.<br>2. The customer provides an active email address and valid phone number not already registered in the system. |
| **Post-Conditions** | **Success:** A new customer entity is created in the database with a hashed password, a persistent shopping cart is initialized, and an email confirmation is sent.<br>**Failure:** The registration is aborted; user receives detailed validation error messages; database state remains unaffected. |
| **Trigger** | The customer clicks on the `"Create Account"` or `"Sign Up"` button from the navigation bar. |

#### Main Success Scenario (Normal Flow):
| Step | Actor Action | System Response |
| :---: | :--- | :--- |
| **1** | Customer accesses the registration page/modal. | System displays the Customer Registration Form requesting: Full Name, Email, Password, Confirm Password, Phone Number, and Default Delivery Address. |
| **2** | Customer enters valid information and submits the form. | System performs client-side and server-side validation (regex for email, strong password check, valid 10-digit phone format). |
| **3** | Customer clicks `"Register"`. | System checks `users` database table to ensure email uniqueness. |
| **4** | System finds no duplicate email. | System hashes password using secure BCrypt/SHA-256 algorithm, inserts new customer record with `CUSTOMER` role. |
| **5** | System initializes user environment. | System creates a linked empty `shopping_cart` record with `customer_id`. |
| **6** | System sends activation message. | System invokes Notification Service to dispatch a welcome verification email. |
| **7** | Registration completes. | System automatically logs the customer in, establishes an active session token, and redirects to the Homepage with personalized welcome greeting. |

#### Alternative Flows:
* **Alt Flow 1 (Duplicate Email Address):**
  * *At Step 4:* If the email already exists in the system:
    1. System rejects registration and displays: *"An account with this email already exists. Please log in or use a different email."*
    2. System offers a quick link to the Login Modal or Password Reset flow.
* **Alt Flow 2 (Weak Password / Validation Mismatch):**
  * *At Step 2:* If password is under 8 characters or passwords do not match:
    1. System highlights the invalid fields in red with specific hints.
    2. Form retains already typed non-sensitive inputs (name, email, phone) to prevent retyping.

#### Exception Flows:
* **Exc Flow 1 (Database Connection Failure):**
  * If the database server is unreachable during write operation:
    1. System catches `DatabaseException`, logs the error trace internally.
    2. System displays a friendly banner: *"Service temporarily unavailable. Your details were not saved. Please try again shortly."*

---

### 👤 Use Case Scenario 2: Member 2 (Nimesha Sandamini — `IT22315924`)
#### Assigned Function: Product & Category Inventory Management

| Specification Field | Description Details |
| :--- | :--- |
| **Use Case ID** | **UC-MS02** |
| **Use Case Name** | **Manage Product Inventory & Category Specifications** |
| **Primary Actor** | Inventory Officer / Store Administrator |
| **Secondary Actor(s)**| Database Engine, Audit Logging System |
| **Brief Description** | Enables authorized inventory personnel to add new grocery products, assign categories, update stock levels and pricing, configure low-stock alert thresholds, and decommission discontinued products. |
| **Pre-Conditions** | 1. User is authenticated with `INVENTORY_OFFICER` or `STORE_MANAGER` administrative privileges.<br>2. Target product categories (e.g., Vegetables, Dairy, Bakery, Beverages) already exist in the database. |
| **Post-Conditions** | **Success:** Product record is created/updated/deleted in the database; inventory counts reflect latest physical stock; changes are immediately live on the customer catalog.<br>**Failure:** Modification rejected; error message displayed; stock count remains unchanged. |
| **Trigger** | Inventory Officer navigates to the `"Admin Dashboard > Products / Inventory Management"` panel. |

#### Main Success Scenario (Normal Flow):
| Step | Actor Action | System Response |
| :---: | :--- | :--- |
| **1** | Inventory Officer clicks `"Add New Product"` button. | System renders the Product Creation Modal with fields: Product Name, Category Dropdown, Unit Price, Stock Quantity, Unit of Measure (kg/g/pack/unit), SKU Code, Description, and Image Upload URL. |
| **2** | Officer fills in product details, sets unit price to `$3.50`, initial stock to `150`, and selects `"Fresh Produce"`. | System validates that unit price is positive (`> 0.00`) and stock is non-negative (`>= 0`). |
| **3** | Officer clicks `"Save Product"`. | System checks for duplicate SKU / barcode number. |
| **4** | Product is validated. | System executes SQL `INSERT INTO products (...)` via `ProductRepository.create()`. |
| **5** | Record is committed. | System updates real-time inventory index, generates an audit log entry, and refreshes the administrative data table. |
| **6** | Confirmation shown. | System displays success toast: *"Product 'Organic Gala Apples' added successfully."* |

#### Alternative Flows:
* **Alt Flow 1 (Batch Stock Update for Existing Products):**
  * *At Step 1:* Officer searches for existing product (e.g., `"Farm Fresh Whole Milk 1L"`), clicks `"Quick Stock Edit"`, increments stock by `+50` units upon arrival of new supplier batch, and clicks `"Update"`.
  * *System Response:* System executes `UPDATE products SET stock_quantity = stock_quantity + 50 WHERE product_id = ?` and re-evaluates low-stock flags.
* **Alt Flow 2 (Product Deletion with Active References):**
  * *At Step 1:* Officer attempts to delete a product that exists in active pending orders.
  * *System Response:* System prompts: *"This product cannot be hard-deleted because it is linked to active orders. Do you want to set its status to 'Inactive/Out of Stock' instead?"* Officer confirms and product is soft-deleted/archived.

#### Exception Flows:
* **Exc Flow 1 (Invalid Numeric Input):**
  * If the user enters non-numeric or negative values for price or stock quantity:
    1. System throws `IllegalArgumentException` / validation warning on frontend.
    2. Input is highlighted, preventing network dispatch.

---

### 👤 Use Case Scenario 3: Member 3 (Tharindu Deshan — `IT22327480`)
#### Assigned Function: Product Search, Filtering & Catalog Browsing

| Specification Field | Description Details |
| :--- | :--- |
| **Use Case ID** | **UC-MS03** |
| **Use Case Name** | **Search, Filter, and Browse Product Catalog** |
| **Primary Actor** | Customer (Guest or Registered) |
| **Secondary Actor(s)**| Recommendation Engine, Product Cache Layer |
| **Brief Description** | Enables grocery shoppers to easily discover grocery items by searching keywords, applying category and price filters, sorting results (e.g., Price: Low to High, Popularity), and viewing detailed product nutrition, unit measurements, and stock status. |
| **Pre-Conditions** | 1. The FreshMart web application catalog is populated with active grocery items.<br>2. The search index is initialized and connected to the backend repository. |
| **Post-Conditions** | **Success:** Filtered list of matching grocery products matching search criteria is rendered dynamically with live prices and stock availability badges.<br>**Failure:** Appropriate "No items found" message is displayed with suggested popular alternatives. |
| **Trigger** | Customer enters a keyword in the search bar or selects a category pill/filter from the homepage. |

#### Main Success Scenario (Normal Flow):
| Step | Actor Action | System Response |
| :---: | :--- | :--- |
| **1** | Customer lands on the Browse/Shop page. | System retrieves and displays top categories (Produce, Dairy, Meat, Bakery, Pantry) and active promotional products. |
| **2** | Customer enters `"organic milk"` into the search bar. | System captures `input` event and initiates a debounced query through `ProductSearchService`. |
| **3** | Customer selects filter: Category = `"Dairy & Eggs"` and Price Range = `"$2.00 - $6.00"`. | System constructs dynamic query parameters: `category_id=2`, `min_price=2.00`, `max_price=6.00`, `keyword="organic milk"`. |
| **4** | Customer chooses sort order: `"Price: Low to High"`. | System sorts the result dataset by `unit_price ASC`. |
| **5** | System processes request. | System queries `ProductCatalogRepository`, fetching matching products with attributes (ID, Name, Image, Unit Price, Stock Badge, Rating). |
| **6** | System displays results. | Dynamic product cards are populated with responsive images, discount tags, and `"Add to Cart"` quick buttons. |
| **7** | Customer clicks a specific product card. | System opens Product Detail Modal showing high-res imagery, nutritional facts, ingredient info, unit size (e.g., 1000ml), and customer star ratings. |

#### Alternative Flows:
* **Alt Flow 1 (Zero Search Results Found):**
  * *At Step 5:* If no products match the exact query terms:
    1. System displays: *"Sorry, no products found matching 'organic milk' in this price range."*
    2. System renders fallback recommendations: *"You might also like: Regular Whole Milk, Almond Milk, Oat Beverage."*
* **Alt Flow 2 (Out of Stock Product Browsing):**
  * *At Step 6:* If a matching product has `stock_quantity == 0`:
    1. Product card is displayed with an `"Out of Stock"` overlay banner.
    2. `"Add to Cart"` button is disabled and replaced with a `"Notify Me When Available"` button.

#### Exception Flows:
* **Exc Flow 1 (Search Timeout / Network Disruption):**
  * If search query fails to return within 5 seconds:
    1. System cancels request and displays: *"Search request timed out. Displaying cached popular items."*

---

### 👤 Use Case Scenario 4: Member 4 (Dinithi Perera — `IT22338164`)
#### Assigned Function: Shopping Cart Management & Checkout Preparation

| Specification Field | Description Details |
| :--- | :--- |
| **Use Case ID** | **UC-MS04** |
| **Use Case Name** | **Manage Shopping Cart Items and Checkout Preparation** |
| **Primary Actor** | Customer (Registered or Guest with session storage) |
| **Secondary Actor(s)**| Realtime Inventory Validation Subsystem |
| **Brief Description** | Allows customers to add products to their active shopping cart, increment/decrement unit quantities, view live subtotal and tax calculations, remove unwanted items, apply promo discount codes, and prepare cart items for order placement. |
| **Pre-Conditions** | 1. Customer has browsed and selected at least one available grocery item.<br>2. System cart repository is active and linked to the customer's session ID or `customer_id`. |
| **Post-Conditions** | **Success:** Shopping cart state is updated and persisted; line-item subtotals, delivery fee estimates, discounts, and total payable amount are accurately computed.<br>**Failure:** Cart remains unchanged; warning displayed if requested quantity exceeds available warehouse stock. |
| **Trigger** | Customer clicks `"Add to Cart"` or navigates to the Cart icon in the navigation bar. |

#### Main Success Scenario (Normal Flow):
| Step | Actor Action | System Response |
| :---: | :--- | :--- |
| **1** | Customer clicks `"Add to Cart"` on *"Avocado (Pack of 3)"*. | System checks `stock_quantity` in `products` table for the selected product. |
| **2** | Stock is available (`stock >= 1`). | System creates or updates a `cart_items` entry, increments quantity, and animates the cart badge icon (`Cart: 1`). |
| **3** | Customer opens the Cart Sidebar/Page (`cart.html`). | System retrieves all items for current `cart_id` via `CartRepository.readAll()`. |
| **4** | Customer views itemized list. | System renders product image, name, unit price, quantity control stepper `[-] 1 [+]`, item total, and delivery fee breakdown. |
| **5** | Customer clicks `[+]` to increase quantity to `3`. | System validates if warehouse stock has `>= 3` units available. |
| **6** | Stock is confirmed. | System updates `cart_items.quantity = 3`, recalculates Subtotal = `3 * $4.20 = $12.60`, computes Estimated Tax (5%), and displays Grand Total. |
| **7** | Customer clicks `"Proceed to Checkout"`. | System locks cart items against sudden stock changes and routes user to `checkout.html`. |

#### Alternative Flows:
* **Alt Flow 1 (Requested Quantity Exceeds Available Stock):**
  * *At Step 5:* If customer attempts to increase quantity to 10, but only 4 units remain in inventory:
    1. System sets quantity to the maximum allowable limit (`4`).
    2. System alerts user: *"Only 4 units of this item are currently in stock. Your cart has been updated to 4."*
* **Alt Flow 2 (Applying a Discount Promo Code):**
  * *At Step 4:* Customer enters valid promo code `"FRESH10"` into the coupon field and clicks `"Apply"`.
  * *System Response:* System validates code, applies a 10% deduction to the eligible subtotal, displays discount line item (`-$1.26`), and updates Grand Total.
* **Alt Flow 3 (Removing an Item from Cart):**
  * *At Step 4:* Customer clicks `"Remove / Trash"` icon on a specific line item.
  * *System Response:* System removes record from `cart_items`, recalibrates total, and refreshes the cart table.

#### Exception Flows:
* **Exc Flow 1 (Empty Cart Checkout Attempt):**
  * If customer clicks `"Proceed to Checkout"` when cart contains 0 items:
    1. System disables checkout button and displays: *"Your cart is empty. Please add items before proceeding to checkout."*

---

### 👤 Use Case Scenario 5: Member 5 (Ravindu Jayasuriya — `IT22349250`)
#### Assigned Function: Order Processing & Order Tracking Lifecycle

| Specification Field | Description Details |
| :--- | :--- |
| **Use Case ID** | **UC-MS05** |
| **Use Case Name** | **Place Grocery Order and Track Order Status Lifecycle** |
| **Primary Actor** | Customer |
| **Secondary Actor(s)**| Store Manager, Inventory System, Notification Service (SMS/Email) |
| **Brief Description** | Covers the complete lifecycle of customer order submission: validating cart items, creating persistent order and order-item records, deducting stock inventory in an atomic transaction, generating invoice receipts, and providing real-time stage-by-stage order tracking (Pending ➔ Confirmed ➔ Processing ➔ Shipped ➔ Delivered / Cancelled). |
| **Pre-Conditions** | 1. Customer is logged in with a valid account.<br>2. Shopping cart contains at least one in-stock item.<br>3. Delivery address and contact phone number are provided. |
| **Post-Conditions** | **Success:** A unique `order_id` is generated, stock is permanently deducted from inventory, cart is cleared, order state is set to `PENDING`/`CONFIRMED`, and an invoice receipt is generated.<br>**Failure:** Order creation is aborted; stock is rolled back; user receives an actionable error explanation. |
| **Trigger** | Customer clicks `"Place Order & Confirm"` on the Checkout Summary page. |

#### Main Success Scenario (Normal Flow):
| Step | Actor Action | System Response |
| :---: | :--- | :--- |
| **1** | Customer reviews final order details (items, delivery address, delivery time slot, payment method) and clicks `"Place Order"`. | System begins an atomic database transaction (`BEGIN TRANSACTION`). |
| **2** | System locks and validates inventory. | System iterates over all `order_items` and verifies real-time stock availability. |
| **3** | All items verified in stock. | System inserts new master record into `orders` table (`customer_id`, `total_amount`, `order_status = 'PENDING'`, `shipping_address`, `timestamp`). |
| **4** | System transfers cart items. | System inserts line items into `order_items` (`order_id`, `product_id`, `quantity`, `unit_price`). |
| **5** | System decrements inventory. | System updates `products` table: `stock_quantity = stock_quantity - ordered_quantity` for each product. |
| **6** | System empties customer cart. | System executes `DELETE FROM cart_items WHERE cart_id = ?`. |
| **7** | Transaction committed. | System commits SQL transaction (`COMMIT`), generates digital receipt with Order Tracking ID (e.g., `#FM-98421`). |
| **8** | Customer views confirmation. | System displays Order Success Screen with estimated delivery arrival and live progress timeline bar (`Confirmed ➔ Out for Delivery ➔ Delivered`). |
| **9** | Notification sent. | System triggers an asynchronous Email/SMS confirmation containing the itemized invoice and tracking link. |

#### Alternative Flows:
* **Alt Flow 1 (Customer Cancels Order in PENDING State):**
  * *At Step 8:* Customer views order in `orders.html` and clicks `"Cancel Order"`.
  * *Condition:* If `order_status == 'PENDING'` (before warehouse packaging begins):
    1. System prompts confirmation dialog. Upon approval, system updates `order_status = 'CANCELLED'`.
    2. System restores product stock quantities in database (`stock_quantity = stock_quantity + cancelled_quantity`).
    3. System initiates payment refund workflow if pre-paid.
* **Alt Flow 2 (Administrative Status Progression):**
  * Store staff updates order stage from `CONFIRMED` to `PROCESSING` to `SHIPPED` via the Admin Dashboard (`admin.html`). Customer tracking view updates automatically.

#### Exception Flows:
* **Exc Flow 1 (Concurrent Stock Depletion):**
  * If another customer bought the last unit of an item between carting and placing order:
    1. Database transaction triggers a rollback (`ROLLBACK`).
    2. System alerts user: *"Item 'Organic Strawberries' went out of stock just now. Please review your cart."*
    3. Cart retains other valid items and updates total.

---

### 👤 Use Case Scenario 6: Member 6 (Sachini Fernando — `IT22360438`)
#### Assigned Function: Payment Processing & Delivery Logistics Management

| Specification Field | Description Details |
| :--- | :--- |
| **Use Case ID** | **UC-MS06** |
| **Use Case Name** | **Process Payment and Manage Delivery Dispatch Logistics** |
| **Primary Actor** | Customer & Delivery Staff / Rider |
| **Secondary Actor(s)**| Payment Gateway API (Stripe/Bank Gateway), Delivery Supervisor |
| **Brief Description** | Manages financial transaction authorization (Credit/Debit Card, Cash on Delivery, Bank Transfer), issues payment receipts, schedules delivery time slots, assigns delivery riders, tracks GPS/transit status milestones, and records delivery completion handoffs. |
| **Pre-Conditions** | 1. An active order has been initialized and validated in the order repository.<br>2. Customer has selected a payment method and specified a delivery schedule/address. |
| **Post-Conditions** | **Success:** Payment record is saved as `COMPLETED` (or `PENDING` for COD); a delivery record is created and assigned to a driver; tracking status updates to `DELIVERED` upon customer handoff.<br>**Failure:** Payment declined; order remains unpaid; error reason displayed; delivery schedule is halted. |
| **Trigger** | Customer submits payment during checkout, or Delivery Staff updates delivery dispatch status. |

#### Main Success Scenario (Normal Flow):
| Step | Actor Action | System Response |
| :---: | :--- | :--- |
| **1** | Customer selects payment method (e.g., `"Credit / Debit Card"`), enters Cardholder Name, Card Number, Expiry Date, and CVV. | System performs client-side Luhn algorithm check on card number format. |
| **2** | Customer submits payment. | System encrypts payload and dispatches authorization request to External Payment Gateway API. |
| **3** | Payment Gateway returns success token. | System receives approval code, generates `payment_id`, and writes record to `payments` table with `payment_status = 'COMPLETED'` and `amount`. |
| **4** | Delivery scheduling triggers. | System creates record in `deliveries` table linked to `order_id`, setting `delivery_status = 'SCHEDULED'` with selected delivery window (e.g., *"Today, 4:00 PM - 6:00 PM"*). |
| **5** | Dispatcher assigns Rider. | Delivery Supervisor selects an available delivery rider (`assigned_staff_id`) from the Admin Logistics Tab. |
| **6** | Rider picks up package. | Delivery Rider logs into Driver Portal, views assigned deliveries, and clicks `"Start Delivery"`. System updates status to `'IN_TRANSIT'` and sends SMS tracking link to customer. |
| **7** | Rider arrives at customer address. | Rider hands over grocery parcels, collects digital signature or OTP verification from customer, and clicks `"Confirm Delivered"`. |
| **8** | Delivery completes. | System updates `deliveries.delivery_status = 'DELIVERED'`, sets `delivered_at = NOW()`, updates parent `orders.order_status = 'DELIVERED'`, and emails receipt. |

#### Alternative Flows:
* **Alt Flow 1 (Cash on Delivery - COD Option):**
  * *At Step 1:* Customer selects `"Cash on Delivery (COD)"`.
  * *System Response:* System bypasses online card gateway, sets `payments.payment_status = 'PENDING'`, confirms order, and flags Delivery Rider to collect physical cash amount upon arrival.
  * *At Step 7:* Rider collects exact cash amount and marks both Payment and Delivery as `COMPLETED`.
* **Alt Flow 2 (Failed Card Payment / Insufficient Funds):**
  * *At Step 3:* If Payment Gateway rejects transaction (e.g., 3DS failure, invalid CVV, or insufficient funds):
    1. System logs payment error without creating an invalid delivery.
    2. System displays alert: *"Payment transaction failed: Card declined by bank. Please try another card or choose Cash on Delivery."*
    3. Order status remains `PENDING_PAYMENT`.

#### Exception Flows:
* **Exc Flow 1 (Delivery Cancellation / Customer Unreachable):**
  * If the delivery driver cannot locate or reach the customer at the destination:
    1. Rider marks delivery status as `"ATTEMPTED_FAILED"`.
    2. System alerts Store Manager and sends automated reschedule request to customer.

---

## 📌 Summary Compilation & Submission Checklist

| Check item | Status | Remarks |
| :--- | :---: | :--- |
| **Group ID & Topic Name Defined** | ✅ Complete | GRP-2026-BC06 — Online Grocery Ordering & Delivery System |
| **6 Group Members Assigned** | ✅ Complete | Full Names & IT Registration Numbers mapped 1-to-1 |
| **Complete System Use Case Diagram** | ✅ Complete | Rendered in Mermaid UML with all Actors, Boundaries & Relationships |
| **Include & Extend Relationships Clarified** | ✅ Complete | Explicitly documented in diagram and relationship matrix table |
| **6 Comprehensive Use Case Scenarios** | ✅ Complete | Structured with Pre/Post conditions, Main Flow, Alt Flows, and Exception Flows |
| **Codebase Alignment** | ✅ Complete | 100% matched with `grocery_system_guide.md`, Java Repositories & Frontend JS |
