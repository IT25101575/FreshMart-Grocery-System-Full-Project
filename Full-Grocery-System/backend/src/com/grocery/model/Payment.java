package com.grocery.model;

import java.sql.Timestamp;

public class Payment {
    private int id;
    private int orderId;
    private String paymentMethod; // 'CARD', 'COD', 'BANK_TRANSFER'
    private String paymentStatus; // 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'
    private double amount;
    private Timestamp transactionDate;

    public Payment() {}

    public Payment(int id, int orderId, String paymentMethod, String paymentStatus, double amount, Timestamp transactionDate) {
        this.id = id;
        this.orderId = orderId;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
        this.amount = amount;
        this.transactionDate = transactionDate;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getOrderId() { return orderId; }
    public void setOrderId(int orderId) { this.orderId = orderId; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public Timestamp getTransactionDate() { return transactionDate; }
    public void setTransactionDate(Timestamp transactionDate) { this.transactionDate = transactionDate; }
}
