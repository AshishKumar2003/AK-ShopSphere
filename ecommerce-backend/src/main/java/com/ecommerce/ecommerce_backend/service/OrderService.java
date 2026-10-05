package com.ecommerce.ecommerce_backend.service;

import com.ecommerce.ecommerce_backend.Entity.Order;
import com.ecommerce.ecommerce_backend.Entity.OrderItem;
import com.ecommerce.ecommerce_backend.Entity.Product;
import com.ecommerce.ecommerce_backend.dto.CheckoutItemDTO;
import com.ecommerce.ecommerce_backend.dto.CheckoutRequestDTO;
import com.ecommerce.ecommerce_backend.repository.OrderRepository;
import com.ecommerce.ecommerce_backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final EmailService emailService;

    public OrderService(ProductRepository productRepository,
                        OrderRepository orderRepository,
                        EmailService emailService) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.emailService = emailService;
    }

    @Transactional(rollbackFor = Exception.class)
    public Order placeOrder(CheckoutRequestDTO request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cart cannot be empty");
        }

        // Payment Mode & Status determination
        String method = request.getPaymentMethod();
        String paymentStatus = "COD".equalsIgnoreCase(method) ? "PENDING" : "PAID";

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        // Main Order entity creation
        Order order = new Order(
                request.getCustomerEmail(),
                BigDecimal.ZERO,
                "CONFIRMED",
                method,
                paymentStatus
        );

        // Atomic Inventory Deduction with Pessimistic Locking
        for (CheckoutItemDTO itemDto : request.getItems()) {
            Product product = productRepository.findByIdWithLock(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found with id: " + itemDto.getProductId()));

            if (product.getStockQuantity() < itemDto.getQuantity()) {
                throw new RuntimeException("Out of stock: " + product.getName());
            }

            product.setStockQuantity(product.getStockQuantity() - itemDto.getQuantity());
            productRepository.save(product);

            BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);

            orderItems.add(new OrderItem(order, product.getId(), product.getName(), itemDto.getQuantity(), product.getPrice()));
        }

        order.setTotalAmount(totalAmount);
        order.setItems(orderItems);

        // Save Order (Cascade will save OrderItems too)
        Order savedOrder = orderRepository.save(order);

        // Automated Asynchronous HTML Email Dispatch
        emailService.sendOrderConfirmationEmail(
                savedOrder.getCustomerEmail(),
                savedOrder.getId(),
                savedOrder.getTotalAmount(),
                orderItems
        );

        return savedOrder;
    }
}