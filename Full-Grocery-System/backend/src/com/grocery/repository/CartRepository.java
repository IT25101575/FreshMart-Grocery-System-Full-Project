package com.grocery.repository;

import com.grocery.model.Cart;
import com.grocery.model.CartItem;
import com.grocery.exception.DatabaseException;
import com.grocery.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CartRepository implements Repository<Cart, Integer> {

    private int ensureValidCustomerId(Connection conn, int customerId) throws SQLException {
        if (customerId <= 0) customerId = 1003;
        String checkSql = "SELECT user_id FROM users WHERE user_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(checkSql)) {
            ps.setInt(1, customerId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return customerId;
                }
            }
        }
        // If specified customer does not exist, fallback to default customer 1003
        return 1003;
    }

    public int getOrCreateCartId(Connection conn, int customerId) throws SQLException {
        int validCustId = ensureValidCustomerId(conn, customerId);
        String selSql = "SELECT cart_id FROM shopping_carts WHERE customer_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(selSql)) {
            ps.setInt(1, validCustId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("cart_id");
                }
            }
        }

        String insSql = "INSERT INTO shopping_carts (customer_id, created_at, updated_at) VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
        try (PreparedStatement ps = conn.prepareStatement(insSql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, validCustId);
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        }

        // Secondary fetch in case of race condition or trigger
        try (PreparedStatement ps = conn.prepareStatement(selSql)) {
            ps.setInt(1, validCustId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("cart_id");
                }
            }
        }
        throw new SQLException("Could not create or obtain cart for customer ID " + validCustId);
    }

    public Cart getCartByCustomerId(int customerId) throws DatabaseException {
        try (Connection conn = DBConnection.getConnection()) {
            int cartId = getOrCreateCartId(conn, customerId);
            return readByIdInternal(conn, cartId);
        } catch (SQLException e) {
            throw new DatabaseException("Failed to get cart for customer " + customerId + ": " + e.getMessage(), e);
        }
    }

    public Cart addItem(int customerId, int productId, double quantity) throws DatabaseException {
        if (quantity <= 0) quantity = 1.0;
        try (Connection conn = DBConnection.getConnection()) {
            conn.setAutoCommit(false);
            try {
                int cartId = getOrCreateCartId(conn, customerId);

                String checkSql = "SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?";
                boolean exists = false;
                double existingQty = 0.0;
                try (PreparedStatement ps = conn.prepareStatement(checkSql)) {
                    ps.setInt(1, cartId);
                    ps.setInt(2, productId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            exists = true;
                            existingQty = rs.getDouble("quantity");
                        }
                    }
                }

                if (exists) {
                    double newQty = existingQty + quantity;
                    String updSql = "UPDATE cart_items SET quantity = ?, added_at = CURRENT_TIMESTAMP WHERE cart_id = ? AND product_id = ?";
                    try (PreparedStatement ps = conn.prepareStatement(updSql)) {
                        ps.setDouble(1, newQty);
                        ps.setInt(2, cartId);
                        ps.setInt(3, productId);
                        ps.executeUpdate();
                    }
                } else {
                    String insSql = "INSERT INTO cart_items (cart_id, product_id, quantity, added_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)";
                    try (PreparedStatement ps = conn.prepareStatement(insSql)) {
                        ps.setInt(1, cartId);
                        ps.setInt(2, productId);
                        ps.setDouble(3, quantity);
                        ps.executeUpdate();
                    }
                }

                String touchSql = "UPDATE shopping_carts SET updated_at = CURRENT_TIMESTAMP WHERE cart_id = ?";
                try (PreparedStatement ps = conn.prepareStatement(touchSql)) {
                    ps.setInt(1, cartId);
                    ps.executeUpdate();
                }

                conn.commit();
                return readByIdInternal(conn, cartId);
            } catch (SQLException ex) {
                conn.rollback();
                throw ex;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to add item to cart: " + e.getMessage(), e);
        }
    }

    public Cart updateQuantity(int customerId, int productId, double quantity) throws DatabaseException {
        try (Connection conn = DBConnection.getConnection()) {
            conn.setAutoCommit(false);
            try {
                int cartId = getOrCreateCartId(conn, customerId);

                if (quantity <= 0.0001) {
                    String delSql = "DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?";
                    try (PreparedStatement ps = conn.prepareStatement(delSql)) {
                        ps.setInt(1, cartId);
                        ps.setInt(2, productId);
                        ps.executeUpdate();
                    }
                } else {
                    String checkSql = "SELECT cart_item_id FROM cart_items WHERE cart_id = ? AND product_id = ?";
                    boolean exists = false;
                    try (PreparedStatement ps = conn.prepareStatement(checkSql)) {
                        ps.setInt(1, cartId);
                        ps.setInt(2, productId);
                        try (ResultSet rs = ps.executeQuery()) {
                            if (rs.next()) exists = true;
                        }
                    }

                    if (exists) {
                        String updSql = "UPDATE cart_items SET quantity = ?, added_at = CURRENT_TIMESTAMP WHERE cart_id = ? AND product_id = ?";
                        try (PreparedStatement ps = conn.prepareStatement(updSql)) {
                            ps.setDouble(1, quantity);
                            ps.setInt(2, cartId);
                            ps.setInt(3, productId);
                            ps.executeUpdate();
                        }
                    } else {
                        String insSql = "INSERT INTO cart_items (cart_id, product_id, quantity, added_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)";
                        try (PreparedStatement ps = conn.prepareStatement(insSql)) {
                            ps.setInt(1, cartId);
                            ps.setInt(2, productId);
                            ps.setDouble(3, quantity);
                            ps.executeUpdate();
                        }
                    }
                }

                String touchSql = "UPDATE shopping_carts SET updated_at = CURRENT_TIMESTAMP WHERE cart_id = ?";
                try (PreparedStatement ps = conn.prepareStatement(touchSql)) {
                    ps.setInt(1, cartId);
                    ps.executeUpdate();
                }

                conn.commit();
                return readByIdInternal(conn, cartId);
            } catch (SQLException ex) {
                conn.rollback();
                throw ex;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update cart item quantity: " + e.getMessage(), e);
        }
    }

    public Cart removeItem(int customerId, int productId) throws DatabaseException {
        try (Connection conn = DBConnection.getConnection()) {
            int cartId = getOrCreateCartId(conn, customerId);
            String delSql = "DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(delSql)) {
                ps.setInt(1, cartId);
                ps.setInt(2, productId);
                ps.executeUpdate();
            }

            String touchSql = "UPDATE shopping_carts SET updated_at = CURRENT_TIMESTAMP WHERE cart_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(touchSql)) {
                ps.setInt(1, cartId);
                ps.executeUpdate();
            }

            return readByIdInternal(conn, cartId);
        } catch (SQLException e) {
            throw new DatabaseException("Failed to remove item from cart: " + e.getMessage(), e);
        }
    }

    public Cart clearCart(int customerId) throws DatabaseException {
        try (Connection conn = DBConnection.getConnection()) {
            int cartId = getOrCreateCartId(conn, customerId);
            String delSql = "DELETE FROM cart_items WHERE cart_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(delSql)) {
                ps.setInt(1, cartId);
                ps.executeUpdate();
            }

            String touchSql = "UPDATE shopping_carts SET updated_at = CURRENT_TIMESTAMP WHERE cart_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(touchSql)) {
                ps.setInt(1, cartId);
                ps.executeUpdate();
            }

            return readByIdInternal(conn, cartId);
        } catch (SQLException e) {
            throw new DatabaseException("Failed to clear cart: " + e.getMessage(), e);
        }
    }

    public Cart syncCart(int customerId, List<CartItem> items) throws DatabaseException {
        try (Connection conn = DBConnection.getConnection()) {
            conn.setAutoCommit(false);
            try {
                int cartId = getOrCreateCartId(conn, customerId);

                // Clear existing items in cart
                String delSql = "DELETE FROM cart_items WHERE cart_id = ?";
                try (PreparedStatement ps = conn.prepareStatement(delSql)) {
                    ps.setInt(1, cartId);
                    ps.executeUpdate();
                }

                // Insert all new items
                if (items != null && !items.isEmpty()) {
                    String insSql = "INSERT INTO cart_items (cart_id, product_id, quantity, added_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)";
                    try (PreparedStatement ps = conn.prepareStatement(insSql)) {
                        for (CartItem it : items) {
                            if (it.getProductId() > 0 && it.getQuantity() > 0) {
                                ps.setInt(1, cartId);
                                ps.setInt(2, it.getProductId());
                                ps.setDouble(3, it.getQuantity());
                                ps.addBatch();
                            }
                        }
                        ps.executeBatch();
                    }
                }

                String touchSql = "UPDATE shopping_carts SET updated_at = CURRENT_TIMESTAMP WHERE cart_id = ?";
                try (PreparedStatement ps = conn.prepareStatement(touchSql)) {
                    ps.setInt(1, cartId);
                    ps.executeUpdate();
                }

                conn.commit();
                return readByIdInternal(conn, cartId);
            } catch (SQLException ex) {
                conn.rollback();
                throw ex;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to sync cart: " + e.getMessage(), e);
        }
    }

    private Cart readByIdInternal(Connection conn, int cartId) throws SQLException {
        Cart cart = null;
        String cartSql = "SELECT cart_id, customer_id, created_at, updated_at FROM shopping_carts WHERE cart_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(cartSql)) {
            ps.setInt(1, cartId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    cart = new Cart(
                        rs.getInt("cart_id"),
                        rs.getInt("customer_id"),
                        rs.getString("created_at"),
                        rs.getString("updated_at")
                    );
                }
            }
        }

        if (cart == null) return null;

        String itemsSql = "SELECT ci.cart_item_id, ci.cart_id, ci.product_id, ci.quantity, ci.added_at, " +
                          "       p.product_name, p.unit_price, p.discount_price, p.unit, p.image_url " +
                          "FROM cart_items ci " +
                          "JOIN products p ON ci.product_id = p.product_id " +
                          "WHERE ci.cart_id = ? " +
                          "ORDER BY ci.added_at ASC";
        try (PreparedStatement ps = conn.prepareStatement(itemsSql)) {
            ps.setInt(1, cartId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    double unitPrice = rs.getDouble("unit_price");
                    double discPrice = rs.getDouble("discount_price");
                    if (!rs.wasNull() && discPrice > 0 && discPrice < unitPrice) {
                        unitPrice = discPrice;
                    }

                    CartItem item = new CartItem(
                        rs.getInt("cart_item_id"),
                        rs.getInt("cart_id"),
                        rs.getInt("product_id"),
                        rs.getString("product_name"),
                        rs.getDouble("quantity"),
                        unitPrice,
                        rs.getString("unit"),
                        rs.getString("image_url"),
                        rs.getString("added_at")
                    );
                    cart.addItem(item);
                }
            }
        }

        return cart;
    }

    @Override
    public void create(Cart entity) throws DatabaseException {
        try (Connection conn = DBConnection.getConnection()) {
            getOrCreateCartId(conn, entity.getCustomerId());
        } catch (SQLException e) {
            throw new DatabaseException("Failed to create cart: " + e.getMessage(), e);
        }
    }

    @Override
    public Cart readById(Integer id) throws DatabaseException {
        try (Connection conn = DBConnection.getConnection()) {
            return readByIdInternal(conn, id);
        } catch (SQLException e) {
            throw new DatabaseException("Failed to read cart by ID: " + e.getMessage(), e);
        }
    }

    @Override
    public List<Cart> readAll() throws DatabaseException {
        List<Cart> list = new ArrayList<>();
        String sql = "SELECT cart_id FROM shopping_carts ORDER BY updated_at DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Cart c = readByIdInternal(conn, rs.getInt("cart_id"));
                if (c != null) list.add(c);
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to read all carts: " + e.getMessage(), e);
        }
        return list;
    }

    @Override
    public void update(Cart entity) throws DatabaseException {
        syncCart(entity.getCustomerId(), entity.getItems());
    }

    @Override
    public void delete(Integer id) throws DatabaseException {
        String sql = "DELETE FROM shopping_carts WHERE cart_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete cart: " + e.getMessage(), e);
        }
    }
}
