# 🛒 AK-ShopSphere

AK-ShopSphere is a full-stack e-commerce web application built to demonstrate a real-world online shopping workflow using **Java Spring Boot, React, and Tailwind CSS**.

The project focuses on backend reliability, secure order processing, inventory management, and a responsive modern frontend.

## 🚀 Live Demo


🔗 GitHub Repository: https://github.com/AshishKumar2003/AK-ShopSphere

---

## ✨ Key Features

* 🛍️ Product browsing and management
* 🛒 Shopping cart functionality
* 📦 Order management
* 🔐 Secure authentication and authorization
* 🔑 JWT-based security
* 🗄️ Database integration using Spring Data JPA
* ⚡ RESTful APIs with Spring Boot
* 🔒 Concurrent stock protection using pessimistic locking
* 💳 Transaction-safe order processing
* 📧 Automatic HTML tax invoice emails after successful orders
* 📱 Responsive React frontend
* 🎨 Tailwind CSS based UI
* 🔄 Real-time stock validation during checkout

---

## 🔥 Real-World Concurrency Problem Solved

A common problem in e-commerce systems occurs when multiple users try to purchase the last available product at the same time.

For example:

> If only 1 item is available and 50+ users attempt to purchase it simultaneously, the system must ensure that the same product cannot be sold multiple times.

AK-ShopSphere addresses this using **pessimistic database locking** with Spring Data JPA:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
```

This ensures that the product stock is safely locked during the transaction and helps prevent overselling.

---

## 💳 Transaction-Safe Order Processing

The checkout process uses Spring's `@Transactional` mechanism to maintain data consistency.

The order workflow ensures that:

1. Product stock is checked.
2. Inventory is updated.
3. Order is created.
4. Order items are saved.
5. Transaction is committed only when the complete operation succeeds.

If an error occurs during the process, the transaction can be rolled back to help maintain database consistency.

---

## 📧 Automatic Invoice Email

After a successful order, the application generates and sends an **HTML tax invoice email** using:

* Spring Mail
* `JavaMailSender`
* HTML email templates

This provides users with an automatic order confirmation and invoice experience.

---

## 🛠️ Tech Stack

### Backend

* Java
* Spring Boot
* Spring Data JPA
* Hibernate
* REST APIs
* Spring Security
* JWT
* Spring Mail
* Maven

### Frontend

* React
* Vite
* Tailwind CSS
* JavaScript
* HTML
* CSS

### Database

* H2 Database
* JPA / Hibernate

### Development Tools

* IntelliJ IDEA
* VS Code
* Git
* GitHub
* Postman
* Maven

---

## 🏗️ Project Architecture

```text
AK-ShopSphere
│
├── ecommerce-backend
│   │
│   ├── src
│   │   ├── main
│   │   │   ├── java
│   │   │   │   └── ...
│   │   │   └── resources
│   │   │       └── ...
│   │   │
│   │   └── test
│   │
│   ├── pom.xml
│   └── ...
│
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have installed:

* Java 17+
* Maven
* Node.js
* npm
* Git
* IntelliJ IDEA or VS Code

---

## 📥 Clone the Repository

```bash
git clone https://github.com/AshishKumar2003/AK-ShopSphere.git
```

```bash
cd AK-ShopSphere
```

---

## 🔧 Backend Setup

Navigate to the backend:

```bash
cd ecommerce-backend
```

Build the project:

```bash
mvn clean install
```

Run the Spring Boot application:

```bash
mvn spring-boot:run
```

The backend runs on:

```text
http://localhost:8080
```

---

## 🌐 Frontend Setup

Create/open the React frontend directory and install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will provide a local development URL, normally:

```text
http://localhost:5173
```

---

## 🔐 Environment Variables

For production or email functionality, configure the required environment variables instead of committing sensitive credentials to GitHub.

Example:

```properties
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-app-password
```

> ⚠️ Never commit passwords, API keys, JWT secrets, or other credentials to the repository.

---

## 🧪 API Testing

The backend REST APIs can be tested using **Postman**.

Typical API operations include:

```text
GET     /api/products
POST    /api/products
GET     /api/products/{id}
PUT     /api/products/{id}
DELETE  /api/products/{id}

POST    /api/orders
GET     /api/orders
```

---

## 📊 Key Backend Concepts Demonstrated

This project demonstrates practical knowledge of:

* REST API development
* MVC architecture
* Dependency Injection
* Spring Boot
* Spring Data JPA
* Hibernate ORM
* Database transactions
* Pessimistic locking
* Concurrency handling
* JWT authentication
* Exception handling
* DTO-based API design
* Email integration
* CRUD operations
* Maven dependency management

---

## 🎯 Project Objective

The goal of AK-ShopSphere is to go beyond a basic CRUD e-commerce tutorial and demonstrate how backend systems can handle **real-world problems such as concurrent purchases, inventory consistency, transactional order processing, and automated invoice communication**.

---

## 👨‍💻 Developer

### Ashish Kumar Sharma

**Java Developer | Spring Boot | REST APIs | SQL**

B.Tech Computer Science Engineering Graduate

📍 Pune, Maharashtra, India

🔗 GitHub:
https://github.com/AshishKumar2003

---

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.

**Built with Java, Spring Boot, React & Tailwind CSS.**
