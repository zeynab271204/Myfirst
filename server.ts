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
    const port = Number(SMTP_PORT) || 587;
    const isSecure = port === 465;
    
    console.log(`[SMTP] Tentative de configuration - Host: ${SMTP_HOST}, Port: ${port}, Secure: ${isSecure}, User: ${SMTP_USER}`);
    
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: port,
      secure: isSecure,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        // Souvent nécessaire pour les serveurs SMTP modernes ou derrière certains pare-feux
        rejectUnauthorized: false
      }
    });
  }
  
  console.warn("[SMTP Warning] Variables d'environnement SMTP manquantes. Les emails sont simulés.");
  return {
    sendMail: async (opts: any) => {
      console.log(`[MOCK EMAIL] Vers: ${opts.to} | Sujet: ${opts.subject}`);
      return { messageId: "mock-id-" + Date.now() };
    },
    verify: async () => true
  };
};

const transporter = createEmailTransporter() as any;

// Lazy init for firebase-admin
// ... existing code ...
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

  // API de test de configuration email
  app.get("/api/test-email", async (req, res) => {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || "zeynad91@gmail.com";
    try {
      if (typeof transporter.verify === 'function') {
        await transporter.verify();
      }
      
      const info = await transporter.sendMail({
        from: `"Test ITECH" <${process.env.SMTP_USER || 'support@itechafrique.com'}>`,
        to: adminEmail,
        subject: "Test de configuration Email SAGESUPPORT",
        text: "Si vous recevez cet email, votre configuration SMTP est correcte !",
        html: "<h1>Test Réussi !</h1><p>Votre portail de support est prêt à envoyer des notifications.</p>"
      });
      
      res.json({ 
        success: true, 
        message: "Email de test envoyé avec succès", 
        info: info.messageId,
        recipient: adminEmail
      });
    } catch (error: any) {
      console.error("[SMTP Test Error]", error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        code: error.code,
        command: error.command,
        hint: "Vérifiez vos identifiants. Si vous utilisez Gmail, avez-vous utilisé un 'Mot de passe d'application' ?"
      });
    }
  });

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

      // 3. Send real email
      const ticketUrl = `${req.get("origin") || "http://localhost:3000"}/tickets/${ticketId}`;
      const subject = `[Nouveau Message] Ticket #${ticketId.slice(0, 8)} - ${ticketData?.title}`;
      
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #002b5c; padding: 24px; color: white;">
            <h1 style="margin: 0; font-size: 20px;">Nouveau Message SAGESUPPORT</h1>
          </div>
          <div style="padding: 24px; color: #1e293b;">
            <p>Bonjour <strong>${agentData?.displayName || "Consultant"}</strong>,</p>
            <p>Un nouveau message a été ajouté au ticket : <strong>${ticketData?.title}</strong></p>
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #00dc82;">
              <p style="margin: 0 0 8px 0;"><strong>De :</strong> ${authorName}</p>
              <p style="margin: 0; font-style: italic;">"${messageContent}"</p>
            </div>
            <a href="${ticketUrl}" style="display: inline-block; background-color: #002b5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Répondre au ticket</a>
          </div>
        </div>
      `;

      try {
        await transporter.sendMail({
          from: `"ITECH Support" <${process.env.SMTP_USER || 'support@itechafrique.com'}>`,
          to: agentEmail,
          subject: subject,
          text: `Nouveau message de ${authorName} sur le ticket "${ticketData?.title}". Voir ici: ${ticketUrl}`,
          html: html
        });
      } catch (mailError) {
        console.error("Failed to send agent notification email:", mailError);
        // We don't throw here so the API still returns success to the client
      }

      res.json({ 
        success: true, 
        deliveredTo: agentEmail
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
      const adminEmail = process.env.ADMIN_EMAIL || "zeynad91@gmail.com";
      const origin = req.get("origin") || "http://localhost:3000";
      const ticketUrl = `${origin}/tickets/${ticketId}`;

      const subject = `[Alerte] Nouveau Ticket #${ticketId.slice(0, 8)} - ${clientName}`;
      
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #002b5c; padding: 24px; color: white;">
            <h1 style="margin: 0; font-size: 20px;">Alerte Nouveau Ticket SAGESUPPORT</h1>
          </div>
          <div style="padding: 24px; color: #1e293b;">
            <p>Un nouveau ticket vient d'être ouvert sur le portail ITECH AFRIQUE.</p>
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Client :</strong> ${clientName}</p>
              <p style="margin: 0 0 8px 0;"><strong>Objet :</strong> ${title}</p>
              <p style="margin: 0;"><strong>ID :</strong> ${ticketId}</p>
            </div>
            <a href="${origin}" style="display: inline-block; background-color: #002b5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Accéder à la console</a>
          </div>
        </div>
      `;

      try {
        await transporter.sendMail({
          from: `"ITECH System" <${process.env.SMTP_USER || 'support@itechafrique.com'}>`,
          to: adminEmail,
          subject: subject,
          text: `Nouveau ticket ouvert par ${clientName}: "${title}". ID: ${ticketId}`,
          html: html
        });
      } catch (mailError) {
        console.error("Failed to send admin notification email:", mailError);
      }

      res.json({ success: true, message: "Admin notified (email might have failed but ticket is created)" });
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
        const priorityLabels: Record<string, string> = {
          low: "Faible",
          medium: "Moyenne",
          high: "Haute",
          urgent: "URGENT"
        };
        const priorityColor = details.priority === 'urgent' ? '#dc2626' : (details.priority === 'high' ? '#ea580c' : '#2563eb');

        const subject = `${details.priority === 'urgent' ? '[URGENT] ' : ''}[Attribution] Ticket #${ticketId.slice(0,8)} - ${details.title}`;
        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #2563eb; padding: 24px; color: white;">
              <h1 style="margin: 0; font-size: 20px;">Nouvelle Attribution SAGESUPPORT</h1>
            </div>
            <div style="padding: 24px; color: #1e293b;">
              <p>Bonjour <strong>${recipientName}</strong>,</p>
              <p>Un nouveau ticket vous a été attribué :</p>
              
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <div style="margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                  <span style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Objet</span>
                  <p style="margin: 4px 0 0 0; font-weight: bold; color: #1e293b; font-size: 16px;">${details.title}</p>
                </div>
                
                <table style="width: 100%; margin-bottom: 16px;">
                  <tr>
                    <td style="width: 50%; padding: 4px 0;">
                      <span style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">Client</span><br/>
                      <strong style="font-size: 13px;">${details.companyName}</strong>
                    </td>
                    <td style="width: 50%; padding: 4px 0;">
                      <span style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">Logiciel</span><br/>
                      <strong style="font-size: 13px;">Sage ${details.sageModule}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="width: 50%; padding: 4px 0;">
                      <span style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">Priorité</span><br/>
                      <strong style="font-size: 13px; color: ${priorityColor};">${priorityLabels[details.priority] || details.priority}</strong>
                    </td>
                  </tr>
                </table>

                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                  <span style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Description du Problème</span>
                  <div style="margin-top: 8px; color: #475569; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
                    ${details.description || "Aucune description fournie."}
                  </div>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 32px;">
                <a href="${origin}/tickets/${ticketId}" style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Accéder à l'Intervention</a>
              </div>
              
              <p style="margin-top: 32px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; pt-16px;">
                Ceci est une notification automatique du portail SAGESUPPORT ITECH AFRIQUE.
              </p>
            </div>
          </div>
        `;

        try {
          await transporter.sendMail({
            from: `"ITECH Support Admin" <${process.env.SMTP_USER || 'support@itechafrique.com'}>`,
            to: recipientEmail,
            subject: subject,
            text: `Bonjour ${recipientName}, un ticket vous a été attribué. Client: ${details.companyName}, Sujet: ${details.title}. Voir ici: ${origin}/tickets/${ticketId}`,
            html: html
          });
        } catch (mailError) {
          console.error("Failed to send dispatch email:", mailError);
        }

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
    
    // Explicitly handle SPA fallback for development if vite doesn't
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const template = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
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
