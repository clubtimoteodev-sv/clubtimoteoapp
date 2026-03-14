import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

type Meeting = {
  id: string;
  date: string;
  type: string;
};

type CalendarViewProps = {
  onTakeAttendance: (meetingId: string) => void;
};

function formatDateTimeLocal(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("es-SV", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function CalendarView({ onTakeAttendance }: CalendarViewProps) {

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [form, setForm] = useState({
    date: formatDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    type: ""
  });

  const loadMeetings = async () => {
    try {
      setLoading(true);

      const data = await apiFetch("/calendar/upcoming");

      setMeetings(Array.isArray(data) ? data : []);

    } catch (error) {
      console.error("Error cargando reuniones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.type.trim() || !form.date) return;

    try {
      setSaving(true);

      await apiFetch("/calendar/meetings", {
        method: "POST",
        body: JSON.stringify(form)
      });

      setForm({
        date: formatDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        type: ""
      });

      await loadMeetings();

    } catch (error) {
      console.error("Error creando reunión:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar reunión?")) return;

    try {

      await apiFetch(`/calendar/meetings/${id}`, {
        method: "DELETE"
      });

      await loadMeetings();

    } catch (error) {
      console.error("Error eliminando reunión:", error);
    }
  };

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Calendario
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Crear y administrar reuniones del club
        </p>
      </div>

      {/* FORMULARIO */}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

        <h2 className="text-lg font-semibold text-gray-900">
          Nueva reunión
        </h2>

        <form onSubmit={handleCreate} className="mt-5 grid gap-4 md:grid-cols-3">

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tipo de reunión
            </label>

            <input
              type="text"
              value={form.type}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, type: e.target.value }))
              }
              placeholder="Ej. Reunión general"
              className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Fecha y hora
            </label>

            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, date: e.target.value }))
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar reunión"}
            </button>
          </div>

        </form>

      </div>

      {/* LISTA DE REUNIONES */}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

        <h2 className="text-lg font-semibold text-gray-900">
          Próximas reuniones
        </h2>

        <div className="mt-5 space-y-3">

          {loading ? (
            <p className="text-sm text-gray-500">Cargando...</p>

          ) : meetings.length === 0 ? (
            <p className="text-sm text-gray-500">
              No hay reuniones registradas.
            </p>

          ) : (
            meetings.map((meeting) => (

              <div
                key={meeting.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 py-4"
              >

                <div>
                  <p className="font-medium text-gray-900">
                    {meeting.type}
                  </p>

                  <p className="text-sm text-gray-500">
                    {formatDate(meeting.date)}
                  </p>
                </div>

                <div className="flex gap-2">

                  <button
                    onClick={() => onTakeAttendance(meeting.id)}
                    className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
                  >
                    Tomar asistencia
                  </button>

                  <button
                    onClick={() => handleDelete(meeting.id)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Eliminar
                  </button>

                </div>

              </div>

            ))
          )}

        </div>

      </div>

    </div>
  );
}
