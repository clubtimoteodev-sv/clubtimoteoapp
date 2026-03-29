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
import { LogIn, Users } from "lucide-react";

interface LoginProps {
  onLogin: (token: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    } catch (err) {
      localStorage.removeItem("token");
      alert("Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md border">

        <CardHeader className="space-y-1 pb-6">

          <div className="mb-6 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>

          <CardTitle className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-center text-2xl text-transparent">
            Bienvenido
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
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
                disabled={loading}
              />
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

            <p className="text-center text-sm text-muted-foreground">
              ¿Olvidaste tu contraseña?{" "}
              <a href="#" className="text-indigo-600">
                Recuperar
              </a>
            </p>

          </CardFooter>
        </form>
      </Card>
    </div>
  );
}