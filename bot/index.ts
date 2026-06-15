/**
 * Bot WhatsApp NearYou — envoie les codes de vérification aux utilisateurs
 *
 * Démarrage : npx ts-node index.ts
 * Première utilisation : scannez le QR code affiché dans le terminal avec WhatsApp
 * Session sauvegardée dans ./auth_info/ (gitignored)
 */

import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import QRCode from "qrcode";
import pino from "pino";

const BOT_SECRET = process.env.BOT_SECRET;
const PORT = process.env.PORT ?? 3001;

if (!BOT_SECRET) {
  console.error("❌ BOT_SECRET est requis dans .env");
  process.exit(1);
}

const logger = pino({ level: "silent" });
let sock: WASocket | null = null;
let lastQr: string | null = null;
let lastQrAt: number = 0;

// ─── Serveur HTTP ────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, connected: sock !== null });
});

// QR code en ASCII pour terminal (curl) — long-poll : attend le QR si pas encore disponible
app.get("/qr-ascii", async (req, res) => {
  if (req.query.secret !== BOT_SECRET) {
    return res.status(401).send("Non autorisé\n");
  }
  if (sock !== null) {
    return res.type("text/plain").send("✅ Bot déjà connecté — pas de QR à scanner.\n");
  }

  // Attendre un QR frais (moins de 12 s) — Baileys en génère un nouveau toutes les ~20 s
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    const age = Date.now() - lastQrAt;
    if (lastQr && age < 12_000) break;   // QR frais dispo
    await new Promise((r) => setTimeout(r, 300));
  }

  if (!lastQr) {
    return res.type("text/plain").send("⏳ Timeout : aucun QR reçu après 45 s. Vérifiez que le bot est bien démarré.\n");
  }

  try {
    const ascii = await QRCode.toString(lastQr, { type: "terminal", small: true });
    res.type("text/plain").send(
      "\n📱 Scannez avec WhatsApp → Appareils connectés → Connecter un appareil\n\n" +
      ascii +
      "\n⏱ QR frais — scannez dans les 12 secondes. Relancez la commande pour un nouveau QR.\n"
    );
  } catch {
    res.status(500).send("Erreur génération QR\n");
  }
});

// Page HTML qui affiche le QR code de connexion WhatsApp
app.get("/qr", (_req, res) => {
  if (sock !== null) {
    res.send(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>NearYou Bot — QR</title></head>
<body style="font-family:sans-serif;text-align:center;padding:40px">
<h2>✅ Bot déjà connecté !</h2>
<p>WhatsApp est connecté. Rechargez si vous venez de scanner.</p>
</body></html>`);
    return;
  }
  if (!lastQr) {
    res.send(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<meta http-equiv="refresh" content="2">
<title>NearYou Bot — QR</title></head>
<body style="font-family:sans-serif;text-align:center;padding:40px">
<h2>⏳ En attente du QR code…</h2>
<p>Rechargement automatique toutes les 2 secondes.</p>
</body></html>`);
    return;
  }
  const qrEncoded = encodeURIComponent(lastQr);
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="12">
  <title>NearYou Bot — Scanner le QR</title>
</head>
<body style="font-family:sans-serif;text-align:center;padding:40px;background:#f8f9fb">
  <h2 style="color:#1B6CA8">📱 Scanner avec WhatsApp</h2>
  <p style="color:#64748b;margin-bottom:24px">
    WhatsApp → ⋮ ou Réglages → <strong>Appareils connectés</strong> → <strong>Connecter un appareil</strong>
  </p>
  <canvas id="qr" style="border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,.1)"></canvas>
  <p style="color:#94a3b8;font-size:12px;margin-top:16px">
    Ce QR expire dans ~20 s · La page se recharge automatiquement toutes les 30 s
  </p>
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
  <script>
    QRCode.toCanvas(document.getElementById('qr'), decodeURIComponent('${qrEncoded}'), { width: 280, margin: 2 });
  </script>
</body>
</html>`);
});

// Réinitialise la session WhatsApp (permet de changer de numéro)
app.post("/reset", async (req, res) => {
  if (req.body.bot_secret !== BOT_SECRET) {
    return res.status(401).json({ error: "Non autorisé" });
  }
  try {
    // Déconnecter le socket actuel
    if (sock) {
      await sock.logout().catch(() => {});
      sock = null;
    }
    // Supprimer les fichiers de session
    const authDir = path.resolve("./auth_info");
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }
    lastQr = null;
    console.log("🗑️  Session WhatsApp supprimée — reconnexion dans 2 secondes…");
    // Relancer la connexion → générera un nouveau QR
    setTimeout(connectToWhatsApp, 2000);
    return res.json({ ok: true, message: "Session supprimée. Ouvrez /qr pour scanner le nouveau QR code." });
  } catch (err) {
    console.error("[/reset]", err);
    return res.status(500).json({ error: "Erreur lors de la réinitialisation" });
  }
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
      lastQr = qr;
      lastQrAt = Date.now();
      console.log("\n📱 Scannez ce QR code avec WhatsApp (Appareils connectés → Connecter un appareil) :\n");
      qrcode.generate(qr, { small: true });
      console.log(`\n🌐 Ou ouvrez dans votre navigateur : https://<votre-domaine-railway>/qr\n`);
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
      lastQr = null;
      console.log("✅ Bot WhatsApp connecté et prêt à envoyer !");
    }
  });
}

connectToWhatsApp().catch(console.error);
