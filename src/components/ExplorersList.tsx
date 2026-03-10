import { useState, useEffect } from "react";
import { apiFetch } from "../services/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { ArrowLeft, Search, UserPlus, Eye, FileText } from "lucide-react";

interface Explorer {
  id: string;
  codigoExplorador?: string | null;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  telefono: string;
  direccion: string;
  alergias?: string | null;
  medicinaControlada?: string | null;
  foto?: string | null;
  fotoUrl?: string | null;
  recetaUrl?: string | null;
  permisoUrl?: string | null;
  nombreResponsable: string;
  telefonoResponsable: string;
  aceptoCristo: boolean;
  bautizado: boolean;
  asisteCelula: boolean;
  nombreLiderCelula?: string | null;
}

interface ExplorersListProps {
  onBack: () => void;
  onViewExplorer: (explorerId: string) => void;
  onAddNew: () => void;
}

export function ExplorersList({ onBack, onViewExplorer, onAddNew }: ExplorersListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [explorers, setExplorers] = useState<Explorer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExplorers() {
      try {
        const data = await apiFetch("/api/explorers");
        setExplorers(data);
      } catch (err) {
        console.error("Error loading explorers:", err);
      } finally {
        setLoading(false);
      }
    }

    loadExplorers();
  }, []);

  const filteredExplorers = explorers.filter((explorer) => {
    const term = searchTerm.toLowerCase().trim();

    const haystack = [
      explorer.codigoExplorador || "",
      explorer.nombre || "",
      explorer.apellidos || "",
      `${explorer.nombre} ${explorer.apellidos}`,
      explorer.nombreResponsable || "",
      explorer.telefono || "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(term);
  });

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const getInitials = (nombre: string, apellidos: string) => {
    return `${nombre?.charAt(0) || ""}${apellidos?.charAt(0) || ""}`.toUpperCase();
  };

  const getPhotoSrc = (explorer: Explorer) => {
    const raw = explorer.fotoUrl || explorer.foto || null;
    if (!raw) return undefined;
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    return `http://localhost:4000${raw}`;
  };

  const getDocumentsStatus = (explorer: Explorer) => {
    const hasFoto = Boolean(explorer.fotoUrl || explorer.foto);
    const hasReceta = Boolean(explorer.recetaUrl);
    const hasPermiso = Boolean(explorer.permisoUrl);

    const total = [hasFoto, hasReceta, hasPermiso].filter(Boolean).length;

    if (total === 3) {
      return {
        label: "Docs completos",
        className: "bg-green-100 text-green-800 border-0",
      };
    }

    if (total >= 1) {
      return {
        label: `Faltan ${3 - total}`,
        className: "bg-amber-100 text-amber-800 border-0",
      };
    }

    return {
      label: "Sin documentos",
      className: "bg-red-100 text-red-800 border-0",
    };
  };

  if (loading) {
    return <div className="p-6">Cargando exploradores...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-gray-900">
                  Exploradores
                </p>
                <p className="text-xs text-muted-foreground">
                  {filteredExplorers.length} encontrado{filteredExplorers.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <Button size="sm" onClick={onAddNew} className="flex-shrink-0">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-5 pb-safe">
        <div className="mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre, código o responsable..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 pl-10"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredExplorers.map((explorer) => {
            const docsStatus = getDocumentsStatus(explorer);

            return (
              <Card
                key={explorer.id}
                className="cursor-pointer border border-gray-200 shadow-sm transition hover:bg-gray-50"
                onClick={() => onViewExplorer(explorer.id)}
              >
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start space-x-3">
                    <Avatar className="h-14 w-14 flex-shrink-0">
                      <AvatarImage src={getPhotoSrc(explorer)} alt={explorer.nombre} />
                      <AvatarFallback className="bg-gray-100 text-gray-700">
                        {getInitials(explorer.nombre, explorer.apellidos)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="mb-1 truncate text-sm font-medium text-gray-900">
                        {explorer.nombre} {explorer.apellidos}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {calculateAge(explorer.fechaNacimiento)} años
                      </p>

                      {explorer.codigoExplorador && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Código: {explorer.codigoExplorador}
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 flex-shrink-0 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewExplorer(explorer.id);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mb-3 space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
                    <p className="truncate">
                      <span className="font-medium text-muted-foreground">Tel:</span>{" "}
                      {explorer.telefono}
                    </p>
                    <p className="truncate">
                      <span className="font-medium text-muted-foreground">Responsable:</span>{" "}
                      {explorer.nombreResponsable}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className={docsStatus.className}>
                      <FileText className="mr-1 h-3 w-3" />
                      {docsStatus.label}
                    </Badge>

                    {explorer.aceptoCristo && (
                      <Badge variant="secondary" className="border-0 bg-green-100 text-xs text-green-800">
                        Cristo
                      </Badge>
                    )}

                    {explorer.bautizado && (
                      <Badge variant="secondary" className="border-0 bg-blue-100 text-xs text-blue-800">
                        Bautizado
                      </Badge>
                    )}

                    {explorer.asisteCelula && (
                      <Badge variant="secondary" className="border-0 bg-purple-100 text-xs text-purple-800">
                        Célula
                      </Badge>
                    )}

                    {(explorer.alergias || explorer.medicinaControlada) && (
                      <Badge variant="secondary" className="border-0 bg-amber-100 text-xs text-amber-800">
                        Info médica
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredExplorers.length === 0 && (
          <div className="py-12 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No se encontraron exploradores</p>
          </div>
        )}
      </main>
    </div>
  );
}

export type { Explorer };