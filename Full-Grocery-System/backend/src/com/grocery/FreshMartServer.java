package com.grocery;

import com.grocery.model.*;
import com.grocery.repository.*;
import com.grocery.util.DBConnection;
import com.grocery.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class FreshMartServer {
    private static final int PORT = 8080;

    private static final UserRepository userRepo = new UserRepository();
    private static final ProductRepository productRepo = new ProductRepository();
    private static final OrderRepository orderRepo = new OrderRepository();
    private static final UserInquiryRepository inquiryRepo = new UserInquiryRepository();
    private static final CategoryRepository categoryRepo = new CategoryRepository();
    private static final SupplierRepository supplierRepo = new SupplierRepository();
    private static final PromotionRepository promotionRepo = new PromotionRepository();
    private static final CartRepository cartRepo = new CartRepository();

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        server.createContext("/api/health", new HealthHandler());
        server.createContext("/api/auth/signup", new SignupHandler());
        server.createContext("/api/auth/login", new LoginHandler());
        server.createContext("/api/products", new ProductsHandler());
        server.createContext("/api/categories", new CategoriesHandler());
        server.createContext("/api/users", new UsersHandler());
        server.createContext("/api/orders", new OrdersHandler());
        server.createContext("/api/inquiries", new InquiriesHandler());
        server.createContext("/api/inquiries/respond", new InquiryRespondHandler());
        server.createContext("/api/inquiries/forward", new InquiryForwardHandler());
        server.createContext("/api/promotions", new PromotionsHandler());
        server.createContext("/api/suppliers", new SuppliersHandler());
        server.createContext("/api/images", new ImagesHandler());
        server.createContext("/api/cart", new CartHandler());

        server.setExecutor(java.util.concurrent.Executors.newCachedThreadPool());
        server.start();
        System.out.println("=================================================");
        System.out.println("  FreshMart Live Backend Running on Port " + PORT);
        System.out.println("  MS SQL Server Live Database Connection: Active");
        System.out.println("  Health: http://localhost:" + PORT + "/api/health");
        System.out.println("=================================================");
        try {
            Thread.currentThread().join();
        } catch (InterruptedException ignored) {}
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String responseBody) throws IOException {
        byte[] bytes = responseBody.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static void handleCorsOptions(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        exchange.sendResponseHeaders(204, -1);
    }

    private static String readRequestBody(HttpExchange exchange) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        return sb.toString();
    }

    private static int extractId(HttpExchange exchange, String body) {
        String path = exchange.getRequestURI().getPath();
        String[] parts = path.split("/");
        if (parts.length > 0) {
            String last = parts[parts.length - 1];
            try {
                return Integer.parseInt(last);
            } catch (NumberFormatException ignored) {}
        }
        String query = exchange.getRequestURI().getQuery();
        if (query != null && query.contains("id=")) {
            for (String param : query.split("&")) {
                if (param.startsWith("id=")) {
                    try {
                        return Integer.parseInt(param.substring(3));
                    } catch (NumberFormatException ignored) {}
                }
            }
        }
        if (body != null && !body.isEmpty()) {
            int bodyId = JsonUtil.getInt(body, "id", -1);
            if (bodyId > 0) return bodyId;
            bodyId = JsonUtil.getInt(body, "orderId", -1);
            if (bodyId > 0) return bodyId;
            bodyId = JsonUtil.getInt(body, "productId", -1);
            if (bodyId > 0) return bodyId;
            bodyId = JsonUtil.getInt(body, "categoryId", -1);
            if (bodyId > 0) return bodyId;
            bodyId = JsonUtil.getInt(body, "supplierId", -1);
            if (bodyId > 0) return bodyId;
            bodyId = JsonUtil.getInt(body, "inquiryId", -1);
            if (bodyId > 0) return bodyId;
        }
        return -1;
    }

    // 1. Health Handler
    static class HealthHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }
            boolean dbConnected = false;
            String error = "";
            try (Connection conn = DBConnection.getConnection()) {
                dbConnected = (conn != null && !conn.isClosed());
            } catch (Exception e) {
                error = e.getMessage();
            }

            String json = "{\"status\":\"" + (dbConnected ? "UP" : "DEGRADED") + "\"," +
                          "\"database\":\"" + (dbConnected ? "CONNECTED" : "DISCONNECTED") + "\"," +
                          "\"dbError\":\"" + JsonUtil.escape(error) + "\"}";
            sendResponse(exchange, dbConnected ? 200 : 503, json);
        }
    }

    // 2. Signup Handler
    static class SignupHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            try {
                String body = readRequestBody(exchange);
                String name = JsonUtil.getString(body, "name");
                String email = JsonUtil.getString(body, "email");
                String password = JsonUtil.getString(body, "password");
                String phone = JsonUtil.getString(body, "phone");
                String address = JsonUtil.getString(body, "address");
                String role = JsonUtil.getString(body, "role");
                if (role == null || role.isEmpty()) role = "CUSTOMER";

                if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
                    sendResponse(exchange, 400, "{\"success\":false,\"error\":\"Email and password are required\"}");
                    return;
                }

                User existing = userRepo.findByEmail(email.trim());
                if (existing != null) {
                    sendResponse(exchange, 400, "{\"success\":false,\"error\":\"Email already registered\"}");
                    return;
                }

                User user = new User();
                user.setName(name != null ? name.trim() : "Customer");
                user.setEmail(email.trim());
                user.setPasswordHash(password.trim());
                user.setPhone(phone != null ? phone.trim() : "");
                user.setAddress(address != null ? address.trim() : "");
                user.setRole(role);

                userRepo.create(user);
                System.out.println("[FreshMart DB LIVE] >> USER SAVED TO DATABASE: ID=" + user.getId() + ", Name=" + user.getName() + ", Email=" + user.getEmail() + ", Role=" + user.getRole());

                String json = "{\"success\":true,\"message\":\"Account registered successfully in database\"," +
                              "\"user\":{" +
                              "\"id\":" + user.getId() + "," +
                              "\"name\":\"" + JsonUtil.escape(user.getName()) + "\"," +
                              "\"email\":\"" + JsonUtil.escape(user.getEmail()) + "\"," +
                              "\"role\":\"" + JsonUtil.escape(user.getRole()) + "\"," +
                              "\"phone\":\"" + JsonUtil.escape(user.getPhone()) + "\"," +
                              "\"address\":\"" + JsonUtil.escape(user.getAddress()) + "\"" +
                              "}}";
                sendResponse(exchange, 201, json);
            } catch (Exception e) {
                System.err.println("[FreshMart DB ERROR] Signup failed: " + e.getMessage());
                sendResponse(exchange, 500, "{\"success\":false,\"error\":\"" + JsonUtil.escape(e.getMessage()) + "\"}");
            }
        }
    }

    // 3. Login Handler
    static class LoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            try {
                String body = readRequestBody(exchange);
                String email = JsonUtil.getString(body, "email");
                String password = JsonUtil.getString(body, "password");

                if (email == null || password == null) {
                    sendResponse(exchange, 400, "{\"success\":false,\"error\":\"Email and password required\"}");
                    return;
                }

                User user = userRepo.findByEmail(email.trim());
                if (user == null || !password.trim().equals(user.getPasswordHash())) {
                    sendResponse(exchange, 401, "{\"success\":false,\"error\":\"Invalid email or password\"}");
                    return;
                }

                String json = "{\"success\":true,\"message\":\"Login successful\"," +
                              "\"user\":{" +
                              "\"id\":" + user.getId() + "," +
                              "\"name\":\"" + JsonUtil.escape(user.getName()) + "\"," +
                              "\"email\":\"" + JsonUtil.escape(user.getEmail()) + "\"," +
                              "\"role\":\"" + JsonUtil.escape(user.getRole()) + "\"," +
                              "\"phone\":\"" + JsonUtil.escape(user.getPhone()) + "\"," +
                              "\"address\":\"" + JsonUtil.escape(user.getAddress()) + "\"" +
                              "}}";
                sendResponse(exchange, 200, json);
            } catch (Exception e) {
                sendResponse(exchange, 500, "{\"success\":false,\"error\":\"" + JsonUtil.escape(e.getMessage()) + "\"}");
            }
        }
    }

    // 4. Products Handler (Full CRUD: GET, POST, PUT, DELETE)
    static class ProductsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }

            String method = exchange.getRequestMethod().toUpperCase();
            try {
                if ("GET".equals(method)) {
                    List<Product> products = productRepo.readAll();
                    StringBuilder sb = new StringBuilder("[");
                    for (int i = 0; i < products.size(); i++) {
                        Product p = products.get(i);
                        String img = p.getImageUrl();
                        if (img != null && (img.contains(":\\") || (img.startsWith("/") && !img.startsWith("images/")))) {
                            ingestLocalImageIfPresent(p);
                            try { productRepo.update(p); } catch (Exception ignored) {}
                        }
                        if (i > 0) sb.append(",");
                        sb.append("{")
                          .append("\"id\":").append(p.getId()).append(",")
                          .append("\"name\":\"").append(JsonUtil.escape(p.getName())).append("\",")
                          .append("\"description\":\"").append(JsonUtil.escape(p.getDescription())).append("\",")
                          .append("\"price\":").append(p.getPrice()).append(",")
                          .append("\"discountPrice\":").append(p.getDiscountPrice() != null ? p.getDiscountPrice() : "null").append(",")
                          .append("\"stockQuantity\":").append(p.getStockQuantity()).append(",")
                          .append("\"unit\":\"").append(JsonUtil.escape(p.getUnit())).append("\",")
                          .append("\"imageUrl\":\"").append(JsonUtil.escape(p.getImageUrl())).append("\",")
                          .append("\"categoryId\":").append(p.getCategoryId() != null ? p.getCategoryId() : "null").append(",")
                          .append("\"supplierId\":").append(p.getSupplierId() != null ? p.getSupplierId() : "null").append(",")
                          .append("\"available\":").append(p.isAvailable())
                          .append("}");
                    }
                    sb.append("]");
                    sendResponse(exchange, 200, sb.toString());
                } else if ("POST".equals(method)) {
                    String body = readRequestBody(exchange);
                    Product p = parseProductJson(body);
                    ingestLocalImageIfPresent(p);
                    productRepo.create(p);
                    System.out.println("[FreshMart DB LIVE] >> PRODUCT CREATED IN DATABASE: ID=" + p.getId() + ", Name=" + p.getName() + ", Price=" + p.getPrice());
                    sendResponse(exchange, 201, "{\"success\":true,\"id\":" + p.getId() + ",\"imageUrl\":\"" + JsonUtil.escape(p.getImageUrl()) + "\",\"message\":\"Product created in database\"}");
                } else if ("PUT".equals(method)) {
                    String body = readRequestBody(exchange);
                    int id = extractId(exchange, body);
                    if (id <= 0) {
                        sendResponse(exchange, 400, "{\"success\":false,\"error\":\"Product ID required\"}");
                        return;
                    }
                    Product p = parseProductJson(body);
                    p.setId(id);
                    ingestLocalImageIfPresent(p);
                    productRepo.update(p);
                    System.out.println("[FreshMart DB LIVE] >> PRODUCT UPDATED IN DATABASE: ID=" + id + ", Name=" + p.getName() + ", Price=" + p.getPrice());
                    sendResponse(exchange, 200, "{\"success\":true,\"imageUrl\":\"" + JsonUtil.escape(p.getImageUrl()) + "\",\"message\":\"Product updated in database\"}");
                } else if ("DELETE".equals(method)) {
                    String body = readRequestBody(exchange);
                    int id = extractId(exchange, body);
                    if (id <= 0) {
                        sendResponse(exchange, 400, "{\"success\":false,\"error\":\"Product ID required\"}");
                        return;
                    }
                    productRepo.delete(id);
                    System.out.println("[FreshMart DB LIVE] >> PRODUCT DELETED FROM DATABASE: ID=" + id);
                    sendResponse(exchange, 200, "{\"success\":true,\"message\":\"Product deleted from database\"}");
                } else {
                    sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                }
            } catch (Exception e) {
                System.err.println("[FreshMart DB ERROR] Products operation failed: " + e.getMessage());
                sendResponse(exchange, 500, "{\"success\":false,\"error\":\"" + JsonUtil.escape(e.getMessage()) + "\"}");
            }
        }

        private void ingestLocalImageIfPresent(Product p) {
            String imgUrl = p.getImageUrl();
            if (imgUrl == null || imgUrl.trim().isEmpty()) return;
            imgUrl = imgUrl.trim();
            if (imgUrl.contains(":\\") || (imgUrl.startsWith("/") && !imgUrl.startsWith("images/"))) {
                File localFile = new File(imgUrl);
                if (localFile.exists() && localFile.isFile()) {
                    try {
                        File targetDir = new File("frontend/images/products");
                        if (!targetDir.exists()) targetDir.mkdirs();

                        String ext = ".jpg";
                        int dotIdx = localFile.getName().lastIndexOf('.');
                        if (dotIdx >= 0) ext = localFile.getName().substring(dotIdx);

                        String safeName = (p.getName() != null ? p.getName().toLowerCase().replaceAll("[^a-z0-9]", "-") : "product");
                        if (safeName.length() > 20) safeName = safeName.substring(0, 20);
                        String targetFilename = safeName + "-" + System.currentTimeMillis() + ext;
                        File targetFile = new File(targetDir, targetFilename);

                        Files.copy(localFile.toPath(), targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
                        p.setImageUrl("images/products/" + targetFilename);
                        System.out.println("[FreshMart DB LIVE] >> Ingested local image to project: " + p.getImageUrl());
                    } catch (Exception e) {
                        System.err.println("[FreshMart DB WARNING] Failed to ingest local image: " + e.getMessage());
                    }
                }
            }
        }

        private Product parseProductJson(String body) {
            Product p = new Product();
            p.setName(JsonUtil.getString(body, "name"));
            p.setDescription(JsonUtil.getString(body, "description"));
            p.setPrice(JsonUtil.getDouble(body, "price", 0.0));
            p.setDiscountPrice(JsonUtil.getNullableDouble(body, "discountPrice"));
            p.setStockQuantity(JsonUtil.getDouble(body, "stockQuantity", 0.0));
            p.setUnit(JsonUtil.getString(body, "unit"));
            p.setImageUrl(JsonUtil.getString(body, "imageUrl"));
            p.setCategoryId(JsonUtil.getNullableInt(body, "categoryId"));
            p.setSupplierId(JsonUtil.getNullableInt(body, "supplierId"));
            p.setAvailable(JsonUtil.getBoolean(body, "available", true));
            return p;
        }
    }

    // 5. Categories Handler (Full CRUD: GET, POST, PUT, DELETE)
    static class CategoriesHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }

            String method = exchange.getRequestMethod().toUpperCase();
            try {
                if ("GET".equals(method)) {
                    List<Category> cats = categoryRepo.readAll();
                    StringBuilder sb = new StringBuilder("[");
                    for (int i = 0; i < cats.size(); i++) {
                        Category c = cats.get(i);
                        if (i > 0) sb.append(",");
                        sb.append("{")
                          .append("\"id\":").append(c.getId()).append(",")
                          .append("\"name\":\"").append(JsonUtil.escape(c.getName())).append("\",")
                          .append("\"description\":\"").append(JsonUtil.escape(c.getDescription())).append("\"")
                          .append("}");
                    }
                    sb.append("]");
                    sendResponse(exchange, 200, sb.toString());
                } else if ("POST".equals(method)) {
                    String body = readRequestBody(exchange);
                    String name = JsonUtil.getString(body, "name");
                    String desc = JsonUtil.getString(body, "description");
                    Category c = new Category(0, name, desc != null ? desc : "");
                    categoryRepo.create(c);
                    System.out.println("[FreshMart DB LIVE] >> CATEGORY CREATED IN DATABASE: ID=" + c.getId() + ", Name=" + c.getName());
                    sendResponse(exchange, 201, "{\"success\":true,\"id\":" + c.getId() + ",\"message\":\"Category created in database\"}");
                } else if ("PUT".equals(method)) {
                    String body = readRequestBody(exchange);
                    int id = extractId(exchange, body);
                    if (id <= 0) {
                        sendResponse(exchange, 400, "{\"success\":false,\"error\":\"Category ID required\"}");
                        return;
                    }
                    String name = JsonUtil.getString(body, "name");
                    String desc = JsonUtil.getString(body, "description");
                    Category c = new Category(id, name, desc != null ? desc : "");
                    categoryRepo.update(c);
                    System.out.println("[FreshMart DB LIVE] >> CATEGORY UPDATED IN DATABASE: ID=" + id + ", Name=" + name);
                    sendResponse(exchange, 200, "{\"success\":true,\"message\":\"Category updated in database\"}");
                } else if ("DELETE".equals(method)) {
                    String body = readRequestBody(exchange);
                    int id = extractId(exchange, body);
                    if (id <= 0) {
                        sendResponse(exchange, 400, "{\"success\":false,\"error\":\"Category ID required\"}");
                        return;
                    }
                    categoryRepo.delete(id);
                    System.out.println("[FreshMart DB LIVE] >> CATEGORY DELETED FROM DATABASE: ID=" + id);
                    sendResponse(exchange, 200, "{\"success\":true,\"message\":\"Category deleted from database\"}");
                } else {
                    sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                }
            } catch (Exception e) {
                System.err.println("[FreshMart DB ERROR] Categories operation failed: " + e.getMessage());
                sendResponse(exchange, 500, "{\"success\":false,\"error\":\"" + JsonUtil.escape(e.getMessage()) + "\"}");
            }
        }
    }

    // 6. Users Handler (Full CRUD: GET, POST, PUT, DELETE)
    static class UsersHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }

            String method = exchange.getRequestMethod().toUpperCase();
            try {
                if ("GET".equals(method)) {
                    List<User> users = userRepo.readAll();
                    StringBuilder sb = new StringBuilder("[");
                    for (int i = 0; i < users.size(); i++) {
                        User u = users.get(i);
                        if (i > 0) sb.append(",");
                        sb.append("{")
                          .append("\"id\":").append(u.getId()).append(",")
                          .append("\"name\":\"").append(JsonUtil.escape(u.getName())).append("\",")
                          .append("\"email\":\"").append(JsonUtil.escape(u.getEmail())).append("\",")
                          .append("\"phone\":\"").append(JsonUtil.escape(u.getPhone())).append("\",")
                          .append("\"role\":\"").append(JsonUtil.escape(u.getRole())).append("\",")
                          .append("\"address\":\"").append(JsonUtil.escape(u.getAddress())).append("\"")
                          .append("}");
                    }
                    sb.append("]");
                    sendResponse(exchange, 200, sb.toString());
                } else if ("POST".equals(method)) {
                    String body = readRequestBody(exchange);
                    String name = JsonUtil.getString(body, "name");
                    String email = JsonUtil.getString(body, "email");
                    String password = JsonUtil.getString(body, "password");
                    String phone = JsonUtil.getString(body, "phone");
                    String address = JsonUtil.getString(body, "address");
                    String role = JsonUtil.getString(body, "role");

                    User u = new User();
                    u.setName(name);
                    u.setEmail(email);
                    u.setPasswordHash(password != null ? password : "password123");
                    u.setPhone(phone != null ? phone : "");
                    u.setAddress(address != null ? address : "");
                    u.setRole(role != null ? role : "CUSTOMER");

                    userRepo.create(u);
                    System.out.println("[FreshMart DB LIVE] >> USER CREATED IN DATABASE: ID=" + u.getId() + ", Email=" + u.getEmail());
                    sendResponse(exchange, 201, "{\"success\":true,\"id\":" + u.getId() + ",\"message\":\"User created in database\"}");
                } else if ("PUT".equals(method)) {
                    String body = readRequestBody(exchange);
                    int id = extractId(exchange, body);
                    if (id <= 0) {
                        sendResponse(exchange, 400, "{\"success\":false,\"error\":\"User ID required\"}");
                        return;
                    }
                    User u = new User();
                    u.setId(id);
                    u.setName(JsonUtil.getString(body, "name"));
                    u.setEmail(JsonUtil.getString(body, "email"));
                    u.setPhone(JsonUtil.getString(body, "phone"));
                    u.setAddress(JsonUtil.getString(body, "address"));
                    u.setRole(JsonUtil.getString(body, "role"));
                    String password = JsonUtil.getString(body, "password");
                    if (password != null && !password.trim().isEmpty()) {
                        u.setPasswordHash(password.trim());
                    }
                    userRepo.update(u);
                    System.out.println("[FreshMart DB LIVE] >> USER UPDATED IN DATABASE: ID=" + id + ", Name=" + u.getName() + ", Role=" + u.getRole());
                    sendResponse(exchange, 200, "{\"success\":true,\"message\":\"User updated in database\"}");
                } else if ("DELETE".equals(method)) {
                    String body = readRequestBody(exchange);
                    int id = extractId(exchange, body);
                    if (id <= 0) {
                        sendResponse(exchange, 400, "{\"success\":false,\"error\":\"User ID required\"}");
                        return;
                    }
                    userRepo.delete(id);
                    System.out.println("[FreshMart DB LIVE] >> USER DELETED FROM DATABASE: ID=" + id);
                    sendResponse(exchange, 200, "{\"success\":true,\"message\":\"User deleted from database\"}");
                } else {
                    sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                }
            } catch (Exception e) {
                System.err.println("[FreshMart DB ERROR] Users operation failed: " + e.getMessage());
                sendResponse(exchange, 500, "{\"success\":false,\"error\":\"" + JsonUtil.escape(e.getMessage()) + "\"}");
            }
        }
    }

    // 7. Orders Handler (Full CRUD: GET, POST, PUT, DELETE)
    static class OrdersHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }

            String method = exchange.getRequestMethod().toUpperCase();
            try {
                if ("GET".equals(method)) {
                    String query = exchange.getRequestURI().getQuery();
                    Integer customerId = null;
                    if (query != null && query.contains("customerId=")) {
                        for (String param : query.split("&")) {
                            if (param.startsWith("customerId=")) {
                                customerId = Integer.parseInt(param.substring("customerId=".length()));
                            }
                        }
                    }

                    List<Order> orders = (customerId != null) ? orderRepo.findByCustomerId(customerId) : orderRepo.readAll();
                    StringBuilder sb = new StringBuilder("[");
                    for (int i = 0; i < orders.size(); i++) {
                        if (i > 0) sb.append(",");
                        sb.append(orderToJson(orders.get(i)));
                    }
                    sb.append("]");
                    sendResponse(exchange, 200, sb.toString());
                } else if ("POST".equals(method)) {
                    String body = readRequestBody(exchange);
                    int customerId = JsonUtil.getInt(body, "customerId", 1);
                    double subtotal = JsonUtil.getDouble(body, "subtotal", 0.0);
                    double deliveryFee = JsonUtil.getDouble(body, "deliveryFee", 2.99);
                    double tax = JsonUtil.getDouble(body, "tax", 0.0);
                    double totalAmount = JsonUtil.getDouble(body, "totalAmount", subtotal + deliveryFee + tax);
                    String shippingAddress = JsonUtil.getString(body, "shippingAddress");
                    String paymentMethod = JsonUtil.getString(body, "paymentMethod");
                    String notes = JsonUtil.getString(body, "notes");

                    List<OrderItem> items = parseOrderItems(body);

                    Order order = new Order();
                    order.setCustomerId(customerId);
                    order.setSubtotal(subtotal);
                    order.setDeliveryFee(deliveryFee);
                    order.setTax(tax);
                    order.setTotalAmount(totalAmount);
                    order.setShippingAddress(shippingAddress != null ? shippingAddress : "Colombo");
                    order.setItems(items);

                    Order created = orderRepo.createOrder(order, items, paymentMethod, notes);
                    System.out.println("[FreshMart DB LIVE] >> ORDER CREATED IN DATABASE: Code=" + created.getOrderCode() + ", CustomerID=" + customerId + ", Total=Rs " + created.getTotalAmount() + ", Items=" + items.size());

                    sendResponse(exchange, 201, "{\"success\":true,\"order\":" + orderToJson(created) + "}");
                } else if ("PUT".equals(method)) {
                    String body = readRequestBody(exchange);
                    int orderId = extractId(exchange, body);
                    String status = JsonUtil.getString(body, "status");
                    if (status == null) status = JsonUtil.getString(body, "orderStatus");

                    if (orderId <= 0 || status == null || status.trim().isEmpty()) {
                        sendResponse(exchange, 400, "{\"success\":false,\"error\":\"orderId and status required\"}");
                        return;
                    }

                    orderRepo.updateStatus(orderId, status.trim().toUpperCase());
                    System.out.println("[FreshMart DB LIVE] >> ORDER STATUS UPDATED IN DATABASE: ID=" + orderId + " -> " + status);
                    sendResponse(exchange, 200, "{\"success\":true,\"message\":\"Order status updated in database\"}");
                } else if ("DELETE".equals(method)) {
                    String body = readRequestBody(exchange);
                    int orderId = extractId(exchange, body);
                    if (orderId <= 0) {
                        sendResponse(exchange, 400, "{\"success\":false,\"error\":\"Order ID required\"}");
                        return;
                    }
                    orderRepo.delete(orderId);
                    System.out.println("[FreshMart DB LIVE] >> ORDER DELETED FROM DATABASE: ID=" + orderId);
                    sendResponse(exchange, 200, "{\"success\":true,\"message\":\"Order deleted from database\"}");
                } else {
                    sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                }
            } catch (Exception e) {
                System.err.println("[FreshMart DB ERROR] Order operation failed: " + e.getMessage());
                sendResponse(exchange, 500, "{\"success\":false,\"error\":\"" + JsonUtil.escape(e.getMessage()) + "\"}");
            }
        }

        private List<OrderItem> parseOrderItems(String json) {
            List<OrderItem> items = new ArrayList<>();
            Pattern itemPattern = Pattern.compile("\\{[^\\{\\}]*\"productId\"\\s*:\\s*(\\d+)[^\\{\\}]*\\}");
            Matcher m = itemPattern.matcher(json);
            while (m.find()) {
                String itemStr = m.group(0);
                int productId = JsonUtil.getInt(itemStr, "productId", 1);
                String name = JsonUtil.getString(itemStr, "productName");
                if (name == null) name = JsonUtil.getString(itemStr, "name");
                double qty = JsonUtil.getDouble(itemStr, "quantity", 1.0);
                double price = JsonUtil.getDouble(itemStr, "unitPrice", 0.0);
                if (price == 0.0) price = JsonUtil.getDouble(itemStr, "price", 0.0);
                items.add(new OrderItem(productId, name != null ? name : "Item", qty, price));
            }
            if (items.isEmpty()) {
                items.add(new OrderItem(1, "Fresh Organic Apples (1kg)", 1.0, 4.50));
            }
            return items;
        }

        private String orderToJson(Order o) {
            StringBuilder sb = new StringBuilder("{");
            sb.append("\"orderId\":").append(o.getOrderId()).append(",")
              .append("\"orderCode\":\"").append(JsonUtil.escape(o.getOrderCode())).append("\",")
              .append("\"customerId\":").append(o.getCustomerId()).append(",")
              .append("\"customerName\":\"").append(JsonUtil.escape(o.getCustomerName())).append("\",")
              .append("\"customerEmail\":\"").append(JsonUtil.escape(o.getCustomerEmail())).append("\",")
              .append("\"subtotal\":").append(o.getSubtotal()).append(",")
              .append("\"deliveryFee\":").append(o.getDeliveryFee()).append(",")
              .append("\"tax\":").append(o.getTax()).append(",")
              .append("\"totalAmount\":").append(o.getTotalAmount()).append(",")
              .append("\"orderStatus\":\"").append(JsonUtil.escape(o.getOrderStatus())).append("\",")
              .append("\"shippingAddress\":\"").append(JsonUtil.escape(o.getShippingAddress())).append("\",")
              .append("\"orderDate\":\"").append(JsonUtil.escape(o.getOrderDate())).append("\",")
              .append("\"paymentMethod\":\"").append(JsonUtil.escape(o.getPaymentMethod())).append("\",")
              .append("\"paymentStatus\":\"").append(JsonUtil.escape(o.getPaymentStatus())).append("\",")
              .append("\"deliveryStatus\":\"").append(JsonUtil.escape(o.getDeliveryStatus())).append("\",")
              .append("\"items\":[");
            List<OrderItem> items = o.getItems();
            if (items != null) {
                for (int i = 0; i < items.size(); i++) {
                    OrderItem it = items.get(i);
                    if (i > 0) sb.append(",");
                    sb.append("{")
                      .append("\"orderItemId\":").append(it.getOrderItemId()).append(",")
                      .append("\"productId\":").append(it.getProductId()).append(",")
                      .append("\"productName\":\"").append(JsonUtil.escape(it.getProductName())).append("\",")
                      .append("\"quantity\":").append(it.getQuantity()).append(",")
                      .append("\"unitPrice\":").append(it.getUnitPrice()).append(",")
                      .append("\"subtotal\":").append(it.getSubtotal())
                      .append("}");
                }
            }
            sb.append("]}");
            return sb.toString();
        }
    }

    // 8. Inquiries Handler (Full CRUD: GET, POST, PUT, DELETE)
    static class InquiriesHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }

            String method = exchange.getRequestMethod().toUpperCase();
            try {
                if ("GET".equals(method)) {
                    String query = exchange.getRequestURI().getQuery();
                    Integer customerId = null;
                    if (query != null && query.contains("customerId=")) {
                        for (String param : query.split("&")) {
                            if (param.startsWith("customerId=")) {
                                customerId = Integer.parseInt(param.substring("customerId=".length()));
                            }
                        }
                    }

                    List<Inquiry> inquiries = (customerId != null) ? inquiryRepo.findByCustomerId(customerId) : inquiryRepo.readAll();
                    StringBuilder sb = new StringBuilder("[");
                    for (int i = 0; i < inquiries.size(); i++) {
                        if (i > 0) sb.append(",");
                        Inquiry inq = inquiries.get(i);
                        sb.append("{")
                          .append("\"id\":").append(inq.getId()).append(",")
                          .append("\"customerId\":").append(inq.getCustomerId()).append(",")
                          .append("\"customerName\":\"").append(JsonUtil.escape(inq.getCustomerName())).append("\",")
                          .append("\"customerEmail\":\"").append(JsonUtil.escape(inq.getCustomerEmail())).append("\",")
                          .append("\"subject\":\"").append(JsonUtil.escape(inq.getSubject())).append("\",")
                          .append("\"message\":\"").append(JsonUtil.escape(inq.getMessage())).append("\",")
                          .append("\"department\":\"").append(JsonUtil.escape(inq.getDepartment())).append("\",")
                          .append("\"status\":\"").append(JsonUtil.escape(inq.getStatus())).append("\",")
                          .append("\"adminResponse\":\"").append(JsonUtil.escape(inq.getAdminResponse())).append("\",")
                          .append("\"createdAt\":\"").append(JsonUtil.escape(inq.getCreatedAt())).append("\"")
                          .append("}");
                    }
                    sb.append("]");
                    sendResponse(exchange, 200, sb.toString());
                } else if ("POST".equals(method)) {
                    String body = readRequestBody(exchange);
                    int customerId = JsonUtil.getInt(body, "customerId", 1);
                    String subject = JsonUtil.getString(body, "subject");
                    String message = JsonUtil.getString(body, "message");
                    String department = JsonUtil.getString(body, "department");
                    if (department == null || department.isEmpty()) department = "GENERAL";

                    Inquiry inq = new Inquiry();
                    inq.setCustomerId(customerId);
                    inq.setSubject(subject != null ? subject : "Customer Inquiry");
                    inq.setMessage(message != null ? message : "");
                    inq.setDepartment(department);
                    inq.setStatus("PENDING");

                    inquiryRepo.create(inq);
                    System.out.println("[FreshMart DB LIVE] >> INQUIRY SAVED TO DATABASE: ID=" + inq.getId() + ", CustomerID=" + customerId + ", Subject=\"" + inq.getSubject() + "\"");

                    sendResponse(exchange, 201, "{\"success\":true,\"id\":" + inq.getId() + ",\"status\":\"PENDING\"}");
                } else if ("PUT".equals(method)) {
                    String body = readRequestBody(exchange);
                    int inquiryId = extractId(exchange, body);
                    String status = JsonUtil.getString(body, "status");
                    String department = JsonUtil.getString(body, "department");
                    if (department == null) department = JsonUtil.getString(body, "forwardedTo");
                    String response = JsonUtil.getString(body, "response");
                    if (response == null) response = JsonUtil.getString(body, "adminResponse");

                    if ("FORWARDED".equalsIgnoreCase(status) || (department != null && response == null)) {
                        if (inquiryId <= 0) {
                            sendResponse(exchange, 400, "{\"success\":false,\"error\":\"inquiryId required\"}");
                            return;
                        }
                        inquiryRepo.forwardInquiry(inquiryId, department != null ? department : "GENERAL");
                        System.out.println("[FreshMart DB LIVE] >> INQUIRY #" + inquiryId + " FORWARDED TO " + department + " IN DATABASE");
                        sendResponse(exchange, 200, "{\"success\":true,\"message\":\"Inquiry forwarded in database\",\"status\":\"FORWARDED\",\"department\":\"" + JsonUtil.escape(department) + "\"}");
                        return;
                    }

                    if (inquiryId <= 0 || response == null) {
                        sendResponse(exchange, 400, "{\"success\":false,\"error\":\"inquiryId and response required\"}");
                        return;
                    }
                    inquiryRepo.answerInquiry(inquiryId, response.trim());
                    System.out.println("[FreshMart DB LIVE] >> INQUIRY #" + inquiryId + " ANSWERED IN DATABASE");
                    sendResponse(exchange, 200, "{\"success\":true,\"message\":\"Inquiry answered in database\",\"status\":\"ANSWERED\"}");
                } else if ("DELETE".equals(method)) {
                    String body = readRequestBody(exchange);
                    int id = extractId(exchange, body);
                    if (id <= 0) {
                        sendResponse(exchange, 400, "{\"success\":false,\"error\":\"Inquiry ID required\"}");
                        return;
                    }
                    inquiryRepo.delete(id);
                    System.out.println("[FreshMart DB LIVE] >> INQUIRY DELETED FROM DATABASE: ID=" + id);
                    sendResponse(exchange, 200, "{\"success\":true,\"message\":\"Inquiry deleted from database\"}");
                } else {
                    sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                }
            } catch (Exception e) {
                System.err.println("[FreshMart DB ERROR] Inquiry operation failed: " + e.getMessage());
                sendResponse(exchange, 500, "{\"success\":false,\"error\":\"" + JsonUtil.escape(e.getMessage()) + "\"}");
            }
        }
    }

    // 9. Inquiry Respond Handler (Specific helper route)
    static class InquiryRespondHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            try {
                String body = readRequestBody(exchange);
                int inquiryId = JsonUtil.getInt(body, "inquiryId", 0);
                String response = JsonUtil.getString(body, "response");

                if (inquiryId <= 0 || response == null || response.trim().isEmpty()) {
                    sendResponse(exchange, 400, "{\"success\":false,\"error\":\"inquiryId and response are required\"}");
                    return;
                }

                inquiryRepo.answerInquiry(inquiryId, response.trim());
                System.out.println("[FreshMart DB LIVE] >> INQUIRY #" + inquiryId + " ANSWERED IN DATABASE -> Status updated to ANSWERED");
                sendResponse(exchange, 200, "{\"success\":true,\"message\":\"Inquiry answered successfully in database\",\"status\":\"ANSWERED\"}");
            } catch (Exception e) {
                System.err.println("[FreshMart DB ERROR] Answering inquiry failed: " + e.getMessage());
                sendResponse(exchange, 500, "{\"success\":false,\"error\":\"" + JsonUtil.escape(e.getMessage()) + "\"}");
            }
        }
    }

    // 10. Inquiry Forward Handler
    static class InquiryForwardHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod()) && !"PUT".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            try {
                String body = readRequestBody(exchange);
                int inquiryId = JsonUtil.getInt(body, "inquiryId", 0);
                if (inquiryId <= 0) inquiryId = JsonUtil.getInt(body, "id", 0);
                if (inquiryId <= 0) inquiryId = extractId(exchange, body);

                String department = JsonUtil.getString(body, "department");
                if (department == null) department = JsonUtil.getString(body, "forwardedTo");

                if (inquiryId <= 0 || department == null || department.trim().isEmpty()) {
                    sendResponse(exchange, 400, "{\"success\":false,\"error\":\"inquiryId and department are required\"}");
                    return;
                }

                inquiryRepo.forwardInquiry(inquiryId, department.trim());
                System.out.println("[FreshMart DB LIVE] >> INQUIRY #" + inquiryId + " FORWARDED TO " + department + " IN DATABASE -> Status updated to FORWARDED");
                sendResponse(exchange, 200, "{\"success\":true,\"message\":\"Inquiry forwarded successfully in database\",\"status\":\"FORWARDED\",\"department\":\"" + JsonUtil.escape(department) + "\"}");
            } catch (Exception e) {
                System.err.println("[FreshMart DB ERROR] Forwarding inquiry failed: " + e.getMessage());
                sendResponse(exchange, 500, "{\"success\":false,\"error\":\"" + JsonUtil.escape(e.getMessage()) + "\"}");
            }
        }
    }

    // 11. Promotions Handler (Full CRUD: GET, POST, DELETE)
    static class PromotionsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }

            String method = exchange.getRequestMethod().toUpperCase();
            try {
                if ("GET".equals(method)) {
                    List<Promotion> promos = promotionRepo.readActive();
                    StringBuilder sb = new StringBuilder("[");
                    for (int i = 0; i < promos.size(); i++) {
                        Promotion pr = promos.get(i);
                        if (i > 0) sb.append(",");
                        sb.append("{")
                          .append("\"promotionId\":").append(pr.getId()).append(",")
                          .append("\"productId\":").append(pr.getProductId()).append(",")
                          .append("\"productName\":\"").append(JsonUtil.escape(pr.getProductName())).append("\",")
                          .append("\"originalPrice\":").append(pr.getOriginalPrice() != null ? pr.getOriginalPrice() : 0.0).append(",")
                          .append("\"discountPercentage\":").append(pr.getDiscountPercentage()).append(",")
                          .append("\"discountPrice\":").append(pr.getDiscountPrice() != null ? pr.getDiscountPrice() : 0.0).append(",")
                          .append("\"isActive\":").append(pr.isActive())
                          .append("}");
                    }
                    sb.append("]");
                    sendResponse(exchange, 200, sb.toString());
                } else if ("POST".equals(method)) {
                    String body = readRequestBody(exchange);
                    int productId = JsonUtil.getInt(body, "productId", 0);
                    if (productId <= 0) productId = extractId(exchange, body);
                    double percentage = JsonUtil.getDouble(body, "discountPercentage", 0.0);
                    if (percentage <= 0) percentage = JsonUtil.getDouble(body, "percentage", 0.0);
                    Double explicitDiscountPrice = JsonUtil.getNullableDouble(body, "discountPrice");

                    if (productId <= 0) {
                        sendResponse(exchange, 400, "{\"success\":false,\"error\":\"productId required\"}");
                        return;
                    }

                    promotionRepo.applyPromotion(productId, percentage, explicitDiscountPrice);
                    System.out.println("[FreshMart DB LIVE] >> PROMOTION APPLIED IN DATABASE: ProductID=" + productId + ", " + percentage + "% OFF");
                    sendResponse(exchange, 200, "{\"success\":true,\"message\":\"Promotion applied successfully in database\",\"productId\":" + productId + "}");
                } else if ("DELETE".equals(method)) {
                    String body = readRequestBody(exchange);
                    int productId = JsonUtil.getInt(body, "productId", 0);
                    if (productId <= 0) productId = extractId(exchange, body);
                    if (productId <= 0) {
                        String query = exchange.getRequestURI().getQuery();
                        if (query != null && query.contains("productId=")) {
                            for (String p : query.split("&")) {
                                if (p.startsWith("productId=")) {
                                    try { productId = Integer.parseInt(p.substring("productId=".length())); } catch (Exception ignored) {}
                                }
                            }
                        }
                    }

                    if (productId <= 0) {
                        sendResponse(exchange, 400, "{\"success\":false,\"error\":\"productId required\"}");
                        return;
                    }

                    promotionRepo.removePromotion(productId);
                    System.out.println("[FreshMart DB LIVE] >> PROMOTION REMOVED IN DATABASE: ProductID=" + productId);
                    sendResponse(exchange, 200, "{\"success\":true,\"message\":\"Promotion removed successfully from database\"}");
                } else {
                    sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                }
            } catch (Exception e) {
                System.err.println("[FreshMart DB ERROR] Promotion operation failed: " + e.getMessage());
                sendResponse(exchange, 500, "{\"success\":false,\"error\":\"" + JsonUtil.escape(e.getMessage()) + "\"}");
            }
        }
    }

    // 10. Suppliers Handler (Full CRUD: GET, POST, PUT, DELETE)
    static class SuppliersHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }

            String method = exchange.getRequestMethod().toUpperCase();
            try {
                if ("GET".equals(method)) {
                    List<Supplier> suppliers = supplierRepo.readAll();
                    StringBuilder sb = new StringBuilder("[");
                    for (int i = 0; i < suppliers.size(); i++) {
                        Supplier s = suppliers.get(i);
                        if (i > 0) sb.append(",");
                        sb.append("{")
                          .append("\"id\":").append(s.getId()).append(",")
                          .append("\"companyName\":\"").append(JsonUtil.escape(s.getCompanyName())).append("\",")
                          .append("\"contactPerson\":\"").append(JsonUtil.escape(s.getContactPerson())).append("\",")
                          .append("\"email\":\"").append(JsonUtil.escape(s.getEmail())).append("\",")
                          .append("\"phone\":\"").append(JsonUtil.escape(s.getPhone())).append("\",")
                          .append("\"address\":\"").append(JsonUtil.escape(s.getAddress())).append("\",")
                          .append("\"contractTerms\":\"").append(JsonUtil.escape(s.getContractTerms())).append("\",")
                          .append("\"active\":").append(s.isActive())
                          .append("}");
                    }
                    sb.append("]");
                    sendResponse(exchange, 200, sb.toString());
                } else if ("POST".equals(method)) {
                    String body = readRequestBody(exchange);
                    Supplier s = new Supplier(
                        0,
                        JsonUtil.getString(body, "companyName"),
                        JsonUtil.getString(body, "contactPerson"),
                        JsonUtil.getString(body, "email"),
                        JsonUtil.getString(body, "phone"),
                        JsonUtil.getString(body, "address"),
                        JsonUtil.getString(body, "contractTerms"),
                        JsonUtil.getBoolean(body, "active", true)
                    );
                    supplierRepo.create(s);
                    System.out.println("[FreshMart DB LIVE] >> SUPPLIER CREATED IN DATABASE: ID=" + s.getId() + ", Company=" + s.getCompanyName());
                    sendResponse(exchange, 201, "{\"success\":true,\"id\":" + s.getId() + ",\"message\":\"Supplier created in database\"}");
                } else if ("PUT".equals(method)) {
                    String body = readRequestBody(exchange);
                    int id = extractId(exchange, body);
                    if (id <= 0) {
                        sendResponse(exchange, 400, "{\"success\":false,\"error\":\"Supplier ID required\"}");
                        return;
                    }
                    Supplier s = new Supplier(
                        id,
                        JsonUtil.getString(body, "companyName"),
                        JsonUtil.getString(body, "contactPerson"),
                        JsonUtil.getString(body, "email"),
                        JsonUtil.getString(body, "phone"),
                        JsonUtil.getString(body, "address"),
                        JsonUtil.getString(body, "contractTerms"),
                        JsonUtil.getBoolean(body, "active", true)
                    );
                    supplierRepo.update(s);
                    System.out.println("[FreshMart DB LIVE] >> SUPPLIER UPDATED IN DATABASE: ID=" + id + ", Company=" + s.getCompanyName());
                    sendResponse(exchange, 200, "{\"success\":true,\"message\":\"Supplier updated in database\"}");
                } else if ("DELETE".equals(method)) {
                    String body = readRequestBody(exchange);
                    int id = extractId(exchange, body);
                    if (id <= 0) {
                        sendResponse(exchange, 400, "{\"success\":false,\"error\":\"Supplier ID required\"}");
                        return;
                    }
                    supplierRepo.delete(id);
                    System.out.println("[FreshMart DB LIVE] >> SUPPLIER DELETED FROM DATABASE: ID=" + id);
                    sendResponse(exchange, 200, "{\"success\":true,\"message\":\"Supplier deleted from database\"}");
                } else {
                    sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                }
            } catch (Exception e) {
                System.err.println("[FreshMart DB ERROR] Suppliers operation failed: " + e.getMessage());
                sendResponse(exchange, 500, "{\"success\":false,\"error\":\"" + JsonUtil.escape(e.getMessage()) + "\"}");
            }
        }
    }

    // 12. Local Image Streaming Handler (Resolves any local file path via HTTP)
    static class ImagesHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }

            String query = exchange.getRequestURI().getQuery();
            String rawPath = null;
            if (query != null && query.contains("path=")) {
                for (String param : query.split("&")) {
                    if (param.startsWith("path=")) {
                        try {
                            rawPath = java.net.URLDecoder.decode(param.substring("path=".length()), StandardCharsets.UTF_8.name());
                        } catch (Exception ignored) {}
                        break;
                    }
                }
            }

            if (rawPath == null || rawPath.trim().isEmpty()) {
                sendResponse(exchange, 400, "{\"error\":\"path parameter required\"}");
                return;
            }

            File file = new File(rawPath.trim());
            if (!file.isAbsolute() || !file.exists()) {
                File rel1 = new File("frontend", rawPath.trim());
                if (rel1.exists()) {
                    file = rel1;
                } else {
                    File rel2 = new File(rawPath.trim());
                    if (rel2.exists()) file = rel2;
                }
            }

            if (!file.exists() || !file.isFile()) {
                sendResponse(exchange, 404, "{\"error\":\"Image not found: " + JsonUtil.escape(rawPath) + "\"}");
                return;
            }

            String mimeType = "image/jpeg";
            String name = file.getName().toLowerCase();
            if (name.endsWith(".png")) mimeType = "image/png";
            else if (name.endsWith(".webp")) mimeType = "image/webp";
            else if (name.endsWith(".gif")) mimeType = "image/gif";
            else if (name.endsWith(".svg")) mimeType = "image/svg+xml";

            byte[] bytes = Files.readAllBytes(file.toPath());
            exchange.getResponseHeaders().set("Content-Type", mimeType);
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Cache-Control", "public, max-age=86400");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }
    }

    // 13. Shopping Cart Handler (Full DB persistence for shopping_carts & cart_items)
    static class CartHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }

            String method = exchange.getRequestMethod().toUpperCase();
            String path = exchange.getRequestURI().getPath();
            String query = exchange.getRequestURI().getQuery();

            try {
                if ("GET".equals(method)) {
                    int customerId = parseCustomerId(query, null);
                    Cart cart = cartRepo.getCartByCustomerId(customerId);
                    sendResponse(exchange, 200, cartToJson(cart));
                } else if ("POST".equals(method)) {
                    String body = readRequestBody(exchange);
                    int customerId = parseCustomerId(query, body);

                    if (path.endsWith("/sync") || body.contains("\"items\"")) {
                        List<CartItem> items = parseCartItems(body);
                        Cart cart = cartRepo.syncCart(customerId, items);
                        System.out.println("[FreshMart DB LIVE] >> CART SYNCED IN DATABASE: CustomerID=" + customerId + " (" + (items != null ? items.size() : 0) + " items)");
                        sendResponse(exchange, 200, cartToJson(cart));
                    } else {
                        int productId = JsonUtil.getInt(body, "productId", 0);
                        if (productId <= 0) productId = JsonUtil.getInt(body, "id", 0);
                        double quantity = JsonUtil.getDouble(body, "quantity", 1.0);
                        if (quantity <= 0) quantity = 1.0;

                        if (productId <= 0) {
                            sendResponse(exchange, 400, "{\"success\":false,\"error\":\"productId is required\"}");
                            return;
                        }

                        Cart cart = cartRepo.addItem(customerId, productId, quantity);
                        System.out.println("[FreshMart DB LIVE] >> ITEM ADDED TO DATABASE CART: CustomerID=" + customerId + ", ProductID=" + productId + ", Qty=" + quantity);
                        sendResponse(exchange, 200, cartToJson(cart));
                    }
                } else if ("PUT".equals(method)) {
                    String body = readRequestBody(exchange);
                    int customerId = parseCustomerId(query, body);
                    int productId = JsonUtil.getInt(body, "productId", 0);
                    if (productId <= 0) productId = JsonUtil.getInt(body, "id", 0);
                    double quantity = JsonUtil.getDouble(body, "quantity", 0.0);

                    if (productId <= 0) {
                        sendResponse(exchange, 400, "{\"success\":false,\"error\":\"productId is required\"}");
                        return;
                    }

                    Cart cart = cartRepo.updateQuantity(customerId, productId, quantity);
                    System.out.println("[FreshMart DB LIVE] >> CART ITEM UPDATED IN DATABASE: CustomerID=" + customerId + ", ProductID=" + productId + ", Qty=" + quantity);
                    sendResponse(exchange, 200, cartToJson(cart));
                } else if ("DELETE".equals(method)) {
                    String body = readRequestBody(exchange);
                    int customerId = parseCustomerId(query, body);

                    if (path.endsWith("/clear") || (query != null && query.contains("clear=true"))) {
                        Cart cart = cartRepo.clearCart(customerId);
                        System.out.println("[FreshMart DB LIVE] >> CART CLEARED IN DATABASE: CustomerID=" + customerId);
                        sendResponse(exchange, 200, cartToJson(cart));
                    } else {
                        int productId = parseProductId(query, body);
                        if (productId <= 0) {
                            Cart cart = cartRepo.clearCart(customerId);
                            System.out.println("[FreshMart DB LIVE] >> CART CLEARED IN DATABASE: CustomerID=" + customerId);
                            sendResponse(exchange, 200, cartToJson(cart));
                        } else {
                            Cart cart = cartRepo.removeItem(customerId, productId);
                            System.out.println("[FreshMart DB LIVE] >> ITEM REMOVED FROM DATABASE CART: CustomerID=" + customerId + ", ProductID=" + productId);
                            sendResponse(exchange, 200, cartToJson(cart));
                        }
                    }
                } else {
                    sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                }
            } catch (Exception e) {
                System.err.println("[FreshMart DB ERROR] Cart operation failed: " + e.getMessage());
                sendResponse(exchange, 500, "{\"success\":false,\"error\":\"" + JsonUtil.escape(e.getMessage()) + "\"}");
            }
        }

        private int parseCustomerId(String query, String body) {
            int custId = 0;
            if (query != null && query.contains("customerId=")) {
                for (String param : query.split("&")) {
                    if (param.startsWith("customerId=")) {
                        try { custId = Integer.parseInt(param.substring("customerId=".length())); } catch (Exception ignored) {}
                        break;
                    }
                }
            }
            if (custId <= 0 && body != null && !body.isEmpty()) {
                custId = JsonUtil.getInt(body, "customerId", 0);
                if (custId <= 0) custId = JsonUtil.getInt(body, "userId", 0);
            }
            if (custId <= 0) custId = 1003;
            return custId;
        }

        private int parseProductId(String query, String body) {
            int prodId = 0;
            if (query != null && (query.contains("productId=") || query.contains("id="))) {
                for (String param : query.split("&")) {
                    if (param.startsWith("productId=")) {
                        try { prodId = Integer.parseInt(param.substring("productId=".length())); } catch (Exception ignored) {}
                        break;
                    } else if (param.startsWith("id=")) {
                        try { prodId = Integer.parseInt(param.substring("id=".length())); } catch (Exception ignored) {}
                        break;
                    }
                }
            }
            if (prodId <= 0 && body != null && !body.isEmpty()) {
                prodId = JsonUtil.getInt(body, "productId", 0);
                if (prodId <= 0) prodId = JsonUtil.getInt(body, "id", 0);
            }
            return prodId;
        }

        private List<CartItem> parseCartItems(String json) {
            List<CartItem> items = new ArrayList<>();
            Pattern itemPattern = Pattern.compile("\\{[^\\{\\}]*\"productId\"\\s*:\\s*(\\d+)[^\\{\\}]*\\}");
            Matcher m = itemPattern.matcher(json);
            while (m.find()) {
                String itemStr = m.group(0);
                int productId = JsonUtil.getInt(itemStr, "productId", 0);
                double qty = JsonUtil.getDouble(itemStr, "quantity", 1.0);
                if (productId > 0 && qty > 0) {
                    CartItem ci = new CartItem();
                    ci.setProductId(productId);
                    ci.setQuantity(qty);
                    items.add(ci);
                }
            }
            return items;
        }

        private String cartToJson(Cart cart) {
            if (cart == null) {
                return "{\"success\":true,\"cartId\":0,\"customerId\":0,\"items\":[]}";
            }
            StringBuilder sb = new StringBuilder("{");
            sb.append("\"success\":true,")
              .append("\"cartId\":").append(cart.getCartId()).append(",")
              .append("\"customerId\":").append(cart.getCustomerId()).append(",")
              .append("\"createdAt\":\"").append(JsonUtil.escape(cart.getCreatedAt() != null ? cart.getCreatedAt() : "")).append("\",")
              .append("\"updatedAt\":\"").append(JsonUtil.escape(cart.getUpdatedAt() != null ? cart.getUpdatedAt() : "")).append("\",")
              .append("\"items\":[");
            List<CartItem> items = cart.getItems();
            if (items != null) {
                for (int i = 0; i < items.size(); i++) {
                    CartItem it = items.get(i);
                    if (i > 0) sb.append(",");
                    sb.append("{")
                      .append("\"cartItemId\":").append(it.getCartItemId()).append(",")
                      .append("\"cartId\":").append(it.getCartId()).append(",")
                      .append("\"productId\":").append(it.getProductId()).append(",")
                      .append("\"productName\":\"").append(JsonUtil.escape(it.getProductName())).append("\",")
                      .append("\"quantity\":").append(it.getQuantity()).append(",")
                      .append("\"unitPrice\":").append(it.getUnitPrice()).append(",")
                      .append("\"unit\":\"").append(JsonUtil.escape(it.getUnit())).append("\",")
                      .append("\"imageUrl\":\"").append(JsonUtil.escape(it.getImageUrl())).append("\",")
                      .append("\"addedAt\":\"").append(JsonUtil.escape(it.getAddedAt() != null ? it.getAddedAt() : "")).append("\"")
                      .append("}");
                }
            }
            sb.append("]}");
            return sb.toString();
        }
    }
}
