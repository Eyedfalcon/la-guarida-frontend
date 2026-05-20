import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { login, register, resetPassword } from "../services/authService";
import {
  createReservation,
  getAvailableSlots,
  getBarbers,
  getMyReservations,
  getServices,
  markDepositReceiptSent,
} from "../services/reservationService";
import {
  getBarberServicePrices,
  type BarberServicePrice,
} from "../services/barberServicePriceService";

type Service = {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  requiresDeposit?: boolean;
  depositAmount?: number;
};

type Barber = {
  id: number;
  name: string;
  specialty: string;
  price: number;
  experience: string;
  image: string;
  description: string;
  tags: string[];
};

type AuthUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  birthday?: string | null;
};

type ReservationHistoryItem = {
  id: number;
  date: string;
  time: string;
  status: string;
  notes?: string;
  barber: string;
  service: string;
  depositAmount?: number;
  depositStatus?: string;
  depositPaidAt?: string;
  depositExpiresAt?: string;
};

type PendingDepositState = {
  reservationId: number;
  amount: number;
  status: string;
  expiresAt?: string;
};

type AuthMode = "login" | "register" | "recover";

const barberPresentation: Record<
  number,
  { description: string; tags: string[]; image: string }
> = {
  1: {
    image: "/assets/barber-1.jpg",
    description:
      "Especialista en fades limpios y cortes modernos con acabados precisos.",
    tags: ["Fade", "Precisión", "Moderno", "Textura"],
  },
  2: {
    image: "/assets/barber-2.jpg",
    description:
      "Barbero versátil, experto en estilos clásicos, peinados elegantes y barba.",
    tags: ["Clásico", "Barba", "Elegancia", "Tradición"],
  },
  3: {
    image: "/assets/barber-3.jpg",
    description:
      "Especializado en cuidado integral, tratamientos y asesoría de imagen.",
    tags: ["Premium", "Cuidado", "Asesoría", "Detalle"],
  },
  4: {
    image: "/assets/barber-4.jpg",
    description:
      "Artista del cabello especializado en diseños geométricos y líneas de precisión.",
    tags: ["Diseño", "Creatividad", "Experiencia", "Detalle"],
  },
  5: {
    image: "/assets/barber-5.jpg",
    description:
      "Experto en afeitado tradicional, perfilado y cuidado premium de barba.",
    tags: ["Barba", "Navaja", "Perfilado", "Clásico"],
  },
  6: {
    image: "/assets/barber-6.jpg",
    description:
      "Especializado en estilos urbanos, textura, volumen y acabados actuales.",
    tags: ["Urbano", "Textura", "Volumen", "Estilo"],
  },
};

function formatBirthdayInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function isoToBirthdayInput(value?: string | null) {
  if (!value) return "";

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return formatBirthdayInput(value);

  return `${match[3]}/${match[2]}/${match[1]}`;
}

function birthdayInputToIso(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "";
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
}

type AuthFormProps = {
  mode: AuthMode;
  context: "account" | "booking";
  name: string;
  phone: string;
  email: string;
  birthday: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  loading: boolean;
  error: string;
  success: string;
  onModeChange: (mode: AuthMode) => void;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onBirthdayChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onRecover: () => void;
};

function AuthForm({
  mode,
  context,
  name,
  phone,
  email,
  birthday,
  password,
  confirmPassword,
  showPassword,
  loading,
  error,
  success,
  onModeChange,
  onNameChange,
  onPhoneChange,
  onEmailChange,
  onBirthdayChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onTogglePassword,
  onLogin,
  onRegister,
  onRecover,
}: AuthFormProps) {
  const isRecover = mode === "recover";
  const isRegister = mode === "register";
  const title =
    mode === "login"
      ? "Bienvenido de vuelta"
      : isRecover
        ? "Recuperar contraseña"
        : "Crea tu cuenta";
  const subtitle =
    mode === "login"
      ? context === "booking"
        ? "Inicia sesión para gestionar tu reserva"
        : "Inicia sesión en tu cuenta"
      : isRecover
        ? "Valida tus datos y crea una nueva contraseña"
        : context === "booking"
          ? "Regístrate para reservar tu cita fácilmente"
          : "Regístrate para acceder a tu cuenta";
  const primaryLabel =
    mode === "login"
      ? loading
        ? "Entrando..."
        : "Iniciar sesión"
      : isRecover
        ? loading
          ? "Actualizando..."
          : "Cambiar contraseña"
        : loading
          ? "Creando cuenta..."
          : "Crear cuenta";
  const primaryAction =
    mode === "login" ? onLogin : isRecover ? onRecover : onRegister;

  return (
    <div className="auth-panel">
      <div className="auth-card">
        <div className="auth-card-icon">
          <img src="/assets/usuario.png" alt="Usuario" />
        </div>

        <h4 className="auth-card-title">{title}</h4>
        <p className="auth-card-subtitle">{subtitle}</p>

        <div className="auth-switch">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => onModeChange("login")}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className={isRegister ? "active" : ""}
            onClick={() => onModeChange("register")}
          >
            Registrarse
          </button>
        </div>

        {isRegister && (
          <div className="field full-width">
            <label>Nombre completo</label>
            <input
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Tu nombre"
            />
          </div>
        )}

        <div className="field full-width">
          <label>Email</label>
          <input
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="tu@email.com"
          />
        </div>

        {isRegister && (
          <div className="field full-width">
            <label>Teléfono</label>
            <input
              value={phone}
              onChange={(event) => onPhoneChange(event.target.value)}
              placeholder="Tu número de teléfono"
            />
          </div>
        )}

        <div className="field full-width">
          <label>{isRecover ? "Nueva contraseña" : "Contraseña"}</label>
          <div className="password-input-wrap">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder={isRegister || isRecover ? "Mínimo 6 caracteres" : "Tu contraseña"}
            />
            <button type="button" className="password-toggle" onClick={onTogglePassword}>
              {showPassword ? "Ocultar" : "Ver"}
            </button>
          </div>
        </div>

        {(isRegister || isRecover) && (
          <>
            <div className="field full-width">
              <label>{isRecover ? "Confirmar nueva contraseña" : "Confirmar contraseña"}</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => onConfirmPasswordChange(event.target.value)}
                placeholder="Repite tu contraseña"
              />
            </div>

            <div className="field full-width">
              <label>Fecha de cumpleaños</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={birthday}
                onChange={(event) => onBirthdayChange(formatBirthdayInput(event.target.value))}
                placeholder="dd/mm/aaaa"
              />
            </div>
          </>
        )}

        {success && <small className="success-text">{success}</small>}
        {error && <small className="error-text">{error}</small>}

        <button
          type="button"
          className="btn btn-primary full"
          onClick={primaryAction}
          disabled={loading}
        >
          {primaryLabel}
        </button>

        <p className="auth-footer-text">
          {mode === "login" ? (
            <>
              <button
                type="button"
                className="auth-link-button"
                onClick={() => onModeChange("recover")}
              >
                Olvidé mi contraseña
              </button>
              <br />
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                className="auth-link-button"
                onClick={() => onModeChange("register")}
              >
                Regístrate gratis
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                className="auth-link-button"
                onClick={() => onModeChange("login")}
              >
                Inicia sesión
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(1);

  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [barberServicePrices, setBarberServicePrices] = useState<BarberServicePrice[]>([]);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

  const today = new Date();
  const [calendarDate, setCalendarDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [notes, setNotes] = useState("");

  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authPassword, setAuthPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  const [reservationLoading, setReservationLoading] = useState(false);
  const [reservationError, setReservationError] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const [historyReservations, setHistoryReservations] = useState<ReservationHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pendingDeposit, setPendingDeposit] = useState<PendingDepositState | null>(null);
  const [isPayingDeposit, setIsPayingDeposit] = useState(false);

  const preselectedServiceId = Number(searchParams.get("serviceId") || 0);
  const preselectedBarberId = Number(searchParams.get("barberId") || 0);
  const historyView = searchParams.get("view") === "history";
  const authView = searchParams.get("view") === "auth";

  const selectedDateObj = selectedDate ? new Date(`${selectedDate}T00:00:00`) : null;
  const selectedDay = selectedDateObj ? selectedDateObj.getDate() : null;

  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();

  const isCurrentCalendarMonth =
    calendarYear === today.getFullYear() &&
    calendarMonth === today.getMonth();

  const isPreviousMonthBlocked =
    calendarYear < today.getFullYear() ||
    (calendarYear === today.getFullYear() && calendarMonth <= today.getMonth());

  const buildDateString = (day: number) =>
    `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const currentCombinationPrice = useMemo(() => {
    if (!selectedBarber || !selectedService) return 0;

    const match = barberServicePrices.find(
      (x) => x.barberId === selectedBarber.id && x.serviceId === selectedService.id
    );

    return match?.price ?? 0;
  }, [selectedBarber, selectedService, barberServicePrices]);

  const totalPrice = useMemo(() => {
    if (!currentCombinationPrice) return "0€";
    return `${currentCombinationPrice}€`;
  }, [currentCombinationPrice]);

  const canGoStep2 = !!selectedService;
  const canGoStep3 = !!selectedBarber;
  const canGoStep4 = !!selectedDate && !!selectedTime;
  const canConfirm = !!name.trim() && !!phone.trim();
  const isAuthenticated = !!token;

  const getServicePriceRange = (serviceId: number) => {
    const prices = barberServicePrices
      .filter((x) => x.serviceId === serviceId)
      .map((x) => x.price)
      .sort((a, b) => a - b);

    if (prices.length === 0) return "—";

    const min = prices[0];
    const max = prices[prices.length - 1];

    if (min === max) return `${min}€`;

    return `${min}€–${max}€`;
  };

  const getBarberPriceForSelectedService = (barberId: number) => {
    if (!selectedService) return "—";

    const match = barberServicePrices.find(
      (x) => x.barberId === barberId && x.serviceId === selectedService.id
    );

    return match ? `${match.price}€` : "—";
  };

  const handlePrevMonth = () => {
    if (isPreviousMonthBlocked) return;
    setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const isPastDay = isCurrentCalendarMonth && day < today.getDate();
    if (isPastDay) return;

    setSelectedDate(buildDateString(day));
  };

  const handleNewReservation = () => {
    setShowSuccess(false);
    setReservationError("");
    setPendingDeposit(null);
    setNotes("");
    setSelectedTime("");
    setActiveStep(1);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        const parsed: AuthUser = JSON.parse(savedUser);
        setName(parsed.name || "");
        setPhone(parsed.phone || "");
        setEmail(parsed.email || "");
        setBirthday(isoToBirthdayInput(parsed.birthday));
      } catch {
        //
      }
    }
  }, []);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingData(true);
        setLoadError("");

        const [barbersData, servicesData, pricesData] = await Promise.all([
          getBarbers(),
          getServices(),
          getBarberServicePrices(),
        ]);

        const mappedBarbers: Barber[] = barbersData.map((barber) => ({
          id: barber.id,
          name: barber.name,
          specialty: barber.specialty,
          price: barber.price,
          experience: barber.experience,
          image:
            barberPresentation[barber.id]?.image ||
            barber.imageUrl ||
            "/assets/barber-1.jpg",
          description:
            barberPresentation[barber.id]?.description ||
            "Barbero profesional con experiencia y atención al detalle.",
          tags: barberPresentation[barber.id]?.tags || [
            "Estilo",
            "Detalle",
            "Experiencia",
          ],
        }));

        const mappedServices: Service[] = servicesData.map((service) => ({
          id: service.id,
          name: service.name,
          description: service.description,
          durationMinutes: service.durationMinutes,
          price: service.price,
          requiresDeposit: service.requiresDeposit,
          depositAmount: service.depositAmount,
        }));

        setBarbers(mappedBarbers);
        setServices(mappedServices);
        setBarberServicePrices(pricesData);

        const initialBarber =
          mappedBarbers.find((b) => b.id === preselectedBarberId) ||
          mappedBarbers[0] ||
          null;

        const initialService =
          mappedServices.find((s) => s.id === preselectedServiceId) ||
          mappedServices[0] ||
          null;

        setSelectedBarber(initialBarber);
        setSelectedService(initialService);

        if (!historyView && !authView) {
          if (preselectedServiceId && preselectedBarberId) {
            setActiveStep(3);
          } else if (preselectedServiceId || preselectedBarberId) {
            setActiveStep(2);
          }
        }
      } catch (error) {
        console.error(error);
        setLoadError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los datos iniciales."
        );
      } finally {
        setLoadingData(false);
      }
    }

    loadInitialData();
  }, [preselectedBarberId, preselectedServiceId, historyView, authView]);

  useEffect(() => {
    const currentSelected =
      selectedDateObj &&
      selectedDateObj.getFullYear() === calendarYear &&
      selectedDateObj.getMonth() === calendarMonth;

    if (currentSelected) return;

    const firstAvailableDay =
      isCurrentCalendarMonth ? Math.max(today.getDate(), 1) : 1;

    setSelectedDate(buildDateString(firstAvailableDay));
  }, [calendarYear, calendarMonth]);

  useEffect(() => {
    async function loadSlots() {
      if (!selectedBarber || !selectedService || !selectedDate || historyView || authView) return;

      try {
        const slots = await getAvailableSlots(selectedBarber.id, selectedService.id, selectedDate);
        setAvailableTimes(slots);

        if (!slots.includes(selectedTime)) {
          setSelectedTime(slots[0] || "");
        }
      } catch {
        setAvailableTimes([]);
      }
    }

    loadSlots();
  }, [selectedBarber, selectedService, selectedDate, historyView, authView]);

  useEffect(() => {
    async function loadHistory() {
      if (!historyView || !token) return;

      try {
        setHistoryLoading(true);
        const result = await getMyReservations(token);
        setHistoryReservations(result);
      } catch {
        setHistoryReservations([]);
      } finally {
        setHistoryLoading(false);
      }
    }

    loadHistory();
  }, [historyView, token]);

  const BARBERSHOP_WHATSAPP = "59167560655";

  function formatDepositExpiry(expiresAt?: string) {
    if (!expiresAt) return "";
    const parsed = new Date(expiresAt);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleString();
  }

  function getDepositStatusLabel(status?: string) {
    const normalized = (status || "").toLowerCase();
    if (normalized === "pending") return "Pendiente de pago";
    if (normalized === "waitingvalidation") return "Pago en revisión";
    if (normalized === "paid") return "Pagada";
    if (normalized === "expired") return "Expirada";
    if (normalized === "rejected") return "Rechazada";
    return status || "No requerida";
  }

  function getDepositStatusClass(status?: string) {
    const normalized = (status || "").toLowerCase();
    if (normalized === "waitingvalidation") return "review";
    if (normalized === "paid") return "confirmed";
    if (normalized === "expired" || normalized === "rejected") return "cancelled";
    return "pending";
  }

  function getReservationStatusLabel(status?: string) {
    const normalized = (status || "").toLowerCase();
    if (normalized === "confirmed") return "Confirmada";
    if (normalized === "completed") return "Completada";
    if (normalized === "cancelled") return "Cancelada";
    if (normalized === "pending") return "Pendiente";
    return status || "Pendiente";
  }

  function getReservationStatusClass(status?: string) {
    const normalized = (status || "").toLowerCase();
    if (normalized === "confirmed" || normalized === "completed") return "confirmed";
    if (normalized === "cancelled") return "cancelled";
    return "pending";
  }

  const isReceiptAlreadySent = pendingDeposit?.status === "WaitingValidation";

  function buildWhatsAppDepositMessage() {
    if (!pendingDeposit || !selectedService || !selectedBarber) return "";

    return [
      "Hola, envío comprobante de pago de señal.",
      `Reserva #${pendingDeposit.reservationId}`,
      `Cliente: ${name}`,
      `Servicio: ${selectedService.name}`,
      `Barbero: ${selectedBarber.name}`,
      `Fecha: ${selectedDate}`,
      `Hora: ${selectedTime}`,
      `Importe señal: ${pendingDeposit.amount}`,
    ].join("\n");
  }

  function openDepositWhatsApp() {
    const message = buildWhatsAppDepositMessage();
    if (!message) return;

    const url = `https://wa.me/${BARBERSHOP_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const handleLogin = async () => {
  try {
    setAuthLoading(true);
    setAuthError("");
    setAuthSuccess("");

    const response = await login(email, authPassword);

    localStorage.setItem("token", response.token);
    localStorage.setItem("user", JSON.stringify(response.user));

    setToken(response.token);
    setName(response.user.name || "");
    setPhone(response.user.phone || "");
    setEmail(response.user.email || "");
    setBirthday(isoToBirthdayInput(response.user.birthday));

    if (authView) {
      navigate("/");
    }
  } catch (error) {
    setAuthError(error instanceof Error ? error.message : "Error al iniciar sesión");
  } finally {
    setAuthLoading(false);
  }
};

const handleRegister = async () => {
  try {
    setAuthLoading(true);
    setAuthError("");
    setAuthSuccess("");

    if (authPassword.length < 6) {
      setAuthError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (authPassword !== confirmPassword) {
      setAuthError("Las contraseñas no coinciden.");
      return;
    }

    const birthdayIso = birthday ? birthdayInputToIso(birthday) : "";

    if (birthday && !birthdayIso) {
      setAuthError("Escribe la fecha de cumpleaños como dd/mm/aaaa.");
      return;
    }

    const response = await register({
      name,
      email,
      phone,
      password: authPassword,
      birthday: birthdayIso || undefined,
    });

    localStorage.setItem("token", response.token);
    localStorage.setItem("user", JSON.stringify(response.user));

    setToken(response.token);
    setName(response.user.name || "");
    setPhone(response.user.phone || "");
    setEmail(response.user.email || "");
    setBirthday(isoToBirthdayInput(response.user.birthday));

    if (authView) {
      navigate("/");
    }
  } catch (error) {
    setAuthError(error instanceof Error ? error.message : "Error al crear la cuenta");
  } finally {
    setAuthLoading(false);
  }
};

const handleResetPassword = async () => {
  try {
    setAuthLoading(true);
    setAuthError("");
    setAuthSuccess("");

    const birthdayIso = birthdayInputToIso(birthday);

    if (!email || !birthday || !authPassword) {
      setAuthError("Completa tu email, fecha de nacimiento y nueva contraseña.");
      return;
    }

    if (!birthdayIso) {
      setAuthError("Escribe la fecha de nacimiento como dd/mm/aaaa.");
      return;
    }

    if (authPassword.length < 6) {
      setAuthError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (authPassword !== confirmPassword) {
      setAuthError("Las contraseñas no coinciden.");
      return;
    }

    await resetPassword({
      email,
      birthday: birthdayIso,
      newPassword: authPassword,
    });

    setAuthPassword("");
    setConfirmPassword("");
    setAuthMode("login");
    setAuthSuccess("Contrasena actualizada. Ya puedes iniciar sesion.");
  } catch (error) {
    setAuthError(error instanceof Error ? error.message : "No se pudo recuperar la contraseña");
  } finally {
    setAuthLoading(false);
  }
};

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
  };

  const handleAuthModeChange = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthError("");
    setAuthSuccess("");
  };

  const authFormProps = {
    mode: authMode,
    name,
    phone,
    email,
    birthday,
    password: authPassword,
    confirmPassword,
    showPassword,
    loading: authLoading,
    error: authError,
    success: authSuccess,
    onModeChange: handleAuthModeChange,
    onNameChange: setName,
    onPhoneChange: setPhone,
    onEmailChange: setEmail,
    onBirthdayChange: setBirthday,
    onPasswordChange: setAuthPassword,
    onConfirmPasswordChange: setConfirmPassword,
    onTogglePassword: () => setShowPassword((prev) => !prev),
    onLogin: handleLogin,
    onRegister: handleRegister,
    onRecover: handleResetPassword,
  };

  const handleConfirm = async () => {
    if (!canConfirm || !selectedBarber || !selectedService || !selectedDate || !selectedTime) {
      return;
    }

    if (!token) {
      setReservationError("Debes iniciar sesión o crear una cuenta antes de reservar.");
      return;
    }

    try {
      setReservationLoading(true);
      setReservationError("");
      setShowSuccess(false);

      const result = await createReservation(token, {
        barberId: selectedBarber.id,
        serviceId: selectedService.id,
        date: selectedDate,
        time: selectedTime,
        notes,
      });

      if (result.requiresDeposit) {
        setPendingDeposit({
          reservationId: result.reservationId,
          amount: result.depositAmount,
          status: result.depositStatus,
          expiresAt: result.depositExpiresAt,
        });
      } else {
        setPendingDeposit(null);
      }

      setShowSuccess(true);

      const updatedSlots = await getAvailableSlots(
        selectedBarber.id,
        selectedService.id,
        selectedDate
      );
      setAvailableTimes(updatedSlots);

      if (!updatedSlots.includes(selectedTime)) {
        setSelectedTime(updatedSlots[0] || "");
      }
    } catch (error) {
      setReservationError(
        error instanceof Error ? error.message : "No se pudo crear la reserva"
      );
    } finally {
      setReservationLoading(false);
    }
  };

  const handleMarkReceiptSent = async () => {
  if (!pendingDeposit || !token) return;

  try {
    setIsPayingDeposit(true);
    setReservationError("");

    await markDepositReceiptSent(token, pendingDeposit.reservationId);

    setPendingDeposit((current) =>
      current
        ? {
            ...current,
            status: "WaitingValidation",
          }
        : null
    );

    setShowSuccess(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    setReservationError(
      error instanceof Error ? error.message : "Error marcando el comprobante"
    );
  } finally {
    setIsPayingDeposit(false);
  }
};

  const handleShowMyReservations = () => {
    navigate("/reservar?view=history");
  };

  if (historyView) {
    return (
      <div className="app">
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
                <div className="brand-title">
                  La <span>Guarida</span>
                </div>
                <div className="brand-subtitle">Barber Studio</div>
              </div>
            </div>

            <Link to="/" className="btn btn-secondary">
              ← Volver al inicio
            </Link>
          </div>
        </header>

        <section className="section">
          <div className="container">
            <p className="eyebrow">TU HISTORIAL</p>
            <h2 className="section-title">
              Hola, <span>{name || "cliente"}</span>
            </h2>
            <p className="section-description">
              Aquí puedes ver todas tus citas pasadas y próximas.
            </p>

            <div className="history-header-row">
              <div className="history-title-wrap">
                <div className="history-title-icon">↻</div>
                <h3>Mis Reservas</h3>
              </div>
              <span className="history-count">
                {historyReservations.length} {historyReservations.length === 1 ? "cita" : "citas"}
              </span>
            </div>

            {historyLoading ? (
              <div className="booking-box">
                <p>Cargando reservas...</p>
              </div>
            ) : historyReservations.length === 0 ? (
              <div className="booking-box">
                <p>No tienes reservas todavía.</p>
              </div>
            ) : (
              <div className="history-list">
                {historyReservations.map((item) => {
                  const [year, month, day] = item.date.split("-");
                  const monthNamesShort = [
                    "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
                    "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"
                  ];
                  const monthLabel = month ? monthNamesShort[Number(month) - 1] : "";

                  return (
                    <div key={item.id} className="history-card">
                      <div className="history-date-box">
                        <strong>{day}</strong>
                        <span>{monthLabel}</span>
                        <small>{year}</small>
                      </div>

                      <div className="history-main">
                        <div className="history-top-line">
                          <h4>{item.service}</h4>
                          <span className={`history-status ${getReservationStatusClass(item.status)}`}>
                            {getReservationStatusLabel(item.status)}
                          </span>
                        </div>

                        <div className="history-meta">
                          <span>Barbero: {item.barber}</span>
                          <span>Hora: {item.time}</span>
                        </div>

                        {item.notes && <p className="history-notes">{item.notes}</p>}

                        {item.depositStatus && item.depositStatus !== "NotRequired" ? (
                          <div className="history-deposit-row">
                            <span>Señal: {item.depositAmount ?? 0}€</span>
                            <span className={`history-status ${getDepositStatusClass(item.depositStatus)}`}>
                              {getDepositStatusLabel(item.depositStatus)}
                            </span>
                          </div>
                        ) : null}

                        {item.depositExpiresAt ? (
                          <small className="admin-cell-muted">
                            Expira: {formatDepositExpiry(item.depositExpiresAt)}
                          </small>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (authView && !isAuthenticated) {
    return (
      <div className="app">
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
                <div className="brand-title">
                  La <span>Guarida</span>
                </div>
                <div className="brand-subtitle">Barber Studio</div>
              </div>
            </div>

            <Link to="/" className="btn btn-secondary">
              ← Volver al home
            </Link>
          </div>
        </header>

        <section className="section">
          <div className="container">
            <AuthForm {...authFormProps} context="account" />
          </div>
        </section>
      </div>
    );
  }

  if (authView && isAuthenticated) {
    return (
      <div className="app">
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
                <div className="brand-title">
                  La <span>Guarida</span>
                </div>
                <div className="brand-subtitle">Barber Studio</div>
              </div>
            </div>

            <Link to="/" className="btn btn-secondary">
              ← Volver al home
            </Link>
          </div>
        </header>

        <section className="section">
          <div className="container">
            <div className="booking-box">
              <h3>Ya has iniciado sesión</h3>
              <div className="booking-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    window.location.href = "/reservar";
                  }}
                >
                  Ir a reservar
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="app">
        <div className="container page-state">
          <h2>Cargando datos...</h2>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app">
        <div className="container page-state">
          <h2>{loadError}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
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
              <div className="brand-title">
                La <span>Guarida</span>
              </div>
              <div className="brand-subtitle">Barber Studio</div>
            </div>
          </div>

          <Link to="/" className="btn btn-secondary">
            ← Volver al home
          </Link>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <div className="section-head center">
            <p className="eyebrow">RESERVA TU CITA</p>
            <h2 className="section-title">
              Tu momento <span>premium</span>
            </h2>
            <p className="section-description center-text">
              Reserva en menos de 2 minutos. Sin esperas, sin complicaciones.
            </p>
          </div>

          {showSuccess ? (
            <div className="booking-box booking-success-wrapper">
              <div className="confirmation-panel">
                <div className="confirmation-icon">✓</div>

                <h3 className="confirmation-title">
                  {pendingDeposit
                    ? isReceiptAlreadySent
                      ? "Reserva confirmada"
                      : "Pago pendiente"
                    : "Cita confirmada"}
                </h3>

                <p className="confirmation-subtitle">
                  {pendingDeposit ? (
                    isReceiptAlreadySent ? (
                      <>
                        La reserva quedó registrada y el pago está
                        <strong> pendiente de revisión</strong>. Te avisaremos cuando la barbería valide el comprobante.
                      </>
                    ) : (
                      <>
                        Tu reserva está guardada. Para confirmarla, paga la señal con el QR y envía el comprobante por WhatsApp.
                      </>
                    )
                  ) : (
                    <>
                      Tu reserva ha sido registrada. Te esperamos el <strong>{selectedDate}</strong> a las <strong>{selectedTime}</strong>.
                    </>
                  )}
                </p>

                <div className="confirmation-summary">
                  <div className="confirmation-row">
                    <span>Servicio</span>
                    <strong>{selectedService?.name}</strong>
                  </div>
                  <div className="confirmation-row">
                    <span>Barbero</span>
                    <strong>{selectedBarber?.name}</strong>
                  </div>
                  <div className="confirmation-row">
                    <span>Fecha</span>
                    <strong>{selectedDate}</strong>
                  </div>
                  <div className="confirmation-row">
                    <span>Hora</span>
                    <strong>{selectedTime}</strong>
                  </div>
                  <div className="confirmation-row">
                    <span>Total</span>
                    <strong className="confirmation-price">{totalPrice}</strong>
                  </div>
                  {pendingDeposit ? (
                    <div className="confirmation-row">
                      <span>Señal</span>
                      <strong>{pendingDeposit.amount}€</strong>
                    </div>
                  ) : null}
                </div>

                {pendingDeposit && !isReceiptAlreadySent ? (
                  <div className="payment-panel">
                    <div className="qr-payment-box">
                      <img
                        src="/assets/qr-barberia.png"
                        alt="QR de pago de la barbería"
                        className="qr-payment-image"
                      />
                      <div className="qr-payment-info">
                        <p><strong>Escanea este QR para pagar la señal.</strong></p>
                        <p>Monto: <strong>{pendingDeposit.amount}€</strong></p>
                        <p>Reserva: <strong>#{pendingDeposit.reservationId}</strong></p>
                      </div>
                    </div>

                    {pendingDeposit.expiresAt ? (
                      <p className="payment-expiry">
                        Debes enviar el comprobante antes de <strong>{formatDepositExpiry(pendingDeposit.expiresAt)}</strong>.
                      </p>
                    ) : null}

                    <div className="confirmation-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={openDepositWhatsApp}
                      >
                        Enviar por WhatsApp
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleMarkReceiptSent}
                        disabled={isPayingDeposit}
                      >
                        {isPayingDeposit ? "Enviando..." : "Ya envié el comprobante"}
                      </button>
                    </div>
                  </div>
                ) : null}

                {pendingDeposit && isReceiptAlreadySent ? (
                  <div className="confirmation-status-card">
                    Reserva confirmada. Pago pendiente de revisión.
                  </div>
                ) : null}

                <div className="confirmation-actions">
                  {isReceiptAlreadySent ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleShowMyReservations}
                    >
                      Ver mis reservas
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleNewReservation}
                  >
                    Nueva reserva
                  </button>

                  <Link to="/" className="btn btn-secondary">
                    Home
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="booking-box">
              <div className="stepper">
                <div className={`step ${activeStep >= 1 ? "done" : ""}`}>
                  <div className="circle">{activeStep > 1 ? "✓" : "1"}</div>
                  <span>Servicio</span>
                </div>
                <div className={`step ${activeStep >= 2 ? "done" : ""}`}>
                  <div className="circle">{activeStep > 2 ? "✓" : "2"}</div>
                  <span>Barbero</span>
                </div>
                <div className={`step ${activeStep >= 3 ? "done" : ""}`}>
                  <div className="circle">{activeStep > 3 ? "✓" : "3"}</div>
                  <span>Fecha & Hora</span>
                </div>
                <div className={`step ${activeStep >= 4 ? "done" : ""}`}>
                  <div className="circle">4</div>
                  <span>Tus Datos</span>
                </div>
              </div>

              {activeStep === 1 && (
                <div className="step-content">
                  <h3>Elige tu servicio</h3>

                  <div className="booking-services-grid">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        className={`booking-service-item ${
                          selectedService?.id === service.id ? "selected" : ""
                        }`}
                        onClick={() => setSelectedService(service)}
                      >
                        <div>
                          <strong>{service.name}</strong>
                          <p>{service.durationMinutes} min</p>
                          {service.requiresDeposit ? (
                            <small className="service-deposit-note">
                              Señal: {service.depositAmount ?? 0}€
                            </small>
                          ) : null}
                        </div>
                        <div className="price-block">
                          <strong>{getServicePriceRange(service.id)}</strong>
                          <small>según barbero</small>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="booking-actions">
                    <div />
                    <button
                      className="btn btn-primary"
                      disabled={!canGoStep2}
                      onClick={() => setActiveStep(2)}
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="step-content">
                  <h3>Elige tu barbero</h3>

                  <div className="barbers-grid">
                    {barbers.map((barber) => (
                      <button
                        key={barber.id}
                        className={`barber-card ${
                          selectedBarber?.id === barber.id ? "selected" : ""
                        }`}
                        onClick={() => setSelectedBarber(barber)}
                      >
                        <img src={barber.image} alt={barber.name} />
                        <h4>{barber.name}</h4>
                        <p>{barber.specialty}</p>
                        <span>{getBarberPriceForSelectedService(barber.id)}</span>
                      </button>
                    ))}
                  </div>

                  <p className="helper-text">
                    El precio cambia según el servicio y el barbero seleccionado.
                  </p>

                  <div className="booking-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setActiveStep(1)}
                    >
                      ← Anterior
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={!canGoStep3}
                      onClick={() => setActiveStep(3)}
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="step-content">
                  <h3>Elige fecha y hora</h3>

                  <div className="date-time-grid">
                    <div className="calendar-box">
                      <div className="calendar-header">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          disabled={isPreviousMonthBlocked}
                        >
                          {"<"}
                        </button>
                        <strong>
                          {monthNames[calendarMonth]} {calendarYear}
                        </strong>
                        <button type="button" onClick={handleNextMonth}>
                          {">"}
                        </button>
                      </div>

                      <div className="calendar-weekdays">
                        <span>Do</span>
                        <span>Lu</span>
                        <span>Ma</span>
                        <span>Mi</span>
                        <span>Ju</span>
                        <span>Vi</span>
                        <span>Sá</span>
                      </div>

                      <div className="calendar-days">
                        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                          <div key={`empty-${index}`} className="calendar-empty" />
                        ))}

                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                          const isPastDay = isCurrentCalendarMonth && day < today.getDate();
                          const isSelected = day === selectedDay;

                          return (
                            <button
                              key={day}
                              type="button"
                              disabled={isPastDay}
                              className={`calendar-day ${isSelected ? "selected" : ""} ${
                                isPastDay ? "disabled" : ""
                              }`}
                              onClick={() => handleSelectDay(day)}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="times-box">
                      <p className="times-title">Horarios disponibles</p>

                      {availableTimes.length === 0 ? (
                        <p>No hay horarios disponibles para este día.</p>
                      ) : (
                        <div className="times-grid">
                          {availableTimes.map((time) => (
                            <button
                              key={time}
                              type="button"
                              className={`time-btn ${
                                selectedTime === time ? "selected" : ""
                              }`}
                              onClick={() => setSelectedTime(time)}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="booking-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setActiveStep(2)}
                    >
                      ← Anterior
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={!canGoStep4}
                      onClick={() => setActiveStep(4)}
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              )}

              {activeStep === 4 && (
                <div className="step-content">
                  <h3>{!isAuthenticated ? "Inicia sesión o regístrate" : "Tus datos personales"}</h3>

                  {isAuthenticated && (
                    <div className="reservation-summary">
                      <span>{selectedService?.name}</span>
                      <span>{selectedBarber?.name}</span>
                      <span>{selectedDate}</span>
                      <span>{selectedTime}</span>
                      <strong>Total {totalPrice}</strong>
                      {selectedService?.requiresDeposit ? (
                        <strong>Señal {selectedService.depositAmount ?? 0}€</strong>
                      ) : null}
                    </div>
                  )}

                  {!isAuthenticated ? (
                    <AuthForm {...authFormProps} context="booking" />
                  ) : (
                    <>
                      <div className="auth-ok">
                        <p>Sesión iniciada correctamente.</p>
                        <div className="booking-actions">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleLogout}
                          >
                            Cerrar sesión
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleShowMyReservations}
                          >
                            Ver mis reservas
                          </button>
                        </div>
                      </div>

                      <div className="form-grid">
                        <div className="field">
                          <label>Nombre *</label>
                          <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Tu nombre"
                          />
                        </div>

                        <div className="field">
                          <label>Teléfono *</label>
                          <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Tu número de teléfono"
                          />
                          {!phone.trim() && (
                            <small className="error-text">Requerido</small>
                          )}
                        </div>

                        <div className="field full-width">
                          <label>Email *</label>
                          <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                          />
                        </div>

                        <div className="field">
                          <label>Fecha de cumpleaños</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={10}
                            value={birthday}
                            onChange={(e) => setBirthday(formatBirthdayInput(e.target.value))}
                            placeholder="dd/mm/aaaa"
                          />
                        </div>

                        <div className="field full-width">
                          <label>Notas (opcional)</label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Alguna preferencia o indicación especial..."
                            maxLength={500}
                          />
                          <small className="char-counter">{notes.length}/500</small>
                        </div>
                      </div>

                      {reservationError && (
                        <div className="error-text form-error">
                          {reservationError}
                        </div>
                      )}

                      <div className="booking-actions">
                        <button
                          className="btn btn-secondary"
                          onClick={() => setActiveStep(3)}
                        >
                          ← Anterior
                        </button>
                        <button
                          className="btn btn-primary"
                          disabled={!canConfirm || reservationLoading}
                          onClick={handleConfirm}
                        >
                          {reservationLoading ? "Confirmando..." : "Confirmar reserva ✓"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

