import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import "../admin.css";
import {
  getBarberFreeSlots,
  getBarberReservations,
  getBarberToday,
  rescheduleBarberReservation,
  updateBarberProfile,
  updateBarberReservationStatus,
  type BarberReservationItem,
  type BarberTodayResponse,
} from "../services/barberPanelService";

type StoredUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  birthday?: string | null;
  role?: string;
  barberId?: number | null;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Ha ocurrido un error";
}

function getStatusLabel(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "confirmed") return "Confirmada";
  if (normalized === "completed") return "Completada";
  if (normalized === "cancelled") return "Cancelada";
  if (normalized === "pending") return "Pendiente";

  return status;
}

function formatCurrency(value: number) {
  return `${value.toFixed(2)}€`;
}

export default function BarberPanelPage() {
  const token = localStorage.getItem("token") || "";
  const rawUser = localStorage.getItem("user");

  let user: StoredUser | null = null;

  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    user = null;
  }

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [todayData, setTodayData] = useState<BarberTodayResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [reservations, setReservations] = useState<BarberReservationItem[]>([]);
  const [freeSlots, setFreeSlots] = useState<string[]>([]);
  const [profileImageUrl, setProfileImageUrl] = useState("");

  const todayDate = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  async function reloadTodayData(targetDate?: string) {
    const dateToUse = targetDate || todayDate;

    const [today, reservationsByDate, freeSlotsResponse] = await Promise.all([
      getBarberToday(token),
      getBarberReservations(token, dateToUse),
      getBarberFreeSlots(token, dateToUse),
    ]);

    setTodayData(today);
    setReservations(reservationsByDate);
    setFreeSlots(freeSlotsResponse.freeSlots);
    setProfileImageUrl(today.barber?.imageUrl || "");
    setSelectedDate(dateToUse);
  }

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setPageError("");
        await reloadTodayData(todayDate);
      } catch (error) {
        setPageError(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    }

    if (token && user?.role === "Barber") {
      void loadData();
    }
  }, [token, user?.role, todayDate]);

  async function handleDateChange(value: string) {
    try {
      setPageError("");
      setPageSuccess("");
      setLoading(true);

      const [reservationsByDate, freeSlotsResponse] = await Promise.all([
        getBarberReservations(token, value),
        getBarberFreeSlots(token, value),
      ]);

      setReservations(reservationsByDate);
      setFreeSlots(freeSlotsResponse.freeSlots);
      setSelectedDate(value);
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(
    reservationId: number,
    status: "Pending" | "Confirmed" | "Completed" | "Cancelled"
  ) {
    try {
      setPageError("");
      setPageSuccess("");

      await updateBarberReservationStatus(token, reservationId, status);
      await reloadTodayData(selectedDate || todayDate);

      setPageSuccess("Estado actualizado correctamente");
    } catch (error) {
      setPageError(getErrorMessage(error));
    }
  }

  async function handleReschedule(reservation: BarberReservationItem) {
    const newDate = window.prompt(
      "Nueva fecha (YYYY-MM-DD)",
      reservation.date || selectedDate || todayDate
    );

    if (!newDate) return;

    const newTime = window.prompt("Nueva hora (HH:mm)", reservation.time);

    if (!newTime) return;

    try {
      setPageError("");
      setPageSuccess("");

      await rescheduleBarberReservation(token, reservation.id, {
        date: newDate,
        time: newTime,
      });

      await reloadTodayData(selectedDate || todayDate);
      setPageSuccess("Reserva reprogramada correctamente");
    } catch (error) {
      setPageError(getErrorMessage(error));
    }
  }

  async function handleSaveProfileImage() {
    try {
      setPageError("");
      setPageSuccess("");

      const result = await updateBarberProfile(token, {
        imageUrl: profileImageUrl.trim(),
      });

      setTodayData((current) =>
        current?.barber
          ? {
              ...current,
              barber: {
                ...current.barber,
                imageUrl: result.imageUrl,
              },
            }
          : current
      );
      setProfileImageUrl(result.imageUrl);
      setPageSuccess("Foto del barbero actualizada correctamente");
    } catch (error) {
      setPageError(getErrorMessage(error));
    }
  }

  if (!token || !user) {
    return <Navigate to="/reservar?view=auth" replace />;
  }

  if (user.role !== "Barber") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app admin-dashboard">
      <header className="topbar">
        <div className="container nav">
          <div className="brand">
            <div className="brand-logo">
              <img
                src="/assets/logo-la-guarida.png"
                alt="La Guarida"
                className="brand-logo-img"
              />
            </div>
            <div>
              <div className="brand-title">Panel del Barbero</div>
              <div className="brand-subtitle">Agenda de {user.name}</div>
            </div>
          </div>

          <div className="admin-top-actions">
            <span className="admin-user-badge">{user.name}</span>

            <Link
              to="/"
              className="btn btn-secondary barber-back-link"
              onClick={() => {
                window.scrollTo(0, 0);
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
              }}
            >
              <img
                src="/assets/flecha-izquierda.png"
                alt="Volver"
                className="barber-back-icon"
              />
              <span>Volver</span>
            </Link>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="container">
          {pageError ? <p className="error-text admin-page-error">{pageError}</p> : null}
          {pageSuccess ? <div className="success-box">{pageSuccess}</div> : null}

          {loading && !todayData ? (
            <div className="booking-box">
              <h3>Cargando...</h3>
            </div>
          ) : null}

          {todayData ? (
            <>
              <div className="admin-section-head">
                <p>Resumen del día · {todayData.date}</p>
              </div>

              <div className="admin-editor-card barber-profile-card">
                <div>
                  <h3>Foto del perfil</h3>
                  <p className="admin-cell-muted">
                    Esta imagen se mostrará en la web para {todayData.barber?.name || user.name}.
                  </p>
                </div>

                <div className="barber-profile-editor">
                  <img
                    src={todayData.barber?.imageUrl || "/assets/barber-1.jpeg"}
                    alt={todayData.barber?.name || user.name}
                    className="admin-management-image barber-profile-preview"
                  />

                  <div className="field">
                    <label>URL de la foto</label>
                    <input
                      value={profileImageUrl}
                      onChange={(e) => setProfileImageUrl(e.target.value)}
                      placeholder="/assets/barber-1.jpg o https://..."
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSaveProfileImage}
                    >
                      Guardar foto
                    </button>
                  </div>
                </div>
              </div>

              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <span>Total hoy</span>
                  <strong>{todayData.total}</strong>
                </div>
                <div className="admin-stat-card">
                  <span>Confirmadas</span>
                  <strong>{todayData.confirmed}</strong>
                </div>
                <div className="admin-stat-card">
                  <span>Completadas</span>
                  <strong>{todayData.completed}</strong>
                </div>
                <div className="admin-stat-card">
                  <span>Canceladas</span>
                  <strong>{todayData.cancelled}</strong>
                </div>
              </div>

              <div className="admin-stats-grid" style={{ marginBottom: 18 }}>
                <div className="admin-stat-card">
                  <span>Ingreso estimado</span>
                  <strong>{formatCurrency(todayData.estimatedIncome)}</strong>
                </div>
                <div className="admin-stat-card">
                  <span>Huecos libres hoy</span>
                  <strong>{todayData.freeSlots.length}</strong>
                </div>
              </div>

              <div className="admin-editor-card" style={{ marginBottom: 18 }}>
                <h3 style={{ marginBottom: 14 }}>Próximas citas</h3>

                {todayData.upcoming.length === 0 ? (
                  <p className="admin-cell-muted">No tienes próximas citas para hoy.</p>
                ) : (
                  <div className="admin-card-grid">
                    {todayData.upcoming.map((item) => (
                      <div key={item.id} className="admin-service-card">
                        <div className="admin-service-headline">
                          <div>
                            <h3>{item.customerName}</h3>
                            <p>{item.serviceName}</p>
                          </div>
                          <strong>{item.time}</strong>
                        </div>

                        <p className="admin-service-description">
                          Teléfono: {item.customerPhone}
                        </p>

                        <div
                          className="admin-status-badge"
                          style={{ display: "inline-flex", marginBottom: 12 }}
                        >
                          {getStatusLabel(item.status)}
                        </div>

                        <div className="admin-actions">
                          <button
                            type="button"
                            className="admin-mini-btn"
                            onClick={() => handleStatusChange(item.id, "Confirmed")}
                          >
                            Confirmar
                          </button>

                          <button
                            type="button"
                            className="admin-mini-btn"
                            onClick={() => handleStatusChange(item.id, "Completed")}
                          >
                            Completar
                          </button>

                          <button
                            type="button"
                            className="admin-mini-btn"
                            onClick={() => handleReschedule(item)}
                          >
                            Reprogramar
                          </button>

                          <button
                            type="button"
                            className="admin-mini-btn danger"
                            onClick={() => handleStatusChange(item.id, "Cancelled")}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-editor-card" style={{ marginBottom: 18 }}>
                <h3 style={{ marginBottom: 14 }}>Huecos libres</h3>

                {freeSlots.length === 0 ? (
                  <p className="admin-cell-muted">No hay huecos libres para esta fecha.</p>
                ) : (
                  <div className="tags">
                    {freeSlots.map((slot) => (
                      <span key={slot}>{slot}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-section-head">
                <p>Agenda por fecha</p>
              </div>

              <div className="admin-toolbar" style={{ marginBottom: 18 }}>
                <input
                  className="admin-input"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => void handleDateChange(e.target.value)}
                />
              </div>

              <div className="admin-table-shell">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Cliente</th>
                      <th>Servicio</th>
                      <th>Teléfono</th>
                      <th>Estado</th>
                      <th>Notas</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.length === 0 ? (
                      <tr>
                        <td colSpan={7}>No hay reservas para este día</td>
                      </tr>
                    ) : (
                      reservations.map((reservation) => (
                        <tr key={reservation.id}>
                          <td>
                            <strong>{reservation.time}</strong>
                          </td>
                          <td>{reservation.customerName}</td>
                          <td>{reservation.serviceName}</td>
                          <td>{reservation.customerPhone}</td>
                          <td>
                            <span className="admin-status-badge">
                              {getStatusLabel(reservation.status)}
                            </span>
                          </td>
                          <td>{reservation.notes || "—"}</td>
                          <td>
                            <div className="admin-actions">
                              <button
                                type="button"
                                className="admin-mini-btn"
                                onClick={() =>
                                  handleStatusChange(reservation.id, "Confirmed")
                                }
                              >
                                Confirmar
                              </button>

                              <button
                                type="button"
                                className="admin-mini-btn"
                                onClick={() =>
                                  handleStatusChange(reservation.id, "Completed")
                                }
                              >
                                Completar
                              </button>

                              <button
                                type="button"
                                className="admin-mini-btn"
                                onClick={() => handleReschedule(reservation)}
                              >
                                Reprogramar
                              </button>

                              <button
                                type="button"
                                className="admin-mini-btn danger"
                                onClick={() =>
                                  handleStatusChange(reservation.id, "Cancelled")
                                }
                              >
                                Cancelar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
