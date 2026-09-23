package com.grocery.repository;

import com.grocery.exception.DatabaseException;
import com.grocery.model.Product;
import com.grocery.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ProductRepository implements Repository<Product, Integer> {

    @Override
    public void create(Product p) throws DatabaseException {
        String sql = "INSERT INTO products (product_name, description, unit_price, discount_price, stock_quantity, unit, image_url, category_id, supplier_id, is_available) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, p.getName());
            ps.setString(2, p.getDescription() != null ? p.getDescription() : "");
            ps.setDouble(3, p.getPrice());
            if (p.getDiscountPrice() != null) ps.setDouble(4, p.getDiscountPrice()); else ps.setNull(4, Types.DECIMAL);
            ps.setDouble(5, p.getStockQuantity());
            ps.setString(6, p.getUnit() != null ? p.getUnit() : "unit");
            ps.setString(7, p.getImageUrl() != null ? p.getImageUrl() : "");
            if (p.getCategoryId() != null) ps.setInt(8, p.getCategoryId()); else ps.setNull(8, Types.INTEGER);
            if (p.getSupplierId() != null) ps.setInt(9, p.getSupplierId()); else ps.setNull(9, Types.INTEGER);
            ps.setBoolean(10, p.isAvailable());
            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    p.setId(rs.getInt(1));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to create product: " + e.getMessage(), e);
        }
    }

    @Override
    public Product readById(Integer id) throws DatabaseException {
        String sql = "SELECT product_id, product_name, description, unit_price, discount_price, stock_quantity, unit, image_url, category_id, supplier_id, is_available " +
                     "FROM products WHERE product_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapProduct(rs);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to read product: " + e.getMessage(), e);
        }
        return null;
    }

    @Override
    public List<Product> readAll() throws DatabaseException {
        List<Product> list = new ArrayList<>();
        String sql = "SELECT product_id, product_name, description, unit_price, discount_price, stock_quantity, unit, image_url, category_id, supplier_id, is_available " +
                     "FROM products ORDER BY product_id";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapProduct(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to read all products: " + e.getMessage(), e);
        }
        return list;
    }

    public void updateStock(int productId, double quantityDelta) throws DatabaseException {
        String sql = "UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ? AND stock_quantity >= ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDouble(1, quantityDelta);
            ps.setInt(2, productId);
            ps.setDouble(3, quantityDelta);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update product stock: " + e.getMessage(), e);
        }
    }

    public void updateDiscountPrice(int productId, Double discountPrice) throws DatabaseException {
        String sql = "UPDATE products SET discount_price = ? WHERE product_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            if (discountPrice != null) ps.setDouble(1, discountPrice);
            else ps.setNull(1, Types.DECIMAL);
            ps.setInt(2, productId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update discount price: " + e.getMessage(), e);
        }
    }

    @Override
    public void update(Product p) throws DatabaseException {
        String sql = "UPDATE products SET product_name = ?, description = ?, unit_price = ?, discount_price = ?, stock_quantity = ?, unit = ?, image_url = ?, is_available = ?, category_id = ?, supplier_id = ? WHERE product_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, p.getName());
            ps.setString(2, p.getDescription());
            ps.setDouble(3, p.getPrice());
            if (p.getDiscountPrice() != null) ps.setDouble(4, p.getDiscountPrice()); else ps.setNull(4, Types.DECIMAL);
            ps.setDouble(5, p.getStockQuantity());
            ps.setString(6, p.getUnit());
            ps.setString(7, p.getImageUrl());
            ps.setBoolean(8, p.isAvailable());
            if (p.getCategoryId() != null) ps.setInt(9, p.getCategoryId()); else ps.setNull(9, Types.INTEGER);
            if (p.getSupplierId() != null) ps.setInt(10, p.getSupplierId()); else ps.setNull(10, Types.INTEGER);
            ps.setInt(11, p.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update product: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(Integer id) throws DatabaseException {
        String sql = "DELETE FROM products WHERE product_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete product: " + e.getMessage(), e);
        }
    }

    private Product mapProduct(ResultSet rs) throws SQLException {
        Product p = new Product();
        p.setId(rs.getInt("product_id"));
        p.setName(rs.getString("product_name"));
        p.setDescription(rs.getString("description"));
        p.setPrice(rs.getDouble("unit_price"));
        double disc = rs.getDouble("discount_price");
        if (!rs.wasNull()) p.setDiscountPrice(disc);
        p.setStockQuantity(rs.getDouble("stock_quantity"));
        p.setUnit(rs.getString("unit"));
        p.setImageUrl(rs.getString("image_url"));
        int catId = rs.getInt("category_id");
        if (!rs.wasNull()) p.setCategoryId(catId);
        int supId = rs.getInt("supplier_id");
        if (!rs.wasNull()) p.setSupplierId(supId);
        p.setAvailable(rs.getBoolean("is_available"));
        return p;
    }
}
