package com.grocery.repository;

import com.grocery.model.RatingReview;
import com.grocery.exception.DatabaseException;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

public class RatingReviewRepository implements Repository<RatingReview, Integer> {
    private List<RatingReview> reviews = new ArrayList<>();

    @Override
    public void create(RatingReview review) throws DatabaseException {
        reviews.add(review);
    }

    @Override
    public RatingReview readById(Integer id) throws DatabaseException {
        return reviews.stream()
                .filter(r -> r.getId() == id)
                .findFirst()
                .orElse(null);
    }

    @Override
    public List<RatingReview> readAll() throws DatabaseException {
        return new ArrayList<>(reviews);
    }

    @Override
    public void update(RatingReview review) throws DatabaseException {
        RatingReview existing = readById(review.getId());
        if (existing != null) {
            existing.setRating(review.getRating());
            existing.setReviewText(review.getReviewText());
        }
    }

    @Override
    public void delete(Integer id) throws DatabaseException {
        reviews.removeIf(r -> r.getId() == id);
    }

    public List<RatingReview> readByProductId(int productId) throws DatabaseException {
        return reviews.stream()
                .filter(r -> r.getProductId() == productId)
                .collect(Collectors.toList());
    }

    public List<RatingReview> readByCustomerId(int customerId) throws DatabaseException {
        return reviews.stream()
                .filter(r -> r.getCustomerId() == customerId)
                .collect(Collectors.toList());
    }
}
