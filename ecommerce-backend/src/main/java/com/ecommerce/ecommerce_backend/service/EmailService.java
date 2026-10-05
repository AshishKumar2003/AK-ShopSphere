package com.ecommerce.ecommerce_backend.service;

import com.ecommerce.ecommerce_backend.Entity.OrderItem;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOrderConfirmationEmail(String toEmail, Long orderId, BigDecimal totalAmount, List<OrderItem> items) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            // Har product ke liye table row generate karna
            StringBuilder itemsHtml = new StringBuilder();
            for (OrderItem item : items) {
                BigDecimal itemTotal = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                itemsHtml.append("<tr style='border-bottom: 1px solid #f1f5f9;'>")
                        .append("<td style='padding: 12px 8px; font-size: 14px; color: #1e293b; font-weight: 500;'>")
                        .append(item.getProductName())
                        .append("</td>")
                        .append("<td style='padding: 12px 8px; font-size: 14px; color: #64748b; text-align: center;'>")
                        .append(item.getQuantity())
                        .append("</td>")
                        .append("<td style='padding: 12px 8px; font-size: 14px; color: #1e293b; text-align: right; font-weight: 600;'>₹")
                        .append(itemTotal)
                        .append("</td>")
                        .append("</tr>");
            }

            String htmlMsg = "<!DOCTYPE html>"
                    + "<html>"
                    + "<head><meta charset='UTF-8'></head>"
                    + "<body style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;'>"
                    + "  <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);'>"
                    + "    <div style='background: linear-gradient(135deg, #4f46e5, #6366f1); padding: 30px; text-align: center; color: #ffffff;'>"
                    + "      <h1 style='margin: 0; font-size: 26px; font-weight: 800;'>ShopSphere</h1>"
                    + "      <p style='margin: 6px 0 0; font-size: 14px; opacity: 0.9;'>Order Confirmation</p>"
                    + "    </div>"
                    + "    <div style='padding: 30px 25px;'>"
                    + "      <div style='display: inline-block; padding: 4px 12px; background-color: #ecfdf5; color: #059669; font-size: 12px; font-weight: 700; border-radius: 9999px; margin-bottom: 12px;'>✓ Order Placed</div>"
                    + "      <h2 style='margin: 0 0 8px; font-size: 20px; color: #0f172a;'>Shukriya, Aapka Order Confirm Ho Gaya Hai!</h2>"
                    + "      <p style='margin: 0 0 24px; font-size: 14px; color: #64748b;'>Order ID: <b>#" + orderId + "</b></p>"
                    + "      <table style='width: 100%; border-collapse: collapse; margin-bottom: 24px;'>"
                    + "        <thead>"
                    + "          <tr style='border-bottom: 2px solid #e2e8f0; text-align: left;'>"
                    + "            <th style='padding: 8px; font-size: 12px; text-transform: uppercase; color: #64748b;'>Item</th>"
                    + "            <th style='padding: 8px; font-size: 12px; text-transform: uppercase; color: #64748b; text-align: center;'>Qty</th>"
                    + "            <th style='padding: 8px; font-size: 12px; text-transform: uppercase; color: #64748b; text-align: right;'>Price</th>"
                    + "          </tr>"
                    + "        </thead>"
                    + "        <tbody>"
                    +            itemsHtml.toString()
                    + "        </tbody>"
                    + "      </table>"
                    + "      <div style='background-color: #f8fafc; border-radius: 10px; padding: 16px; border: 1px solid #e2e8f0; margin-bottom: 24px;'>"
                    + "        <div style='display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; color: #0f172a;'>"
                    + "          <span>Total Payable:</span>"
                    + "          <span style='color: #4f46e5;'>₹" + totalAmount + "</span>"
                    + "        </div>"
                    + "      </div>"
                    + "      <p style='font-size: 13px; color: #64748b; margin: 0; text-align: center;'>Koi sawal ho toh humare support portal par connect karein.</p>"
                    + "    </div>"
                    + "    <div style='background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;'>"
                    + "      © 2026 ShopSphere. Automatic confirmation receipt."
                    + "    </div>"
                    + "  </div>"
                    + "</body>"
                    + "</html>";

            helper.setTo(toEmail);
            helper.setSubject("ShopSphere Invoice: Order #" + orderId + " Confirmed");
            helper.setText(htmlMsg, true);

            mailSender.send(mimeMessage);
            System.out.println(">>> Detailed Order receipt sent to: " + toEmail + " <<<");
        } catch (MessagingException e) {
            System.err.println("Failed to send order email: " + e.getMessage());
        }
    }
}