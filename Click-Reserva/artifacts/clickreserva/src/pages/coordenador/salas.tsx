import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetRooms, useCreateRoom, useUpdateRoom, useDeleteRoom, getGetRoomsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MonitorPlay, Plus, Trash2, Pencil } from "lucide-react";

const roomSchema = z.object({
  number: z.string().min(1, "Número é obrigatório"),
  name: z.string().min(2, "Nome é obrigatório"),
  capacity: z.coerce.number().min(1, "Capacidade inválida"),
  computers: z.coerce.number().min(1, "Número de computadores inválido"),
  description: z.string().optional(),
});

type RoomForm = z.infer<typeof roomSchema>;

export function CoordinatorRoomsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const { data: rooms, isLoading } = useGetRooms();
  const createMutation = useCreateRoom();
  const updateMutation = useUpdateRoom();
  const deleteMutation = useDeleteRoom();

  const form = useForm<RoomForm>({
    resolver: zodResolver(roomSchema),
    defaultValues: { number: "", name: "", capacity: 30, computers: 20, description: "" },
  });

  function openNew() {
    form.reset({ number: "", name: "", capacity: 30, computers: 20, description: "" });
    setEditId(null);
    setOpen(true);
  }

  function openEdit(r: any) {
    form.reset({ number: r.number, name: r.name, capacity: r.capacity, computers: r.computers, description: r.description ?? "" });
    setEditId(r.id);
    setOpen(true);
  }

  function onSubmit(values: RoomForm) {
    const data = { ...values, isActive: true };
    if (editId) {
      updateMutation.mutate({ roomId: editId, data }, {
        onSuccess: () => {
          toast({ title: "Sala atualizada com sucesso!" });
          queryClient.invalidateQueries({ queryKey: getGetRoomsQueryKey() });
          setOpen(false);
        },
        onError: () => toast({ title: "Erro ao atualizar sala.", variant: "destructive" })
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "Sala cadastrada com sucesso!" });
          queryClient.invalidateQueries({ queryKey: getGetRoomsQueryKey() });
          setOpen(false);
        },
        onError: (err: any) => toast({ title: err?.error?.message ?? "Erro ao cadastrar.", variant: "destructive" })
      });
    }
  }

  function handleDelete(id: number, name: string) {
    if (!confirm(`Remover a sala "${name}"? Reservas existentes podem ser afetadas.`)) return;
    deleteMutation.mutate({ roomId: id }, {
      onSuccess: () => {
        toast({ title: "Sala removida." });
        queryClient.invalidateQueries({ queryKey: getGetRoomsQueryKey() });
      }
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Salas</h1>
          <p className="text-muted-foreground mt-1">Cadastre e configure os laboratórios de informática.</p>
        </div>
        <Button onClick={openNew} data-testid="button-add-sala">
          <Plus className="h-4 w-4 mr-2" /> Nova Sala
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Sala" : "Cadastrar Sala"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="number" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identificador</FormLabel>
                    <FormControl><Input placeholder="LAB-05" data-testid="input-sala-number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="capacity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade</FormLabel>
                    <FormControl><Input type="number" data-testid="input-sala-capacity" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da sala</FormLabel>
                  <FormControl><Input placeholder="Laboratório de Informática 5" data-testid="input-sala-name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="computers" render={({ field }) => (
                <FormItem>
                  <FormLabel>Computadores</FormLabel>
                  <FormControl><Input type="number" data-testid="input-sala-computers" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl><Input placeholder="Recursos disponíveis..." data-testid="input-sala-description" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-sala">
                {(createMutation.isPending || updateMutation.isPending) ? "Salvando..." : (editId ? "Atualizar" : "Cadastrar")}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-20 bg-muted rounded-lg animate-pulse"/>)}</div>
      ) : (
        <div className="space-y-3">
          {(rooms ?? []).map(r => (
            <Card key={r.id} className="hover:shadow-sm transition-shadow" data-testid={`card-sala-${r.id}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <MonitorPlay className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{r.number} — {r.name}</p>
                    <p className="text-sm text-muted-foreground">{r.computers} computadores • {r.capacity} lugares</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(r)} data-testid={`button-edit-sala-${r.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(r.id, r.name)} disabled={deleteMutation.isPending}
                    data-testid={`button-delete-sala-${r.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
