import dotenv from "dotenv";
dotenv.config();

export function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Falta variable de entorno: ${name}`);
  return v;
}