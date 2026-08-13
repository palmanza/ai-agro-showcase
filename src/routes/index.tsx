import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EntryForm } from "@/components/EntryForm";
import { CATEGORIES, fetchApprovedEntries, prettyUrl } from "@/lib/catalog";

const TITLE = "Catálogo IA + Agro — comunidad de productores y asesores";
const DESCRIPTION =
  "Catálogo abierto de la comunidad de IA y automatización aplicada al agro. Sumá tu nombre, tu empresa, tu web y qué hacés.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["entries", "approved"],
    queryFn: fetchApprovedEntries,
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesCategory = !activeCategory || entry.category === activeCategory;
      const matchesTerm =
        !term ||
        [entry.full_name, entry.company, entry.description, entry.category ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(term);
      return matchesCategory && matchesTerm;
    });
  }, [entries, search, activeCategory]);

  const usedCategories = useMemo(
    () => CATEGORIES.filter((c) => entries.some((e) => e.category === c)),
    [entries],
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="relative overflow-hidden bg-hero-gradient text-primary-foreground">
        <div className="absolute inset-0 opacity-[0.14] [background-image:repeating-linear-gradient(115deg,transparent_0_26px,currentColor_26px_27px)]" />
        <div className="relative mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1 text-xs font-medium tracking-wide uppercase">
              IA + Agro · Comunidad
            </span>
            <Link
              to="/admin"
              className="text-xs text-primary-foreground/70 underline-offset-4 hover:underline"
            >
              Admin
            </Link>
          </div>

          <h1 className="mt-8 max-w-3xl text-4xl leading-[1.05] font-bold sm:text-6xl">
            El catálogo de quiénes somos y qué hacemos
          </h1>
          <p className="mt-5 max-w-2xl text-base text-primary-foreground/80 sm:text-lg">
            Comunidad para productores, asesores y gente del agro que está usando —o quiere
            empezar a usar— inteligencia artificial y automatización. Acá compartimos
            herramientas, prompts, agentes y casos reales. Sin spam.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <a href="#sumarme">Sumarme al catálogo</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <a href="#catalogo">Ver el catálogo ({entries.length})</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-14">
        <section id="catalogo" className="scroll-mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">Catálogo de servicios</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {entries.length} {entries.length === 1 ? "entrada aprobada" : "entradas aprobadas"}
              </p>
            </div>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, empresa o servicio"
              className="w-full sm:w-72"
            />
          </div>

          {usedCategories.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              <CategoryChip
                label="Todas"
                active={activeCategory === null}
                onClick={() => setActiveCategory(null)}
              />
              {usedCategories.map((category) => (
                <CategoryChip
                  key={category}
                  label={category}
                  active={activeCategory === category}
                  onClick={() =>
                    setActiveCategory(activeCategory === category ? null : category)
                  }
                />
              ))}
            </div>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {isLoading &&
              [0, 1, 2, 3].map((i) => (
                <div key={i} className="h-44 animate-pulse rounded-xl border bg-muted/50" />
              ))}

            {!isLoading &&
              filtered.map((entry) => (
                <article
                  key={entry.id}
                  className="shadow-soft hover:shadow-lift group rounded-xl border bg-card p-6 transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{entry.company}</h3>
                      <p className="text-sm text-muted-foreground">{entry.full_name}</p>
                    </div>
                    {entry.category && <Badge variant="secondary">{entry.category}</Badge>}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-foreground/85">
                    {entry.description}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    {entry.website && (
                      <a
                        href={entry.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {prettyUrl(entry.website)}
                      </a>
                    )}
                    {entry.contact && (
                      <span className="text-muted-foreground">{entry.contact}</span>
                    )}
                  </div>
                </article>
              ))}
          </div>

          {!isLoading && filtered.length === 0 && (
            <div className="mt-8 rounded-xl border border-dashed p-12 text-center">
              <p className="font-medium">Todavía no hay entradas publicadas acá.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sé el primero: completá el formulario de abajo.
              </p>
            </div>
          )}
        </section>

        <section id="sumarme" className="mt-20 scroll-mt-8">
          <div className="shadow-soft rounded-2xl border bg-card p-6 sm:p-10">
            <div className="mb-8 max-w-xl">
              <h2 className="text-2xl font-semibold sm:text-3xl">Sumate al catálogo</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Dejá tu nombre, tu empresa, el link a tu web y qué hacen. Lo revisamos y lo
                publicamos.
              </p>
            </div>
            <EntryForm />
          </div>
        </section>
      </main>

      <footer className="border-t py-10 text-center text-sm text-muted-foreground">
        Hecho para la comunidad de IA + Agro · compartir, aprender y construir.
      </footer>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
