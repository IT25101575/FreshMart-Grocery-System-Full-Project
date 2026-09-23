package com.grocery.service;

import com.grocery.model.Delivery;
import com.grocery.repository.DeliveryRepository;
import com.grocery.exception.DatabaseException;
import java.sql.Timestamp;
import java.util.List;

public class DeliveryService {
    private final DeliveryRepository deliveryRepository;

    public DeliveryService() {
        this.deliveryRepository = new DeliveryRepository();
    }

    public DeliveryService(DeliveryRepository deliveryRepository) {
        this.deliveryRepository = deliveryRepository;
    }

    public void scheduleDelivery(Delivery delivery) throws DatabaseException {
        deliveryRepository.create(delivery);
    }

    public Delivery getDeliveryById(int id) throws DatabaseException {
        return deliveryRepository.readById(id);
    }

    public Delivery getDeliveryByOrderId(int orderId) throws DatabaseException {
        return deliveryRepository.readByOrderId(orderId);
    }

    public List<Delivery> getAllDeliveries() throws DatabaseException {
        return deliveryRepository.readAll();
    }

    public void updateDeliveryStatus(int deliveryId, String status) throws DatabaseException {
        Delivery delivery = deliveryRepository.readById(deliveryId);
        if (delivery != null) {
            delivery.setDeliveryStatus(status);
            if ("DELIVERED".equalsIgnoreCase(status)) {
                delivery.setDeliveredAt(new Timestamp(System.currentTimeMillis()));
            }
            deliveryRepository.update(delivery);
        }
    }

    public void assignDeliveryStaff(int deliveryId, int staffId) throws DatabaseException {
        Delivery delivery = deliveryRepository.readById(deliveryId);
        if (delivery != null) {
            delivery.setAssignedStaffId(staffId);
            deliveryRepository.update(delivery);
        }
    }
}
