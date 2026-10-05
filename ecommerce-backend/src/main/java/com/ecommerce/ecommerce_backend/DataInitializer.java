package com.ecommerce.ecommerce_backend;

import com.ecommerce.ecommerce_backend.Entity.Product;
import com.ecommerce.ecommerce_backend.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final ProductRepository productRepository;

    public DataInitializer(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        // Table clear karke fresh 12 products insert honge
        productRepository.deleteAll();

        List<Product> products = List.of(
                new Product(
                        "Mechanical Keyboard",
                        "RGB Backlit Wireless Mechanical Keyboard with Hot-Swappable Switches",
                        new BigDecimal("1.00"),
                        10,
                        "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80"
                ),
                new Product(
                        "Gaming Mouse",
                        "Ultra-lightweight 16000 DPI sensor mouse with RGB lighting",
                        new BigDecimal("1.00"),
                        15,
                        "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&q=80"
                ),
                new Product(
                        "Noise Cancelling Headphones",
                        "Active noise cancelling wireless Bluetooth headphones with deep bass",
                        new BigDecimal("1.00"),
                        6,
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"
                ),
                new Product(
                        "Smart Watch Series 9",
                        "AMOLED Display, Blood Oxygen & Heart Rate Monitor, 7-Day Battery",
                        new BigDecimal("1.00"),
                        10,
                        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80"
                ),
                new Product(
                        "4K Ultra HD Monitor 27-inch",
                        "IPS Panel, 144Hz Refresh Rate, 1ms Response Time with HDR400",
                        new BigDecimal("1.00"),
                        4,
                        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80"
                ),
                new Product(
                        "Wireless Gaming Controller",
                        "Ergonomic design with dual haptic vibration support for PC & Console",
                        new BigDecimal("3499.00"),
                        12,
                        "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=500&q=80"
                ),
                new Product(
                        "Pro Ultrabook 14-inch",
                        "Intel Core i7 13th Gen, 16GB RAM, 512GB SSD, Metal Unibody",
                        new BigDecimal("68999.00"),
                        5,
                        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80"
                ),
                new Product(
                        "4K Mirrorless Vlogging Camera",
                        "24.2 MP APS-C Sensor with 16-50mm Lens Kit and 4K Video",
                        new BigDecimal("54990.00"),
                        3,
                        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80"
                ),
                new Product(
                        "Rugged Bluetooth Speaker",
                        "IPX7 Waterproof, 20W Powerful Output with 12 Hours Playtime",
                        new BigDecimal("1.00"),
                        14,
                        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80"
                ),
                new Product(
                        "NVMe M.2 SSD 1TB",
                        "PCIe Gen4 High Speed up to 5000 MB/s Read Speed for PC & PS5",
                        new BigDecimal("1.00"),
                        18,
                        "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&q=80"
                ),
                new Product(
                        "Pro Stream Webcam 1080p",
                        "Full HD 60FPS with Dual Noise-Cancelling Mics and Privacy Shutter",
                        new BigDecimal("1.00"),
                        9,
                        "https://images.unsplash.com/photo-1588508065123-287b28e013da?w=500&q=80"
                ),
                new Product(
                        "3-in-1 Fast Wireless Charger",
                        "Magnetic charging station for Phone, Watch, and Earbuds simultaneously",
                        new BigDecimal("1.00"),
                        22,
                        "https://images.unsplash.com/photo-1628202926206-c63a34b1618f?w=600&auto=format&fit=crop&q=80"
                )
        );

        productRepository.saveAll(products);
        System.out.println(">>> All 12 Products inserted successfully! <<<");
    }
}