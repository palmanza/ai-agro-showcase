import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, normalizeUrl, submitEntry } from "@/lib/catalog";

export function EntryForm({ onDone }: { onDone?: () => void }) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [contact, setContact] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      submitEntry({
        full_name: fullName.trim(),
        company: company.trim(),
        website: normalizeUrl(website),
        description: description.trim(),
        category: category || null,
        contact: contact.trim() || null,
      }),
    onSuccess: () => {
      toast.success("¡Listo! Tu entrada quedó en la cola para aprobación.");
      setFullName("");
      setCompany("");
      setWebsite("");
      setDescription("");
      setCategory("");
      setContact("");
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      onDone?.();
    },
    onError: () => toast.error("No pudimos enviar tu entrada. Probá de nuevo."),
  });

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!fullName.trim() || !company.trim() || description.trim().length < 10) {
          toast.error("Completá nombre, empresa y una descripción de al menos 10 caracteres.");
          return;
        }
        mutation.mutate();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="full_name">Tu nombre *</Label>
          <Input
            id="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Paul Almanza"
            maxLength={80}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="company">Empresa o proyecto *</Label>
          <Input
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="AgroBots"
            maxLength={80}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="website">Link a la web</Label>
          <Input
            id="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="miempresa.com"
            maxLength={200}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="category">Categoría</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Elegí una categoría" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">¿Qué hacen? *</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Contá en pocas líneas qué resolvés y para quién. Sin spam, bien concreto."
          rows={4}
          maxLength={600}
          required
        />
        <p className="text-xs text-muted-foreground">{description.length}/600</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="contact">Contacto (opcional)</Label>
        <Input
          id="contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Email, LinkedIn o WhatsApp"
          maxLength={120}
        />
      </div>

      <Button type="submit" size="lg" disabled={mutation.isPending}>
        {mutation.isPending ? "Enviando..." : "Sumarme al catálogo"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Tu entrada entra en una cola y se publica cuando el administrador la aprueba.
      </p>
    </form>
  );
}