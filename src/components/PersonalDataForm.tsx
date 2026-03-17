import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Separator } from "./ui/separator";
import { ArrowLeft, Upload, User, FileText, Phone, Church, Shield } from "lucide-react";

interface PersonalDataFormProps {
  onBack: () => void;
}

export function PersonalDataForm({ onBack }: PersonalDataFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [recetaPreview, setRecetaPreview] = useState<string | null>(null);
  const [permisoPreview, setPermisoPreview] = useState<string | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [recetaFile, setRecetaFile] = useState<File | null>(null);
  const [permisoFile, setPermisoFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    codigoExplorador: "",
    nombre: "",
    apellidos: "",
    fechaNacimiento: "",
    direccion: "",
    telefono: "",
    alergias: "",
    medicinaControlada: "",
    estudia: "",
    nivelEducativo: "",
    nombreResponsable: "",
    telefonoResponsable: "",
    aceptoCristo: "",
    bautizado: "",
    asisteCelula: "",
    nombreLiderCelula: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRecetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRecetaFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setRecetaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePermisoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPermisoFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPermisoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadSingleFile = async (file: File, token: string) => {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("http://localhost:4000/api/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: fd,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.msg || data?.error || "Error al subir archivo");
    }

    return data?.url || data?.fileUrl || data?.path || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        alert("No hay token. Inicia sesión otra vez.");
        return;
      }

      let fotoUrl: string | null = null;
      let recetaUrl: string | null = null;
      let permisoUrl: string | null = null;

      if (photoFile) {
        fotoUrl = await uploadSingleFile(photoFile, token);
      }

      if (recetaFile) {
        recetaUrl = await uploadSingleFile(recetaFile, token);
      }

      if (permisoFile) {
        permisoUrl = await uploadSingleFile(permisoFile, token);
      }

      const payload = {
        codigoExplorador: formData.codigoExplorador,
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        fechaNacimiento: formData.fechaNacimiento,
        direccion: formData.direccion,
        telefono: formData.telefono,
        alergias: formData.alergias || null,
        medicinaControlada: formData.medicinaControlada || null,
        estudia: formData.estudia === "si",
        nivelEducativo: formData.estudia === "si" ? formData.nivelEducativo || null : null,
        nombreResponsable: formData.nombreResponsable,
        telefonoResponsable: formData.telefonoResponsable,
        aceptoCristo: formData.aceptoCristo === "si",
        bautizado: formData.bautizado === "si",
        asisteCelula: formData.asisteCelula === "si",
        nombreLiderCelula:
          formData.asisteCelula === "si" ? formData.nombreLiderCelula || null : null,
        fotoUrl,
        recetaUrl,
        permisoUrl,
      };

      const res = await fetch("http://localhost:4000/api/explorers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Error creando explorador:", data);
        alert(data?.msg || data?.error || "Error al guardar explorador");
        return;
      }

      alert("Explorador guardado correctamente");

      setFormData({
        codigoExplorador: "",
        nombre: "",
        apellidos: "",
        fechaNacimiento: "",
        direccion: "",
        telefono: "",
        alergias: "",
        medicinaControlada: "",
        estudia: "",
        nivelEducativo: "",
        nombreResponsable: "",
        telefonoResponsable: "",
        aceptoCristo: "",
        bautizado: "",
        asisteCelula: "",
        nombreLiderCelula: "",
      });

      setPhotoFile(null);
      setRecetaFile(null);
      setPermisoFile(null);
      setPhotoPreview(null);
      setRecetaPreview(null);
      setPermisoPreview(null);

      onBack();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const sectionTitle = "text-lg font-semibold text-gray-900";
  const sectionDescription = "text-sm text-gray-500";
  const inputClass = "h-11";
  const radioItemClass =
    "flex items-center space-x-2 rounded-xl border border-gray-200 px-3 py-3";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div>
              <p className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-base text-transparent">
                Registro de explorador
              </p>

              <p className="text-xs text-muted-foreground">
                Completa la información personal, familiar y eclesiástica
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-5 pb-safe">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className={sectionTitle}>Datos personales</CardTitle>
                  <CardDescription className={sectionDescription}>
                    Información general del explorador.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-gray-400" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Fotografía</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Sube una foto del explorador para identificarlo fácilmente.
                  </p>

                  <input
                    type="file"
                    id="photo"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3"
                    onClick={() => document.getElementById("photo")?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {photoPreview ? "Cambiar foto" : "Subir foto"}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="codigoExplorador">Código de Explorador *</Label>
                  <Input
                    id="codigoExplorador"
                    value={formData.codigoExplorador}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9-]/g, "");
                      const formatted = value
                        .replace(/-/g, "")
                        .substring(0, 6)
                        .replace(/^(\d{3})(\d)/, "$1-$2");
                      handleInputChange("codigoExplorador", formatted);
                    }}
                    placeholder="000-000"
                    maxLength={7}
                    required
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-500">Formato: 000-000</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaNacimiento">Fecha de Nacimiento *</Label>
                  <Input
                    id="fechaNacimiento"
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={(e) => handleInputChange("fechaNacimiento", e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                    placeholder="Ingrese el nombre"
                    required
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellidos">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    value={formData.apellidos}
                    onChange={(e) => handleInputChange("apellidos", e.target.value)}
                    placeholder="Ingrese los apellidos"
                    required
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange("telefono", e.target.value)}
                    placeholder="+503 0000-0000"
                    required
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección *</Label>
                  <Textarea
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => handleInputChange("direccion", e.target.value)}
                    placeholder="Calle, número, colonia, ciudad"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alergias">Alergias</Label>
                  <Textarea
                    id="alergias"
                    value={formData.alergias}
                    onChange={(e) => handleInputChange("alergias", e.target.value)}
                    placeholder="Especifique alergias"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicinaControlada">Medicina Controlada</Label>
                  <Textarea
                    id="medicinaControlada"
                    value={formData.medicinaControlada}
                    onChange={(e) => handleInputChange("medicinaControlada", e.target.value)}
                    placeholder="Medicamentos regulares"
                    rows={3}
                  />
                </div>
              </div>

              {formData.medicinaControlada && (
                <>
                  <Separator />

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm font-medium text-gray-900">Foto de receta médica</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Adjunta la receta para respaldar el tratamiento.
                      </p>

                      {recetaPreview && (
                        <div className="mt-4 h-36 overflow-hidden rounded-xl border border-gray-200 bg-white">
                          <img
                            src={recetaPreview}
                            alt="Receta"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}

                      <input
                        type="file"
                        id="receta"
                        accept="image/*"
                        onChange={handleRecetaChange}
                        className="hidden"
                      />

                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4 w-full"
                        onClick={() => document.getElementById("receta")?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {recetaPreview ? "Cambiar receta" : "Subir receta"}
                      </Button>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm font-medium text-gray-900">
                        Documento de permiso firmado
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Permiso del padre o tutor para manejo de medicina controlada.
                      </p>

                      {permisoPreview && (
                        <div className="mt-4 h-36 overflow-hidden rounded-xl border border-gray-200 bg-white">
                          <img
                            src={permisoPreview}
                            alt="Permiso"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}

                      <input
                        type="file"
                        id="permiso"
                        accept="image/*,application/pdf"
                        onChange={handlePermisoChange}
                        className="hidden"
                      />

                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4 w-full"
                        onClick={() => document.getElementById("permiso")?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {permisoPreview ? "Cambiar documento" : "Subir documento"}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-900">
                    ¿Estudia actualmente? *
                  </Label>
                  <RadioGroup
                    value={formData.estudia}
                    onValueChange={(value) => handleInputChange("estudia", value)}
                    className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
                  >
                    <div className={radioItemClass}>
                      <RadioGroupItem value="si" id="estudia-si" />
                      <Label htmlFor="estudia-si" className="cursor-pointer">
                        Sí
                      </Label>
                    </div>

                    <div className={radioItemClass}>
                      <RadioGroupItem value="no" id="estudia-no" />
                      <Label htmlFor="estudia-no" className="cursor-pointer">
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.estudia === "si" && (
                  <div>
                    <Label className="text-sm font-medium text-gray-900">
                      Nivel Educativo *
                    </Label>
                    <RadioGroup
                      value={formData.nivelEducativo}
                      onValueChange={(value) => handleInputChange("nivelEducativo", value)}
                      className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
                    >
                      <div className={radioItemClass}>
                        <RadioGroupItem value="parvularia" id="nivel-parvularia" />
                        <Label htmlFor="nivel-parvularia" className="cursor-pointer">
                          Parvularia
                        </Label>
                      </div>

                      <div className={radioItemClass}>
                        <RadioGroupItem value="basica" id="nivel-basica" />
                        <Label htmlFor="nivel-basica" className="cursor-pointer">
                          Básica
                        </Label>
                      </div>

                      <div className={radioItemClass}>
                        <RadioGroupItem value="media" id="nivel-media" />
                        <Label htmlFor="nivel-media" className="cursor-pointer">
                          Media
                        </Label>
                      </div>

                      <div className={radioItemClass}>
                        <RadioGroupItem value="superior" id="nivel-superior" />
                        <Label htmlFor="nivel-superior" className="cursor-pointer">
                          Superior
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className={sectionTitle}>Datos familiares</CardTitle>
                  <CardDescription className={sectionDescription}>
                    Contacto responsable y de emergencia.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombreResponsable">Nombre del Responsable *</Label>
                <Input
                  id="nombreResponsable"
                  value={formData.nombreResponsable}
                  onChange={(e) => handleInputChange("nombreResponsable", e.target.value)}
                  placeholder="Nombre completo"
                  required
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefonoResponsable">Teléfono del Responsable *</Label>
                <Input
                  id="telefonoResponsable"
                  type="tel"
                  value={formData.telefonoResponsable}
                  onChange={(e) => handleInputChange("telefonoResponsable", e.target.value)}
                  placeholder="+503 0000-0000"
                  required
                  className={inputClass}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                  <Church className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className={sectionTitle}>Datos eclesiásticos</CardTitle>
                  <CardDescription className={sectionDescription}>
                    Información espiritual y de participación.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-900">
                  ¿Aceptó a Cristo en su corazón? *
                </Label>
                <RadioGroup
                  value={formData.aceptoCristo}
                  onValueChange={(value) => handleInputChange("aceptoCristo", value)}
                  className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  <div className={radioItemClass}>
                    <RadioGroupItem value="si" id="aceptoCristo-si" />
                    <Label htmlFor="aceptoCristo-si" className="cursor-pointer">
                      Sí
                    </Label>
                  </div>

                  <div className={radioItemClass}>
                    <RadioGroupItem value="no" id="aceptoCristo-no" />
                    <Label htmlFor="aceptoCristo-no" className="cursor-pointer">
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-900">
                  ¿Bautizado en agua? *
                </Label>
                <RadioGroup
                  value={formData.bautizado}
                  onValueChange={(value) => handleInputChange("bautizado", value)}
                  className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  <div className={radioItemClass}>
                    <RadioGroupItem value="si" id="bautizado-si" />
                    <Label htmlFor="bautizado-si" className="cursor-pointer">
                      Sí
                    </Label>
                  </div>

                  <div className={radioItemClass}>
                    <RadioGroupItem value="no" id="bautizado-no" />
                    <Label htmlFor="bautizado-no" className="cursor-pointer">
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-900">
                  ¿Asiste a célula? *
                </Label>
                <RadioGroup
                  value={formData.asisteCelula}
                  onValueChange={(value) => handleInputChange("asisteCelula", value)}
                  className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  <div className={radioItemClass}>
                    <RadioGroupItem value="si" id="asisteCelula-si" />
                    <Label htmlFor="asisteCelula-si" className="cursor-pointer">
                      Sí
                    </Label>
                  </div>

                  <div className={radioItemClass}>
                    <RadioGroupItem value="no" id="asisteCelula-no" />
                    <Label htmlFor="asisteCelula-no" className="cursor-pointer">
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.asisteCelula === "si" && (
                <>
                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="nombreLiderCelula">Nombre del Líder de Célula *</Label>
                    <Input
                      id="nombreLiderCelula"
                      value={formData.nombreLiderCelula}
                      onChange={(e) => handleInputChange("nombreLiderCelula", e.target.value)}
                      placeholder="Nombre completo del líder"
                      required={formData.asisteCelula === "si"}
                      className={inputClass}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className={sectionTitle}>Acciones</CardTitle>
                  <CardDescription className={sectionDescription}>
                    Guarda el registro o cancela para volver.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="h-11 flex-1"
                >
                  Cancelar
                </Button>

                <Button type="submit" className="h-11 flex-1" disabled={loading}>
                  <FileText className="mr-2 h-4 w-4" />
                  {loading ? "Guardando..." : "Guardar explorador"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}
