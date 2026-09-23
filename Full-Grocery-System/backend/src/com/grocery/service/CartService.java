package com.grocery.service;

import com.grocery.repository.CartRepository;

public class CartService {
    private final CartRepository repository;

    public CartService(CartRepository repository) {
        this.repository = repository;
    }
}
