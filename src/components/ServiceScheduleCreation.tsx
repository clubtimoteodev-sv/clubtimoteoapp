import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { ArrowLeft, Plus, Trash2, Pencil, CalendarDays, Users } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface Explorer {
  id: string;
  nombre: string;
  apellidos: string;
  fotoUrl?: string | null;
}

interface ServiceGroupMemberApi {
  id: string;
  explorerId: string;
  explorer: Explorer;
}

interface ServiceGroupApi {
  id: string;
  date: string;
  day: string;
  createdAt: string;
  members: ServiceGroupMemberApi[];
}

interface ServiceScheduleCreationProps {
  onBack: () => void;
}

const initialForm = {
  date: new Date().toISOString().split("T")[0],
  day: "",
};

export function ServiceScheduleCreation({ onBack }: ServiceScheduleCreationProps) {
  const [explorers, setExplorers] = useState<Explorer[]>([]);
  const [groups, setGroups] = useState<ServiceGroupApi[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState(initialForm);
  const [selectedMembers, setSelectedMembers] = useState<Record<string, boolean>>({});
  const [editId, setEditId] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);

      const [explorersData, groupsData] = await Promise.all([
        apiFetch("/explorers"),
        apiFetch("/service-groups"),
      ]);

      setExplorers(explorersData);
      setGroups(groupsData);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  }

  const selectedMemberIds = useMemo(
    () =>
      Object.entries(selectedMembers)
        .filter(([, checked]) => checked)
        .map(([id]) => id),
    [selectedMembers]
  );

  function getInitials(nombre: string, apellidos: string) {
    return `${nombre?.charAt(0) || ""}${apellidos?.charAt(0) || ""}`.toUpperCase();
  }

  function resetForm() {
    setForm(initialForm);
    setSelectedMembers({});
    setEditId(null);
  }

  function openCreateDialog() {
    resetForm();
    setIsDialogOpen(true);
  }

  function openEditDialog(group: ServiceGroupApi) {
    const membersMap: Record<string, boolean> = {};

    group.members.forEach((member) => {
      membersMap[member.explorerId] = true;
    });

    setEditId(group.id);
    setForm({
      date: group.date.slice(0, 10),
      day: group.day,
    });
    setSelectedMembers(membersMap);
    setIsDialogOpen(true);
  }

  function toggleMember(explorerId: string, checked: boolean) {
    setSelectedMembers((prev) => ({
      ...prev,
      [explorerId]: checked,
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!form.day.trim()) {
      toast.error("Escribe el día o nombre del servicio");
      return;
    }

    if (!form.date) {
      toast.error("Selecciona una fecha");
      return;
    }

    if (selectedMemberIds.length === 0) {
      toast.error("Selecciona al menos un explorador");
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        date: form.date,
        day: form.day.trim(),
        memberIds: selectedMemberIds,
      };

      if (editId) {
        await apiFetch(`/service-groups/${editId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Grupo actualizado");
      } else {
        await apiFetch("/service-groups", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Grupo creado");
      }

      setIsDialogOpen(false);
      resetForm();
      await loadAll();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar el grupo");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;

    try {
      await apiFetch(`/service-groups/${deleteId}`, {
        method: "DELETE",
      });

      toast.success("Grupo eliminado");
      setDeleteId(null);
      await loadAll();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el grupo");
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("es-SV", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-sky-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2 min-w-0">
              <Button variant="ghost" size="sm" onClick={onBack} className="!text-slate-700">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <p className="text-base bg-gradient-to-r from-cyan-600 to-sky-600 bg-clip-text text">
                  Creación de Servicio
                </p>
                <p className="text-xs text-muted-foreground">
                  Crea grupos y asigna exploradores
                </p>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="!text-white !bg-gradient-to-r !from-cyan-600 !to-sky-600 hover:!from-cyan-700 hover:!to-sky-700 border-0 shadow-sm"
                  onClick={openCreateDialog}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>{editId ? "Editar grupo" : "Nuevo grupo de servicio"}</DialogTitle>
                  <DialogDescription>
                    Selecciona fecha, nombre del servicio y miembros.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Fecha</Label>
                      <Input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Día / Nombre</Label>
                      <Input
                        value={form.day}
                        onChange={(e) => setForm((prev) => ({ ...prev, day: e.target.value }))}
                        placeholder="Ej. Domingo, Sábado AM, Servicio especial"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Exploradores</Label>
                      <Badge variant="outline" className="text-xs">
                        Seleccionados: {selectedMemberIds.length}
                      </Badge>
                    </div>

                    <div className="max-h-80 overflow-y-auto border rounded-xl bg-white">
                      {explorers.length === 0 ? (
                        <div className="p-4">
                          <p className="text-sm text-muted-foreground">
                            No hay exploradores registrados.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {explorers.map((explorer) => {
                            const checked = selectedMembers[explorer.id] || false;

                            return (
                              <label
                                key={explorer.id}
                                className="flex items-center justify-between gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-sky-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                                    {getInitials(explorer.nombre, explorer.apellidos)}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {explorer.nombre} {explorer.apellidos}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      Explorador
                                    </p>
                                  </div>
                                </div>

                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(value) =>
                                    toggleMember(explorer.id, value === true)
                                  }
                                />
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 !text-slate-700"
                      disabled={isSaving}
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>

                    <Button
                      type="submit"
                      className="flex-1 !text-white !bg-gradient-to-r !from-cyan-600 !to-sky-600 hover:!from-cyan-700 hover:!to-sky-700 disabled:opacity-60 border-0 shadow-sm"
                      disabled={isSaving}
                    >
                      {isSaving ? "Guardando..." : editId ? "Actualizar" : "Guardar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="px-4 py-5 pb-safe space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Grupos</p>
                <p className="text-xl font-semibold">{groups.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-cyan-700" />
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Exploradores</p>
                <p className="text-xl font-semibold">{explorers.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-sky-700" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Grupos creados</CardTitle>
            <CardDescription className="text-xs">
              Administra los grupos de servicio
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Cargando grupos...
              </div>
            ) : groups.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Aún no hay grupos creados
                </p>
                <Button
                  variant="outline"
                  onClick={openCreateDialog}
                  className="!text-slate-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear grupo
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {groups.map((group) => (
                  <div key={group.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant="secondary" className="bg-cyan-100 text-cyan-800">
                            {group.day}
                          </Badge>
                          <Badge variant="outline">{formatDate(group.date)}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {group.members.length} miembros
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {group.members.map((member) => (
                            <Badge key={member.id} variant="outline" className="text-xs">
                              {member.explorer.nombre} {member.explorer.apellidos}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(group)}
                          className="!text-slate-700"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(group.id)}
                          className="!text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar grupo</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el grupo y sus miembros asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}