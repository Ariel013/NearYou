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
let isConnected = false;
let isResetting = false;

// ─── Serveur HTTP ────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, connected: isConnected });
});

// QR code en ASCII pour terminal (curl) — long-poll : attend le QR si pas encore disponible
app.get("/qr-ascii", async (req, res) => {
  if (req.query.secret !== BOT_SECRET) {
    return res.status(401).send("Non autorisé\n");
  }
  if (isConnected) {
    return res.type("text/plain").send("✅ Bot déjà connecté — pas de QR à scanner.\n");
  }

  // Attendre le prochain QR généré par Baileys (différent de l'actuel)
  const previousQr = lastQr;
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (lastQr && lastQr !== previousQr) break; // nouveau QR arrivé
    if (lastQr && !previousQr) break;           // premier QR disponible
    await new Promise((r) => setTimeout(r, 200));
  }

  if (!lastQr || lastQr === previousQr) {
    return res.type("text/plain").send("⏳ Timeout (60 s) : aucun nouveau QR reçu. Relancez la commande.\n");
  }

  try {
    const ascii = await QRCode.toString(lastQr, { type: "terminal", small: true });
    res.type("text/plain").send(
      "\n📱 Scannez avec WhatsApp → Appareils connectés → Connecter un appareil\n\n" +
      ascii +
      "\n⏱ Scannez maintenant ! Relancez la commande pour un nouveau QR si expiré.\n"
    );
  } catch {
    res.status(500).send("Erreur génération QR\n");
  }
});

// Page HTML qui affiche le QR code de connexion WhatsApp
app.get("/qr", (_req, res) => {
  if (isConnected) {
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
app.post("/reset", (req, res) => {
  if (req.body.bot_secret !== BOT_SECRET) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  isResetting = true;
  lastQr = null;

  // 1. Supprimer auth_info avant de fermer le socket
  try {
    const authDir = path.resolve("./auth_info");
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }
  } catch (e) {
    console.warn("[/reset] Impossible de supprimer auth_info :", e);
  }

  // 2. Fermer le socket (connection.update ignorera la reconnexion auto grâce à isResetting)
  if (sock) {
    try { (sock as any).ws?.close(); } catch {}
    sock = null;
    isConnected = false;
  }

  // 3. Relancer proprement après que le socket soit fermé
  setTimeout(() => {
    isResetting = false;
    connectToWhatsApp();
  }, 4000);

  console.log("🗑️  Session supprimée — nouveau QR dans ~4 secondes…");
  return res.json({ ok: true, message: "Reset effectué. Appelez /qr-ascii dans 8 secondes." });
});

app.post("/api/send", async (req, res) => {
  if (req.body.bot_secret !== BOT_SECRET) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  const { to_phone, code } = req.body as { to_phone?: string; code?: string };

  if (!to_phone || !code) {
    return res.status(400).json({ error: "to_phone et code sont requis" });
  }

  if (!isConnected) {
    return res.status(503).json({ error: "Bot WhatsApp non connecté, réessayez dans quelques secondes" });
  }

  try {
    // Normaliser le numéro : retirer le + et ajouter @s.whatsapp.net
    const jid = `${to_phone.replace(/^\+/, "")}@s.whatsapp.net`;
    const text =
      `🔐 Votre code NearYou : *${code}*\n\n` +
      `Entrez ce code sur l'application pour valider votre fiche.\n` +
      `⏱ Valable 15 minutes — ne le partagez pas.`;

    await sock!.sendMessage(jid, { text });
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
      console.log("\n📱 Scannez ce QR code avec WhatsApp (Appareils connectés → Connecter un appareil) :\n");
      qrcode.generate(qr, { small: true });
      console.log(`\n🌐 Ou ouvrez dans votre navigateur : https://<votre-domaine-railway>/qr\n`);
    }

    if (connection === "close") {
      sock = null;
      isConnected = false;
      if (isResetting) {
        // Reset en cours : connectToWhatsApp est déjà planifié depuis /reset
        return;
      }
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
      isConnected = true;
      lastQr = null;
      console.log("✅ Bot WhatsApp connecté et prêt à envoyer !");
    }
  });
}

connectToWhatsApp().catch(console.error);
