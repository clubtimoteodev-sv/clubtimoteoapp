import { useState } from "react";
import { apiFetch } from "../services/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "./ui/card";
import { LogIn, Users, Eye, EyeOff, ShieldAlert, Send } from "lucide-react";
import { toast } from "sonner";

interface LoginProps {
  onLogin: (token: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para recuperación de cuenta bloqueada
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [showUnlockForm, setShowUnlockForm] = useState(false);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password
        })
      });

      // Guardamos el token
      localStorage.setItem("token", data.token);
      
      // AGREGADO: Si el backend envía la info del usuario, la guardamos
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      onLogin(data.token);

    } catch (err: any) {
      console.error("Login Error:", err);
      localStorage.removeItem("token");
      
      const errorMsg = err.message || 'Error desconocido';
      toast.error(errorMsg);

      // Detectar si el usuario está bloqueado
      if (errorMsg.toLowerCase().includes("bloqueado")) {
        setIsLockedOut(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 8) return toast.error("Por favor, ingresa un número válido");
    
    setLoading(true);
    try {
      // Endpoint público sin auth
      await apiFetch("/auth/request-unlock", {
        method: "POST",
        body: JSON.stringify({ email, phone, message })
      });
      toast.success("Solicitud enviada exitosamente. El administrador te contactará pronto.");
      setShowUnlockForm(false);
      setIsLockedOut(false);
      setPassword("");
    } catch (err: any) {
      toast.error(err.message || "Error al enviar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md border">

        <CardHeader className="space-y-1 pb-6">

          <div className="mb-6 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Club Timoteo Logo" 
              className="h-20 w-25 object-contain drop-shadow-sm"
              onError={(e) => {
                // Si la imagen no existe, mostramos un recuadro temporal amigable
                (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=Club+Timoteo&background=4f46e5&color=fff&size=256";
              }}
            />
          </div>

          <CardTitle className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-center text-2xl text-transparent">
            Club Timoteo APP
          </CardTitle>

          <CardDescription className="text-center">
            Sistema de Gestión de Exploradores
          </CardDescription>

        </CardHeader>

        {showUnlockForm ? (
          <form onSubmit={handleUnlockRequest}>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-800 mb-2">
                <strong>Cuenta bloqueada.</strong> Ingresa tus datos para solicitar el desbloqueo.
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-locked">Correo asociado</Label>
                <Input id="email-locked" type="email" value={email} disabled className="bg-gray-50 text-gray-500 h-11" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Número de Teléfono / WhatsApp</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Ej. 7777-7777"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="h-11"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensaje (Opcional)</Label>
                <textarea
                  id="message"
                  placeholder="Mensaje breve para el administrador..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full flex min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button type="submit" className="h-11 w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                <Send className="mr-2 h-4 w-4" />
                {loading ? "Enviando..." : "Enviar Solicitud"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowUnlockForm(false)} className="w-full" disabled={loading}>
                Volver al inicio de sesión
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">

              {isLockedOut && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex flex-col items-center text-center gap-2 mb-2">
                  <ShieldAlert className="text-red-500 h-8 w-8" />
                  <div>
                    <p className="text-sm font-bold text-red-800">Acceso Restringido</p>
                    <p className="text-xs text-red-600 mt-1">Tu cuenta ha sido bloqueada por seguridad tras varios intentos fallidos.</p>
                  </div>
                  <Button type="button" variant="outline" onClick={() => setShowUnlockForm(true)} className="mt-2 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800 h-9 text-xs w-full">
                    Solicitar Desbloqueo
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setIsLockedOut(false); }}
                  required
                  className="h-11"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    style={{ right: '0.875rem' }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">

              <Button
                type="submit"
                className="h-11 w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                disabled={loading}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {loading ? "Validando..." : "Iniciar sesión"}
              </Button>

            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}