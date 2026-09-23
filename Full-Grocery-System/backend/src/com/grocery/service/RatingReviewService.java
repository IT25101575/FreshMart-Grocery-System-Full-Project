package com.grocery.service;

import com.grocery.model.RatingReview;
import com.grocery.repository.RatingReviewRepository;
import com.grocery.exception.DatabaseException;
import java.util.List;

public class RatingReviewService {
    private final RatingReviewRepository repository;

    public RatingReviewService() {
        this.repository = new RatingReviewRepository();
    }

    public RatingReviewService(RatingReviewRepository repository) {
        this.repository = repository;
    }

    public void submitReview(RatingReview review) throws DatabaseException {
        if (review.getRating() < 1 || review.getRating() > 5) {
            throw new DatabaseException("Rating must be between 1 and 5 stars.");
        }
        repository.create(review);
    }

    public List<RatingReview> getReviewsByProduct(int productId) throws DatabaseException {
        return repository.readByProductId(productId);
    }

    public List<RatingReview> getReviewsByCustomer(int customerId) throws DatabaseException {
        return repository.readByCustomerId(customerId);
    }

    public List<RatingReview> getAllReviews() throws DatabaseException {
        return repository.readAll();
    }

    public double getAverageRatingForProduct(int productId) throws DatabaseException {
        List<RatingReview> reviews = repository.readByProductId(productId);
        if (reviews.isEmpty()) return 0.0;
        return reviews.stream().mapToInt(RatingReview::getRating).average().orElse(0.0);
    }
}
