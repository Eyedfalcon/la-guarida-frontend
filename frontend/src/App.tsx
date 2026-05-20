import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type TouchEvent as ReactTouchEvent,
} from "react";
import BarberPanelPage from "./pages/BarberPanelPage";
import {
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import AdminPage from "./pages/AdminPage";
import BookingPage from "./pages/BookingPage";
import { getBarbers, getServices } from "./services/reservationService";
import {
  getBarberServicePrices,
  type BarberServicePrice,
} from "./services/barberServicePriceService";

type Service = {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
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
  role?: string;
};

const barberPresentation: Record<
  number,
  { description: string; tags: string[]; image: string }
> = {
  1: {
    image: "/assets/barber-1.jpeg",
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

function ScrollToTop() {
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname, location.search, location.key]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  return null;
}

function HomePage() {
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [barberServicePrices, setBarberServicePrices] = useState<
    BarberServicePrice[]
  >([]);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const barberStripRef = useRef<HTMLDivElement | null>(null);
  const barberStripInitializedRef = useRef(false);
  const barbersUserInteractedRef = useRef(false);

  const selectedBarberIndex =
    barbers.findIndex((b) => b.id === selectedBarber?.id) + 1;

  const selectedBarberRawIndex = barbers.findIndex(
    (b) => b.id === selectedBarber?.id
  );

  function openBookingTab(options?: {
    serviceId?: number;
    barberId?: number;
    view?: string;
  }) {
    const params = new URLSearchParams();

    if (options?.serviceId) params.set("serviceId", String(options.serviceId));
    if (options?.barberId) params.set("barberId", String(options.barberId));
    if (options?.view) params.set("view", options.view);

    const url = params.toString() ? `/reservar?${params.toString()}` : "/reservar";

    navigate(url);
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const goToPreviousBarber = () => {
    if (barbers.length === 0 || selectedBarberRawIndex === -1) return;

    barbersUserInteractedRef.current = true;

    const previousIndex =
      selectedBarberRawIndex === 0
        ? barbers.length - 1
        : selectedBarberRawIndex - 1;

    setSelectedBarber(barbers[previousIndex]);
  };

  const goToNextBarber = () => {
    if (barbers.length === 0 || selectedBarberRawIndex === -1) return;

    barbersUserInteractedRef.current = true;

    const nextIndex =
      selectedBarberRawIndex === barbers.length - 1
        ? 0
        : selectedBarberRawIndex + 1;

    setSelectedBarber(barbers[nextIndex]);
  };

  const handleBarberTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.changedTouches[0].clientX;
  };

  const handleBarberTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;

    const endX = event.changedTouches[0].clientX;
    const diff = endX - touchStartXRef.current;

    if (Math.abs(diff) < 50) {
      touchStartXRef.current = null;
      return;
    }

    if (diff < 0) {
      goToNextBarber();
    } else {
      goToPreviousBarber();
    }

    touchStartXRef.current = null;
  };

  const getServicePriceRange = (serviceId: number) => {
    const prices = barberServicePrices
      .filter((x) => x.serviceId === serviceId)
      .map((x) => x.price)
      .sort((a, b) => a - b);

    if (prices.length === 0) {
      const service = services.find((x) => x.id === serviceId);
      return service ? `${service.price}€` : "—";
    }

    const min = prices[0];
    const max = prices[prices.length - 1];

    return min === max ? `${min}€` : `${min}€–${max}€`;
  };

  const loadUserFromStorage = () => {
    const raw = localStorage.getItem("user");

    if (!raw) {
      setUser(null);
      return;
    }

    try {
      setUser(JSON.parse(raw));
    } catch {
      setUser(null);
    }
  };

  useLayoutEffect(() => {
    const forceTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    forceTop();

    const frame = requestAnimationFrame(forceTop);
    const timeout = window.setTimeout(forceTop, 60);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const forceTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    if (!loading) {
      forceTop();
      const frame = requestAnimationFrame(forceTop);
      const timeout = window.setTimeout(forceTop, 80);

      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timeout);
      };
    }
  }, [loading]);

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);

        const [barbersData, servicesData, pricesData] = await Promise.all([
          getBarbers(),
          getServices(),
          getBarberServicePrices(),
        ]);

        const mappedBarbers: Barber[] = barbersData.map((barber: any) => ({
          id: barber.id,
          name: barber.name,
          specialty: barber.specialty,
          price: barber.price,
          experience: barber.experience,
          image:
            barberPresentation[barber.id]?.image ||
            barber.imageUrl ||
            "/assets/barber-1.jpeg",
          description:
            barberPresentation[barber.id]?.description ||
            "Barbero profesional con experiencia y atención al detalle.",
          tags: barberPresentation[barber.id]?.tags || [
            "Estilo",
            "Detalle",
            "Experiencia",
          ],
        }));

        const mappedServices: Service[] = servicesData.map((service: any) => ({
          id: service.id,
          name: service.name,
          description: service.description,
          durationMinutes: service.durationMinutes,
          price: service.price,
        }));

        setBarbers(mappedBarbers);
        setServices(mappedServices);
        setBarberServicePrices(pricesData);
        setSelectedBarber(mappedBarbers[0] || null);
      } catch (error) {
        console.error("Error cargando home:", error);
        alert(error instanceof Error ? error.message : "Error cargando datos del home");
      } finally {
        setLoading(false);
      }
    }

    void loadHomeData();
    loadUserFromStorage();
  }, []);

  useEffect(() => {
    const handleStorage = () => loadUserFromStorage();

    const handleClickOutside = (event: MouseEvent) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    window.addEventListener("storage", handleStorage);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!barberStripRef.current || !selectedBarber) return;
    if (!barbersUserInteractedRef.current) return;

    const container = barberStripRef.current;
    const activeCard = container.querySelector<HTMLButtonElement>(
      `[data-barber-id="${selectedBarber.id}"]`
    );

    if (!activeCard) return;

    const targetLeft =
      activeCard.offsetLeft - container.clientWidth / 2 + activeCard.clientWidth / 2;

    container.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: barberStripInitializedRef.current ? "smooth" : "auto",
    });

    barberStripInitializedRef.current = true;
  }, [selectedBarber?.id]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setProfileOpen(false);
    setMobileMenuOpen(false);
  };

  const handleMyReservations = () => {
    navigate("/reservar?view=history");
    setProfileOpen(false);
    setMobileMenuOpen(false);
  };

  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "→";

  if (loading) {
    return (
      <div className="app">
        <div className="container" style={{ padding: "80px 0" }}>
          <h2>Cargando...</h2>
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

          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Abrir menú"
            type="button"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>

          <nav className={`menu ${mobileMenuOpen ? "menu-open" : ""}`}>
            <button onClick={() => scrollToSection("inicio")}>Inicio</button>
            <button onClick={() => scrollToSection("servicios")}>Servicios</button>
            <button onClick={() => scrollToSection("barberos")}>Barberos</button>
            <button onClick={() => openBookingTab()}>Reservar</button>
            <button onClick={() => scrollToSection("contacto")}>Contacto</button>

            <div className="mobile-menu-divider" />

            {user ? (
              <div className="mobile-menu-account">
                <div className="mobile-menu-user">
                  <span className="mobile-menu-avatar">{initial}</span>
                  <div>
                    <div className="mobile-menu-user-name">{user.name}</div>
                    <div className="mobile-menu-user-email">{user.email}</div>
                  </div>
                </div>

                {user.role === "Admin" && (
                  <button
                    type="button"
                    className="mobile-menu-link"
                    onClick={() => {
                      navigate("/admin");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Panel admin
                  </button>
                )}
                {user.role === "Barber" && (
  <button
    type="button"
    className="mobile-menu-link"
    onClick={() => {
      navigate("/barber");
      setMobileMenuOpen(false);
    }}
  >
    Mi panel
  </button>
)}

                <button
                  type="button"
                  className="mobile-menu-link"
                  onClick={handleMyReservations}
                >
                  Mis reservas
                </button>

                <button
                  type="button"
                  className="mobile-menu-link danger"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="mobile-menu-account">
                <button
                  type="button"
                  className="mobile-menu-link"
                  onClick={() => openBookingTab({ view: "auth" })}
                >
                  Iniciar sesión
                </button>
              </div>
            )}
          </nav>

          <div className="profile-menu-wrapper" ref={profileRef}>
            <button
              type="button"
              className="profile-trigger"
              onClick={() => {
                if (user) {
                  setProfileOpen((prev) => !prev);
                } else {
                  openBookingTab({ view: "auth" });
                }
              }}
            >
              <span className="profile-avatar">{initial}</span>
              <span className="profile-name">
                {user ? user.name : "Iniciar sesión"}
              </span>
              <span className="profile-caret">
                {user ? (profileOpen ? "⌃" : "⌄") : ""}
              </span>
            </button>

            {user && profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <div className="profile-dropdown-user">{user.name}</div>
                  <div className="profile-dropdown-email">{user.email}</div>
                </div>

                {user.role === "Admin" && (
                  <button
                    type="button"
                    className="profile-dropdown-item"
                    onClick={() => {
                      navigate("/admin");
                      setProfileOpen(false);
                    }}
                  >
                    <span className="profile-dropdown-icon">🛠</span>
                    <span>Panel admin</span>
                  </button>
                )}
                {user.role === "Barber" && (
  <button
    type="button"
    className="profile-dropdown-item"
    onClick={() => {
      navigate("/barber");
      setProfileOpen(false);
    }}
  >
    <span className="profile-dropdown-icon">✂</span>
    <span>Mi panel</span>
  </button>
)}

                <button
                  type="button"
                  className="profile-dropdown-item"
                  onClick={handleMyReservations}
                >
                  <span className="profile-dropdown-icon">📅</span>
                  <span>Mis reservas</span>
                </button>

                <button
                  type="button"
                  className="profile-dropdown-item danger"
                  onClick={handleLogout}
                >
                  <span className="profile-dropdown-icon">⎋</span>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <section id="inicio" className="hero">
        <div className="hero-overlay" />
        <div className="container hero-content">
          <p className="eyebrow">BARBER STUDIO · DESDE 2010</p>
          <h1 className="hero-title">
            La <span>Guarida</span>
            <br />
            Barber Studio
          </h1>
          <p className="hero-text">
            Donde cada corte es una obra de arte. Experiencia premium, estilo
            inigualable y atención al detalle que marca la diferencia.
          </p>

          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => openBookingTab()}>
              Reservar cita
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => scrollToSection("servicios")}
            >
              Ver servicios
            </button>
          </div>

          <div className="stats">
            <div className="stat">
              <h3>15+</h3>
              <p>Años de experiencia</p>
            </div>
            <div className="stat">
              <h3>6</h3>
              <p>Maestros barberos</p>
            </div>
            <div className="stat">
              <h3>5K+</h3>
              <p>Clientes satisfechos</p>
            </div>
          </div>
        </div>
      </section>

      <section id="servicios" className="section">
        <div className="container">
          <div className="section-head section-head-split">
            <div>
              <p className="eyebrow">NUESTROS SERVICIOS</p>
              <h2 className="section-title">
                Servicios que <span>definen tu estilo</span>
              </h2>
            </div>
            <p className="section-description">
              Cada servicio está diseñado para ofrecerte la mejor experiencia de
              grooming masculino.
            </p>
          </div>

          <div className="services-grid">
            {services.map((service, index) => (
              <article
                key={service.id}
                className="card service-card service-card-clickable"
                onClick={() => openBookingTab({ serviceId: service.id })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openBookingTab({ serviceId: service.id });
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="service-top">
                  <div className="service-icon service-icon-image">
                    <img src="/assets/barber-icon.png" alt="Icono barbería" />
                  </div>
                  <span className="service-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3>{service.name}</h3>
                <p>{service.description}</p>

                <div className="service-meta">
                  <span>{service.durationMinutes} min</span>
                  <strong>{getServicePriceRange(service.id)}</strong>
                </div>

                <button
                  className="btn btn-secondary full"
                  onClick={(e) => {
                    e.stopPropagation();
                    openBookingTab({ serviceId: service.id });
                  }}
                >
                  Seleccionar
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="barberos" className="section section-dark">
        <div className="container">
          <div className="section-head center">
            <p className="eyebrow">NUESTRO EQUIPO</p>
            <h2 className="section-title">
              Maestros del <span>Arte</span>
            </h2>
          </div>

          {selectedBarber && (
            <div className="featured-barber featured-barber-premium">
              <div
                className="featured-image-wrap"
                onTouchStart={handleBarberTouchStart}
                onTouchEnd={handleBarberTouchEnd}
              >
                <img
                  src={selectedBarber.image}
                  alt={selectedBarber.name}
                  className="featured-image"
                />

                <span className="badge">{selectedBarber.experience}</span>

                <div className="featured-image-controls">
                  <button
                    type="button"
                    className="featured-arrow ghost"
                    onClick={goToPreviousBarber}
                    aria-label="Barbero anterior"
                  >
                    <img
                      src="/assets/flecha-izquierda.png"
                      alt="Anterior"
                      className="featured-arrow-icon"
                    />
                  </button>

                  <button
                    type="button"
                    className="featured-arrow"
                    onClick={goToNextBarber}
                    aria-label="Barbero siguiente"
                  >
                    <img
                      src="/assets/flecha-derecha.png"
                      alt="Siguiente"
                      className="featured-arrow-icon"
                    />
                  </button>
                </div>
              </div>

              <div className="featured-content featured-content-premium">
                <p className="mini-index">
                  ( {String(selectedBarberIndex).padStart(2, "0")} /{" "}
                  {String(barbers.length).padStart(2, "0")} )
                </p>

                <h3>{selectedBarber.name}</h3>
                <p className="featured-specialty">{selectedBarber.specialty}</p>

                <div className="featured-quote-wrap">
                  <span className="featured-quote-mark">“</span>
                  <blockquote>{selectedBarber.description}</blockquote>
                </div>

                <div className="tags">
                  {selectedBarber.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>

                <div className="featured-dots">
                  {barbers.map((barber, index) => (
                    <button
                      key={barber.id}
                      type="button"
                      className={`featured-dot ${
                        selectedBarber.id === barber.id ? "active" : ""
                      }`}
                      onClick={() => {
                        barbersUserInteractedRef.current = true;
                        setSelectedBarber(barbers[index]);
                      }}
                      aria-label={`Ir a ${barber.name}`}
                    />
                  ))}
                </div>

                <button
                  className="btn btn-primary featured-reserve-btn"
                  onClick={() => openBookingTab({ barberId: selectedBarber.id })}
                >
                  Reservar con {selectedBarber.name.split(" ")[0]} →
                </button>
              </div>
            </div>
          )}

          <div ref={barberStripRef} className="barber-strip barber-strip-premium">
            {barbers.map((barber) => (
              <button
                key={barber.id}
                type="button"
                data-barber-id={barber.id}
                className={`barber-mini barber-mini-premium ${
                  selectedBarber?.id === barber.id ? "active" : ""
                }`}
                onClick={() => {
                  barbersUserInteractedRef.current = true;
                  setSelectedBarber(barber);
                }}
              >
                <div className="barber-mini-avatar-wrap">
                  <img src={barber.image} alt={barber.name} />
                </div>

                <h4>{barber.name.split(" ")[0]}</h4>
                <p>{barber.specialty}</p>
                <span>{barber.experience}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="contacto" className="section section-dark">
        <div className="container">
          <div className="section-head center">
            <p className="eyebrow">CONTACTO</p>
            <h2 className="section-title">
              Encuéntranos <span>aquí</span>
            </h2>
          </div>

          <div className="contact-grid">
            <div className="contact-left">
              <div className="contact-cards">
                <div className="card contact-card">
                  <h3>Dirección</h3>
                  <p>La Guarida Barber Studio</p>
                  <p>Cochabamba, Bolivia</p>
                </div>

                <div className="card contact-card">
                  <h3>Teléfono</h3>
                  <p>+591 000 000 000</p>
                  <p>+591 000 000 001</p>
                </div>

                <div className="card contact-card">
                  <h3>Horario</h3>
                  <p>Lun–Vie: 9:00 – 20:30</p>
                  <p>Sábado: 9:00 – 18:00</p>
                </div>

                <div className="card contact-card">
                  <h3>Email</h3>
                  <p>info@laguarida.com</p>
                  <p>reservas@laguarida.com</p>
                </div>
              </div>

              <div className="card social-box">
  <h3>Síguenos</h3>
  <div className="social-links social-links-icons">
    <a
      href="https://instagram.com/tu_cuenta"
      target="_blank"
      rel="noreferrer"
      aria-label="Instagram"
      className="social-icon-link"
    >
      <img src="/assets/instagram.png" alt="Instagram" />
      <span>Instagram</span>
    </a>

    <a
      href="https://facebook.com/tu_pagina"
      target="_blank"
      rel="noreferrer"
      aria-label="Facebook"
      className="social-icon-link"
    >
      <img src="/assets/facebook.png" alt="Facebook" />
      <span>Facebook</span>
    </a>

    <a
      href="https://tiktok.com/@tu_cuenta"
      target="_blank"
      rel="noreferrer"
      aria-label="TikTok"
      className="social-icon-link"
    >
      <img src="/assets/tiktok.png" alt="TikTok" />
      <span>TikTok</span>
    </a>
  </div>
</div>
            </div>

            <div className="map-card">
              <iframe
                title="Mapa La Guarida"
                src="https://www.google.com/maps?q=La%20Guarida%20Barber%20Studio%20Cochabamba&z=15&output=embed"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <div className="brand footer-brand">
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

            <p className="footer-text">
              Barbería premium donde el estilo se convierte en arte y cada visita
              es una experiencia única.
            </p>

            <ul className="footer-info">
              <li>Cochabamba, Bolivia</li>
              <li>+591 000 000 000</li>
              <li>Lun–Sáb: 9:00 – 20:30</li>
            </ul>

            <div className="social-circles social-circles-icons">
  <a
    href="https://instagram.com/tu_cuenta"
    target="_blank"
    rel="noreferrer"
    aria-label="Instagram"
  >
    <img src="/assets/instagram.png" alt="Instagram" />
  </a>

  <a
    href="https://facebook.com/tu_pagina"
    target="_blank"
    rel="noreferrer"
    aria-label="Facebook"
  >
    <img src="/assets/facebook.png" alt="Facebook" />
  </a>

  <a
    href="https://www.tiktok.com/@donnacho21?_r=1&_t=ZN-95iH6Ps73jS"
    target="_blank"
    rel="noreferrer"
    aria-label="TikTok"
  >
    <img src="/assets/tiktok.png" alt="TikTok" />
  </a>
</div>
          </div>

          <div>
            <h4>Servicios</h4>
            <ul>
              {services.map((service) => (
                <li key={service.id}>{service.name}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4>La Guarida</h4>
            <ul>
              <li>Sobre Nosotros</li>
              <li>Nuestro Equipo</li>
              <li>Galería</li>
              <li>Blog</li>
            </ul>
          </div>

          <div>
            <h4>Legal</h4>
            <ul>
              <li>Política de Privacidad</li>
              <li>Términos de Uso</li>
              <li>Cookies</li>
            </ul>
          </div>
        </div>

        <div className="container footer-bottom">
          <p>© 2026 La Guarida Barber Studio. Todos los derechos reservados.</p>
          <button onClick={() => scrollToSection("inicio")}>Volver arriba ↑</button>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/reservar" element={<BookingPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/barber" element={<BarberPanelPage />} />
      </Routes>
    </>
  );
}