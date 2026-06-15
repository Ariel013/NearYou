-- Migration 005 : système de revendication via WhatsApp
-- Remplace le flow OTP SMS par un flow wa.me + bot WhatsApp

CREATE TABLE whatsapp_claims (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token          TEXT UNIQUE NOT NULL,                          -- ex: GS-A1B2C3D4
  phone          TEXT NOT NULL,                                 -- contact_phone de la fiche à revendiquer
  provider_id    UUID REFERENCES providers(id) ON DELETE SET NULL,
  whatsapp_from  TEXT,                                          -- numéro WA de l'expéditeur (rempli par le bot)
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'verified', 'expired', 'used')),
  expires_at     TIMESTAMPTZ NOT NULL,
  verified_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX whatsapp_claims_token_idx  ON whatsapp_claims(token);
CREATE INDEX whatsapp_claims_phone_idx  ON whatsapp_claims(phone);
CREATE INDEX whatsapp_claims_status_idx ON whatsapp_claims(status);

-- RLS : lecture publique bloquée, seul le service role accède
ALTER TABLE whatsapp_claims ENABLE ROW LEVEL SECURITY;
