import { useMemo, useState } from "react";

type Service = {
  id: number;
  name: string;
  description: string;
  duration: number;
  price: string;
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

const services: Service[] = [
  {
    id: 1,
    name: "Corte Clásico",
    description: "Corte tradicional con tijera y máquina, acabado impecable.",
    duration: 30,
    price: "18–25€",
  },
  {
    id: 2,
    name: "Degradado",
    description: "Fade perfecto con transición suave y definida.",
    duration: 45,
    price: "22–35€",
  },
  {
    id: 3,
    name: "Arreglo de Barba",
    description: "Perfilado, recorte y definición de barba con navaja.",
    duration: 20,
    price: "12–20€",
  },
  {
    id: 4,
    name: "Corte + Barba",
    description: "Servicio completo: corte a medida y arreglo de barba.",
    duration: 60,
    price: "30–42€",
  },
  {
    id: 5,
    name: "Tratamiento Premium",
    description: "Experiencia completa: corte, barba, mascarilla y masaje.",
    duration: 90,
    price: "50–65€",
  },
];

const barbers: Barber[] = [
  {
    id: 1,
    name: "Marco Reyes",
    specialty: "Degradados & Fades",
    price: 25,
    experience: "5+ años",
    image: "/assets/barber-1.jpg",
    description:
      "Especialista en fades limpios y cortes modernos con acabados precisos.",
    tags: ["Fade", "Precisión", "Moderno", "Textura"],
  },
  {
    id: 2,
    name: "Carlos Rodriguez",
    specialty: "Cortes Clásicos & Barba",
    price: 20,
    experience: "6+ años",
    image: "/assets/barber-2.jpg",
    description:
      "Barbero versátil, experto en estilos clásicos, peinados elegantes y barba.",
    tags: ["Clásico", "Barba", "Elegancia", "Tradición"],
  },
  {
    id: 3,
    name: "Alex Torres",
    specialty: "Tratamientos Premium",
    price: 18,
    experience: "4+ años",
    image: "/assets/barber-3.jpg",
    description:
      "Especializado en cuidado integral, tratamientos y asesoría de imagen.",
    tags: ["Premium", "Cuidado", "Asesoría", "Detalle"],
  },
  {
    id: 4,
    name: "Diego Vargas",
    specialty: "Diseños & Líneas",
    price: 22,
    experience: "7+ años",
    image: "/assets/barber-4.jpg",
    description:
      "Artista del cabello especializado en diseños geométricos y líneas de precisión.",
    tags: ["Diseño", "Creatividad", "Experiencia", "Detalle"],
  },
  {
    id: 5,
    name: "Rubén Castillo",
    specialty: "Barbas & Afeitado Clásico",
    price: 23,
    experience: "8+ años",
    image: "/assets/barber-5.jpg",
    description:
      "Experto en afeitado tradicional, perfilado y cuidado premium de barba.",
    tags: ["Barba", "Navaja", "Perfilado", "Clásico"],
  },
  {
    id: 6,
    name: "Iván Morales",
    specialty: "Cortes Urbanos & Textura",
    price: 19,
    experience: "5+ años",
    image: "/assets/barber-6.jpg",
    description:
      "Especializado en estilos urbanos, textura, volumen y acabados actuales.",
    tags: ["Urbano", "Textura", "Volumen", "Estilo"],
  },
];

const availableTimes = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
];

function App() {
  const [activeStep, setActiveStep] = useState(1);

  const [selectedService, setSelectedService] = useState<Service | null>(services[0]);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(barbers[0]);
  const [selectedDate, setSelectedDate] = useState("2026-04-13");
  const [selectedTime, setSelectedTime] = useState("09:30");

  const [name, setName] = useState("Juan");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [showSuccess, setShowSuccess] = useState(false);

  const totalPrice = useMemo(() => {
    if (!selectedBarber) return "0€";
    return `${selectedBarber.price}€`;
  }, [selectedBarber]);

  const canGoStep2 = !!selectedService;
  const canGoStep3 = !!selectedBarber;
  const canGoStep4 = !!selectedDate && !!selectedTime;
  const canConfirm = !!name.trim() && !!phone.trim();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    setShowSuccess(true);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="container nav">
          <div className="brand">
            <div className="brand-logo">LG</div>
            <div>
              <div className="brand-title">
                La <span>Guarida</span>
              </div>
              <div className="brand-subtitle">Barber Studio</div>
            </div>
          </div>

          <nav className="menu">
            <button onClick={() => scrollToSection("inicio")}>Inicio</button>
            <button onClick={() => scrollToSection("servicios")}>Servicios</button>
            <button onClick={() => scrollToSection("barberos")}>Barberos</button>
            <button onClick={() => scrollToSection("reservar")}>Reservar</button>
            <button onClick={() => scrollToSection("contacto")}>Contacto</button>
          </nav>

          <button className="btn btn-outline" onClick={() => scrollToSection("reservar")}>
            Reservar cita
          </button>
        </div>
      </header>

      <section id="inicio" className="hero">
        <div className="hero-overlay" />
        <div className="container hero-content">
          <p className="eyebrow">BARBER STUDIO · DESDE 2020</p>
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
            <button className="btn btn-primary" onClick={() => scrollToSection("reservar")}>
              Reservar cita
            </button>
            <button className="btn btn-secondary" onClick={() => scrollToSection("servicios")}>
              Ver servicios
            </button>
          </div>

          <div className="stats">
            <div className="stat">
              <h3>6+</h3>
              <p>Años de experiencia</p>
            </div>
            <div className="stat">
              <h3>6</h3>
              <p>Maestros barberos</p>
            </div>
            <div className="stat">
              <h3>1K+</h3>
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
            {services.map((service, index) => {
              const selected = selectedService?.id === service.id;

              return (
                <article
                  key={service.id}
                  className={`card service-card ${selected ? "selected" : ""}`}
                >
                  <div className="service-top">
                    <div className="service-icon">✂</div>
                    <span className="service-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3>{service.name}</h3>
                  <p>{service.description}</p>

                  <div className="service-meta">
                    <span>{service.duration} min</span>
                    <strong>{service.price}</strong>
                  </div>

                  <button
                    className={`btn ${selected ? "btn-primary" : "btn-secondary"} full`}
                    onClick={() => {
                      setSelectedService(service);
                      scrollToSection("reservar");
                      setActiveStep(1);
                    }}
                  >
                    {selected ? "Seleccionado ✓" : "Seleccionar"}
                  </button>
                </article>
              );
            })}
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

          <div className="featured-barber">
  <div className="featured-image-wrap">
    <img
      src={selectedBarber?.image}
      alt={selectedBarber?.name}
      className="featured-image"
    />
    <span className="badge">{selectedBarber?.experience}</span>
  </div>

  <div className="featured-content">
    <p className="mini-index">
      (
      {" "}
      {String(
        barbers.findIndex((b) => b.id === selectedBarber?.id) + 1
      ).padStart(2, "0")}{" "}
      / {String(barbers.length).padStart(2, "0")} )
    </p>

    <h3>{selectedBarber?.name}</h3>
    <p className="featured-specialty">{selectedBarber?.specialty}</p>
    <blockquote>{selectedBarber?.description}</blockquote>

    <div className="tags">
  {selectedBarber?.tags.map((tag) => (
    <span key={tag}>{tag}</span>
  ))}
</div>

    <button
      className="btn btn-primary"
      onClick={() => scrollToSection("reservar")}
    >
      Reservar con {selectedBarber?.name?.split(" ")[0]}
    </button>
  </div>
</div>

          <div className="barber-strip">
            {barbers.map((barber) => (
              <div
                key={barber.id}
                className={`barber-mini ${selectedBarber?.id === barber.id ? "active" : ""}`}
                onClick={() => setSelectedBarber(barber)}
              >
                <img src={barber.image} alt={barber.name} />
                <h4>{barber.name.split(" ")[0]}</h4>
                <p>{barber.specialty}</p>
                <span>{barber.experience}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="reservar" className="section">
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
                        <p>{service.duration} min</p>
                      </div>
                      <div className="price-block">
                        <strong>{service.price}</strong>
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
                      className={`barber-card ${selectedBarber?.id === barber.id ? "selected" : ""}`}
                      onClick={() => setSelectedBarber(barber)}
                    >
                      <img src={barber.image} alt={barber.name} />
                      <h4>{barber.name}</h4>
                      <p>{barber.specialty}</p>
                      <span>{barber.price}€</span>
                    </button>
                  ))}
                </div>

                <p className="helper-text">
                  El precio puede variar según el barbero seleccionado.
                </p>

                <div className="booking-actions">
                  <button className="btn btn-secondary" onClick={() => setActiveStep(1)}>
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
                      <button>{"<"}</button>
                      <strong>Abril 2026</strong>
                      <button>{">"}</button>
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
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                        <button
                          key={day}
                          className={`calendar-day ${day === 13 ? "selected" : ""}`}
                          onClick={() =>
                            setSelectedDate(`2026-04-${String(day).padStart(2, "0")}`)
                          }
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="times-box">
                    <p className="times-title">Horarios disponibles</p>
                    <div className="times-grid">
                      {availableTimes.map((time) => (
                        <button
                          key={time}
                          className={`time-btn ${selectedTime === time ? "selected" : ""}`}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="booking-actions">
                  <button className="btn btn-secondary" onClick={() => setActiveStep(2)}>
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
                <h3>Tus datos personales</h3>

                <div className="reservation-summary">
                  <span>{selectedService?.name}</span>
                  <span>{selectedBarber?.name}</span>
                  <span>{selectedDate}</span>
                  <span>{selectedTime}</span>
                  <strong>Total {totalPrice}</strong>
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
                    {!phone.trim() && <small className="error-text">Requerido</small>}
                  </div>

                  <div className="field full-width">
                    <label>Email (opcional)</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
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

                <div className="booking-actions">
                  <button className="btn btn-secondary" onClick={() => setActiveStep(3)}>
                    ← Anterior
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={!canConfirm}
                    onClick={handleConfirm}
                  >
                    Confirmar reserva ✓
                  </button>
                </div>

                {showSuccess && (
                  <div className="success-box">
                    Reserva confirmada para <strong>{name}</strong> el día{" "}
                    <strong>{selectedDate}</strong> a las <strong>{selectedTime}</strong>.
                  </div>
                )}
              </div>
            )}
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
                  <p>Av. Oquendo casi Heroinas</p>
                  <p>Cochabamba, Bolivia</p>
                </div>

                <div className="card contact-card">
                  <h3>Teléfono</h3>
                  <p>+591 62676234</p>
                  
                </div>

                <div className="card contact-card">
                  <h3>Horario</h3>
                  <p>Lun–Vie: 9:00 – 20:00</p>
                  <p>Sábado: 9:00 – 20:00</p>
                </div>

                <div className="card contact-card">
                  <h3>Email</h3>
                  <p>laguaridabarberstudio@gmail.com</p>
                  <p>reservas@laguarida.es</p>
                </div>
              </div>

              <div className="card social-box">
                <h3>Síguenos</h3>
                <div className="social-links">
                  <a href="#">Instagram</a>
                  <a href="#">Facebook</a>
                  <a href="#">TikTok</a>
                </div>
              </div>
            </div>

            <div className="map-card">
              <iframe
              title="Mapa La Guarida"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1903.7071821527677!2d-66.15009216144769!3d-17.391891136788452!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x93e37382c09cf4cb%3A0x69fc95ab77165935!2sLa%20Guarida%20Barber%20Studio!5e0!3m2!1ses!2sbo!4v1776137464357!5m2!1ses!2sbo"
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
              <div className="brand-logo">LG</div>
              <div>
                <div className="brand-title">
                  La <span>Guarida</span>
                </div>
                <div className="brand-subtitle">Barber Studio</div>
              </div>
            </div>

            <p className="footer-text">
              Barbería premium en el corazón de la ciudad. Donde el estilo se
              convierte en arte y cada visita es una experiencia única.
            </p>

            <ul className="footer-info">
              <li>Calle Gran Vía 45, 28013 Madrid</li>
              <li>+34 912 345 678</li>
              <li>Lun–Sáb: 9:00 – 20:30</li>
            </ul>

            <div className="social-circles">
              <a href="#">IG</a>
              <a href="#">FB</a>
              <a href="#">TT</a>
            </div>
          </div>

          <div>
            <h4>Servicios</h4>
            <ul>
              <li>Corte Clásico</li>
              <li>Degradado</li>
              <li>Arreglo de Barba</li>
              <li>Corte + Barba</li>
              <li>Tratamiento Premium</li>
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

export default App;