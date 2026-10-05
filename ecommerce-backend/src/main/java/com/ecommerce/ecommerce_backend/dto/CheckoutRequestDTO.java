package com.ecommerce.ecommerce_backend.dto;

import java.util.List;

public class CheckoutRequestDTO {
    private String customerEmail;
    private String paymentMethod; // UPI, CARD, COD
    private List<CheckoutItemDTO> items;

    public String getCustomerEmail() {
        return customerEmail;
    }
    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getPaymentMethod() {
        return paymentMethod != null && !paymentMethod.isBlank() ? paymentMethod : "COD";
    }
    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public List<CheckoutItemDTO> getItems() {
        return items;
    }
    public void setItems(List<CheckoutItemDTO> items) {
        this.items = items;
    }
}