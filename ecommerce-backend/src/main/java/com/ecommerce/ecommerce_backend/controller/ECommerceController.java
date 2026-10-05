package com.ecommerce.ecommerce_backend.controller;

import com.ecommerce.ecommerce_backend.Entity.AppUser;
import com.ecommerce.ecommerce_backend.Entity.Order;
import com.ecommerce.ecommerce_backend.Entity.Product;
import com.ecommerce.ecommerce_backend.dto.CheckoutRequestDTO;
import com.ecommerce.ecommerce_backend.repository.AppUserRepository;
import com.ecommerce.ecommerce_backend.repository.OrderRepository;
import com.ecommerce.ecommerce_backend.repository.ProductRepository;
import com.ecommerce.ecommerce_backend.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class ECommerceController {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final AppUserRepository userRepository;

    public ECommerceController(ProductRepository productRepository,
                               OrderRepository orderRepository,
                               OrderService orderService,
                               AppUserRepository userRepository) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    // --- Product Endpoints ---

    @GetMapping("/products")
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    // --- User Auth Endpoints (Signup & Login) ---

    @PostMapping("/auth/signup")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String fullName = request.get("fullName");
        String password = request.get("password");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email aur Password required hain!"));
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Yeh email pehle se registered hai!"));
        }

        AppUser user = new AppUser(email, fullName, password);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "Account successfully ban gaya!",
                "email", email,
                "fullName", fullName != null ? fullName : "User"
        ));
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        Optional<AppUser> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty() || !userOpt.get().getPassword().equals(password)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Galat email ya password!"));
        }

        AppUser user = userOpt.get();
        return ResponseEntity.ok(Map.of(
                "message", "Login successful!",
                "email", user.getEmail(),
                "fullName", user.getFullName()
        ));
    }

    // --- Order & Checkout Endpoints ---

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody CheckoutRequestDTO request) {
        try {
            Order order = orderService.placeOrder(request);
            return ResponseEntity.ok(Map.of("message", "Order placed successfully!", "orderId", order.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/orders")
    public List<Order> getOrders(@RequestParam String email) {
        return orderRepository.findByCustomerEmailOrderByOrderDateDesc(email);
    }
    // --- Track Single Order Endpoint ---
    @GetMapping("/orders/track/{orderId}")
    public ResponseEntity<?> trackOrderById(@PathVariable Long orderId) {
        return orderRepository.findById(orderId)
                .map(order -> ResponseEntity.ok(Map.of(
                        "orderId", order.getId(),
                        "customerEmail", order.getCustomerEmail(),
                        "totalAmount", order.getTotalAmount(),
                        "status", order.getStatus() != null ? order.getStatus() : "CONFIRMED",
                        "orderDate", order.getOrderDate() != null ? order.getOrderDate().toString() : "Recent"
                )))
                .orElse(ResponseEntity.status(404).body(Map.of("error", "Order nahi mila! Kripya sahi Order ID daalein.")));
    }
}