/**
 * Bot WhatsApp NearYou — envoie les codes de vérification aux utilisateurs
 *
 * Démarrage : npx ts-node index.ts
 * Première utilisation : scannez le QR code affiché dans le terminal avec WhatsApp
 * Session sauvegardée dans ./auth_info/ (gitignored)
 */

import "dotenv/config";
import express from "express";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import pino from "pino";

const BOT_SECRET = process.env.BOT_SECRET;
const PORT = process.env.PORT ?? 3001;

if (!BOT_SECRET) {
  console.error("❌ BOT_SECRET est requis dans .env");
  process.exit(1);
}

const logger = pino({ level: "silent" });
let sock: WASocket | null = null;

// ─── Serveur HTTP ────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, connected: sock !== null });
});

app.post("/api/send", async (req, res) => {
  if (req.body.bot_secret !== BOT_SECRET) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  const { to_phone, code } = req.body as { to_phone?: string; code?: string };

  if (!to_phone || !code) {
    return res.status(400).json({ error: "to_phone et code sont requis" });
  }

  if (!sock) {
    return res.status(503).json({ error: "Bot WhatsApp non connecté, réessayez dans quelques secondes" });
  }

  try {
    // Normaliser le numéro : retirer le + et ajouter @s.whatsapp.net
    const jid = `${to_phone.replace(/^\+/, "")}@s.whatsapp.net`;
    const text =
      `🔐 Votre code NearYou : *${code}*\n\n` +
      `Entrez ce code sur l'application pour valider votre fiche.\n` +
      `⏱ Valable 15 minutes — ne le partagez pas.`;

    await sock.sendMessage(jid, { text });
    console.log(`📤 Code envoyé à ${to_phone}`);
    return res.json({ sent: true });
  } catch (err) {
    console.error("[/api/send]", err);
    return res.status(500).json({ error: "Échec d'envoi WhatsApp" });
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Serveur HTTP bot sur le port ${PORT}`);
});

// ─── Connexion WhatsApp ───────────────────────────────────────────────────────

async function connectToWhatsApp(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("\n📱 Scannez ce QR code avec WhatsApp (Appareils connectés → Connecter un appareil) :\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      sock = null;
      const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log(`🔌 Connexion fermée (code ${code}). Reconnexion : ${shouldReconnect}`);
      if (shouldReconnect) {
        setTimeout(connectToWhatsApp, 3000);
      } else {
        console.log("🔓 Déconnecté. Supprimez ./auth_info/ et relancez pour reconnecter.");
      }
    }

    if (connection === "open") {
      console.log("✅ Bot WhatsApp connecté et prêt à envoyer !");
    }
  });
}

connectToWhatsApp().catch(console.error);
