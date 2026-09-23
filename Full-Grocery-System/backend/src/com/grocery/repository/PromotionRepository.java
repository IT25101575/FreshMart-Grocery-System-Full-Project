package com.grocery.repository;

import com.grocery.model.Promotion;
import com.grocery.exception.DatabaseException;
import com.grocery.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class PromotionRepository implements Repository<Promotion, Integer> {

    @Override
    public void create(Promotion promotion) throws DatabaseException {
        String sql = "INSERT INTO promotions (product_id, discount_percentage, discount_price, is_active) VALUES (?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, promotion.getProductId() != null ? promotion.getProductId() : 1);
            ps.setDouble(2, promotion.getDiscountPercentage());
            ps.setDouble(3, promotion.getDiscountPrice() != null ? promotion.getDiscountPrice() : 0.0);
            ps.setBoolean(4, promotion.isActive());
            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    promotion.setId(rs.getInt(1));
                }
            }

            if (promotion.getProductId() != null && promotion.getDiscountPrice() != null) {
                updateProductDiscount(conn, promotion.getProductId(), promotion.getDiscountPrice());
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to create promotion: " + e.getMessage(), e);
        }
    }

    public void applyPromotion(int productId, double discountPercentage, Double explicitDiscountPrice) throws DatabaseException {
        try (Connection conn = DBConnection.getConnection()) {
            conn.setAutoCommit(false);
            try {
                double discountPrice;
                if (explicitDiscountPrice != null && explicitDiscountPrice > 0) {
                    discountPrice = explicitDiscountPrice;
                } else {
                    double originalPrice = 0.0;
                    String selSql = "SELECT unit_price FROM products WHERE product_id = ?";
                    try (PreparedStatement selPs = conn.prepareStatement(selSql)) {
                        selPs.setInt(1, productId);
                        try (ResultSet rs = selPs.executeQuery()) {
                            if (rs.next()) {
                                originalPrice = rs.getDouble("unit_price");
                            }
                        }
                    }
                    discountPrice = Math.round(originalPrice * (1.0 - (discountPercentage / 100.0)) * 100.0) / 100.0;
                }

                // Deactivate any existing promotions for this product
                String deactSql = "UPDATE promotions SET is_active = 0 WHERE product_id = ?";
                try (PreparedStatement deactPs = conn.prepareStatement(deactSql)) {
                    deactPs.setInt(1, productId);
                    deactPs.executeUpdate();
                }

                // Insert active promotion record
                String insSql = "INSERT INTO promotions (product_id, discount_percentage, discount_price, is_active) VALUES (?, ?, ?, 1)";
                try (PreparedStatement insPs = conn.prepareStatement(insSql)) {
                    insPs.setInt(1, productId);
                    insPs.setDouble(2, discountPercentage);
                    insPs.setDouble(3, discountPrice);
                    insPs.executeUpdate();
                }

                // Update product table discount_price
                updateProductDiscount(conn, productId, discountPrice);

                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to apply promotion: " + e.getMessage(), e);
        }
    }

    public void removePromotion(int productId) throws DatabaseException {
        try (Connection conn = DBConnection.getConnection()) {
            conn.setAutoCommit(false);
            try {
                String deactSql = "UPDATE promotions SET is_active = 0 WHERE product_id = ?";
                try (PreparedStatement deactPs = conn.prepareStatement(deactSql)) {
                    deactPs.setInt(1, productId);
                    deactPs.executeUpdate();
                }

                updateProductDiscount(conn, productId, null);

                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to remove promotion: " + e.getMessage(), e);
        }
    }

    private void updateProductDiscount(Connection conn, int productId, Double discountPrice) throws SQLException {
        String updSql = "UPDATE products SET discount_price = ? WHERE product_id = ?";
        try (PreparedStatement updPs = conn.prepareStatement(updSql)) {
            if (discountPrice != null) {
                updPs.setDouble(1, discountPrice);
            } else {
                updPs.setNull(1, Types.DECIMAL);
            }
            updPs.setInt(2, productId);
            updPs.executeUpdate();
        }
    }

    @Override
    public Promotion readById(Integer id) throws DatabaseException {
        String sql = "SELECT p.promotion_id, p.product_id, pr.product_name, pr.unit_price, p.discount_percentage, p.discount_price, p.is_active " +
                     "FROM promotions p JOIN products pr ON p.product_id = pr.product_id WHERE p.promotion_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapPromotion(rs);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to read promotion: " + e.getMessage(), e);
        }
        return null;
    }

    @Override
    public List<Promotion> readAll() throws DatabaseException {
        List<Promotion> list = new ArrayList<>();
        String sql = "SELECT p.promotion_id, p.product_id, pr.product_name, pr.unit_price, p.discount_percentage, p.discount_price, p.is_active " +
                     "FROM promotions p JOIN products pr ON p.product_id = pr.product_id ORDER BY p.promotion_id DESC";
        try (Connection conn = DBConnection.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                list.add(mapPromotion(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to read promotions: " + e.getMessage(), e);
        }
        return list;
    }

    public List<Promotion> readActive() throws DatabaseException {
        List<Promotion> list = new ArrayList<>();
        String sql = "SELECT p.promotion_id, p.product_id, pr.product_name, pr.unit_price, p.discount_percentage, p.discount_price, p.is_active " +
                     "FROM promotions p JOIN products pr ON p.product_id = pr.product_id WHERE p.is_active = 1 ORDER BY p.promotion_id DESC";
        try (Connection conn = DBConnection.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                list.add(mapPromotion(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to read active promotions: " + e.getMessage(), e);
        }
        return list;
    }

    @Override
    public void update(Promotion promotion) throws DatabaseException {
        String sql = "UPDATE promotions SET discount_percentage = ?, discount_price = ?, is_active = ? WHERE promotion_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDouble(1, promotion.getDiscountPercentage());
            ps.setDouble(2, promotion.getDiscountPrice() != null ? promotion.getDiscountPrice() : 0.0);
            ps.setBoolean(3, promotion.isActive());
            ps.setInt(4, promotion.getId());
            ps.executeUpdate();

            if (promotion.getProductId() != null) {
                Double disc = promotion.isActive() ? promotion.getDiscountPrice() : null;
                updateProductDiscount(conn, promotion.getProductId(), disc);
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update promotion: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(Integer id) throws DatabaseException {
        Promotion p = readById(id);
        String sql = "DELETE FROM promotions WHERE promotion_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.executeUpdate();
            if (p != null && p.getProductId() != null) {
                updateProductDiscount(conn, p.getProductId(), null);
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete promotion: " + e.getMessage(), e);
        }
    }

    public Promotion readByPromoCode(String promoCode) throws DatabaseException {
        // Fallback for code-based search if needed
        for (Promotion p : readAll()) {
            if (p.getPromoCode() != null && p.getPromoCode().equalsIgnoreCase(promoCode)) {
                return p;
            }
        }
        return null;
    }

    private Promotion mapPromotion(ResultSet rs) throws SQLException {
        Promotion p = new Promotion();
        p.setId(rs.getInt("promotion_id"));
        p.setProductId(rs.getInt("product_id"));
        p.setProductName(rs.getString("product_name"));
        p.setOriginalPrice(rs.getDouble("unit_price"));
        p.setDiscountPercentage(rs.getDouble("discount_percentage"));
        p.setDiscountPrice(rs.getDouble("discount_price"));
        p.setActive(rs.getBoolean("is_active"));
        return p;
    }
}
