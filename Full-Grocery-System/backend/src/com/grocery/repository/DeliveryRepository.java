package com.grocery.repository;

import com.grocery.model.Delivery;
import com.grocery.exception.DatabaseException;
import java.util.List;
import java.util.ArrayList;

public class DeliveryRepository implements Repository<Delivery, Integer> {
    private List<Delivery> deliveries = new ArrayList<>();

    @Override
    public void create(Delivery delivery) throws DatabaseException {
        deliveries.add(delivery);
    }

    @Override
    public Delivery readById(Integer id) throws DatabaseException {
        return deliveries.stream()
                .filter(d -> d.getId() == id)
                .findFirst()
                .orElse(null);
    }

    @Override
    public List<Delivery> readAll() throws DatabaseException {
        return new ArrayList<>(deliveries);
    }

    @Override
    public void update(Delivery delivery) throws DatabaseException {
        Delivery existing = readById(delivery.getId());
        if (existing != null) {
            existing.setAssignedStaffId(delivery.getAssignedStaffId());
            existing.setDeliveryStatus(delivery.getDeliveryStatus());
            existing.setScheduledTime(delivery.getScheduledTime());
            existing.setDeliveredAt(delivery.getDeliveredAt());
            existing.setDeliveryNotes(delivery.getDeliveryNotes());
        }
    }

    @Override
    public void delete(Integer id) throws DatabaseException {
        deliveries.removeIf(d -> d.getId() == id);
    }

    public Delivery readByOrderId(int orderId) throws DatabaseException {
        return deliveries.stream()
                .filter(d -> d.getOrderId() == orderId)
                .findFirst()
                .orElse(null);
    }
}
