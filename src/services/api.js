const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

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

  const res = await fetch(API + finalPath, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ msg: "Error" }));
    throw new Error(err.msg || "Error");
  }

  return res.json();
}
