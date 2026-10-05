CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    price DECIMAL(19, 2) NOT NULL,
    stock_quantity INT NOT NULL,
    image_url VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_email VARCHAR(255),
    total_amount DECIMAL(19, 2),
    status VARCHAR(50),
    order_date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT,
    product_id BIGINT,
    product_name VARCHAR(255),
    quantity INT,
    price DECIMAL(19, 2),
    CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id)
);