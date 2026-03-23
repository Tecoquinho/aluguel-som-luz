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
    const { booking, type } = req.body;

    try {
      // 1. Email Notification (Client and Partner)
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });

          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: `${booking.clientEmail}, ${process.env.PARTNER_EMAIL || process.env.EMAIL_USER}`,
            subject: `Reserva de Aluguel - ${booking.packageType}`,
            text: `
              Olá,
              Uma nova reserva foi realizada:
              
              Cliente: ${booking.clientName}
              Data: ${booking.startDate} até ${booking.endDate}
              Local: ${booking.location}
              Tipo de Evento: ${booking.eventType}
              Pacote: ${booking.packageType}
              Preço Total: R$ ${booking.totalPrice}
              
              Status: ${booking.status}
            `,
          };

          await transporter.sendMail(mailOptions);
          console.log("Email sent successfully");
        } catch (emailError) {
          console.error("Email notification failed:", emailError);
          // Don't throw, let Telegram try
        }
      }

      // 2. Telegram Notification (Partner)
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        try {
          const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
          const message = `
  📦 *Nova Reserva de Aluguel*
  👤 Cliente: ${booking.clientName}
  📅 Data: ${booking.startDate} a ${booking.endDate}
  📍 Local: ${booking.location}
  🎉 Evento: ${booking.eventType}
  🛠 Pacote: ${booking.packageType}
  💰 Total: R$ ${booking.totalPrice}
          `;

          await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: process.env.TELEGRAM_CHAT_ID,
              text: message,
              parse_mode: 'Markdown',
            }),
          });
          console.log("Telegram notification sent successfully");
        } catch (telegramError) {
          console.error("Telegram notification failed:", telegramError);
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("General notification error:", error);
      res.status(500).json({ error: "Failed to process notifications" });
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
