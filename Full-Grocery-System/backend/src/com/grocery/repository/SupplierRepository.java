package com.grocery.repository;

import com.grocery.exception.DatabaseException;
import com.grocery.model.Supplier;
import com.grocery.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class SupplierRepository implements Repository<Supplier, Integer> {

    @Override
    public void create(Supplier s) throws DatabaseException {
        String sql = "INSERT INTO suppliers (company_name, contact_person, email, phone, address, contract_terms, is_active) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, s.getCompanyName());
            ps.setString(2, s.getContactPerson() != null ? s.getContactPerson() : "");
            ps.setString(3, s.getEmail() != null ? s.getEmail() : "");
            ps.setString(4, s.getPhone() != null ? s.getPhone() : "");
            ps.setString(5, s.getAddress() != null ? s.getAddress() : "");
            ps.setString(6, s.getContractTerms() != null ? s.getContractTerms() : "Standard Terms");
            ps.setBoolean(7, s.isActive());
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    s.setId(rs.getInt(1));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to create supplier: " + e.getMessage(), e);
        }
    }

    @Override
    public Supplier readById(Integer id) throws DatabaseException {
        String sql = "SELECT supplier_id, company_name, contact_person, email, phone, address, contract_terms, is_active " +
                     "FROM suppliers WHERE supplier_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapSupplier(rs);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to read supplier by ID: " + e.getMessage(), e);
        }
        return null;
    }

    @Override
    public List<Supplier> readAll() throws DatabaseException {
        List<Supplier> list = new ArrayList<>();
        String sql = "SELECT supplier_id, company_name, contact_person, email, phone, address, contract_terms, is_active " +
                     "FROM suppliers ORDER BY supplier_id";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapSupplier(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to read suppliers: " + e.getMessage(), e);
        }
        return list;
    }

    @Override
    public void update(Supplier s) throws DatabaseException {
        String sql = "UPDATE suppliers SET company_name = ?, contact_person = ?, email = ?, phone = ?, address = ?, contract_terms = ?, is_active = ? " +
                     "WHERE supplier_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, s.getCompanyName());
            ps.setString(2, s.getContactPerson() != null ? s.getContactPerson() : "");
            ps.setString(3, s.getEmail() != null ? s.getEmail() : "");
            ps.setString(4, s.getPhone() != null ? s.getPhone() : "");
            ps.setString(5, s.getAddress() != null ? s.getAddress() : "");
            ps.setString(6, s.getContractTerms() != null ? s.getContractTerms() : "Standard Terms");
            ps.setBoolean(7, s.isActive());
            ps.setInt(8, s.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update supplier: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(Integer id) throws DatabaseException {
        String sql = "DELETE FROM suppliers WHERE supplier_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete supplier: " + e.getMessage(), e);
        }
    }

    private Supplier mapSupplier(ResultSet rs) throws SQLException {
        return new Supplier(
            rs.getInt("supplier_id"),
            rs.getString("company_name"),
            rs.getString("contact_person"),
            rs.getString("email"),
            rs.getString("phone"),
            rs.getString("address"),
            rs.getString("contract_terms"),
            rs.getBoolean("is_active")
        );
    }
}
