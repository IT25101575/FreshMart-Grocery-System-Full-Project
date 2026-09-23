package com.grocery.repository;

import com.grocery.model.Payment;
import com.grocery.exception.DatabaseException;
import java.util.List;
import java.util.ArrayList;

public class PaymentRepository implements Repository<Payment, Integer> {
    private List<Payment> payments = new ArrayList<>();

    @Override
    public void create(Payment payment) throws DatabaseException {
        payments.add(payment);
    }

    @Override
    public Payment readById(Integer id) throws DatabaseException {
        return payments.stream()
                .filter(p -> p.getId() == id)
                .findFirst()
                .orElse(null);
    }

    @Override
    public List<Payment> readAll() throws DatabaseException {
        return new ArrayList<>(payments);
    }

    @Override
    public void update(Payment payment) throws DatabaseException {
        Payment existing = readById(payment.getId());
        if (existing != null) {
            existing.setPaymentMethod(payment.getPaymentMethod());
            existing.setPaymentStatus(payment.getPaymentStatus());
            existing.setAmount(payment.getAmount());
            existing.setTransactionDate(payment.getTransactionDate());
        }
    }

    @Override
    public void delete(Integer id) throws DatabaseException {
        payments.removeIf(p -> p.getId() == id);
    }

    public Payment readByOrderId(int orderId) throws DatabaseException {
        return payments.stream()
                .filter(p -> p.getOrderId() == orderId)
                .findFirst()
                .orElse(null);
    }
}
