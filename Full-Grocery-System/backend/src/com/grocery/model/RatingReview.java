package com.grocery.model;

import java.sql.Timestamp;

public class RatingReview {
    private int id;
    private int productId;
    private int customerId;
    private int rating; // 1 to 5
    private String reviewText;
    private Timestamp createdAt;

    public RatingReview() {}

    public RatingReview(int id, int productId, int customerId, int rating, String reviewText, Timestamp createdAt) {
        this.id = id;
        this.productId = productId;
        this.customerId = customerId;
        this.rating = rating;
        this.reviewText = reviewText;
        this.createdAt = createdAt;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getProductId() { return productId; }
    public void setProductId(int productId) { this.productId = productId; }

    public int getCustomerId() { return customerId; }
    public void setCustomerId(int customerId) { this.customerId = customerId; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public String getReviewText() { return reviewText; }
    public void setReviewText(String reviewText) { this.reviewText = reviewText; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}
