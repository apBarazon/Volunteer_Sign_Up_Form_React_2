import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { fetchApplications, fetchOpportunities, type ApplicationRecord } from "../api/api";
import { useAuth } from "../context/AuthContext";
import type { VolunteerOpportunity } from "../types/VolunteerOpportunity";
import { Link } from "react-router-dom";

const FILTERS = ["All", "Education", "Environment", "Outreach"];

function HomePage() {
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [checkingOpportunityId, setCheckingOpportunityId] = useState<number | null>(null);
  const [duplicateApplication, setDuplicateApplication] = useState<ApplicationRecord | null>(null);
  const [applyCheckError, setApplyCheckError] = useState("");

  const { setSelectedOpportunity } = useAppContext();
  const { account } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOpportunities()
      .then(setOpportunities)
      .catch(() => setLoadError("Could not load opportunities. Is the API server running?"))
      .finally(() => setLoading(false));
  }, []);

  async function handleApply(opportunity: VolunteerOpportunity) {
    if (!account) {
      setSelectedOpportunity(opportunity);
      navigate("/signup");
      return;
    }

    setCheckingOpportunityId(opportunity.id);
    setDuplicateApplication(null);
    setApplyCheckError("");
    try {
      const applications = await fetchApplications();
      const existingApplication = applications.find((application) => application.volunteerId === opportunity.id);
      if (existingApplication) {
        setDuplicateApplication(existingApplication);
        return;
      }

      setSelectedOpportunity(opportunity);
      navigate("/signup");
    } catch {
      setApplyCheckError("Could not check your existing applications. Please try again.");
    } finally {
      setCheckingOpportunityId(null);
    }
  }

  const filtered = opportunities.filter((o) => {
    const matchesFilter = activeFilter === "All" || o.type === activeFilter;
    const matchesSearch = o.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="page page-wide home-page">
      <section className="home-hero">
        <p className="eyebrow">Volunteer together</p>
        <h1 className="page-title">Make an Impact Today</h1>
        <p className="page-subtitle">
        Choose an available volunteer opportunity below and register to join our community initiatives.
        </p>
      </section>

      <section className="home-controls" aria-label="Opportunity filters">
        <input
          className="search-input"
          placeholder="Search opportunities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="filter-row">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`chip ${activeFilter === f ? "chip-active" : ""}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {loading && <p className="loading-message" role="status" aria-live="polite">Loading opportunities...</p>}
      {loadError && <p className="error" role="alert">{loadError}</p>}

      <div className="card-grid">
        {filtered.map((o, index) => (
          <div
            className={`opportunity-card ${index === 0 ? "featured" : ""} category-${o.type.toLowerCase()}`}
            key={o.id}
          >
            <div className="opportunity-card-header">
              <span className="badge">{o.type.toUpperCase()}</span>
              <span className="spots-pill"> {o.spotsLeft} spots left</span>
            </div>
            <h3>{o.name}</h3>
            <p>{o.description}</p>
            {index === 0 && <p className="featured-note">This is currently our highest-need opportunity.</p>}
            {duplicateApplication?.volunteerId === o.id && (
              <p className="application-notice">
                You've already applied to this opportunity. <Link to="/my-applications">View My Applications</Link>
              </p>
            )}
            {applyCheckError && checkingOpportunityId === null && duplicateApplication === null && (
              <p className="error" role="alert">{applyCheckError}</p>
            )}
            <button
              type="button"
              className={`btn btn-block ${o.spotsLeft === 0 || duplicateApplication?.volunteerId === o.id ? "btn-full" : "btn-primary"}`}
              disabled={o.spotsLeft === 0 || duplicateApplication?.volunteerId === o.id || checkingOpportunityId === o.id}
              onClick={() => handleApply(o)}
            >
              {o.spotsLeft === 0 ? "Full" : duplicateApplication?.volunteerId === o.id ? "Already applied" : checkingOpportunityId === o.id ? "Checking..." : "Apply Now"}
            </button>
          </div>
        ))}
      </div>

      {!loading && !loadError && filtered.length === 0 && (
        <p>No opportunities match your search.</p>
      )}
    </div>
  );
}

export default HomePage;
