import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteEntry,
  fetchAllEntries,
  prettyUrl,
  setEntryStatus,
  updateEntry,
  type Entry,
  type EntryStatus,
} from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Cola de entradas — Catálogo IA + Agro" },
      { name: "description", content: "Panel para aprobar entradas del catálogo IA + Agro." },
      { property: "og:title", content: "Cola de entradas — Catálogo IA + Agro" },
      { property: "og:description", content: "Panel de moderación del catálogo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<EntryStatus>("pending");

  const { data: isAdmin, isLoading: checkingRole } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      return Boolean(data);
    },
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["entries", "all"],
    queryFn: fetchAllEntries,
    enabled: isAdmin === true,
  });

  const claimAdmin = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("claim_first_admin");
      if (error) throw error;
      return data as boolean;
    },
    onSuccess: (granted) => {
      if (granted) {
        toast.success("Listo, ahora sos administrador.");
        queryClient.invalidateQueries();
      } else {
        toast.error("Ya existe un administrador en este catálogo.");
      }
    },
    onError: () => toast.error("No pudimos asignarte el rol."),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EntryStatus }) =>
      setEntryStatus(id, status),
    onSuccess: () => {
      toast.success("Entrada actualizada.");
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
    onError: () => toast.error("No se pudo actualizar."),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteEntry(id),
    onSuccess: () => {
      toast.success("Entrada eliminada.");
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
    onError: () => toast.error("No se pudo eliminar."),
  });

  const counts = {
    pending: entries.filter((e) => e.status === "pending").length,
    approved: entries.filter((e) => e.status === "approved").length,
    rejected: entries.filter((e) => e.status === "rejected").length,
  };
  const visible = entries.filter((e) => e.status === tab);

  if (checkingRole) {
    return <div className="p-10 text-sm text-muted-foreground">Cargando...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="shadow-soft max-w-md rounded-2xl border bg-card p-8 text-center">
          <h1 className="text-xl font-semibold">Todavía no sos administrador</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Si sos quien creó el catálogo, reclamá el rol de administrador. Solo funciona si
            aún no hay ninguno asignado.
          </p>
          <div className="mt-6 grid gap-2">
            <Button onClick={() => claimAdmin.mutate()} disabled={claimAdmin.isPending}>
              Reclamar rol de administrador
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-xl font-semibold">Cola del catálogo</h1>
            <p className="text-sm text-muted-foreground">
              {counts.pending} pendientes · {counts.approved} publicadas
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/">Ver catálogo</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
            >
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <Tabs value={tab} onValueChange={(value) => setTab(value as EntryStatus)}>
          <TabsList>
            <TabsTrigger value="pending">Pendientes ({counts.pending})</TabsTrigger>
            <TabsTrigger value="approved">Aprobadas ({counts.approved})</TabsTrigger>
            <TabsTrigger value="rejected">Rechazadas ({counts.rejected})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-6 grid gap-4">
          {isLoading && <p className="text-sm text-muted-foreground">Cargando entradas...</p>}
          {!isLoading && visible.length === 0 && (
            <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
              No hay entradas en esta pestaña.
            </div>
          )}
          {visible.map((entry) => (
            <AdminEntryCard
              key={entry.id}
              entry={entry}
              onStatus={(status) => statusMutation.mutate({ id: entry.id, status })}
              onDelete={() => removeMutation.mutate(entry.id)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function AdminEntryCard({
  entry,
  onStatus,
  onDelete,
}: {
  entry: Entry;
  onStatus: (status: EntryStatus) => void;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(entry.full_name);
  const [company, setCompany] = useState(entry.company);
  const [website, setWebsite] = useState(entry.website ?? "");
  const [description, setDescription] = useState(entry.description);

  useEffect(() => {
    setFullName(entry.full_name);
    setCompany(entry.company);
    setWebsite(entry.website ?? "");
    setDescription(entry.description);
  }, [entry]);

  const save = useMutation({
    mutationFn: () =>
      updateEntry(entry.id, {
        full_name: fullName.trim(),
        company: company.trim(),
        website: website.trim() || null,
        description: description.trim(),
      }),
    onSuccess: () => {
      toast.success("Cambios guardados.");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
    onError: () => toast.error("No se pudo guardar."),
  });

  return (
    <article className="shadow-soft rounded-xl border bg-card p-6">
      {editing ? (
        <div className="grid gap-3">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input value={company} onChange={(e) => setCompany(e.target.value)} />
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
              Guardar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">{entry.company}</h2>
              <p className="text-sm text-muted-foreground">{entry.full_name}</p>
            </div>
            {entry.category && <Badge variant="secondary">{entry.category}</Badge>}
          </div>
          <p className="mt-3 text-sm leading-relaxed">{entry.description}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
            {entry.website && (
              <a
                href={entry.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                {prettyUrl(entry.website)}
              </a>
            )}
            {entry.contact && <span>{entry.contact}</span>}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {entry.status !== "approved" && (
              <Button size="sm" onClick={() => onStatus("approved")}>
                Aprobar
              </Button>
            )}
            {entry.status !== "rejected" && (
              <Button size="sm" variant="outline" onClick={() => onStatus("rejected")}>
                Rechazar
              </Button>
            )}
            {entry.status !== "pending" && (
              <Button size="sm" variant="outline" onClick={() => onStatus("pending")}>
                Volver a la cola
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Editar
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={onDelete}>
              Eliminar
            </Button>
          </div>
        </>
      )}
    </article>
  );
}