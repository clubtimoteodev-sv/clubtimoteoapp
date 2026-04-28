const API = import.meta.env.VITE_API_URL;

if (!API) {
  console.error(
    "[ClubTimoteo] ❌ VITE_API_URL no está definida. " +
    "Crea un archivo .env en la raíz con: VITE_API_URL=http://localhost:4000/api"
  );
}

export function getToken() {
  return localStorage.getItem("token");
}

export async function apiFetch(path, options = {}) {
  const token = getToken();

  let finalPath = path;
  const overrideId = localStorage.getItem("overrideDestacamentoId");
  if (overrideId && (!options.method || options.method === "GET")) {
    const divider = path.includes("?") ? "&" : "?";
    finalPath = `${path}${divider}destacamentoId=${overrideId}`;
  }

  const fetchOptions = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  };

  if (options.body && typeof options.body === "object") {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(API + finalPath, fetchOptions);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ msg: "Error" }));
    throw new Error(err.msg || "Error");
  }

  return res.json();
}
