package com.grocery.service;

import com.grocery.model.Payment;
import com.grocery.repository.PaymentRepository;
import com.grocery.exception.DatabaseException;
import java.util.List;

public class PaymentService {
    private final PaymentRepository paymentRepository;

    public PaymentService() {
        this.paymentRepository = new PaymentRepository();
    }

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    public void processPayment(Payment payment) throws DatabaseException {
        paymentRepository.create(payment);
    }

    public Payment getPaymentById(int id) throws DatabaseException {
        return paymentRepository.readById(id);
    }

    public Payment getPaymentByOrderId(int orderId) throws DatabaseException {
        return paymentRepository.readByOrderId(orderId);
    }

    public List<Payment> getAllPayments() throws DatabaseException {
        return paymentRepository.readAll();
    }

    public void updatePaymentStatus(int paymentId, String status) throws DatabaseException {
        Payment payment = paymentRepository.readById(paymentId);
        if (payment != null) {
            payment.setPaymentStatus(status);
            paymentRepository.update(payment);
        }
    }
}
