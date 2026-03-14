import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Meeting = {
  id: string;
  date: string;
  type: string;
};

type CalendarViewProps = {
  onTakeAttendance: (meetingId: string) => void;
};

function formatDateTimeLocal(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  const h = `${date.getHours()}`.padStart(2, "0");
  const min = `${date.getMinutes()}`.padStart(2, "0");

  return `${y}-${m}-${d}T${h}:${min}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getMeetingColor(type: string) {
  const t = type.toLowerCase();

  if (t.includes("general")) return "bg-blue-100 text-blue-700";
  if (t.includes("campamento")) return "bg-green-100 text-green-700";
  if (t.includes("especial")) return "bg-purple-100 text-purple-700";

  return "bg-gray-100 text-gray-700";
}

export function CalendarView({ onTakeAttendance }: CalendarViewProps) {

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const [form, setForm] = useState({
    date: formatDateTimeLocal(new Date(Date.now() + 86400000)),
    type: ""
  });

  const loadMeetings = async () => {
    try {
      const data = await apiFetch("/calendar/upcoming");
      setMeetings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.type.trim()) return;

    try {
      setSaving(true);

      await apiFetch("/calendar/meetings", {
        method: "POST",
        body: JSON.stringify(form)
      });

      setForm({
        date: formatDateTimeLocal(new Date(Date.now() + 86400000)),
        type: ""
      });

      loadMeetings();

    } catch (e) {
      console.error(e);
      alert("No se pudo crear la reunión");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {

      await apiFetch(`/calendar/meetings/${id}`, {
        method: "DELETE"
      });

      loadMeetings();

    } catch (e) {
      console.error(e);
    }
  };

  const startOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );

  const startDay = startOfMonth.getDay();

  const days: Date[] = [];

  for (let i = 0; i < 42; i++) {
    const d = new Date(startOfMonth);
    d.setDate(i - startDay + 1);
    days.push(d);
  }

  const meetingsOfDay = selectedDay
    ? meetings.filter(m => sameDay(new Date(m.date), selectedDay))
    : [];

  const monthName = currentMonth.toLocaleString("es-SV", {
    month: "long",
    year: "numeric"
  });

  const today = new Date();

  return (

    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold">Calendario</h1>
        <p className="text-sm text-gray-500">
          Gestión de reuniones del club
        </p>
      </div>

      {/* CREAR */}

      <div className="rounded-2xl border bg-white p-6 shadow-sm">

        <h2 className="font-semibold mb-4">Crear reunión</h2>

        <form onSubmit={handleCreate} className="flex gap-3 flex-wrap">

          <input
            type="text"
            value={form.type}
            onChange={e =>
              setForm(p => ({ ...p, type: e.target.value }))
            }
            placeholder="Tipo de reunión"
            className="border rounded-xl px-4 py-2"
          />

          <input
            type="datetime-local"
            value={form.date}
            onChange={e =>
              setForm(p => ({ ...p, date: e.target.value }))
            }
            className="border rounded-xl px-4 py-2"
          />

          <button
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl"
          >
            {saving ? "Guardando..." : "Crear"}
          </button>

        </form>

      </div>

      {/* HEADER CALENDARIO */}

      <div className="flex items-center justify-between">

        <button
          onClick={() =>
            setCurrentMonth(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1
              )
            )
          }
        >
          <ChevronLeft />
        </button>

        <h2 className="text-lg font-semibold capitalize">
          {monthName}
        </h2>

        <button
          onClick={() =>
            setCurrentMonth(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1
              )
            )
          }
        >
          <ChevronRight />
        </button>

      </div>

      {/* CALENDARIO */}

      <div className="grid grid-cols-7 gap-2">

        {days.map(day => {

          const dayMeetings = meetings.filter(m =>
            sameDay(new Date(m.date), day)
          );

          return (

            <div
              key={day.toISOString()}
              onClick={() => setSelectedDay(day)}
              className={`
              min-h-[90px] p-2 rounded-xl border cursor-pointer
              ${sameDay(day, today) ? "ring-2 ring-blue-500" : ""}
              `}
            >

              <div className="text-sm font-medium">
                {day.getDate()}
              </div>

              <div className="mt-1 space-y-1">

                {dayMeetings.slice(0,2).map(m => (

                  <div
                    key={m.id}
                    className={`text-xs px-2 py-1 rounded ${getMeetingColor(m.type)}`}
                  >
                    {m.type}
                  </div>

                ))}

              </div>

            </div>

          );

        })}

      </div>

      {/* DETALLE DIA */}

      {selectedDay && (

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <h2 className="font-semibold mb-4">
            Reuniones del {selectedDay.toLocaleDateString()}
          </h2>

          {meetingsOfDay.length === 0 && (
            <p className="text-sm text-gray-500">
              No hay reuniones este día
            </p>
          )}

          <div className="space-y-3">

            {meetingsOfDay.map(m => (

              <div
                key={m.id}
                className="border rounded-xl p-4 flex justify-between"
              >

                <div>

                  <p className="font-medium">
                    {m.type}
                  </p>

                  <p className="text-sm text-gray-500">
                    {new Date(m.date).toLocaleTimeString()}
                  </p>

                </div>

                <div className="flex gap-3">

                  <button
                    onClick={() => onTakeAttendance(m.id)}
                    className="text-blue-600 text-sm"
                  >
                    Asistencia
                  </button>

                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-red-600 text-sm"
                  >
                    Eliminar
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

      )}

    </div>

  );
}
