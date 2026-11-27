import { useEffect, useRef, useState } from "react";
import "./App.css";
import logo from "./assets/logo.svg";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const SERVICES = ["General checkup", "Teeth cleaning", "Teeth whitening", "Consultation"];
const TIMES = ["Morning", "Afternoon"];
const SUGGESTIONS = ["What services do you offer?", "What are your opening hours?"];

const GREETING = {
  role: "assistant",
  text: "Hello! Welcome to Bright Smile. I'm your virtual receptionist. How can I help you today?",
};

function Sparkle({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1.5l2.6 7.9L22.5 12l-7.9 2.6L12 22.5l-2.6-7.9L1.5 12l7.9-2.6z" />
    </svg>
  );
}

function getRoute() {
  return window.location.hash === "#/assistant" ? "assistant" : "home";
}

function App() {
  const [route, setRoute] = useState(getRoute);
  const [messages, setMessages] = useState([GREETING]);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [booking, setBooking] = useState({ service: "", date: "", time: "" });
  const [apiStatus, setApiStatus] = useState("");

  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function go(page) {
    window.location.hash = page === "assistant" ? "#/assistant" : "#/";
  }

  function send(text) {
    const clean = text.trim();
    if (!clean) return;
    setMessages((m) => [
      ...m,
      { role: "user", text: clean },
      {
        role: "assistant",
        text: "Thanks for your message! I'll be able to answer once the AI service is connected.",
      },
    ]);
  }

  function startBooking() {
    if (!bookingOpen) {
      setBookingOpen(true);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "Happy to help. Choose a service, a day and a time, and I'll prepare your request.",
        },
      ]);
    }
    go("assistant");
  }

  function submitBooking() {
    const { service, date, time } = booking;
    if (!service || !date || !time) return;
    const nice = new Date(`${date}T00:00`).toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        text: `Your request is ready: ${service}, ${nice}, ${time.toLowerCase()}. Online confirmation will be enabled once the booking system is connected.`,
      },
    ]);
    setBookingOpen(false);
    setBooking({ service: "", date: "", time: "" });
  }

  async function testConnection() {
    setApiStatus("Checking...");
    try {
      const res = await fetch(`${API_URL}/api/hello`, { method: "POST" });
      if (!res.ok) throw new Error();
      setApiStatus("Connected");
    } catch {
      setApiStatus("Connection unavailable");
    }
  }

  return (
    <div className={`app ${route}`}>
      <header className="navbar">
        <a href="#/" className="brand" aria-label="Bright Smile Dental Center home">
          <img src={logo} alt="Bright Smile Dental Center" />
        </a>
        <nav className="nav-links">
          <a href="#/" className={route === "home" ? "active" : ""}>Home</a>
          <a href="#/assistant" className={route === "assistant" ? "active" : ""}>Assistant</a>
        </nav>
      </header>

      {route === "home" ? (
        <Home
          onAsk={(t) => {
            send(t);
            go("assistant");
          }}
          onBook={startBooking}
          onOpen={() => go("assistant")}
        />
      ) : (
        <Assistant
          messages={messages}
          send={send}
          bookingOpen={bookingOpen}
          setBookingOpen={setBookingOpen}
          startBooking={startBooking}
          booking={booking}
          setBooking={setBooking}
          submitBooking={submitBooking}
        />
      )}

      <footer className="page-footer">
        <span>© Bright Smile Dental Center</span>
        {import.meta.env.DEV && (
          <>
            <button className="connection-check" onClick={testConnection}>
              System check
            </button>
            {apiStatus && <span>{apiStatus}</span>}
          </>
        )}
      </footer>
    </div>
  );
}

function Home({ onAsk, onBook, onOpen }) {
  const [text, setText] = useState("");

  function submit(e) {
    e.preventDefault();
    if (text.trim()) onAsk(text);
  }

  return (
    <section className="hero">
      <h1>Book a visit or ask us anything.</h1>
      <p className="hero-description">
        Our virtual receptionist answers questions and prepares your
        appointment request, any time of day.
      </p>

      <div className="hero-actions">
        <button className="primary-button" onClick={onBook}>
          Book an appointment
        </button>
        <button className="text-button" onClick={onOpen}>
          Open the assistant
        </button>
      </div>

      <div className="try-box">
        <form className="try-form" onSubmit={submit}>
          <Sparkle className="try-icon" />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Try it: ask the receptionist a question"
            aria-label="Ask the receptionist"
          />
          <button type="submit" disabled={!text.trim()} aria-label="Send">
            Ask
          </button>
        </form>
        <div className="chips">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chip" onClick={() => onAsk(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Assistant({
  messages,
  send,
  bookingOpen,
  setBookingOpen,
  startBooking,
  booking,
  setBooking,
  submitBooking,
}) {
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, bookingOpen]);

  function submit(e) {
    e.preventDefault();
    send(text);
    setText("");
  }

  const ready = booking.service && booking.date && booking.time;
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

  return (
    <section className="assistant-page">
      <div className="assistant-card">
        <div className="assistant-header">
          <div className="assistant-avatar">
            <Sparkle />
          </div>
          <div className="assistant-title">
            <strong>Bright Smile Assistant</strong>
            <span>Virtual receptionist</span>
          </div>
          <span className="online-indicator">
            <span className="status-dot" /> Online
          </span>
        </div>

        <div className="chat-body" role="log" aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className={`message-row ${m.role}`}>
              {m.role === "assistant" && (
                <div className="message-avatar">
                  <Sparkle />
                </div>
              )}
              <div className="message-bubble">{m.text}</div>
            </div>
          ))}

          {bookingOpen ? (
            <div className="booking-form">
              <div className="field-label">Service</div>
              <div className="chips">
                {SERVICES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`chip ${booking.service === s ? "selected" : ""}`}
                    onClick={() => setBooking({ ...booking, service: s })}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="booking-row">
                <label>
                  <span className="field-label">Date</span>
                  <input
                    type="date"
                    min={today}
                    value={booking.date}
                    onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                  />
                </label>
                <div>
                  <div className="field-label">Time</div>
                  <div className="chips">
                    {TIMES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`chip ${booking.time === t ? "selected" : ""}`}
                        onClick={() => setBooking({ ...booking, time: t })}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="booking-actions">
                <button className="booking-submit" disabled={!ready} onClick={submitBooking}>
                  Request appointment
                </button>
                <button className="cancel-booking" onClick={() => setBookingOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="chips quick-actions">
              <button className="chip gold" onClick={startBooking}>
                Book an appointment
              </button>
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form className="chat-input" onSubmit={submit}>
          <input
            type="text"
            placeholder="Type your message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Message the receptionist"
          />
          <button type="submit" disabled={!text.trim()}>
            Send
          </button>
        </form>
      </div>
    </section>
  );
}

export default App;
