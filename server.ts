import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // API routes
  app.post("/api/notify", async (req, res) => {
    const { booking, type, message } = req.body;

    try {
      console.log(`Processing ${type} notification for booking: ${booking.id}`);

      // 1. Email Notification
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });

          const subject = type === 'question' 
            ? `Dúvida sobre sua reserva - Som & Luz`
            : `Reserva de Aluguel - ${booking.packageType}`;
          
          const text = type === 'question'
            ? `Olá ${booking.clientName},\n\nO administrador tem uma dúvida sobre sua reserva:\n\n"${message}"\n\nPor favor, responda este e-mail para prosseguirmos.`
            : `Nova reserva de ${booking.clientName} para o dia ${booking.startDate}.`;

          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: type === 'question' ? booking.clientEmail : `${booking.clientEmail}, ${process.env.PARTNER_EMAIL || process.env.EMAIL_USER}`,
            subject,
            text,
          });
          console.log("Email sent.");
        } catch (e) {
          console.warn("Email skipped (likely config issue):", e instanceof Error ? e.message : e);
        }
      } else {
        console.log("Email notification skipped: Credentials not set.");
      }

      // 2. Telegram Notification
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        try {
          const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
          const text = type === 'question'
            ? `❓ *Dúvida Enviada*\n👤 Para: ${booking.clientName}\n💬 Mensagem: ${message}`
            : `📦 *Nova Reserva*\n👤 ${booking.clientName}\n💰 R$ ${booking.totalPrice}`;

          await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: process.env.TELEGRAM_CHAT_ID,
              text,
              parse_mode: 'Markdown',
            }),
          });
          console.log("Telegram sent.");
        } catch (e) {
          console.warn("Telegram skipped (likely config issue):", e instanceof Error ? e.message : e);
        }
      } else {
        console.log("Telegram notification skipped: Credentials not set.");
      }

      // Always return success to the frontend
      res.json({ success: true, message: "Notification process completed" });
    } catch (error) {
      // Even if the whole logic fails, we don't want to break the client's experience
      console.error("Critical notification error:", error);
      res.json({ success: true, warning: "Notifications failed but booking is safe" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
