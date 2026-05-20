import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import "../admin.css";
import {
  createAdminBarber,
  createAdminService,
  deleteAdminBarber,
  deleteAdminService,
  deleteReservation,
  getAdminBarbers,
  getAdminServices,
  getAllReservations,
  getBarberBusinessHours,
  saveBarberBusinessHours,
  updateAdminBarber,
  updateAdminService,
  updateReservationStatus,
  confirmReservationDeposit,
rejectReservationDeposit,
expireReservationDeposit,
  type AdminBarber,
  type AdminReservation,
  type AdminServiceItem,
  type BarberBusinessHour,
  type ReservationStatus,
} from "../services/adminService";

type StoredUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  birthday?: string | null;
  role?: string;
};

type AdminTab = "reservations" | "barbers" | "services" | "hours";

type BarberFormState = {
  name: string;
  specialty: string;
  imageUrl: string;
  experience: string;
  price: string;
  linkedEmail: string;
};

type ServiceFormState = {
  name: string;
  description: string;
  durationMinutes: string;
  price: string;
  requiresDeposit: boolean;
  depositAmount: string;
};

const emptyBarberForm: BarberFormState = {
  name: "",
  specialty: "",
  imageUrl: "",
  experience: "",
  price: "0",
  linkedEmail: "",
};

const emptyServiceForm: ServiceFormState = {
  name: "",
  description: "",
  durationMinutes: "30",
  price: "0",
  requiresDeposit: false,
  depositAmount: "0",
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Ha ocurrido un error";
}

function formatPrice(value: number) {
  return `€${value}`;
}

function getTodayDateValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStatusLabel(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "confirmed") return "Confirmada";
  if (normalized === "completed") return "Completada";
  if (normalized === "cancelled") return "Cancelada";
  if (normalized === "pending") return "Pendiente";

  return status;
}
function getDepositStatusLabel(status?: string) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "notrequired") return "No requerida";
  if (normalized === "pending") return "Pendiente de pago";
  if (normalized === "waitingvalidation") return "Pendiente de validación";
  if (normalized === "paid") return "Pagada";
  if (normalized === "rejected") return "Rechazada";
  if (normalized === "expired") return "Expirada";

  return status || "No requerida";
}

function getBarberDescription(barber: AdminBarber) {
  const exp = barber.experience?.trim() || "gran experiencia";
  return `Especialista en ${barber.specialty.toLowerCase()}. Profesional con ${exp}.`;
}

export default function AdminPage() {
  const token = localStorage.getItem("token") || "";
  const rawUser = localStorage.getItem("user");

  let user: StoredUser | null = null;

  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    user = null;
  }

  const [activeTab, setActiveTab] = useState<AdminTab>("reservations");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");

  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [barbers, setBarbers] = useState<AdminBarber[]>([]);
  const [services, setServices] = useState<AdminServiceItem[]>([]);

  const [selectedBarberId, setSelectedBarberId] = useState<number | null>(null);
  const [hours, setHours] = useState<BarberBusinessHour[]>([]);
  const [hoursDirty, setHoursDirty] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(getTodayDateValue);

  const [showBarberForm, setShowBarberForm] = useState(false);
  const [editingBarberId, setEditingBarberId] = useState<number | null>(null);
  const [barberForm, setBarberForm] = useState<BarberFormState>(emptyBarberForm);

  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceFormState>(emptyServiceForm);

  const selectedBarber = useMemo(
    () => barbers.find((x) => x.id === selectedBarberId) ?? null,
    [barbers, selectedBarberId]
  );

  async function loadReservations() {
    const data = await getAllReservations(token);
    setReservations(data);
  }

  async function loadBarbers() {
    const data = await getAdminBarbers(token);
    setBarbers(data);

    if (data.length > 0 && (!selectedBarberId || !data.some((x) => x.id === selectedBarberId))) {
      setSelectedBarberId(data[0].id);
    }
  }

  async function loadServices() {
    const data = await getAdminServices(token);
    setServices(data);
  }

  async function loadHours(barberId?: number | null) {
    const targetBarberId = barberId ?? selectedBarberId;

    if (!targetBarberId) {
      setHours([]);
      setHoursDirty(false);
      return;
    }

    const data = await getBarberBusinessHours(token, targetBarberId);

    const ordered = [...data].sort((a, b) => {
      const order = [1, 2, 3, 4, 5, 6, 0];
      return order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek);
    });

    setHours(ordered);
    setHoursDirty(false);
  }

  async function loadCurrentTab(tab: AdminTab) {
    setLoading(true);
    setPageError("");

    try {
      if (tab === "reservations") await loadReservations();
      if (tab === "barbers") await loadBarbers();
      if (tab === "services") await loadServices();
      if (tab === "hours") await loadBarbers();
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token || user?.role !== "Admin") return;
    void loadCurrentTab(activeTab);
  }, [activeTab, token, user?.role]);

  useEffect(() => {
    if (!token || user?.role !== "Admin") return;
    if (activeTab !== "hours") return;
    if (!selectedBarberId) return;

    void loadHours(selectedBarberId);
  }, [activeTab, selectedBarberId, token, user?.role]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        !search ||
        reservation.customerName.toLowerCase().includes(search) ||
        reservation.serviceName.toLowerCase().includes(search) ||
        reservation.barberName.toLowerCase().includes(search) ||
        reservation.customerPhone?.toLowerCase().includes(search);

      const matchesStatus =
        !statusFilter || reservation.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesDate = reservation.date === (dateFilter || getTodayDateValue());

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [reservations, searchTerm, statusFilter, dateFilter]);

  const dailyReservations = useMemo(() => {
    return reservations.filter((reservation) => reservation.date === (dateFilter || getTodayDateValue()));
  }, [reservations, dateFilter]);

  const reservationStats = useMemo(() => {
    return {
      total: dailyReservations.length,
      confirmed: dailyReservations.filter((x) => x.status.toLowerCase() === "confirmed").length,
      completed: dailyReservations.filter((x) => x.status.toLowerCase() === "completed").length,
      cancelled: dailyReservations.filter((x) => x.status.toLowerCase() === "cancelled").length,
    };
  }, [dailyReservations]);

  if (!token || !user) {
    return <Navigate to="/reservar?view=auth" replace />;
  }

  if (user.role !== "Admin") {
    return <Navigate to="/" replace />;
  }

  async function handleStatusChange(id: number, status: ReservationStatus) {
    try {
      setPageError("");
      setPageSuccess("");
      await updateReservationStatus(token, id, status);
      await loadReservations();
      setPageSuccess("Estado actualizado correctamente");
    } catch (error) {
      setPageError(getErrorMessage(error));
    }
  }

  async function handleDeleteReservation(id: number) {
    if (!window.confirm("¿Seguro que quieres eliminar esta reserva?")) return;

    try {
      setPageError("");
      setPageSuccess("");
      await deleteReservation(token, id);
      await loadReservations();
      setPageSuccess("Reserva eliminada correctamente");
    } catch (error) {
      setPageError(getErrorMessage(error));
    }
  }
  async function handleConfirmDeposit(id: number) {
  try {
    setPageError("");
    setPageSuccess("");
    await confirmReservationDeposit(token, id);
    await loadReservations();
    setPageSuccess("Pago confirmado correctamente");
  } catch (error) {
    setPageError(getErrorMessage(error));
  }
}

async function handleRejectDeposit(id: number) {
  try {
    setPageError("");
    setPageSuccess("");
    await rejectReservationDeposit(token, id);
    await loadReservations();
    setPageSuccess("Comprobante rechazado");
  } catch (error) {
    setPageError(getErrorMessage(error));
  }
}

async function handleExpireDeposit(id: number) {
  try {
    setPageError("");
    setPageSuccess("");
    await expireReservationDeposit(token, id);
    await loadReservations();
    setPageSuccess("Señal marcada como expirada");
  } catch (error) {
    setPageError(getErrorMessage(error));
  }
}
  function openCreateBarber() {
    setEditingBarberId(null);
    setBarberForm(emptyBarberForm);
    setShowBarberForm(true);
  }

  function openEditBarber(barber: AdminBarber) {
    setEditingBarberId(barber.id);
    setBarberForm({
      name: barber.name,
      specialty: barber.specialty,
      imageUrl: barber.imageUrl || "",
      experience: barber.experience || "",
      price: String(barber.price),
      linkedEmail: barber.linkedEmail || "",
    });
    setShowBarberForm(true);
  }

  async function handleSaveBarber() {
    try {
      setPageError("");
      setPageSuccess("");

      const payload = {
        name: barberForm.name.trim(),
        specialty: barberForm.specialty.trim(),
        imageUrl: barberForm.imageUrl.trim(),
        experience: barberForm.experience.trim(),
        price: Number(barberForm.price),
        linkedEmail: barberForm.linkedEmail.trim(),
        isActive: true,
      };

      if (!payload.name || !payload.specialty) {
        setPageError("Completa al menos nombre y especialidad del barbero");
        return;
      }

      if (editingBarberId) {
        await updateAdminBarber(token, editingBarberId, payload);
        setPageSuccess("Barbero actualizado correctamente");
      } else {
        await createAdminBarber(token, payload);
        setPageSuccess("Barbero creado correctamente");
      }

      setShowBarberForm(false);
      setEditingBarberId(null);
      setBarberForm(emptyBarberForm);
      await loadBarbers();
    } catch (error) {
      setPageError(getErrorMessage(error));
    }
  }

  async function handleDeleteBarber(id: number) {
    if (!window.confirm("¿Seguro que quieres eliminar este barbero?")) return;

    try {
      setPageError("");
      setPageSuccess("");
      await deleteAdminBarber(token, id);
      await loadBarbers();

      if (selectedBarberId === id) {
        setSelectedBarberId(null);
      }

      setPageSuccess("Barbero eliminado correctamente");
    } catch (error) {
      setPageError(getErrorMessage(error));
    }
  }

  function openCreateService() {
    setEditingServiceId(null);
    setServiceForm(emptyServiceForm);
    setShowServiceForm(true);
  }

  function openEditService(service: AdminServiceItem) {
    const serviceAny = service as AdminServiceItem & {
      requiresDeposit?: boolean;
      depositAmount?: number;
    };

    setEditingServiceId(service.id);
    setServiceForm({
      name: service.name,
      description: service.description,
      durationMinutes: String(service.durationMinutes),
      price: String(service.price),
      requiresDeposit: !!serviceAny.requiresDeposit,
      depositAmount: String(serviceAny.depositAmount ?? 0),
    });
    setShowServiceForm(true);
  }

  async function handleSaveService() {
    try {
      setPageError("");
      setPageSuccess("");

      const payload = {
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim(),
        durationMinutes: Number(serviceForm.durationMinutes),
        price: Number(serviceForm.price),
        isActive: true,
        requiresDeposit: serviceForm.requiresDeposit,
        depositAmount: serviceForm.requiresDeposit
          ? Number(serviceForm.depositAmount)
          : 0,
      };

      if (!payload.name) {
        setPageError("El servicio debe tener nombre");
        return;
      }

      if (!payload.durationMinutes || payload.durationMinutes <= 0) {
        setPageError("La duración debe ser mayor que 0");
        return;
      }

      if (payload.requiresDeposit && (!payload.depositAmount || payload.depositAmount <= 0)) {
        setPageError("La señal debe ser mayor que 0");
        return;
      }

      if (editingServiceId) {
        await updateAdminService(token, editingServiceId, payload as any);
        setPageSuccess("Servicio actualizado correctamente");
      } else {
        await createAdminService(token, payload as any);
        setPageSuccess("Servicio creado correctamente");
      }

      setShowServiceForm(false);
      setEditingServiceId(null);
      setServiceForm(emptyServiceForm);
      await loadServices();
    } catch (error) {
      setPageError(getErrorMessage(error));
    }
  }

  async function handleDeleteService(id: number) {
    if (!window.confirm("¿Seguro que quieres eliminar este servicio?")) return;

    try {
      setPageError("");
      setPageSuccess("");
      await deleteAdminService(token, id);
      await loadServices();
      setPageSuccess("Servicio eliminado correctamente");
    } catch (error) {
      setPageError(getErrorMessage(error));
    }
  }

  function updateHourRow(dayOfWeek: number, patch: Partial<BarberBusinessHour>) {
    setHours((current) =>
      current.map((item) =>
        item.dayOfWeek === dayOfWeek ? { ...item, ...patch } : item
      )
    );
    setHoursDirty(true);
  }

  async function handleSaveHours() {
    if (!selectedBarberId) {
      setPageError("Selecciona un barbero");
      return;
    }

    try {
      setPageError("");
      setPageSuccess("");
      await saveBarberBusinessHours(token, selectedBarberId, hours);
      setHoursDirty(false);
      setPageSuccess("Horarios del barbero guardados correctamente");
    } catch (error) {
      setPageError(getErrorMessage(error));
    }
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
              <div className="brand-title">Panel de Control</div>
              <div className="brand-subtitle">La Guarida Barber Studio</div>
            </div>
          </div>

          <div className="admin-top-actions">
            <span className="admin-user-badge">{user.name}</span>
            <Link
              to="/"
              className="btn btn-secondary"
              onClick={() => {
                window.scrollTo(0, 0);
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
              }}
            >
              Volver
            </Link>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <div className="admin-tabs">
            <button
              type="button"
              className={`admin-tab ${activeTab === "reservations" ? "active" : ""}`}
              onClick={() => setActiveTab("reservations")}
            >
              📅 Reservas
            </button>
            <button
              type="button"
              className={`admin-tab ${activeTab === "barbers" ? "active" : ""}`}
              onClick={() => setActiveTab("barbers")}
            >
              🧑‍💼 Barberos
            </button>
            <button
              type="button"
              className={`admin-tab ${activeTab === "services" ? "active" : ""}`}
              onClick={() => setActiveTab("services")}
            >
              ✂️ Servicios
            </button>
            <button
              type="button"
              className={`admin-tab ${activeTab === "hours" ? "active" : ""}`}
              onClick={() => setActiveTab("hours")}
            >
              🕒 Horarios
            </button>
          </div>

          {pageError ? <p className="error-text admin-page-error">{pageError}</p> : null}
          {pageSuccess ? <div className="success-box">{pageSuccess}</div> : null}

          {loading ? (
            <div className="booking-box">
              <h3>Cargando...</h3>
            </div>
          ) : null}

          {!loading && activeTab === "reservations" ? (
            <>
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <span>Total</span>
                  <strong>{reservationStats.total}</strong>
                </div>
                <div className="admin-stat-card">
                  <span>Confirmadas</span>
                  <strong>{reservationStats.confirmed}</strong>
                </div>
                <div className="admin-stat-card">
                  <span>Completadas</span>
                  <strong>{reservationStats.completed}</strong>
                </div>
                <div className="admin-stat-card">
                  <span>Canceladas</span>
                  <strong>{reservationStats.cancelled}</strong>
                </div>
              </div>

              <div className="admin-toolbar">
                <input
                  className="admin-input"
                  type="text"
                  placeholder="Buscar por cliente, servicio, barbero..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                  className="admin-input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  <option value="Pending">Pendientes</option>
                  <option value="Confirmed">Confirmadas</option>
                  <option value="Completed">Completadas</option>
                  <option value="Cancelled">Canceladas</option>
                </select>

                <input
                  className="admin-input"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value || getTodayDateValue())}
                />
              </div>

              <div className="admin-table-shell">
                <table className="admin-table">
                  <thead>
  <tr>
    <th>Fecha / Hora</th>
    <th>Cliente</th>
    <th>Servicio</th>
    <th>Barbero</th>
    <th>Señal</th>
    <th>Estado</th>
    <th>Acciones</th>
  </tr>
</thead>
<tbody>
  {filteredReservations.length === 0 ? (
    <tr>
      <td colSpan={7}>No hay reservas</td>
    </tr>
  ) : (
    filteredReservations.map((reservation) => (
      <tr key={reservation.id}>
        <td>
          <strong>{reservation.date}</strong>
          <div className="admin-cell-muted">{reservation.time}</div>
        </td>

        <td>
          <strong>{reservation.customerName}</strong>
          <div className="admin-cell-muted">
            {reservation.customerPhone || "—"}
          </div>
        </td>

        <td>{reservation.serviceName}</td>
        <td>{reservation.barberName}</td>

        <td>
          {(reservation.depositAmount ?? 0) > 0 ? (
            <>
              <strong style={{ color: "#e1221a" }}>
                {reservation.depositAmount}€
              </strong>
              <div className="admin-cell-muted">
                {getDepositStatusLabel(reservation.depositStatus)}
              </div>
            </>
          ) : (
            <span className="admin-cell-muted">No requerida</span>
          )}
        </td>

        <td>
          <span className="admin-status-badge">
            {getStatusLabel(reservation.status)}
          </span>
        </td>

        <td>
          <div className="admin-actions">
            <button
              type="button"
              className="admin-mini-btn"
              onClick={() => handleStatusChange(reservation.id, "Confirmed")}
            >
              Confirmar
            </button>

            <button
              type="button"
              className="admin-mini-btn"
              onClick={() => handleStatusChange(reservation.id, "Completed")}
            >
              Completar
            </button>

            <button
              type="button"
              className="admin-mini-btn danger"
              onClick={() => handleStatusChange(reservation.id, "Cancelled")}
            >
              Cancelar
            </button>

            {(reservation.depositAmount ?? 0) > 0 &&
            reservation.depositStatus !== "Paid" &&
            reservation.depositStatus !== "Expired" ? (
              <>
                <button
  type="button"
  className="admin-mini-btn"
  onClick={() => handleConfirmDeposit(reservation.id)}
>
  Pago hecho
</button>

                <button
                  type="button"
                  className="admin-mini-btn danger"
                  onClick={() => handleRejectDeposit(reservation.id)}
                >
                  Rechazar
                </button>

                <button
                  type="button"
                  className="admin-mini-btn danger"
                  onClick={() => handleExpireDeposit(reservation.id)}
                >
                  Expirar
                </button>
              </>
            ) : null}

            <button
              type="button"
              className="admin-mini-btn danger"
              onClick={() => handleDeleteReservation(reservation.id)}
            >
              Eliminar
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

          {!loading && activeTab === "barbers" ? (
            <>
              <div className="admin-section-head">
                <p>{barbers.length} barberos registrados</p>
                <button type="button" className="btn btn-primary" onClick={openCreateBarber}>
                  + Nuevo barbero
                </button>
              </div>

              {showBarberForm ? (
                <div className="admin-editor-card">
                  <h3>{editingBarberId ? "Editar barbero" : "Nuevo barbero"}</h3>

                  <div className="admin-form-grid">
                    <div className="field">
                      <label>Nombre</label>
                      <input
                        value={barberForm.name}
                        onChange={(e) =>
                          setBarberForm((current) => ({ ...current, name: e.target.value }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label>Especialidad</label>
                      <input
                        value={barberForm.specialty}
                        onChange={(e) =>
                          setBarberForm((current) => ({ ...current, specialty: e.target.value }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label>Experiencia</label>
                      <input
                        value={barberForm.experience}
                        onChange={(e) =>
                          setBarberForm((current) => ({ ...current, experience: e.target.value }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label>Precio base</label>
                      <input
                        type="number"
                        step="0.01"
                        value={barberForm.price}
                        onChange={(e) =>
                          setBarberForm((current) => ({ ...current, price: e.target.value }))
                        }
                      />
                    </div>

                    <div className="field full-width">
                      <label>URL imagen</label>
                      <input
                        value={barberForm.imageUrl}
                        onChange={(e) =>
                          setBarberForm((current) => ({ ...current, imageUrl: e.target.value }))
                        }
                        placeholder="/assets/barber-1.jpg o https://..."
                      />
                    </div>

                    <div className="field full-width">
                      <label>Correo vinculado al barbero</label>
                      <input
                        type="email"
                        value={barberForm.linkedEmail}
                        onChange={(e) =>
                          setBarberForm((current) => ({ ...current, linkedEmail: e.target.value }))
                        }
                        placeholder="correo@ejemplo.com"
                      />
                      <small className="admin-cell-muted">
                        Ese usuario pasará a rol Barber y podrá entrar al panel del barbero.
                      </small>
                    </div>
                  </div>

                  <div className="admin-form-actions">
                    <button type="button" className="btn btn-primary" onClick={handleSaveBarber}>
                      Guardar barbero
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowBarberForm(false);
                        setEditingBarberId(null);
                        setBarberForm(emptyBarberForm);
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="admin-card-grid">
                {barbers.map((barber) => (
                  <div key={barber.id} className="admin-management-card">
                    <img
                      src={barber.imageUrl || "/assets/barber-1.jpeg"}
                      alt={barber.name}
                      className="admin-management-image"
                    />

                    <div className="admin-management-body">
                      <div className="admin-management-top">
                        <div>
                          <h3>{barber.name}</h3>
                          <p>{barber.specialty}</p>
                        </div>
                        <span>{barber.experience || "—"}</span>
                      </div>

                      <p className="admin-management-text">{getBarberDescription(barber)}</p>
                      <p className="admin-management-text">
                        Acceso: <strong>{barber.linkedEmail || "Sin correo vinculado"}</strong>
                      </p>

                      <div className="admin-management-actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => openEditBarber(barber)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => handleDeleteBarber(barber.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {!loading && activeTab === "services" ? (
            <>
              <div className="admin-section-head">
                <p>{services.length} servicios disponibles</p>
                <button type="button" className="btn btn-primary" onClick={openCreateService}>
                  + Nuevo servicio
                </button>
              </div>

              {showServiceForm ? (
                <div className="admin-editor-card">
                  <h3>{editingServiceId ? "Editar servicio" : "Nuevo servicio"}</h3>

                  <div className="admin-form-grid">
                    <div className="field">
                      <label>Nombre</label>
                      <input
                        value={serviceForm.name}
                        onChange={(e) =>
                          setServiceForm((current) => ({ ...current, name: e.target.value }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label>Duración (min)</label>
                      <input
                        type="number"
                        value={serviceForm.durationMinutes}
                        onChange={(e) =>
                          setServiceForm((current) => ({
                            ...current,
                            durationMinutes: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label>Precio</label>
                      <input
                        type="number"
                        step="0.01"
                        value={serviceForm.price}
                        onChange={(e) =>
                          setServiceForm((current) => ({ ...current, price: e.target.value }))
                        }
                      />
                    </div>

                    <div className="field">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={serviceForm.requiresDeposit}
                          onChange={(e) =>
                            setServiceForm((current) => ({
                              ...current,
                              requiresDeposit: e.target.checked,
                              depositAmount: e.target.checked
                                ? current.depositAmount || "5"
                                : "0",
                            }))
                          }
                        />
                        <span>Requiere señal</span>
                      </label>
                    </div>

                    {serviceForm.requiresDeposit ? (
                      <div className="field">
                        <label>Importe señal</label>
                        <input
                          type="number"
                          step="0.01"
                          value={serviceForm.depositAmount}
                          onChange={(e) =>
                            setServiceForm((current) => ({
                              ...current,
                              depositAmount: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ) : null}

                    <div className="field full-width">
                      <label>Descripción</label>
                      <textarea
                        value={serviceForm.description}
                        onChange={(e) =>
                          setServiceForm((current) => ({
                            ...current,
                            description: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="admin-form-actions">
                    <button type="button" className="btn btn-primary" onClick={handleSaveService}>
                      Guardar servicio
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowServiceForm(false);
                        setEditingServiceId(null);
                        setServiceForm(emptyServiceForm);
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="admin-service-grid">
                {services.map((service) => {
                  const serviceAny = service as AdminServiceItem & {
                    requiresDeposit?: boolean;
                    depositAmount?: number;
                  };

                  return (
                    <div key={service.id} className="admin-service-card">
                      <div className="admin-service-headline">
                        <div className="admin-service-left">
                          <div className="admin-service-icon admin-service-icon-image">
                            <img src="/assets/barber-icon.png" alt="" />
                          </div>
                          <div>
                            <h3>{service.name}</h3>
                            <p>{service.durationMinutes} min</p>
                          </div>
                        </div>
                        <strong>{formatPrice(service.price)}</strong>
                      </div>

                      <p className="admin-service-description">{service.description}</p>

                      {serviceAny.requiresDeposit ? (
                        <div
                          className="admin-status-badge"
                          style={{ display: "inline-flex", marginBottom: 12 }}
                        >
                          Señal: €{serviceAny.depositAmount ?? 0}
                        </div>
                      ) : null}

                      <div className="admin-management-actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => openEditService(service)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}

          {!loading && activeTab === "hours" ? (
            <>
              <div className="admin-section-head">
                <p>
                  {selectedBarber
                    ? `Configura los horarios de ${selectedBarber.name}`
                    : "Configura los horarios por barbero"}
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveHours}
                  disabled={!hoursDirty || !selectedBarberId}
                >
                  Guardar horarios
                </button>
              </div>

              <div className="admin-toolbar" style={{ marginBottom: 18 }}>
                <select
                  className="admin-input"
                  value={selectedBarberId ?? ""}
                  onChange={(e) => setSelectedBarberId(Number(e.target.value))}
                >
                  {barbers.map((barber) => (
                    <option key={barber.id} value={barber.id}>
                      {barber.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-hours-list">
                {hours.map((hour) => (
                  <div
                    key={hour.dayOfWeek}
                    className={`admin-hour-row ${!hour.isOpen ? "closed" : ""}`}
                  >
                    <div className="admin-hour-day">
                      <button
                        type="button"
                        className={`admin-switch ${hour.isOpen ? "on" : ""}`}
                        onClick={() => updateHourRow(hour.dayOfWeek, { isOpen: !hour.isOpen })}
                      >
                        <span />
                      </button>

                      <strong>{hour.label}</strong>
                    </div>

                    {hour.isOpen ? (
                      <div className="admin-hour-inputs">
                        <div className="admin-hour-group">
                          <span>Apertura</span>
                          <input
                            type="time"
                            value={hour.openTime}
                            onChange={(e) =>
                              updateHourRow(hour.dayOfWeek, { openTime: e.target.value })
                            }
                          />
                        </div>

                        <div className="admin-hour-group">
                          <span>Cierre</span>
                          <input
                            type="time"
                            value={hour.closeTime}
                            onChange={(e) =>
                              updateHourRow(hour.dayOfWeek, { closeTime: e.target.value })
                            }
                          />
                        </div>

                        <div className="admin-hour-group">
                          <span>Descanso</span>
                          <input
                            type="time"
                            value={hour.breakStart}
                            onChange={(e) =>
                              updateHourRow(hour.dayOfWeek, { breakStart: e.target.value })
                            }
                          />
                        </div>

                        <div className="admin-hour-group">
                          <span>—</span>
                          <input
                            type="time"
                            value={hour.breakEnd}
                            onChange={(e) =>
                              updateHourRow(hour.dayOfWeek, { breakEnd: e.target.value })
                            }
                          />
                        </div>

                        <div className="admin-hour-group">
                          <span>Intervalo</span>
                          <select
                            value={hour.slotIntervalMinutes}
                            onChange={(e) =>
                              updateHourRow(hour.dayOfWeek, {
                                slotIntervalMinutes: Number(e.target.value),
                              })
                            }
                          >
                            <option value={15}>15 min</option>
                            <option value={30}>30 min</option>
                            <option value={60}>60 min</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="admin-day-closed-text">Cerrado</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
