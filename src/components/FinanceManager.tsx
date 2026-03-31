import { useEffect, useMemo, useState } from "react";
import { useIsDesktop } from "../hooks/useIsDesktop";
import { apiFetch } from "../services/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
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
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Calendar as CalendarIcon,
  Filter,
  Upload,
  X,
  Pencil,
  Trash2,
  Receipt,
  Search,
  Eye,
} from "lucide-react";
import { toast } from "sonner@2.0.3";

type MovementType = "entrada" | "salida";

interface Movement {
  id: string;
  type: MovementType;
  amount: number;
  category: string;
  description: string;
  date: string;
  recipient: string;
  receiptUrl?: string | null;
  createdAt?: string;
}

interface FinanceManagerProps {
  onBack: () => void;
}

const incomeCategories = ["Donaciones", "Eventos", "Inscripciones", "Ofrendas", "Otros"];
const expenseCategories = ["Material", "Alimentos", "Transporte", "Servicios", "Eventos", "Otros"];

const initialForm = {
  type: "entrada" as MovementType,
  amount: "",
  category: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
  recipient: "",
};

export function FinanceManager({ onBack }: FinanceManagerProps) {
  const isDesktop = useIsDesktop();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] = useState<"all" | MovementType>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedReceiptFile, setSelectedReceiptFile] = useState<File | null>(null);
  const [selectedReceiptName, setSelectedReceiptName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [newMovement, setNewMovement] = useState(initialForm);

  useEffect(() => {
    loadMovements();
  }, []);

  async function loadMovements() {
    try {
      setLoading(true);
      const data = await apiFetch("/finance");
      setMovements(data);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los movimientos");
    } finally {
      setLoading(false);
    }
  }

  const availableCategories =
    newMovement.type === "entrada" ? incomeCategories : expenseCategories;

  const allCategories = Array.from(
    new Set([...incomeCategories, ...expenseCategories])
  ).sort((a, b) => a.localeCompare(b));

  const filteredMovements = useMemo(() => {
    return movements
      .filter((m) => filterType === "all" || m.type === filterType)
      .filter((m) => filterCategory === "all" || m.category === filterCategory)
      .filter((m) => {
        if (!search.trim()) return true;
        const term = search.toLowerCase();
        return (
          m.description.toLowerCase().includes(term) ||
          m.recipient.toLowerCase().includes(term) ||
          m.category.toLowerCase().includes(term)
        );
      })
      .filter((m) => {
        const movementDate = new Date(m.date);
        movementDate.setHours(12, 0, 0, 0);

        if (startDate) {
          const from = new Date(startDate);
          from.setHours(0, 0, 0, 0);
          if (movementDate < from) return false;
        }

        if (endDate) {
          const to = new Date(endDate);
          to.setHours(23, 59, 59, 999);
          if (movementDate > to) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements, filterType, filterCategory, search, startDate, endDate]);

  const totalEntradas = filteredMovements
    .filter((m) => m.type === "entrada")
    .reduce((sum, m) => sum + Number(m.amount), 0);

  const totalSalidas = filteredMovements
    .filter((m) => m.type === "salida")
    .reduce((sum, m) => sum + Number(m.amount), 0);

  const balance = totalEntradas - totalSalidas;

  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const sameMonth = movements.filter((m) => {
      const d = new Date(m.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const entradas = sameMonth
      .filter((m) => m.type === "entrada")
      .reduce((sum, m) => sum + Number(m.amount), 0);

    const salidas = sameMonth
      .filter((m) => m.type === "salida")
      .reduce((sum, m) => sum + Number(m.amount), 0);

    return {
      entradas,
      salidas,
      balance: entradas - salidas,
    };
  }, [movements]);

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();

    filteredMovements
      .filter((m) => m.type === "salida")
      .forEach((m) => {
        map.set(m.category, (map.get(m.category) || 0) + Number(m.amount));
      });

    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredMovements]);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("es-SV", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-SV", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function resetForm() {
    setNewMovement(initialForm);
    setSelectedReceiptFile(null);
    setSelectedReceiptName("");
    setEditId(null);
  }

  function clearFilters() {
    setFilterType("all");
    setFilterCategory("all");
    setStartDate("");
    setEndDate("");
    setSearch("");
  }

  function openCreateDialog() {
    resetForm();
    setIsDialogOpen(true);
  }

  function openEditDialog(movement: Movement) {
    setEditId(movement.id);
    setNewMovement({
      type: movement.type,
      amount: String(movement.amount),
      category: movement.category,
      description: movement.description,
      date: movement.date.slice(0, 10),
      recipient: movement.recipient,
    });
    setSelectedReceiptFile(null);
    setSelectedReceiptName(movement.receiptUrl ? "Recibo ya guardado" : "");
    setIsDialogOpen(true);
  }

  async function uploadReceiptIfNeeded(): Promise<string | null> {
    if (!selectedReceiptFile) return null;

    const formData = new FormData();
    formData.append("file", selectedReceiptFile);

    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:4000/api/upload", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    if (!res.ok) {
      let msg = "Error subiendo recibo";
      try {
        const err = await res.json();
        msg = err.msg || msg;
      } catch {}
      throw new Error(msg);
    }

    const data = await res.json();
    return data.url || null;
  }

  async function handleSaveMovement(e: React.FormEvent) {
    e.preventDefault();

    const amount = Number(newMovement.amount);

    if (!newMovement.category.trim()) {
      toast.error("Selecciona una categoría");
      return;
    }

    if (!newMovement.description.trim()) {
      toast.error("Escribe una descripción");
      return;
    }

    if (!newMovement.recipient.trim()) {
      toast.error("Escribe el destinatario u origen");
      return;
    }

    if (!newMovement.date) {
      toast.error("Selecciona una fecha");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("El monto debe ser mayor que 0");
      return;
    }

    try {
      setIsSaving(true);

      let receiptUrl: string | null | undefined = undefined;

      if (selectedReceiptFile) {
        receiptUrl = await uploadReceiptIfNeeded();
      } else if (editId) {
        const existing = movements.find((m) => m.id === editId);
        receiptUrl = existing?.receiptUrl || null;
      } else {
        receiptUrl = null;
      }

      const payload = {
        type: newMovement.type,
        amount,
        category: newMovement.category,
        description: newMovement.description.trim(),
        date: newMovement.date,
        recipient: newMovement.recipient.trim(),
        receiptUrl,
      };

      if (editId) {
        await apiFetch(`/finance/${editId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Movimiento actualizado");
      } else {
        await apiFetch("/finance", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Movimiento agregado");
      }

      setIsDialogOpen(false);
      resetForm();
      await loadMovements();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Error guardando movimiento");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteMovement() {
    if (!deleteId) return;

    try {
      await apiFetch(`/finance/${deleteId}`, {
        method: "DELETE",
      });

      toast.success("Movimiento eliminado");
      setDeleteId(null);
      await loadMovements();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el movimiento");
    }
  }

  const activeFilterCount =
    (filterType !== "all" ? 1 : 0) +
    (filterCategory !== "all" ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0) +
    (search.trim() ? 1 : 0);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #ecfdf5 50%, #f0fdfa 100%)" }}>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* Inner header — only for desktop (mobile uses MobileHeader from App) */}
        {isDesktop && (
        <header style={{ background: "white", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={onBack}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.85rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: "0.875rem", color: "#475569", fontWeight: 500 }}
              >
                <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
                Volver
              </button>
              <div>
                <p style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>Finanzas</p>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Gestión de ingresos y gastos</p>
              </div>
            </div>

            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-emerald-600 to-teal-600"
                onClick={openCreateDialog}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo
              </Button>
            </DialogTrigger>
          </div>
        </header>
        )}

        {/* Mobile back + new button row */}
        {!isDesktop && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", gap: "0.5rem", borderBottom: "1px solid #e5e7eb", background: "white" }}>
            <button
              type="button"
              onClick={onBack}
              style={{ padding: "0.4rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#374151" }}
            >
              <ArrowLeft style={{ width: "0.9rem", height: "0.9rem" }} />
              Volver
            </button>
            <DialogTrigger asChild>
              <button
                type="button"
                onClick={openCreateDialog}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.9rem", borderRadius: "0.5rem", border: "none", background: "linear-gradient(to right, #059669, #0d9488)", color: "white", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
              >
                <Plus style={{ width: "0.9rem", height: "0.9rem" }} />
                Nuevo
              </button>
            </DialogTrigger>
          </div>
        )}

        <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar movimiento" : "Nuevo movimiento"}</DialogTitle>
            <DialogDescription>
              Registra ingresos, gastos y recibos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveMovement} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={newMovement.type}
                onValueChange={(value: MovementType) =>
                  setNewMovement((prev) => ({
                    ...prev,
                    type: value,
                    category: "",
                  }))
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="salida">Salida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={newMovement.amount}
                  onChange={(e) =>
                    setNewMovement((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  placeholder="0.00"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  value={newMovement.category}
                  onValueChange={(value) =>
                    setNewMovement((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={newMovement.description}
                onChange={(e) =>
                  setNewMovement((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe el movimiento"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={newMovement.date}
                  onChange={(e) =>
                    setNewMovement((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label>{newMovement.type === "entrada" ? "Origen" : "Destinatario"}</Label>
                <Input
                  value={newMovement.recipient}
                  onChange={(e) =>
                    setNewMovement((prev) => ({ ...prev, recipient: e.target.value }))
                  }
                  placeholder={newMovement.type === "entrada" ? "Ej. Donante" : "Ej. Librería"}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Recibo</Label>
              <label className="flex items-center justify-center gap-2 border rounded-md h-11 cursor-pointer px-3">
                <Upload className="w-4 h-4" />
                <span className="text-sm truncate">
                  {selectedReceiptName || "Subir recibo"}
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedReceiptFile(file);
                    setSelectedReceiptName(file?.name || "");
                  }}
                />
              </label>

              {selectedReceiptName ? (
                <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                  <span className="text-xs truncate">{selectedReceiptName}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedReceiptFile(null);
                      setSelectedReceiptName("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600"
                disabled={isSaving}
              >
                {isSaving ? "Guardando..." : editId ? "Actualizar" : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <main style={{ padding: isDesktop ? "1.25rem 1.5rem" : "0.75rem 0.75rem" }} className="space-y-4">
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumen general</CardTitle>
            <CardDescription className="text-xs">
              Totales según los filtros actuales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "1fr", gap: "0.75rem" }}>
              <div className="rounded-xl border bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Entradas</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(totalEntradas)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Salidas</p>
                    <p className="text-lg font-semibold text-red-600">
                      {formatCurrency(totalSalidas)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Balance general</p>
                    <p className={`text-lg font-semibold ${balance >= 0 ? "text-slate-900" : "text-red-700"}`}>
                      {formatCurrency(balance)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-slate-700" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumen del mes</CardTitle>
            <CardDescription className="text-xs">
              Vista rápida del mes actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "1fr", gap: "0.75rem" }}>
              <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                <p className="text-xs text-muted-foreground">Entradas mes</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(currentMonthStats.entradas)}
                </p>
              </div>

              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs text-muted-foreground">Salidas mes</p>
                <p className="text-lg font-semibold text-red-600">
                  {formatCurrency(currentMonthStats.salidas)}
                </p>
              </div>

              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="text-xs text-muted-foreground">Balance mes</p>
                <p className={`text-lg font-semibold ${currentMonthStats.balance >= 0 ? "text-slate-900" : "text-red-700"}`}>
                  {formatCurrency(currentMonthStats.balance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border">
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600" />
              <div>
                <CardTitle className="text-base">Filtros</CardTitle>
                <CardDescription className="text-xs">
                  {activeFilterCount > 0 ? `${activeFilterCount} filtros activos` : "Buscar por fecha, categoría o tipo"}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: isFiltersOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                >
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </Button>
            </div>
          </div>

          {isFiltersOpen && (
            <CardContent className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label className="text-xs">Buscar</Label>
                <div className="relative">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por descripción, categoría o destinatario"
                    className="pl-9 h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={filterType} onValueChange={(value: "all" | MovementType) => setFilterType(value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="entrada">Entradas</SelectItem>
                      <SelectItem value="salida">Salidas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              <div className="space-y-2">
                <Label className="text-xs">Categoría</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {allCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Desde</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Hasta</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                {filteredMovements.length} movimiento(s) · {activeFilterCount} filtro(s)
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar
              </Button>
            </div>
          </CardContent>
          )}
        </Card>

        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Movimientos</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Cargando movimientos...
              </div>
            ) : filteredMovements.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Aún no hay movimientos para mostrar
                </p>
                <Button variant="outline" onClick={openCreateDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar movimiento
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {filteredMovements.map((movement) => (
                  <div key={movement.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge
                            variant="secondary"
                            className={
                              movement.type === "entrada"
                                ? "bg-green-100 text-green-800 text-xs"
                                : "bg-red-100 text-red-800 text-xs"
                            }
                          >
                            {movement.type === "entrada" ? "Entrada" : "Salida"}
                          </Badge>

                          <Badge variant="outline" className="text-xs">
                            {movement.category}
                          </Badge>

                          {movement.receiptUrl ? (
                            <Badge variant="outline" className="text-xs">
                              <Receipt className="w-3 h-3 mr-1" />
                              Recibo
                            </Badge>
                          ) : null}
                        </div>

                        <p className="text-sm mb-1 break-words font-medium">
                          {movement.description}
                        </p>

                        <p className="text-xs text-muted-foreground mb-1">
                          {movement.recipient}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarIcon className="w-3 h-3" />
                          <span>{formatDate(movement.date)}</span>
                        </div>

                        {movement.receiptUrl ? (
                          <div className="mt-3">
                            <a
                              href={`http://localhost:4000${movement.receiptUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-xs text-emerald-700 hover:underline"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Ver recibo
                            </a>
                          </div>
                        ) : null}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p
                          className={`text-base font-medium ${
                            movement.type === "entrada" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {movement.type === "entrada" ? "+" : "-"}
                          {formatCurrency(Number(movement.amount))}
                        </p>

                        <div className="flex items-center justify-end gap-1 mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(movement)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(movement.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
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
            <AlertDialogTitle>Eliminar movimiento</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMovement}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}