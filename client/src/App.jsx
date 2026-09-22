import { useState, useEffect } from "react";
import { checkServerHealth, getEvents, submitSignup } from "./api/volunteerApi.js";
import VolunteerForm from "./components/VolunteerForm.jsx";
import ConfirmationModal from "./components/ConfirmationModal.jsx";
import "./App.css";

export default function App() {
  const [serverOnline, setServerOnline] = useState(false);
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedSignup, setConfirmedSignup] = useState(null);

  const fetchStatusAndEvents = async () => {
    setIsLoadingEvents(true);
    const health = await checkServerHealth();
    setServerOnline(health.ok);

    if (health.ok) {
      const eventRes = await getEvents();
      setEvents(eventRes.ok ? (eventRes.events || []) : []);
    } else {
      setEvents([]);
    }
    setIsLoadingEvents(false);
  };

  useEffect(() => {
    let isSubscribed = true;

    async function initialLoad() {
      setIsLoadingEvents(true);
      const health = await checkServerHealth();
      if (!isSubscribed) return;
      setServerOnline(health.ok);

      if (health.ok) {
        const eventRes = await getEvents();
        if (!isSubscribed) return;
        setEvents(eventRes.ok ? (eventRes.events || []) : []);
      } else {
        setEvents([]);
      }
      setIsLoadingEvents(false);
    }

    initialLoad();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const handleSignupSubmit = async (payload) => {
    setIsSubmitting(true);
    const res = await submitSignup(payload);
    setIsSubmitting(false);

    if (res.ok) {
      setConfirmedSignup(res.data);
      return { ok: true };
    } else {
      return {
        ok: false,
        error: res.error,
        details: res.details,
      };
    }
  };

  return (
    <div className="app-layout">
      {/* Top Navigation / Header */}
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-icon">🤝</span>
          <div>
            <h1>Volunteer Hub</h1>
            <p className="brand-tagline">Sign-Up &amp; Event Management Portal</p>
          </div>
        </div>

        {/* Live System Status Badge */}
        <div className="status-badges">
          <div className={`status-pill ${serverOnline ? "pill-online" : "pill-offline"}`}>
            <span className="status-dot"></span>
            <span>
              {serverOnline ? "Backend API: Online" : "Backend API: Offline"}
            </span>
          </div>
          <button
            className="btn-refresh"
            onClick={fetchStatusAndEvents}
            title="Refresh connection and events"
          >
            🔄 Refresh
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main">
        {!serverOnline && (
          <div className="banner banner-warning">
            <strong>⚠️ Backend Server is not reachable!</strong>
            <p>
              Make sure you started the Express server in the <code>server/</code> folder:
              <br />
              <code>cd server ; npm run dev</code>
            </p>
          </div>
        )}

        {serverOnline && events.length === 0 && !isLoadingEvents && (
          <div className="banner banner-info">
            <strong>ℹ️ MariaDB Database Connected!</strong>
            <p>
              Database is ready. Once events are added, they will show up in the dropdown below.
            </p>
          </div>
        )}

        <VolunteerForm
          events={events}
          onSubmit={handleSignupSubmit}
          isSubmitting={isSubmitting}
          serverStatus={serverOnline ? "connected" : "disconnected"}
        />
      </main>

      {/* Confirmation Modal */}
      {confirmedSignup && (
        <ConfirmationModal
          signupData={confirmedSignup}
          onClose={() => setConfirmedSignup(null)}
        />
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p>Volunteer Sign-Up Form App &bull; Built with React, Express, Sequelize &amp; MariaDB</p>
      </footer>
    </div>
  );
}
