import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Session du prestataire propriétaire d'une fiche, émise côté serveur après
// la revendication (code WhatsApp vérifié). Seule autorité pour modifier une
// fiche : ni un en-tête, ni un champ envoyé par le client.
// Clé dédiée (PROVIDER_SESSION_SECRET), distincte de celle de l'admin.

const COOKIE_NAME = "provider_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 jours

export interface ProviderSession {
  phone: string;
  providerId: string;
}

const PLACEHOLDER_SECRET = "changeme_secret_aleatoire_32_chars";

function getSecret(): Uint8Array {
  const secret = process.env.PROVIDER_SESSION_SECRET;
  // Échec fermé : un secret absent, court ou recopié de .env.example
  // permettrait à n'importe qui de signer une session
  if (!secret || secret.length < 32 || secret === PLACEHOLDER_SECRET) {
    throw new Error("PROVIDER_SESSION_SECRET is missing or too weak");
  }
  return new TextEncoder().encode(secret);
}

export async function signProviderSession(session: ProviderSession): Promise<string> {
  return new SignJWT({ phone: session.phone, providerId: session.providerId, role: "provider" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyProviderSession(token: string): Promise<ProviderSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    if (
      payload.role !== "provider" ||
      typeof payload.phone !== "string" ||
      typeof payload.providerId !== "string"
    ) {
      return null;
    }
    return { phone: payload.phone, providerId: payload.providerId };
  } catch {
    return null;
  }
}

export async function getProviderSession(): Promise<ProviderSession | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyProviderSession(token);
}

export const PROVIDER_COOKIE_NAME = COOKIE_NAME;
export const PROVIDER_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
