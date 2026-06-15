"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProviderAdminActionsProps {
  providerId: string;
  isDisabled: boolean;
  initialData: {
    name: string;
    contact_phone: string;
    bio: string | null;
    address_label: string | null;
    available: boolean;
  };
}

export function ProviderAdminActions({ providerId, isDisabled, initialData }: ProviderAdminActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Champs du formulaire d'édition
  const [name, setName] = useState(initialData.name);
  const [phone, setPhone] = useState(initialData.contact_phone);
  const [bio, setBio] = useState(initialData.bio ?? "");
  const [address, setAddress] = useState(initialData.address_label ?? "");
  const [available, setAvailable] = useState(initialData.available);

  async function toggle(action: "enable" | "disable") {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/providers/${providerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) { toast.error("Erreur lors de la mise à jour"); return; }
      toast.success(action === "enable" ? "Fiche réactivée" : "Fiche désactivée");
      router.refresh();
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveEdit() {
    if (!name.trim() || !phone.trim()) {
      toast.error("Nom et téléphone sont obligatoires");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/providers/${providerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contact_phone: phone.trim(),
          bio: bio.trim() || undefined,
          address_label: address.trim() || undefined,
          available,
        }),
      });
      if (!res.ok) { toast.error("Erreur lors de la mise à jour"); return; }
      toast.success("Fiche mise à jour");
      setShowEdit(false);
      router.refresh();
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteProvider() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/providers/${providerId}`, {
        method: "DELETE",
      });
      if (!res.ok) { toast.error("Erreur lors de la suppression"); return; }
      toast.success("Fiche supprimée définitivement");
      router.refresh();
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  }

  const inputClass = "w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-primary)]";
  const inputStyle = {
    borderColor: "var(--color-border)",
    backgroundColor: "var(--color-bg)",
    color: "var(--color-text)",
  };

  return (
    <div className="space-y-3">
      {/* Boutons d'action principaux */}
      <div className="flex gap-2 flex-wrap">
        {isDisabled ? (
          <Button size="sm" onClick={() => toggle("enable")} disabled={isLoading}
            className="rounded-full text-xs"
            style={{ backgroundColor: "var(--color-success-light)", color: "var(--color-success)" }}>
            {isLoading ? "…" : "Réactiver"}
          </Button>
        ) : (
          <Button size="sm" onClick={() => toggle("disable")} disabled={isLoading}
            className="rounded-full text-xs"
            style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}>
            {isLoading ? "…" : "Désactiver"}
          </Button>
        )}

        <Button size="sm" onClick={() => { setShowEdit((v) => !v); setShowDeleteConfirm(false); }}
          disabled={isLoading}
          className="rounded-full text-xs"
          style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}>
          {showEdit ? "Annuler" : "Modifier"}
        </Button>

        <Button size="sm" onClick={() => { setShowDeleteConfirm((v) => !v); setShowEdit(false); }}
          disabled={isLoading}
          className="rounded-full text-xs"
          style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}>
          Supprimer
        </Button>
      </div>

      {/* Formulaire d'édition inline */}
      {showEdit && (
        <div className="rounded-2xl p-4 space-y-3"
          style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
          <p className="font-semibold text-xs" style={{ color: "var(--color-text-muted)" }}>
            MODIFIER LA FICHE
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Nom *</label>
              <input className={inputClass} style={inputStyle} value={name}
                onChange={(e) => setName(e.target.value)} placeholder="Nom du prestataire" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Téléphone *</label>
              <input className={inputClass} style={inputStyle} value={phone}
                onChange={(e) => setPhone(e.target.value)} placeholder="+229..." />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Adresse</label>
            <input className={inputClass} style={inputStyle} value={address}
              onChange={(e) => setAddress(e.target.value)} placeholder="Quartier, Ville" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Bio</label>
            <textarea className={inputClass} style={inputStyle} value={bio}
              onChange={(e) => setBio(e.target.value)} rows={2} placeholder="Description du prestataire" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={available}
              onChange={(e) => setAvailable(e.target.checked)} className="rounded" />
            <span className="text-sm" style={{ color: "var(--color-text)" }}>Disponible</span>
          </label>

          <Button size="sm" onClick={saveEdit} disabled={isLoading} className="rounded-full text-xs w-full"
            style={{ backgroundColor: "var(--color-primary)", color: "white" }}>
            {isLoading ? "Enregistrement…" : "Enregistrer les modifications"}
          </Button>
        </div>
      )}

      {/* Confirmation suppression */}
      {showDeleteConfirm && (
        <div className="rounded-2xl p-4 space-y-3"
          style={{ backgroundColor: "var(--color-error-light)", border: "1px solid var(--color-error)" }}>
          <p className="text-sm font-medium" style={{ color: "var(--color-error)" }}>
            Supprimer définitivement cette fiche ? Cette action est irréversible.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={deleteProvider} disabled={isLoading}
              className="rounded-full text-xs"
              style={{ backgroundColor: "var(--color-error)", color: "white" }}>
              {isLoading ? "…" : "Oui, supprimer"}
            </Button>
            <Button size="sm" onClick={() => setShowDeleteConfirm(false)}
              className="rounded-full text-xs"
              style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
