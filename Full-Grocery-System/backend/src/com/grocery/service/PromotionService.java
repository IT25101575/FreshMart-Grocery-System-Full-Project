package com.grocery.service;

import com.grocery.model.Promotion;
import com.grocery.repository.PromotionRepository;
import com.grocery.exception.DatabaseException;
import java.util.List;

public class PromotionService {
    private final PromotionRepository promotionRepository;

    public PromotionService() {
        this.promotionRepository = new PromotionRepository();
    }

    public PromotionService(PromotionRepository promotionRepository) {
        this.promotionRepository = promotionRepository;
    }

    public void createPromotion(Promotion promotion) throws DatabaseException {
        promotionRepository.create(promotion);
    }

    public Promotion getPromotionById(int id) throws DatabaseException {
        return promotionRepository.readById(id);
    }

    public Promotion getPromotionByCode(String promoCode) throws DatabaseException {
        return promotionRepository.readByPromoCode(promoCode);
    }

    public List<Promotion> getAllPromotions() throws DatabaseException {
        return promotionRepository.readAll();
    }

    public double applyPromotion(String promoCode, double orderAmount) throws DatabaseException {
        Promotion promo = promotionRepository.readByPromoCode(promoCode);
        if (promo != null && promo.isActive() && orderAmount >= promo.getMinOrderAmount()) {
            double discount = orderAmount * (promo.getDiscountPercentage() / 100.0);
            return Math.max(0.0, orderAmount - discount);
        }
        return orderAmount;
    }

    public void deactivatePromotion(int id) throws DatabaseException {
        Promotion promo = promotionRepository.readById(id);
        if (promo != null) {
            promo.setActive(false);
            promotionRepository.update(promo);
        }
    }
}
