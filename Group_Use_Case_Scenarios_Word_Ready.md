# 🛒 Online Grocery Ordering and Delivery Management System
## Comprehensive Use Case Scenarios (Word-Ready Format)

---

# USE CASE SCENARIO 1

### **Student Information**
* **Member Name:** Dulwin W.N.
* **IT Registration Number:** IT25101575
* **Assigned Function / Module:** Shopping Cart Management

---

### **1. Use Case Identification & Metadata**

| Specification Attribute | Details |
| :--- | :--- |
| **Use Case ID** | **UC-01** |
| **Use Case Name** | **Manage Shopping Cart and Prepare for Checkout** |
| **Primary Actor** | Customer (Guest or Registered Customer) |
| **Secondary Actor(s)**| Real-time Inventory Subsystem |
| **Brief Description** | Enables grocery shoppers to add products to a shopping cart, update unit quantities, remove unwanted items, view price/tax breakdowns, and validate inventory availability before proceeding to checkout. |
| **Trigger** | Customer clicks the `"Add to Cart"` button on a product card or opens the cart panel/page. |
| **Pre-Conditions** | 1. Customer has accessed the FreshMart web application.<br>2. The target product is active in the catalog with available warehouse stock (`stock_quantity > 0`).<br>3. Cart storage mechanism (Browser LocalStorage / Database session) is operational. |
| **Post-Conditions** | **Success:** The item is recorded in the cart with updated line subtotals, taxes, and grand total; cart badge counter is updated; items are validated for checkout.<br>**Failure:** Cart remains unchanged; descriptive alert is displayed if the requested quantity exceeds inventory. |

---

### **2. Main Success Scenario (Normal Flow)**

| Step | Actor Action | System Response |
| :---: | :--- | :--- |
| **1** | Customer browses grocery items and clicks `"Add to Cart"` on a selected product (e.g., *"Organic Full Cream Milk 1L"*). | System queries the `products` table to check the available `stock_quantity`. |
| **2** | Stock is available (`stock >= 1`). | System creates a new cart item record (or increments quantity if already present) in `cart_items` with `quantity = 1`. |
| **3** | Item is stored. | System plays visual feedback animation, updates the navigation bar cart badge (`Cart: [1]`), and displays a confirmation toast: *"Organic Full Cream Milk added to cart"*. |
| **4** | Customer navigates to the Shopping Cart view (`cart.html`). | System retrieves all items for the active `cart_id` via `CartRepository.readAll()`. |
| **5** | Customer reviews the cart. | System renders item thumbnail, product title, unit price, quantity stepper `[-] 1 [+]`, item total, estimated tax, and total payable amount. |
| **6** | Customer clicks `[+]` to increase quantity from `1` to `3`. | System validates if warehouse inventory has `>= 3` units available for this SKU. |
| **7** | Stock validation succeeds. | System updates `cart_items.quantity = 3`, recalculates line-item total (`3 × $3.50 = $10.50`), updates subtotal and delivery fee, and recalculates Grand Total. |
| **8** | Customer clicks `"Proceed to Checkout"`. | System performs final stock lock and redirects customer to the Checkout page (`checkout.html`). |

---

### **3. Alternative Flows**

* **AF-1.1: Customer Decreases Item Quantity**
  * *At Step 6:* Customer clicks `[-]` button on a line item with quantity $> 1$.
  * *System Response:* System decrements quantity by 1, updates line-item total, recalculates the subtotal, taxes, and grand total.
* **AF-1.2: Customer Removes an Item from Cart**
  * *At Step 5:* Customer clicks the `"Remove / Trash"` icon on a specific line item.
  * *System Response:* System prompts: *"Are you sure you want to remove this item from your cart?"*. Upon confirmation, system deletes the record from `cart_items`, decrements cart badge count, and recalculates the grand total.
* **AF-1.3: Customer Clears Entire Cart**
  * *At Step 5:* Customer clicks `"Clear Cart"`.
  * *System Response:* System prompts confirmation dialog. Upon approval, system executes `DELETE FROM cart_items WHERE cart_id = ?`, resets cart badge to `0`, and displays: *"Your cart is empty"*.

---

### **4. Exception Flows**

* **EF-1.1: Requested Quantity Exceeds Available Inventory**
  * *At Step 6:* Customer attempts to increase item quantity to `10`, but warehouse stock only has `4` units remaining.
  * *System Response:* 
    1. System rejects quantity increase to 10.
    2. System automatically sets quantity to the maximum available stock (`4`).
    3. System alerts customer: *"Only 4 units of this item are currently available in stock. Your cart has been updated to the maximum available limit."*
* **EF-1.2: Attempting to Checkout with an Empty Cart**
  * *At Step 8:* Customer attempts to trigger checkout when cart item count is `0`.
  * *System Response:* System disables the `"Proceed to Checkout"` button and displays a warning banner: *"Your cart is currently empty. Please add items before checking out."*

---

### **5. Business Rules & Non-Functional Requirements**
* **BR-01:** Cart items must persist across page refreshes and user sessions for up to 30 days for registered users.
* **BR-02:** Maximum quantity per individual grocery item is capped at `50` units per retail order to prevent hoarding.
* **NFR-01:** Subtotal, discount deductions, tax, and grand total recalculations must render in less than `100ms`.

```
========================================================================================
```

# USE CASE SCENARIO 2

### **Student Information**
* **Member Name:** Ashvithan S.
* **IT Registration Number:** IT25102406
* **Assigned Function / Module:** Product & Category Inventory Management

---

### **1. Use Case Identification & Metadata**

| Specification Attribute | Details |
| :--- | :--- |
| **Use Case ID** | **UC-02** |
| **Use Case Name** | **Manage Product Inventory and Categories** |
| **Primary Actor** | Inventory Officer / Store Administrator |
| **Secondary Actor(s)**| Database Engine, Audit Logging Subsystem |
| **Brief Description** | Enables authorized store administrators and inventory officers to add new grocery products, modify existing product specifications and prices, manage grocery categories, update stock levels, and decommission discontinued items. |
| **Trigger** | Inventory Officer navigates to `"Admin Dashboard > Products"` or `"Categories"` tab. |
| **Pre-Conditions** | 1. User has logged in and possesses valid administrative/inventory role credentials (`INVENTORY_OFFICER` or `STORE_MANAGER`).<br>2. Target product categories (e.g., Fresh Produce, Dairy, Bakery, Beverages) are registered in the system. |
| **Post-Conditions** | **Success:** Product or category data is created, updated, or removed in the database; real-time catalog reflects modifications; audit log records the administrative action.<br>**Failure:** Operation is aborted; validation error details are displayed; database records remain unaltered. |

---

### **2. Main Success Scenario (Normal Flow)**

| Step | Actor Action | System Response |
| :---: | :--- | :--- |
| **1** | Inventory Officer logs into the Admin Portal (`admin.html`) and selects `"Products"` tab. | System retrieves and displays the active inventory table with Product ID, Image, Name, Category, Unit Price, Stock Level, and Action buttons (`Edit`, `Delete`, `Restock`). |
| **2** | Officer clicks the `"+ Add New Product"` button. | System displays the Product Creation Modal requesting: Product Name, Category Dropdown, Unit Price ($), Stock Quantity, Unit of Measure (kg/pack/liter), SKU Code, Description, and Image URL. |
| **3** | Officer enters product details (e.g., Name: *"Organic Strawberries 250g"*, Category: *"Fresh Produce"*, Price: `4.50`, Stock: `120`, Unit: `"pack"`) and clicks `"Save Product"`. | System performs validation: checks that unit price is $> 0.00$, stock quantity is $\ge 0$, and required fields are populated. |
| **4** | Input validation passes. | System queries database to ensure SKU code is unique. |
| **5** | SKU uniqueness confirmed. | System executes `ProductRepository.create()` to insert record into `products` table. |
| **6** | Record successfully committed. | System logs the transaction (`User: IT25102406, Action: CREATE_PRODUCT, Product: Organic Strawberries`), refreshes data table, and displays success toast: *"Product added successfully"*. |
| **7** | Catalog updates. | System automatically makes the new product visible to customers on the public storefront. |

---

### **3. Alternative Flows**

* **AF-2.1: Updating Existing Product Details & Price**
  * *At Step 1:* Officer searches for an existing product (e.g., *"Brown Eggs 12pk"*), clicks `"Edit"`, updates the unit price to `$4.99`, and clicks `"Save Changes"`.
  * *System Response:* System executes `ProductRepository.update()`, updates database values, logs the price change event, and refreshes the display.
* **AF-2.2: Quick Stock Restocking / Batch Increment**
  * *At Step 1:* Officer clicks `"Restock"` next to a low-stock product, inputs batch quantity `+100`, and clicks `"Confirm Restock"`.
  * *System Response:* System executes `UPDATE products SET stock_quantity = stock_quantity + 100 WHERE product_id = ?`, updates badge from "Low Stock" to "In Stock", and dismisses alert.
* **AF-2.3: Adding a New Category**
  * *At Step 1:* Officer switches to `"Categories"` tab, clicks `"+ Add Category"`, enters Category Name (e.g., *"Frozen Foods"*), Description, and submits.
  * *System Response:* System saves category in `categories` table and populates it across all product creation dropdown menus.

---

### **4. Exception Flows**

* **EF-2.1: Invalid Pricing or Negative Stock Value**
  * *At Step 3:* Officer enters a negative price (`-$2.00`) or non-numeric stock.
  * *System Response:* System highlights invalid fields in red, blocks submission, and displays: *"Unit price must be greater than zero, and stock must be a non-negative integer."*
* **EF-2.2: Attempting to Delete a Product Linked to Pending Orders**
  * *At Step 1:* Officer attempts to hard-delete a product currently contained in active customer orders.
  * *System Response:* 
    1. System blocks hard deletion to protect database referential integrity.
    2. System displays a dialog: *"Cannot permanently delete product because it is referenced in active orders. Would you like to archive/deactivate this product instead?"*
    3. Upon confirmation, system sets `is_active = FALSE` (soft delete).

---

### **5. Business Rules & Non-Functional Requirements**
* **BR-03:** An automatic Low Stock Warning badge must be triggered when `stock_quantity <= 10`.
* **BR-04:** Every stock and price modification must record the Administrator ID, timestamp, and previous values in the system audit trail.
* **NFR-02:** Product creation and inventory updates must reflect across the public customer catalog within `1 second`.

```
========================================================================================
```

# USE CASE SCENARIO 3

### **Student Information**
* **Member Name:** Poorna W.A.K.S.
* **IT Registration Number:** IT25103409
* **Assigned Function / Module:** Order Management

---

### **1. Use Case Identification & Metadata**

| Specification Attribute | Details |
| :--- | :--- |
| **Use Case ID** | **UC-03** |
| **Use Case Name** | **Place Customer Order and Track Lifecycle Status** |
| **Primary Actor** | Customer |
| **Secondary Actor(s)**| Store Manager, Inventory Management System, SMS/Email Notification Gateway |
| **Brief Description** | Facilitates the complete order lifecycle: converts cart items into a verified order, performs atomic inventory deduction, creates persistent order records, generates unique tracking IDs and invoices, tracks order statuses (Pending ➔ Confirmed ➔ Processing ➔ Shipped ➔ Delivered), and handles order cancellations. |
| **Trigger** | Customer clicks `"Place Order & Pay"` on the checkout review screen. |
| **Pre-Conditions** | 1. Customer is authenticated with a registered account.<br>2. Shopping cart contains at least one in-stock item.<br>3. Shipping address, contact phone number, and delivery schedule are selected. |
| **Post-Conditions** | **Success:** A unique `order_id` is generated, product stock is permanently deducted, customer cart is cleared, order state is set to `PENDING`/`CONFIRMED`, and digital invoice receipt is issued.<br>**Failure:** Order transaction is rolled back; inventory counts remain unchanged; customer is informed of failure reason. |

---

### **2. Main Success Scenario (Normal Flow)**

| Step | Actor Action | System Response |
| :---: | :--- | :--- |
| **1** | Customer reviews final checkout summary (items, delivery window, address, grand total) and clicks `"Place Order"`. | System initiates an atomic database transaction (`BEGIN TRANSACTION`). |
| **2** | Transaction starts. | System locks and queries `products` table for all items in the order to re-validate real-time stock levels. |
| **3** | Stock verified for all items. | System inserts master record into `orders` table (`customer_id`, `total_amount`, `order_status = 'PENDING'`, `shipping_address`, `created_at = NOW()`). |
| **4** | Master record created. | System generates a unique Order Reference ID (e.g., `#ORD-2026-8891`). |
| **5** | Line items recorded. | System iterates through cart items and inserts records into `order_items` (`order_id`, `product_id`, `quantity`, `unit_price`). |
| **6** | Inventory decremented. | System executes `UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?` for each ordered item. |
| **7** | Cart cleared. | System deletes items from `cart_items` for this `customer_id`. |
| **8** | Transaction committed. | System commits database transaction (`COMMIT`). |
| **9** | Confirmation & receipt issued. | System renders the Order Confirmation Page with printable invoice, estimated delivery arrival, and real-time status tracker (`Pending ➔ Confirmed ➔ Processing ➔ Shipped ➔ Delivered`). |
| **10** | Notification dispatched. | System invokes Notification Service to send an order confirmation SMS and Email receipt to the customer. |

---

### **3. Alternative Flows**

* **AF-3.1: Customer Views Order History & Tracks Status**
  * *At Step 9:* Customer accesses `"My Orders"` (`orders.html`).
  * *System Response:* System queries `OrderRepository.readByCustomerId()`, lists all past and active orders, and provides a real-time progress bar for active deliveries.
* **AF-3.2: Customer Cancels an Order in PENDING Status**
  * *At Step 9:* Customer opens an order with status `PENDING` and clicks `"Cancel Order"`.
  * *System Response:* 
    1. System verifies that order is not yet marked as `PROCESSING` or `SHIPPED`.
    2. System updates `orders.order_status = 'CANCELLED'`.
    3. System restores product stock quantities in database (`stock_quantity = stock_quantity + cancelled_quantity`).
    4. System initiates payment refund workflow (if pre-paid) and dispatches cancellation confirmation email.
* **AF-3.3: Store Administrator Updates Order Lifecycle**
  * Store Staff updates order state in `admin.html` from `PENDING` ➔ `CONFIRMED` ➔ `PROCESSING` ➔ `SHIPPED`. Customer tracking interface updates automatically.

---

### **4. Exception Flows**

* **EF-3.1: Concurrent Stock Depletion During Order Placement**
  * *At Step 2:* Another shopper purchases the last remaining unit of an item immediately before customer clicks place order.
  * *System Response:* 
    1. System detects stock shortfall (`available_stock < ordered_quantity`).
    2. System rolls back transaction (`ROLLBACK`).
    3. System alerts customer: *"Item 'Organic Hass Avocado' became out of stock during checkout. Please adjust your cart to proceed."*
    4. Order is not created, and no charges are made.
* **EF-3.2: Customer Tries to Cancel a Shipped Order**
  * Customer clicks cancel on an order with status `SHIPPED`.
  * *System Response:* System denies request: *"This order has already been dispatched for delivery and cannot be cancelled online. Please contact customer support."*

---

### **5. Business Rules & Non-Functional Requirements**
* **BR-05:** Order creation and stock deduction must strictly occur within an ACID-compliant database transaction.
* **BR-06:** Customers may only self-cancel orders while the status remains `PENDING` (within 15 minutes of placement).
* **NFR-03:** Order submission and invoice generation must complete within `2.0 seconds`.

```
========================================================================================
```

# USE CASE SCENARIO 4

### **Student Information**
* **Member Name:** Surendra R.S.L.
* **IT Registration Number:** IT25101236
* **Assigned Function / Module:** Customer Account & Inquiry Handling

---

### **1. Use Case Identification & Metadata**

| Specification Attribute | Details |
| :--- | :--- |
| **Use Case ID** | **UC-04** |
| **Use Case Name** | **Customer Account Management and Inquiry Resolution Handling** |
| **Primary Actor** | Customer (New / Registered) & Customer Support Representative |
| **Secondary Actor(s)**| Authentication Service, Email/SMS Gateway, Departmental Support Teams |
| **Brief Description** | Covers user registration, profile configuration, secure authentication, password recovery, and the end-to-end inquiry lifecycle (submitting customer tickets/questions regarding products, orders, or delivery, departmental routing, staff response, and status tracking). |
| **Trigger** | Customer signs up / logs in or submits a support inquiry via the `"Inquiries / Help"` portal. |
| **Pre-Conditions** | 1. Customer has opened the FreshMart web application.<br>2. For inquiries, customer provides valid contact information (or is logged in). |
| **Post-Conditions** | **Success:** User account is created/authenticated OR inquiry ticket is logged in the system with tracking ticket ID and routed to the respective department.<br>**Failure:** Error message displayed; invalid inputs flagged; credentials or inquiry rejected. |

---

### **2. Main Success Scenario (Normal Flow)**

#### Sub-Flow A: Account Registration & Authentication
| Step | Actor Action | System Response |
| :---: | :--- | :--- |
| **1** | Customer clicks `"Sign Up"` on the navigation bar. | System opens Registration Modal requesting: Full Name, Email, Password, Confirm Password, Phone, and Default Address. |
| **2** | Customer enters valid information and clicks `"Create Account"`. | System validates inputs, verifies email uniqueness, hashes password using BCrypt, and inserts record into `users` table with role `CUSTOMER`. |
| **3** | Account created. | System creates a linked shopping cart, sends a welcome email, establishes user session, and displays personalized user menu. |

#### Sub-Flow B: Customer Inquiry Submission & Departmental Resolution
| Step | Actor Action | System Response |
| :---: | :--- | :--- |
| **4** | Customer navigates to Inquiries page (`inquiries.html`) and clicks `"Submit New Inquiry"`. | System renders Inquiry Submission Form with fields: Subject, Category (Order Issue / Product Quality / Delivery Delay / General), Message, and optional Order ID. |
| **5** | Customer fills details (e.g., Subject: *"Late delivery for order #8891"*, Category: *"Delivery Delay"*, Message: *"My order was scheduled for 4 PM but hasn't arrived"*) and submits. | System validates required fields and assigns a unique Ticket Reference (e.g., `INQ-4402`). |
| **6** | Ticket saved. | System executes `UserInquiryRepository.create()`, sets `status = 'PENDING'`, and assigns the inquiry to the **Delivery Department**. |
| **7** | Staff notification. | System sends acknowledgement email with Ticket ID to customer and notifies Support Staff. |
| **8** | Support Staff responds. | Staff logs into Admin Portal (`admin.html > Inquiries`), opens Ticket `INQ-4402`, enters reply: *"Rider was delayed due to heavy rain, will arrive in 15 mins"*, and marks status as `'ANSWERED'`. |
| **9** | Customer notified. | System dispatches email notification to customer with response; customer views response in their account portal. |

---

### **3. Alternative Flows**

* **AF-4.1: Customer Password Reset Flow**
  * *At Step 1:* Customer clicks `"Forgot Password?"` on login modal, enters registered email address.
  * *System Response:* System generates a secure one-time password reset link/token, sends to customer's email, and allows customer to set a new password.
* **AF-4.2: Customer Updates Profile & Delivery Addresses**
  * Customer navigates to `"My Profile"`, edits phone number or adds a secondary delivery address (e.g., Office Address), and clicks `"Save Profile"`. System updates `users` table and displays confirmation.
* **AF-4.3: Customer Resolves & Closes an Inquiry**
  * Customer reviews staff reply on `inquiries.html` and clicks `"Mark as Resolved"`. System updates status to `'CLOSED'`.

---

### **4. Exception Flows**

* **EF-4.1: Duplicate Email Address During Registration**
  * Customer submits registration with an email already present in `users` table.
  * *System Response:* System halts submission and displays: *"An account with this email already exists. Please log in or reset your password."*
* **EF-4.2: Invalid Login Credentials**
  * Customer enters wrong email or password.
  * *System Response:* System displays generic error: *"Invalid email or password. Please check your credentials and try again."* (Account locks temporarily after 5 consecutive failed attempts).

---

### **5. Business Rules & Non-Functional Requirements**
* **BR-07:** User passwords must be stored using irreversible salted cryptographic hashing (e.g., BCrypt).
* **BR-08:** High-priority inquiries (e.g., Delivery or Payment discrepancies) must be automatically flagged with an SLA target of $< 2$ hours response time.
* **NFR-04:** Authentication response and session verification must occur in $< 300ms$.

```
========================================================================================
```

# USE CASE SCENARIO 5

### **Student Information**
* **Member Name:** Wickramasinghe W.A.S.D.
* **IT Registration Number:** IT25103409 / IT25103155
* **Assigned Function / Module:** Payment Processing & Delivery Logistics Management

---

### **1. Use Case Identification & Metadata**

| Specification Attribute | Details |
| :--- | :--- |
| **Use Case ID** | **UC-05** |
| **Use Case Name** | **Process Payments and Manage Delivery Logistics** |
| **Primary Actor** | Customer & Delivery Staff / Courier Rider |
| **Secondary Actor(s)**| External Payment Gateway API (Visa/Mastercard/Stripe), Delivery Supervisor |
| **Brief Description** | Manages financial transaction authorization (Credit/Debit Card, Cash-on-Delivery, Bank Transfer), issues transaction receipts, schedules customer delivery slots, assigns delivery personnel, and manages real-time delivery milestone tracking (Scheduled ➔ In-Transit ➔ Delivered). |
| **Trigger** | Customer initiates checkout payment OR Delivery Staff updates shipment status. |
| **Pre-Conditions** | 1. Order details and total payable amount are calculated in the order subsystem.<br>2. Customer has specified destination delivery address and contact phone number. |
| **Post-Conditions** | **Success:** Payment is verified and recorded as `COMPLETED` (or `PENDING` for COD); a delivery record is scheduled, assigned to a rider, and marked `DELIVERED` upon physical receipt.<br>**Failure:** Payment declined; delivery scheduling paused; descriptive error provided to the customer. |

---

### **2. Main Success Scenario (Normal Flow)**

| Step | Actor Action | System Response |
| :---: | :--- | :--- |
| **1** | Customer reaches Checkout Payment step, selects `"Credit / Debit Card"`, and enters Cardholder Name, 16-digit Card Number, Expiry Date, and 3-digit CVV. | System executes client-side Luhn algorithm validation on card format. |
| **2** | Customer clicks `"Pay Now ($54.20)"`. | System encrypts payload and dispatches secure authorization request to External Payment Gateway API. |
| **3** | Payment Gateway returns success token (`AUTH_OK_88321`). | System receives approval token, generates `payment_id`, and creates record in `payments` table with `payment_method = 'CARD'`, `payment_status = 'COMPLETED'`, and `amount = 54.20`. |
| **4** | Delivery scheduling initializes. | System inserts new record into `deliveries` table linked to `order_id`, setting `delivery_status = 'SCHEDULED'`, and assigns selected time slot (e.g., *"Today 2:00 PM - 4:00 PM"*). |
| **5** | Supervisor assigns rider. | Delivery Supervisor opens Admin Logistics tab (`admin.html`) and assigns an available driver (`assigned_staff_id = 14`). |
| **6** | Rider accepts delivery. | Delivery Rider logs into Driver Portal, views delivery details, and clicks `"Start Delivery"`. System updates status to `'IN_TRANSIT'` and sends SMS tracking link to customer. |
| **7** | Rider arrives at destination. | Rider delivers grocery package to customer, collects customer digital signature or verification OTP, and clicks `"Confirm Delivered"`. |
| **8** | Delivery completed. | System updates `deliveries.delivery_status = 'DELIVERED'`, sets timestamp `delivered_at = NOW()`, updates parent `orders.order_status = 'DELIVERED'`, and emails final invoice. |

---

### **3. Alternative Flows**

* **AF-5.1: Cash-on-Delivery (COD) Payment Mode**
  * *At Step 1:* Customer selects `"Cash on Delivery (COD)"`.
  * *System Response:* System bypasses online payment gateway, inserts `payments` record with `payment_status = 'PENDING'`, confirms order, and flags the delivery record with `"Collect Cash: $54.20"`.
  * *At Step 7:* Delivery rider collects physical cash, clicks `"Payment Collected & Delivered"`; system updates payment and delivery status simultaneously to `COMPLETED` and `DELIVERED`.
* **AF-5.2: Customer Reschedules Delivery Slot**
  * Before shipment status reaches `IN_TRANSIT`, customer contacts support or clicks `"Reschedule Slot"`. System updates `scheduled_time` in `deliveries` table.

---

### **4. Exception Flows**

* **EF-5.1: Card Payment Declined / Insufficient Balance**
  * *At Step 3:* External Payment Gateway returns a transaction decline error (e.g., `DECLINED_INSUFFICIENT_FUNDS` or `INVALID_CVV`).
  * *System Response:* 
    1. System logs payment failure in transaction log.
    2. System does not generate active delivery task.
    3. System alerts customer: *"Payment failed: Card was declined by your issuing bank. Please check details, try another card, or choose Cash on Delivery."*
* **EF-5.2: Delivery Attempt Failed (Customer Unavailable)**
  * *At Step 7:* Rider reaches location but customer is unreachable.
  * *System Response:* Rider selects `"Delivery Failed - Customer Unavailable"`. System updates `delivery_status = 'ATTEMPTED_FAILED'`, notifies customer, and returns package to local hub for re-dispatch.

---

### **5. Business Rules & Non-Functional Requirements**
* **BR-09:** Credit card data (PAN, CVV) must never be stored in plain text or persistent application database tables (PCI-DSS compliance).
* **BR-10:** Cash on Delivery is restricted to orders with a total value under `$200.00`.
* **NFR-05:** Payment gateway communication and handshake must time out safely after `15 seconds` with automatic reversal if unresponsive.

```
========================================================================================
```

# USE CASE SCENARIO 6

### **Student Information**
* **Member Name:** Ahamed R.R.
* **IT Registration Number:** IT25100360
* **Assigned Function / Module:** Rating, Reviews and Promotions Management

---

### **1. Use Case Identification & Metadata**

| Specification Attribute | Details |
| :--- | :--- |
| **Use Case ID** | **UC-06** |
| **Use Case Name** | **Manage Product Ratings, Customer Reviews, and Promotional Campaigns** |
| **Primary Actor** | Customer & Marketing / Store Administrator |
| **Secondary Actor(s)**| Product Catalog Subsystem, Review Moderation Engine |
| **Brief Description** | Enables verified customers to submit star ratings (1–5 stars) and qualitative feedback reviews for purchased grocery items, allows administrators to moderate customer reviews, dynamically calculates average product rating scores, and enables marketing staff to configure promo discount codes and promotional banners. |
| **Trigger** | Customer clicks `"Write a Review"` on a delivered order item OR Admin manages promo codes in dashboard. |
| **Pre-Conditions** | 1. For reviews: Customer must have purchased and received the product (`order_status = 'DELIVERED'`).<br>2. For promotions: Store Admin has valid marketing/administrative privileges. |
| **Post-Conditions** | **Success:** Product review is published and incorporated into the item's average star rating score; promo discount codes are activated and redeemable at checkout.<br>**Failure:** Review rejected if profanity or invalid rating is detected; promo code rejected if expired or below minimum purchase threshold. |

---

### **2. Main Success Scenario (Normal Flow)**

#### Sub-Flow A: Submitting a Product Rating & Review
| Step | Actor Action | System Response |
| :---: | :--- | :--- |
| **1** | Customer visits `"My Orders"`, opens a delivered order, and clicks `"Rate & Review"` on *"Organic Honey Jar 500g"*. | System opens Review Modal displaying Star Selector (1 to 5 Stars), Title, Comment Textbox, and Image Upload. |
| **2** | Customer selects `5 Stars`, enters Title: *"Excellent quality and taste!"*, writes detailed comment: *"Very pure organic honey, fast delivery"*, and clicks `"Submit Review"`. | System validates that rating is between `1` and `5` and comment is not empty. |
| **3** | Review verified. | System inserts record into `reviews` table (`product_id`, `customer_id`, `rating = 5`, `comment`, `created_at = NOW()`). |
| **4** | Rating recalculated. | System recalculates average rating for the product: `avg_rating = SUM(rating) / COUNT(reviews)` and updates the product display badge. |
| **5** | Confirmation shown. | System displays confirmation: *"Thank you for your feedback! Your review is now live."* and displays review on product details page. |

#### Sub-Flow B: Admin Configures Promotional Discount Code
| Step | Actor Action | System Response |
| :---: | :--- | :--- |
| **6** | Marketing Admin navigates to `"Admin Dashboard > Promotions"` tab. | System displays list of active promotional codes, discount values, validity periods, and usage stats. |
| **7** | Admin clicks `"+ Create Promo Code"`, enters Code: `"SAVE20"`, Discount Type: `Percentage (20%)`, Minimum Spend: `$30.00`, Expiry Date: `2026-12-31`, and clicks `"Save"`. | System validates parameters and saves promo rule in `promotions` table. |
| **8** | Customer redeems promo. | Shopper enters `"SAVE20"` in cart/checkout; system deducts 20% from eligible subtotal and displays discounted amount. |

---

### **3. Alternative Flows**

* **AF-6.1: Admin Moderates / Flags Inappropriate Review**
  * *At Step 3:* System or customer flags a review containing abusive language or spam.
  * *System Response:* Admin opens Review Moderation panel (`admin.html > Reviews`), clicks `"Hide / Remove Review"`. System sets `is_approved = FALSE`, removes it from public view, and recalculates product average rating.
* **AF-6.2: Applying Fixed-Value vs Percentage Discount**
  * Admin creates a fixed discount coupon (e.g., `"$5 OFF on orders above $25"`). System deducts exactly `$5.00` from the checkout total when conditions are satisfied.

---

### **4. Exception Flows**

* **EF-6.1: Unverified Review Submission Attempt**
  * Non-logged-in user or customer who hasn't purchased the item attempts to submit a review.
  * *System Response:* System blocks submission and displays: *"Only verified buyers who have purchased this product may submit a review."*
* **EF-6.2: Invalid or Expired Promotional Code**
  * Shopper enters an expired code or cart subtotal is under the minimum spend requirement.
  * *System Response:* System displays error: *"Promo code 'SAVE20' requires a minimum order value of $30.00. Please add more items to qualify."*

---

### **5. Business Rules & Non-Functional Requirements**
* **BR-11:** Each customer can submit only one review per purchased product (with option to edit their existing review).
* **BR-12:** Promo discounts cannot exceed the order subtotal and cannot be combined with conflicting coupons unless marked as stackable.
* **NFR-06:** Average rating calculations and review rendering must update dynamically without requiring a full page reload.
