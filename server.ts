import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import fs from "fs";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// Email Transporter (Lazy loaded or configured via env)
const createEmailTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  
  // Fallback / Mock for development
  return {
    sendMail: async (opts: any) => {
      console.log(`[MOCK EMAIL] To: ${opts.to} | Subject: ${opts.subject}`);
      console.log(`[BODY]\n${opts.text}\n`);
      return { messageId: "mock-id-" + Date.now() };
    }
  };
};

const transporter = createEmailTransporter();

// Lazy init for firebase-admin
let adminApp: any = null;
function getAdmin() {
  if (!adminApp) {
    adminApp = admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
  return adminApp;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API to fetch all consultants (agents/admins)
  app.get("/api/consultants", async (req, res) => {
    try {
      const { getFirestore } = await import("firebase-admin/firestore");
      const firestore = getFirestore(getAdmin(), firebaseConfig.firestoreDatabaseId);
      const snapshot = await firestore.collection("users")
        .where("role", "in", ["agent", "admin"])
        .get();
      
      const consultants = snapshot.docs.map(doc => ({
        uid: doc.id,
        displayName: doc.data().displayName,
        email: doc.data().email
      }));
      
      res.json(consultants);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API to notify agent
  app.post("/api/notify-new-message", async (req, res) => {
    const { ticketId, messageContent, authorName } = req.body;

    if (!ticketId || !messageContent) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // Use the specific databaseId from config
      const { getFirestore } = await import("firebase-admin/firestore");
      const firestore = getFirestore(getAdmin(), firebaseConfig.firestoreDatabaseId);
      
      // 1. Fetch ticket
      const ticketDoc = await firestore.collection("tickets").doc(ticketId).get();
      if (!ticketDoc.exists) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      const ticketData = ticketDoc.data();
      const agentId = ticketData?.agentId;

      if (!agentId) {
        console.log(`[Notification] No agent assigned to ticket ${ticketId}. Skipping email.`);
        return res.json({ success: true, message: "No agent assigned" });
      }

      // 2. Fetch agent details
      const agentDoc = await firestore.collection("users").doc(agentId).get();
      if (!agentDoc.exists) {
        return res.status(404).json({ error: "Agent user not found" });
      }

      const agentData = agentDoc.data();
      const agentEmail = agentData?.email;

      if (!agentEmail) {
        return res.status(400).json({ error: "Agent has no email address" });
      }

      // 3. Simulate sending email
      const ticketUrl = `${req.get("origin") || "http://localhost:3000"}/tickets/${ticketId}`;
      const emailContent = `
        ------------------------------------------------------------
        📧 NOTIFICATION SAGESUPPORT
        ------------------------------------------------------------
        Bonjour ${agentData?.displayName || "Consultant"},
        
        Un nouveau message a été ajouté au ticket : "${ticketData?.title}"
        
        De : ${authorName}
        Message : "${messageContent.substring(0, 200)}${messageContent.length > 200 ? "..." : ""}"
        
        Voir le ticket : ${ticketUrl}
        ------------------------------------------------------------
      `;

      console.log(`[EMAIL DISPATCH] To: ${agentEmail}\n${emailContent}`);

      // Here you would integrate with SendGrid, Resend, etc.
      // e.g., await resend.emails.send({ ... });

      res.json({ 
        success: true, 
        deliveredTo: agentEmail,
        simulation: true 
      });
    } catch (error: any) {
      console.error("Error in notify-new-message:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notify-new-ticket", async (req, res) => {
    const { ticketId, title, clientName } = req.body;
    if (!ticketId || !title) return res.status(400).json({ error: "Missing data" });

    try {
      console.log(`[NOTIFICATION ADMIN] Nouveau ticket créè: #${ticketId} par ${clientName}`);
      
      const adminEmail = "zeynad91@gmail.com"; // Example admin email
      const ticketUrl = `${req.get("origin") || "http://localhost:3000"}`;

      const emailContent = `
        ------------------------------------------------------------
        🚨 ALERTE NOUVEAU TICKET - SAGESUPPORT
        ------------------------------------------------------------
        Un nouveau ticket vient d'être ouvert sur le portail.
        
        Client : ${clientName}
        Objet : ${title}
        ID : ${ticketId}
        
        Lien Admin : ${ticketUrl}
        ------------------------------------------------------------
      `;

      console.log(`[EMAIL DISPATCH] To: ${adminEmail}\n${emailContent}`);

      res.json({ success: true, message: "Admin notified" });
    } catch (error: any) {
      console.error("Error in notify-new-ticket:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/dispatch-assignment", async (req, res) => {
    const { ticketId, type, consultantId, details } = req.body;
    
    if (!ticketId || !type) return res.status(400).json({ error: "Data manquante" });

    try {
      const { getFirestore, FieldValue } = await import("firebase-admin/firestore");
      const firestore = getFirestore(getAdmin(), firebaseConfig.firestoreDatabaseId);
      
      // Fetch consultant info
      let recipientEmail = details?.consultantEmail || "consultant@example.com";
      let recipientName = "Consultant";

      if (consultantId) {
         const userDoc = await firestore.collection("users").doc(consultantId).get();
         if (userDoc.exists) {
           recipientEmail = userDoc.data()?.email;
           recipientName = userDoc.data()?.displayName;
         }
      }

      const timestamp = new Date().toISOString();
      const origin = req.get("origin") || "http://localhost:3000";

      if (type === "email") {
        const subject = `[Attribution] Ticket #${ticketId.slice(0,8)} - ${details.title}`;
        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #2563eb; padding: 24px; color: white;">
              <h1 style="margin: 0; font-size: 20px;">Nouvelle Attribution SAGESUPPORT</h1>
            </div>
            <div style="padding: 24px; color: #1e293b;">
              <p>Bonjour <strong>${recipientName}</strong>,</p>
              <p>Un nouveau ticket vous a été attribué :</p>
              <div style="background-color: #f8fafc; padding: 16px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Client :</strong> ${details.companyName}</p>
                <p style="margin: 0 0 8px 0;"><strong>Sage :</strong> ${details.sageModule}</p>
                <p style="margin: 0;"><strong>Sujet :</strong> ${details.title}</p>
              </div>
              <a href="${origin}/tickets/${ticketId}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Ouvrir le ticket</a>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"SageSupport Admin" <${process.env.SMTP_USER || 'noreply@sagesupport.pro'}>`,
          to: recipientEmail,
          subject: subject,
          text: `Bonjour ${recipientName}, un ticket vous a été attribué. Client: ${details.companyName}, Sujet: ${details.title}. Voir ici: ${origin}/tickets/${ticketId}`,
          html: html
        });

      } else if (type === "whatsapp") {
        const waMessage = `*SAGESUPPORT PRO*\n\nNouvelle intervention attribuée :\n📦 *Client:* ${details.companyName}\n🛠 *Sage:* ${details.sageModule}\n📝 *Sujet:* ${details.title}\n\nLien: ${origin}/tickets/${ticketId}`;
        
        console.log(`[WHATSAPP API DISPATCH] Triggering WhatsApp Webhook to: ${recipientEmail}\nMessage: ${waMessage}`);
        // Ici: intégration avec Twilio / Wati / Meta API
      }

      // Record this assignment in the ticket history
      await firestore.collection("tickets").doc(ticketId).update({
        agentId: consultantId || FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp()
      });

      // Add a system message to the ticket messages
      await firestore.collection("tickets").doc(ticketId).collection("messages").add({
        content: `🚩 _Le ticket a été attribué à ${recipientName} via ${type.toUpperCase()}_`,
        authorId: "system",
        authorName: "Système",
        createdAt: FieldValue.serverTimestamp()
      });

      res.json({ 
        success: true, 
        message: `Attribution par ${type} réussie`,
        dispatchedAt: timestamp 
      });
    } catch (error: any) {
      console.error("Dispatch Error:", error);
      res.status(500).json({ error: error.message });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
