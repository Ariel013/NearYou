/**
 * Bot WhatsApp GéoService — revendication de fiche via WhatsApp
 *
 * Démarrage : npx ts-node bot/index.ts
 * Première utilisation : scannez le QR code affiché dans le terminal avec WhatsApp
 * Session sauvegardée dans ./auth_info/ (gitignored)
 */

import "dotenv/config";
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

const TOKEN_PATTERN = /GS-[A-Z0-9]{8}/;

const BOT_SECRET = process.env.BOT_SECRET;
const APP_URL = process.env.APP_URL;

if (!BOT_SECRET || !APP_URL) {
  console.error("❌ BOT_SECRET et APP_URL sont requis dans .env");
  process.exit(1);
}

const logger = pino({ level: "silent" });

async function sendWebhook(token: string, fromPhone: string): Promise<{ found: boolean; created: boolean; error?: string }> {
  const res = await fetch(`${APP_URL}/api/claim/whatsapp/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, from_phone: fromPhone, bot_secret: BOT_SECRET }),
  });
  return res.json().then((j) => j.data ?? { found: false, created: false, error: j.error });
}

async function connectToWhatsApp(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock: WASocket = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: false, // on gère manuellement pour plus de clarté
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("\n📱 Scannez ce QR code avec WhatsApp (Appareils connectés → Connecter un appareil) :\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
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
      console.log("✅ Bot WhatsApp connecté et en écoute !");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      // Ignorer les messages envoyés par le bot lui-même
      if (msg.key.fromMe) continue;
      // Ignorer les messages de groupe
      if (msg.key.remoteJid?.endsWith("@g.us")) continue;

      const text =
        msg.message?.conversation ??
        msg.message?.extendedTextMessage?.text ??
        "";

      const match = text.match(TOKEN_PATTERN);
      if (!match) continue;

      const token = match[0];
      // Baileys fournit le JID sous la forme "2250XXXXXXXX@s.whatsapp.net"
      const rawJid = msg.key.remoteJid!;
      const fromPhone = "+" + rawJid.replace("@s.whatsapp.net", "");

      console.log(`📩 Code reçu : ${token} de ${fromPhone}`);

      try {
        const result = await sendWebhook(token, fromPhone);

        let reply: string;
        if (result.error) {
          reply = `❌ ${result.error}\n\nSi le problème persiste, générez un nouveau code sur GéoService.`;
        } else if (result.found) {
          reply = "✅ Votre fiche GéoService a été revendiquée avec succès !\n\nVous pouvez maintenant accéder à votre tableau de bord et modifier vos informations.";
        } else {
          reply = "✅ Code vérifié !\n\n⚠️ Aucune fiche ne correspond à ce numéro. Rendez-vous sur GéoService pour créer votre fiche.";
        }

        await sock.sendMessage(rawJid, { text: reply });
      } catch (err) {
        console.error("[webhook]", err);
        await sock.sendMessage(rawJid, {
          text: "❌ Une erreur est survenue. Réessayez dans quelques instants.",
        });
      }
    }
  });
}

connectToWhatsApp().catch(console.error);
