import { supabase } from "@/integrations/supabase/client";

export type EntryStatus = "pending" | "approved" | "rejected";

export type Entry = {
  id: string;
  full_name: string;
  company: string;
  website: string | null;
  description: string;
  category: string | null;
  contact: string | null;
  status: EntryStatus;
  created_at: string;
};

export const CATEGORIES = [
  "Agentes de IA",
  "Automatizaciones",
  "Datos y análisis",
  "Software agro",
  "Consultoría / Asesoría",
  "Maquinaria y campo",
  "Formación",
  "Otro",
] as const;

export type NewEntry = {
  full_name: string;
  company: string;
  website: string | null;
  description: string;
  category: string | null;
  contact: string | null;
};

export async function fetchApprovedEntries(): Promise<Entry[]> {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Entry[];
}

export async function fetchAllEntries(): Promise<Entry[]> {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Entry[];
}

export async function submitEntry(entry: NewEntry) {
  const { error } = await supabase.from("entries").insert({ ...entry, status: "pending" });
  if (error) throw error;
}

export async function setEntryStatus(id: string, status: EntryStatus) {
  const { error } = await supabase.from("entries").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function updateEntry(id: string, patch: Partial<NewEntry>) {
  const { error } = await supabase.from("entries").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteEntry(id: string) {
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw error;
}

export function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}
