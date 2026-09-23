package com.grocery.service;

import com.grocery.model.Supplier;
import com.grocery.repository.SupplierRepository;
import java.util.List;

public class SupplierService {
    private SupplierRepository supplierRepository;

    public SupplierService() {
        this.supplierRepository = new SupplierRepository();
    }

    public void registerSupplier(Supplier supplier) throws Exception {
        supplierRepository.create(supplier);
    }

    public List<Supplier> getAllSuppliers() throws Exception {
        return supplierRepository.readAll();
    }

    public Supplier getSupplierById(int id) throws Exception {
        return supplierRepository.readById(id);
    }

    public void updateSupplier(Supplier supplier) throws Exception {
        supplierRepository.update(supplier);
    }

    public void deactivateSupplier(int id) throws Exception {
        // Implementation to soft delete or mark inactive
        supplierRepository.delete(id);
    }

    public void generatePurchaseOrder(int productId, int supplierId, int quantity) {
        // Logic to notify supplier for restocking
    }
}
