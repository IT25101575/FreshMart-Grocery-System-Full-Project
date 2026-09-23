package com.grocery.model;

import java.sql.Timestamp;

public class Delivery {
    private int id;
    private int orderId;
    private Integer assignedStaffId;
    private String deliveryStatus; // 'SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'
    private Timestamp scheduledTime;
    private Timestamp deliveredAt;
    private String deliveryNotes;

    public Delivery() {}

    public Delivery(int id, int orderId, Integer assignedStaffId, String deliveryStatus, Timestamp scheduledTime, Timestamp deliveredAt, String deliveryNotes) {
        this.id = id;
        this.orderId = orderId;
        this.assignedStaffId = assignedStaffId;
        this.deliveryStatus = deliveryStatus;
        this.scheduledTime = scheduledTime;
        this.deliveredAt = deliveredAt;
        this.deliveryNotes = deliveryNotes;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getOrderId() { return orderId; }
    public void setOrderId(int orderId) { this.orderId = orderId; }

    public Integer getAssignedStaffId() { return assignedStaffId; }
    public void setAssignedStaffId(Integer assignedStaffId) { this.assignedStaffId = assignedStaffId; }

    public String getDeliveryStatus() { return deliveryStatus; }
    public void setDeliveryStatus(String deliveryStatus) { this.deliveryStatus = deliveryStatus; }

    public Timestamp getScheduledTime() { return scheduledTime; }
    public void setScheduledTime(Timestamp scheduledTime) { this.scheduledTime = scheduledTime; }

    public Timestamp getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(Timestamp deliveredAt) { this.deliveredAt = deliveredAt; }

    public String getDeliveryNotes() { return deliveryNotes; }
    public void setDeliveryNotes(String deliveryNotes) { this.deliveryNotes = deliveryNotes; }
}
