package com.grocery.repository;

import com.grocery.exception.DatabaseException;
import com.grocery.model.Category;
import com.grocery.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CategoryRepository implements Repository<Category, Integer> {

    @Override
    public void create(Category c) throws DatabaseException {
        String sql = "INSERT INTO categories (category_name, description) VALUES (?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, c.getName());
            ps.setString(2, c.getDescription() != null ? c.getDescription() : "");
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    c.setId(rs.getInt(1));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to create category: " + e.getMessage(), e);
        }
    }

    @Override
    public Category readById(Integer id) throws DatabaseException {
        String sql = "SELECT category_id, category_name, description FROM categories WHERE category_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new Category(rs.getInt("category_id"), rs.getString("category_name"), rs.getString("description"));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to read category by ID: " + e.getMessage(), e);
        }
        return null;
    }

    @Override
    public List<Category> readAll() throws DatabaseException {
        List<Category> list = new ArrayList<>();
        String sql = "SELECT category_id, category_name, description FROM categories ORDER BY category_id";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(new Category(rs.getInt("category_id"), rs.getString("category_name"), rs.getString("description")));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to read categories: " + e.getMessage(), e);
        }
        return list;
    }

    @Override
    public void update(Category c) throws DatabaseException {
        String sql = "UPDATE categories SET category_name = ?, description = ? WHERE category_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, c.getName());
            ps.setString(2, c.getDescription() != null ? c.getDescription() : "");
            ps.setInt(3, c.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update category: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(Integer id) throws DatabaseException {
        String sql = "DELETE FROM categories WHERE category_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete category: " + e.getMessage(), e);
        }
    }
}
