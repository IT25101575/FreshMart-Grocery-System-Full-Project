package com.grocery.repository;

import com.grocery.exception.DatabaseException;
import com.grocery.model.Order;
import com.grocery.model.OrderItem;
import com.grocery.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class OrderRepository implements Repository<Order, Integer> {

    @Override
    public void create(Order entity) throws DatabaseException {
        // Default create delegating to createOrder
        createOrder(entity, entity.getItems(), entity.getPaymentMethod(), "Standard Delivery");
    }

    public Order createOrder(Order order, List<OrderItem> items, String paymentMethod, String notes) throws DatabaseException {
        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false);

            // 1. Insert into orders
            String orderSql = "INSERT INTO orders (customer_id, subtotal, delivery_fee, tax, total_amount, order_status, shipping_address, order_date) " +
                             "VALUES (?, ?, ?, ?, ?, 'CONFIRMED', ?, GETDATE())";
            int orderId;
            try (PreparedStatement ps = conn.prepareStatement(orderSql, Statement.RETURN_GENERATED_KEYS)) {
                ps.setInt(1, order.getCustomerId());
                ps.setDouble(2, order.getSubtotal());
                ps.setDouble(3, order.getDeliveryFee());
                ps.setDouble(4, order.getTax());
                ps.setDouble(5, order.getTotalAmount());
                ps.setString(6, order.getShippingAddress() != null ? order.getShippingAddress() : "Colombo");
                ps.executeUpdate();
                try (ResultSet rs = ps.getGeneratedKeys()) {
                    if (!rs.next()) throw new SQLException("Failed to retrieve order ID");
                    orderId = rs.getInt(1);
                }
            }

            // Generate order_code e.g. ORD-00001
            String orderCode = String.format("ORD-%05d", orderId);
            try (PreparedStatement ps = conn.prepareStatement("UPDATE orders SET order_code = ? WHERE order_id = ?")) {
                ps.setString(1, orderCode);
                ps.setInt(2, orderId);
                ps.executeUpdate();
            }
            order.setOrderId(orderId);
            order.setOrderCode(orderCode);
            order.setOrderStatus("CONFIRMED");

            // 2. Insert into order_items & update product stock
            String itemSql = "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)";
            String stockSql = "UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ? AND stock_quantity >= ?";
            for (OrderItem it : items) {
                try (PreparedStatement psItem = conn.prepareStatement(itemSql, Statement.RETURN_GENERATED_KEYS)) {
                    psItem.setInt(1, orderId);
                    psItem.setInt(2, it.getProductId());
                    psItem.setDouble(3, it.getQuantity());
                    psItem.setDouble(4, it.getUnitPrice());
                    psItem.executeUpdate();
                    try (ResultSet rs = psItem.getGeneratedKeys()) {
                        if (rs.next()) it.setOrderItemId(rs.getInt(1));
                    }
                }
                // Try stock decrement (if stock is sufficient)
                try (PreparedStatement psStock = conn.prepareStatement(stockSql)) {
                    psStock.setDouble(1, it.getQuantity());
                    psStock.setInt(2, it.getProductId());
                    psStock.setDouble(3, it.getQuantity());
                    psStock.executeUpdate();
                }
            }

            // 3. Insert into payments
            String payMethod = (paymentMethod != null && !paymentMethod.trim().isEmpty()) ? paymentMethod.toUpperCase() : "CARD";
            if (!payMethod.equals("CARD") && !payMethod.equals("COD") && !payMethod.equals("BANK_TRANSFER")) {
                payMethod = "CARD";
            }
            int paymentId;
            String paySql = "INSERT INTO payments (order_id, payment_method, payment_status, amount, transaction_date) " +
                            "VALUES (?, ?, 'COMPLETED', ?, GETDATE())";
            try (PreparedStatement psPay = conn.prepareStatement(paySql, Statement.RETURN_GENERATED_KEYS)) {
                psPay.setInt(1, orderId);
                psPay.setString(2, payMethod);
                psPay.setDouble(3, order.getTotalAmount());
                psPay.executeUpdate();
                try (ResultSet rs = psPay.getGeneratedKeys()) {
                    if (rs.next()) {
                        paymentId = rs.getInt(1);
                        String payCode = String.format("PAY-%05d", paymentId);
                        try (PreparedStatement psCode = conn.prepareStatement("UPDATE payments SET payment_code = ? WHERE payment_id = ?")) {
                            psCode.setString(1, payCode);
                            psCode.setInt(2, paymentId);
                            psCode.executeUpdate();
                        }
                    }
                }
            }
            order.setPaymentMethod(payMethod);
            order.setPaymentStatus("COMPLETED");

            // 4. Insert into deliveries
            int deliveryId;
            String delSql = "INSERT INTO deliveries (order_id, delivery_status, scheduled_time, delivery_notes) " +
                            "VALUES (?, 'SCHEDULED', DATEADD(hour, 3, GETDATE()), ?)";
            try (PreparedStatement psDel = conn.prepareStatement(delSql, Statement.RETURN_GENERATED_KEYS)) {
                psDel.setInt(1, orderId);
                psDel.setString(2, notes != null ? notes : "Standard delivery");
                psDel.executeUpdate();
                try (ResultSet rs = psDel.getGeneratedKeys()) {
                    if (rs.next()) {
                        deliveryId = rs.getInt(1);
                        String delCode = String.format("DEL-%05d", deliveryId);
                        try (PreparedStatement psCode = conn.prepareStatement("UPDATE deliveries SET delivery_code = ? WHERE delivery_id = ?")) {
                            psCode.setString(1, delCode);
                            psCode.setInt(2, deliveryId);
                            psCode.executeUpdate();
                        }
                    }
                }
            }
            order.setDeliveryStatus("SCHEDULED");

            conn.commit();
            return order;
        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ex) {}
            }
            throw new DatabaseException("Failed to place order: " + e.getMessage(), e);
        } finally {
            if (conn != null) {
                try { conn.setAutoCommit(true); conn.close(); } catch (SQLException ex) {}
            }
        }
    }

    @Override
    public Order readById(Integer id) throws DatabaseException {
        String sql = "SELECT o.order_id, o.order_code, o.customer_id, o.subtotal, o.delivery_fee, o.tax, o.total_amount, " +
                     "o.order_status, o.shipping_address, CONVERT(VARCHAR(25), o.order_date, 126) as order_date, " +
                     "u.name, u.email, p.payment_method, p.payment_status, d.delivery_status " +
                     "FROM orders o " +
                     "LEFT JOIN users u ON o.customer_id = u.user_id " +
                     "LEFT JOIN payments p ON o.order_id = p.order_id " +
                     "LEFT JOIN deliveries d ON o.order_id = d.order_id " +
                     "WHERE o.order_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Order order = mapOrder(rs);
                    order.setItems(loadItemsForOrder(conn, id));
                    return order;
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to read order by ID: " + e.getMessage(), e);
        }
        return null;
    }

    public List<Order> findByCustomerId(int customerId) throws DatabaseException {
        List<Order> list = new ArrayList<>();
        String sql = "SELECT o.order_id, o.order_code, o.customer_id, o.subtotal, o.delivery_fee, o.tax, o.total_amount, " +
                     "o.order_status, o.shipping_address, CONVERT(VARCHAR(25), o.order_date, 126) as order_date, " +
                     "u.name, u.email, p.payment_method, p.payment_status, d.delivery_status " +
                     "FROM orders o " +
                     "LEFT JOIN users u ON o.customer_id = u.user_id " +
                     "LEFT JOIN payments p ON o.order_id = p.order_id " +
                     "LEFT JOIN deliveries d ON o.order_id = d.order_id " +
                     "WHERE o.customer_id = ? " +
                     "ORDER BY o.order_id DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, customerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Order o = mapOrder(rs);
                    o.setItems(loadItemsForOrder(conn, o.getOrderId()));
                    list.add(o);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to find customer orders: " + e.getMessage(), e);
        }
        return list;
    }

    @Override
    public List<Order> readAll() throws DatabaseException {
        List<Order> list = new ArrayList<>();
        String sql = "SELECT o.order_id, o.order_code, o.customer_id, o.subtotal, o.delivery_fee, o.tax, o.total_amount, " +
                     "o.order_status, o.shipping_address, CONVERT(VARCHAR(25), o.order_date, 126) as order_date, " +
                     "u.name, u.email, p.payment_method, p.payment_status, d.delivery_status " +
                     "FROM orders o " +
                     "LEFT JOIN users u ON o.customer_id = u.user_id " +
                     "LEFT JOIN payments p ON o.order_id = p.order_id " +
                     "LEFT JOIN deliveries d ON o.order_id = d.order_id " +
                     "ORDER BY o.order_id DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Order o = mapOrder(rs);
                o.setItems(loadItemsForOrder(conn, o.getOrderId()));
                list.add(o);
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to read all orders: " + e.getMessage(), e);
        }
        return list;
    }

    @Override
    public void update(Order entity) throws DatabaseException {
        String sql = "UPDATE orders SET order_status = ?, shipping_address = ? WHERE order_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, entity.getOrderStatus());
            ps.setString(2, entity.getShippingAddress());
            ps.setInt(3, entity.getOrderId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update order: " + e.getMessage(), e);
        }
    }

    public void updateStatus(int orderId, String newStatus) throws DatabaseException {
        try (Connection conn = DBConnection.getConnection()) {
            try (PreparedStatement ps = conn.prepareStatement("UPDATE orders SET order_status = ? WHERE order_id = ?")) {
                ps.setString(1, newStatus);
                ps.setInt(2, orderId);
                ps.executeUpdate();
            }
            if ("DELIVERED".equalsIgnoreCase(newStatus)) {
                try (PreparedStatement ps = conn.prepareStatement("UPDATE orders SET delivered_at = GETDATE() WHERE order_id = ?")) {
                    ps.setInt(1, orderId);
                    ps.executeUpdate();
                }
                try (PreparedStatement ps = conn.prepareStatement("UPDATE deliveries SET delivery_status = 'DELIVERED', delivered_at = GETDATE() WHERE order_id = ?")) {
                    ps.setInt(1, orderId);
                    ps.executeUpdate();
                }
            } else if ("SHIPPED".equalsIgnoreCase(newStatus)) {
                try (PreparedStatement ps = conn.prepareStatement("UPDATE deliveries SET delivery_status = 'IN_TRANSIT' WHERE order_id = ?")) {
                    ps.setInt(1, orderId);
                    ps.executeUpdate();
                }
            } else if ("CANCELLED".equalsIgnoreCase(newStatus)) {
                try (PreparedStatement ps = conn.prepareStatement("UPDATE deliveries SET delivery_status = 'CANCELLED' WHERE order_id = ?")) {
                    ps.setInt(1, orderId);
                    ps.executeUpdate();
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update order status: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(Integer id) throws DatabaseException {
        try (Connection conn = DBConnection.getConnection()) {
            conn.setAutoCommit(false);
            try (PreparedStatement ps1 = conn.prepareStatement("DELETE FROM order_items WHERE order_id = ?");
                 PreparedStatement ps2 = conn.prepareStatement("DELETE FROM payments WHERE order_id = ?");
                 PreparedStatement ps3 = conn.prepareStatement("DELETE FROM deliveries WHERE order_id = ?");
                 PreparedStatement ps4 = conn.prepareStatement("DELETE FROM orders WHERE order_id = ?")) {
                ps1.setInt(1, id); ps1.executeUpdate();
                ps2.setInt(1, id); ps2.executeUpdate();
                ps3.setInt(1, id); ps3.executeUpdate();
                ps4.setInt(1, id); ps4.executeUpdate();
                conn.commit();
            } catch (SQLException ex) {
                conn.rollback();
                throw ex;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete order: " + e.getMessage(), e);
        }
    }

    private List<OrderItem> loadItemsForOrder(Connection conn, int orderId) throws SQLException {
        List<OrderItem> items = new ArrayList<>();
        String sql = "SELECT oi.order_item_id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price, oi.subtotal, p.product_name " +
                     "FROM order_items oi " +
                     "LEFT JOIN products p ON oi.product_id = p.product_id " +
                     "WHERE oi.order_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    OrderItem item = new OrderItem();
                    item.setOrderItemId(rs.getInt("order_item_id"));
                    item.setOrderId(rs.getInt("order_id"));
                    item.setProductId(rs.getInt("product_id"));
                    item.setQuantity(rs.getDouble("quantity"));
                    item.setUnitPrice(rs.getDouble("unit_price"));
                    item.setSubtotal(rs.getDouble("subtotal"));
                    item.setProductName(rs.getString("product_name"));
                    items.add(item);
                }
            }
        }
        return items;
    }

    private Order mapOrder(ResultSet rs) throws SQLException {
        Order o = new Order();
        o.setOrderId(rs.getInt("order_id"));
        o.setOrderCode(rs.getString("order_code"));
        o.setCustomerId(rs.getInt("customer_id"));
        o.setCustomerName(rs.getString("name"));
        o.setCustomerEmail(rs.getString("email"));
        o.setSubtotal(rs.getDouble("subtotal"));
        o.setDeliveryFee(rs.getDouble("delivery_fee"));
        o.setTax(rs.getDouble("tax"));
        o.setTotalAmount(rs.getDouble("total_amount"));
        o.setOrderStatus(rs.getString("order_status"));
        o.setShippingAddress(rs.getString("shipping_address"));
        o.setOrderDate(rs.getString("order_date"));
        o.setPaymentMethod(rs.getString("payment_method"));
        o.setPaymentStatus(rs.getString("payment_status"));
        o.setDeliveryStatus(rs.getString("delivery_status"));
        return o;
    }
}
