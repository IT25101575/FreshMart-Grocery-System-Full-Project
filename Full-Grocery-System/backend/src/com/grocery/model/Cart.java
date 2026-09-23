package com.grocery.model;

import java.util.ArrayList;
import java.util.List;

public class Cart {
    private int cartId;
    private int customerId;
    private String createdAt;
    private String updatedAt;
    private List<CartItem> items = new ArrayList<>();

    public Cart() {}

    public Cart(int cartId, int customerId, String createdAt, String updatedAt) {
        this.cartId = cartId;
        this.customerId = customerId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.items = new ArrayList<>();
    }

    public int getCartId() { return cartId; }
    public void setCartId(int cartId) { this.cartId = cartId; }

    public int getCustomerId() { return customerId; }
    public void setCustomerId(int customerId) { this.customerId = customerId; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public List<CartItem> getItems() { return items; }
    public void setItems(List<CartItem> items) { this.items = items; }

    public void addItem(CartItem item) {
        if (this.items == null) this.items = new ArrayList<>();
        this.items.add(item);
    }
}
