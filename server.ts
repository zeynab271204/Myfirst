import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import * as admin from "firebase-admin";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// Lazy init for firebase-admin
let adminApp: admin.app.App | null = null;
function getAdmin() {
  if (!adminApp) {
    // In this environment, we attempt to initialize with project ID.
    // Real apps would need a service account key for local dev.
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

  // API to notify agent
  app.post("/api/notify-new-message", async (req, res) => {
    const { ticketId, messageContent, authorName } = req.body;

    if (!ticketId || !messageContent) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const db = getAdmin().firestore();
      
      // 1. Fetch ticket
      const ticketDoc = await db.collection("tickets").doc(ticketId).get();
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
      const agentDoc = await db.collection("users").doc(agentId).get();
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
