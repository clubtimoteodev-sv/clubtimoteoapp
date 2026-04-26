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
import { LogIn, Users, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface LoginProps {
  onLogin: (token: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
      toast.error(err.message || 'Error desconocido');
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

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
      </Card>
    </div>
  );
}