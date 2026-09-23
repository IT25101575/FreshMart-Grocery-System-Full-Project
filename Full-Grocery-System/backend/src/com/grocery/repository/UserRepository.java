package com.grocery.repository;

import com.grocery.exception.DatabaseException;
import com.grocery.model.User;
import com.grocery.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class UserRepository implements Repository<User, Integer> {

    @Override
    public void create(User user) throws DatabaseException {
        String sql = "INSERT INTO users (name, email, password_hash, phone, role, address, city, is_active) " +
                     "VALUES (?, ?, ?, ?, ?, ?, 'Colombo', 1)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, user.getName());
            ps.setString(2, user.getEmail());
            ps.setString(3, user.getPasswordHash() != null ? user.getPasswordHash() : "");
            ps.setString(4, user.getPhone() != null ? user.getPhone() : "");
            ps.setString(5, user.getRole() != null ? user.getRole() : "CUSTOMER");
            ps.setString(6, user.getAddress() != null ? user.getAddress() : "");
            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    user.setId(rs.getInt(1));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to create user: " + e.getMessage(), e);
        }
    }

    @Override
    public User readById(Integer id) throws DatabaseException {
        String sql = "SELECT user_id, name, email, password_hash, phone, role, address FROM users WHERE user_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapUser(rs);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to read user by ID: " + e.getMessage(), e);
        }
        return null;
    }

    public User findByEmail(String email) throws DatabaseException {
        String sql = "SELECT user_id, name, email, password_hash, phone, role, address FROM users WHERE email = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapUser(rs);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to find user by email: " + e.getMessage(), e);
        }
        return null;
    }

    @Override
    public List<User> readAll() throws DatabaseException {
        List<User> list = new ArrayList<>();
        String sql = "SELECT user_id, name, email, password_hash, phone, role, address FROM users ORDER BY user_id";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapUser(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to read all users: " + e.getMessage(), e);
        }
        return list;
    }

    @Override
    public void update(User user) throws DatabaseException {
        boolean hasPw = (user.getPasswordHash() != null && !user.getPasswordHash().isEmpty());
        String sql = hasPw
            ? "UPDATE users SET name = ?, email = ?, phone = ?, address = ?, role = ?, password_hash = ? WHERE user_id = ?"
            : "UPDATE users SET name = ?, email = ?, phone = ?, address = ?, role = ? WHERE user_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, user.getName());
            ps.setString(2, user.getEmail());
            ps.setString(3, user.getPhone());
            ps.setString(4, user.getAddress());
            ps.setString(5, user.getRole());
            if (hasPw) {
                ps.setString(6, user.getPasswordHash());
                ps.setInt(7, user.getId());
            } else {
                ps.setInt(6, user.getId());
            }
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update user: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(Integer id) throws DatabaseException {
        String sql = "DELETE FROM users WHERE user_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete user: " + e.getMessage(), e);
        }
    }

    private User mapUser(ResultSet rs) throws SQLException {
        return new User(
            rs.getInt("user_id"),
            rs.getString("name"),
            rs.getString("email"),
            rs.getString("password_hash"),
            rs.getString("phone"),
            rs.getString("role"),
            rs.getString("address")
        );
    }
}
