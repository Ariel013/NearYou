import { Suspense } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import { ProviderAdminActions } from "./ProviderAdminActions";
import { AdminProviderFilters } from "./AdminProviderFilters";

const PAGE_SIZE = 20;

interface Category { id: string; name: string; slug: string }

interface ProviderRow {
  id: string;
  name: string;
  contact_phone: string;
  bio: string | null;
  address_label: string | null;
  available: boolean;
  avg_rating: number;
  review_count: number;
  claimed_at: string | null;
  verified_at: string | null;
  disabled_at: string | null;
  created_at: string;
  provider_categories: { categories: Category | null }[];
}

export default async function AdminProvidersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const { q, category: categorySlug, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr || "1"));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createServiceClient();

  // Fetch all categories for filter chips
  const { data: allCats } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name");
  const categories: Category[] = allCats ?? [];

  // Resolve category slug → provider IDs filter
  const categoryId = categorySlug
    ? categories.find((c) => c.slug === categorySlug)?.id ?? null
    : null;

  let providerIdFilter: string[] | null = null;
  if (categoryId) {
    const { data: pcRows } = await supabase
      .from("provider_categories")
      .select("provider_id")
      .eq("category_id", categoryId);
    providerIdFilter = (pcRows ?? []).map((r: { provider_id: string }) => r.provider_id);
  }

  // Short-circuit: category exists but has no providers
  let providers: ProviderRow[] = [];
  let totalCount = 0;
  let fetchError = false;

  const emptyCategory = providerIdFilter !== null && providerIdFilter.length === 0;

  if (!emptyCategory) {
    let query = supabase
      .from("providers")
      .select(
        "id, name, contact_phone, bio, address_label, available, avg_rating, review_count, claimed_at, verified_at, disabled_at, created_at, provider_categories(categories(id, name, slug))",
        { count: "exact" },
      )
      .order("disabled_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (q?.trim()) {
      const term = q.trim();
      query = query.or(
        `name.ilike.%${term}%,contact_phone.ilike.%${term}%,address_label.ilike.%${term}%`,
      );
    }

    if (providerIdFilter !== null) {
      query = query.in("id", providerIdFilter);
    }

    const { data, count, error } = await query.range(from, to);
    if (!error) {
      providers = (data ?? []) as unknown as ProviderRow[];
      totalCount = count ?? 0;
    } else {
      fetchError = true;
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const activeLabel = categories.find((c) => c.slug === categorySlug)?.name;

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1
          className="font-bold"
          style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)" }}
        >
          Prestataires
        </h1>
        <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
          {totalCount} résultat{totalCount !== 1 ? "s" : ""}
          {activeLabel && ` · ${activeLabel}`}
          {q && ` · « ${q} »`}
        </span>
      </div>

      {fetchError && (
        <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)" }}>
          Erreur lors du chargement.
        </p>
      )}

      {/* Filtres (barre de recherche + chips catégories) */}
      <Suspense>
        <AdminProviderFilters
          categories={categories}
          currentCategory={categorySlug ?? null}
          currentQ={q ?? null}
        />
      </Suspense>

      {/* Liste */}
      {providers.length === 0 ? (
        <p
          className="py-8 text-center"
          style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}
        >
          Aucun prestataire trouvé.
        </p>
      ) : (
        <section className="space-y-3">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </section>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <PaginationLinks
          page={page}
          totalPages={totalPages}
          q={q}
          categorySlug={categorySlug}
        />
      )}
    </div>
  );
}

// ─── ProviderCard ─────────────────────────────────────────────────────────────

function ProviderCard({ provider: p }: { provider: ProviderRow }) {
  const isDisabled = !!p.disabled_at;
  const providerCategories = p.provider_categories
    .map((pc) => pc.categories)
    .filter((c): c is Category => c !== null);

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        backgroundColor: "var(--color-surface)",
        boxShadow: "var(--shadow-sm)",
        borderLeft: `3px solid ${isDisabled ? "var(--color-error)" : "var(--color-success)"}`,
        opacity: isDisabled ? 0.85 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0 space-y-1">
          {/* Nom + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`/providers/${p.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline"
              style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}
            >
              {p.name}
            </a>
            {p.claimed_at && (
              <ShieldCheck
                size={14}
                style={{ color: "var(--color-primary)" }}
                aria-label="Fiche revendiquée"
              />
            )}
            {isDisabled && (
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: "var(--color-error-light)",
                  color: "var(--color-error)",
                }}
              >
                Désactivée
              </span>
            )}
          </div>

          {/* Infos */}
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
            {p.contact_phone} · ⭐ {Number(p.avg_rating).toFixed(1)} ({p.review_count} avis)
          </p>

          {p.address_label && (
            <p style={{ color: "var(--color-text-light)", fontSize: "var(--text-xs)" }}>
              {p.address_label}
            </p>
          )}

          <p style={{ color: "var(--color-text-light)", fontSize: "var(--text-xs)" }}>
            Créée le {new Date(p.created_at).toLocaleDateString("fr-FR")}
          </p>

          {/* Catégories */}
          {providerCategories.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {providerCategories.map((cat) => (
                <span
                  key={cat.id}
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: "var(--color-primary-light)",
                    color: "var(--color-primary)",
                  }}
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          {isDisabled ? (
            <XCircle size={18} style={{ color: "var(--color-error)" }} />
          ) : (
            <CheckCircle size={18} style={{ color: "var(--color-success)" }} />
          )}
        </div>
      </div>

      <ProviderAdminActions
        providerId={p.id}
        isDisabled={isDisabled}
        initialData={{
          name: p.name,
          contact_phone: p.contact_phone,
          bio: p.bio,
          address_label: p.address_label,
          available: p.available,
        }}
      />
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function PaginationLinks({
  page,
  totalPages,
  q,
  categorySlug,
}: {
  page: number;
  totalPages: number;
  q?: string;
  categorySlug?: string;
}) {
  function buildUrl(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categorySlug) params.set("category", categorySlug);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `?${s}` : "?";
  }

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  const linkStyle = (disabled: boolean) => ({
    backgroundColor: "var(--color-surface)" as const,
    color: disabled ? "var(--color-text-muted)" : "var(--color-primary)",
    border: "1px solid var(--color-border)",
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? ("none" as const) : ("auto" as const),
  });

  return (
    <div className="flex items-center justify-between gap-4 pt-2">
      <a
        href={prevDisabled ? undefined : buildUrl(page - 1)}
        aria-disabled={prevDisabled}
        className="rounded-full px-4 py-2 text-xs font-medium transition-opacity"
        style={linkStyle(prevDisabled)}
      >
        ← Précédent
      </a>

      <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
        Page {page} / {totalPages}
      </span>

      <a
        href={nextDisabled ? undefined : buildUrl(page + 1)}
        aria-disabled={nextDisabled}
        className="rounded-full px-4 py-2 text-xs font-medium transition-opacity"
        style={linkStyle(nextDisabled)}
      >
        Suivant →
      </a>
    </div>
  );
}
