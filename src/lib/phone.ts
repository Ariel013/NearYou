import { parsePhoneNumberWithError } from "libphonenumber-js";

/**
 * Normalise un numéro brut en format E.164.
 *
 * - Accepte le format international avec ou sans espaces/tirets (+225 07 56 89 04 77)
 * - Exige le préfixe `+` (format international obligatoire)
 * - Pour les anciens numéros CI à 8 chiffres locaux (+22556890477), retourne tel quel
 *   si libphonenumber-js ne peut pas les analyser — ils existent encore sur WhatsApp
 *
 * Throws une erreur lisible par l'utilisateur si le numéro est réellement invalide.
 */
export function normalizePhoneE164(raw: string): string {
  const cleaned = raw.trim().replace(/[\s\-\.\(\)]/g, "");

  if (!cleaned.startsWith("+")) {
    throw new Error(
      "Préfixe international manquant. Exemple : +225 07 56 89 04 77"
    );
  }

  try {
    return parsePhoneNumberWithError(cleaned).format("E.164");
  } catch {
    // Fallback pour les numéros légitimes non reconnus par libphonenumber
    // (ex : anciens numéros CI à 8 chiffres encore actifs sur WhatsApp)
    if (/^\+[1-9]\d{6,14}$/.test(cleaned)) {
      return cleaned;
    }
    throw new Error(`Numéro invalide : vérifiez le format international (ex : +225 07 56 89 04 77)`);
  }
}

/**
 * Tente la normalisation E.164 sans lever d'exception.
 * Retourne le numéro original si la normalisation échoue.
 * Utile pour les données existantes en base.
 */
export function safeNormalizePhoneE164(raw: string): string {
  try {
    return normalizePhoneE164(raw);
  } catch {
    return raw.trim();
  }
}

/** Supprime le `+` pour construire un lien wa.me (ex: +225... → 225...) */
export function formatWaMe(e164: string): string {
  return e164.replace(/^\+/, "");
}

/**
 * Détecte un ancien numéro CI (+225 + 8 chiffres locaux = 12 chars au total).
 * Ex: +22556890477 — format pré-réforme 2015 encore présent sur WhatsApp.
 */
export function isCILegacyNumber(phone: string): boolean {
  return /^\+225\d{8}$/.test(phone);
}

/**
 * Pour un ancien numéro CI à 8 chiffres, génère les deux variantes modernes
 * possibles (préfixe 07 ou 05) car la correspondance ancienne → nouvelle
 * n'est pas déterministe depuis notre côté.
 *
 * Ex: +22556890477 → ["+2250756890477", "+2250556890477"]
 */
export function getCILegacyAlternates(legacyPhone: string): string[] {
  if (!isCILegacyNumber(legacyPhone)) return [];
  const local8 = legacyPhone.slice(4); // retire +225
  return [`+22507${local8}`, `+22505${local8}`];
}
