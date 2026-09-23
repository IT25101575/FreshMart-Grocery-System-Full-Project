package com.grocery.repository;

import com.grocery.exception.DatabaseException;
import com.grocery.model.Inquiry;
import com.grocery.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class UserInquiryRepository implements Repository<Inquiry, Integer> {

    @Override
    public void create(Inquiry inq) throws DatabaseException {
        String sql = "INSERT INTO user_inquiries (customer_id, subject, message, department, status, created_at, updated_at) " +
                     "VALUES (?, ?, ?, ?, ?, GETDATE(), GETDATE())";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, inq.getCustomerId());
            ps.setString(2, inq.getSubject());
            ps.setString(3, inq.getMessage());
            ps.setString(4, inq.getDepartment() != null ? inq.getDepartment() : "GENERAL");
            ps.setString(5, inq.getStatus() != null ? inq.getStatus() : "PENDING");
            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    inq.setId(rs.getInt(1));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to create inquiry: " + e.getMessage(), e);
        }
    }

    @Override
    public Inquiry readById(Integer id) throws DatabaseException {
        String sql = "SELECT i.inquiry_id, i.customer_id, i.subject, i.message, i.department, i.status, " +
                     "i.admin_response, CONVERT(VARCHAR(25), i.created_at, 126) as created_at, u.name, u.email " +
                     "FROM user_inquiries i " +
                     "LEFT JOIN users u ON i.customer_id = u.user_id " +
                     "WHERE i.inquiry_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapInquiry(rs);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to read inquiry by ID: " + e.getMessage(), e);
        }
        return null;
    }

    @Override
    public List<Inquiry> readAll() throws DatabaseException {
        List<Inquiry> list = new ArrayList<>();
        String sql = "SELECT i.inquiry_id, i.customer_id, i.subject, i.message, i.department, i.status, " +
                     "i.admin_response, CONVERT(VARCHAR(25), i.created_at, 126) as created_at, u.name, u.email " +
                     "FROM user_inquiries i " +
                     "LEFT JOIN users u ON i.customer_id = u.user_id " +
                     "ORDER BY i.inquiry_id DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapInquiry(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to read inquiries: " + e.getMessage(), e);
        }
        return list;
    }

    public List<Inquiry> findByCustomerId(int customerId) throws DatabaseException {
        List<Inquiry> list = new ArrayList<>();
        String sql = "SELECT i.inquiry_id, i.customer_id, i.subject, i.message, i.department, i.status, " +
                     "i.admin_response, CONVERT(VARCHAR(25), i.created_at, 126) as created_at, u.name, u.email " +
                     "FROM user_inquiries i " +
                     "LEFT JOIN users u ON i.customer_id = u.user_id " +
                     "WHERE i.customer_id = ? " +
                     "ORDER BY i.inquiry_id DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, customerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapInquiry(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to find customer inquiries: " + e.getMessage(), e);
        }
        return list;
    }

    public void answerInquiry(int inquiryId, String adminResponse) throws DatabaseException {
        String sql = "UPDATE user_inquiries SET admin_response = ?, status = 'ANSWERED', updated_at = GETDATE() WHERE inquiry_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, adminResponse);
            ps.setInt(2, inquiryId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to answer inquiry: " + e.getMessage(), e);
        }
    }

    public void forwardInquiry(int inquiryId, String department) throws DatabaseException {
        String sql = "UPDATE user_inquiries SET department = ?, status = 'FORWARDED', updated_at = GETDATE() WHERE inquiry_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, department != null ? department : "GENERAL");
            ps.setInt(2, inquiryId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to forward inquiry: " + e.getMessage(), e);
        }
    }

    @Override
    public void update(Inquiry entity) throws DatabaseException {
        String sql = "UPDATE user_inquiries SET subject = ?, message = ?, department = ?, status = ?, admin_response = ?, updated_at = GETDATE() WHERE inquiry_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, entity.getSubject());
            ps.setString(2, entity.getMessage());
            ps.setString(3, entity.getDepartment());
            ps.setString(4, entity.getStatus());
            ps.setString(5, entity.getAdminResponse());
            ps.setInt(6, entity.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update inquiry: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(Integer id) throws DatabaseException {
        String sql = "DELETE FROM user_inquiries WHERE inquiry_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete inquiry: " + e.getMessage(), e);
        }
    }

    private Inquiry mapInquiry(ResultSet rs) throws SQLException {
        Inquiry inq = new Inquiry();
        inq.setId(rs.getInt("inquiry_id"));
        inq.setCustomerId(rs.getInt("customer_id"));
        inq.setSubject(rs.getString("subject"));
        inq.setMessage(rs.getString("message"));
        inq.setDepartment(rs.getString("department"));
        inq.setStatus(rs.getString("status"));
        inq.setAdminResponse(rs.getString("admin_response"));
        inq.setCreatedAt(rs.getString("created_at"));
        inq.setCustomerName(rs.getString("name"));
        inq.setCustomerEmail(rs.getString("email"));
        return inq;
    }
}
