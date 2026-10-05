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