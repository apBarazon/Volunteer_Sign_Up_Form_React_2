import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { fetchOpportunities } from "../api/api";
import type { VolunteerOpportunity } from "../types/VolunteerOpportunity";

const FILTERS = ["All", "Education", "Environment", "Outreach"];

function HomePage() {
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const { setSelectedOpportunity } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOpportunities()
      .then(setOpportunities)
      .catch(() => setLoadError("Could not load opportunities. Is the API server running?"))
      .finally(() => setLoading(false));
  }, []);

  function handleApply(opportunity: VolunteerOpportunity) {
    // Store the chosen opportunity in Context so the unrelated
    // SignUpPage can read it (same idea as UserContext in the mini activity).
    setSelectedOpportunity(opportunity);
    navigate("/signup");
  }

  const filtered = opportunities.filter((o) => {
    const matchesFilter = activeFilter === "All" || o.type === activeFilter;
    const matchesSearch = o.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="page page-wide">
      <h1 className="page-title">Make an Impact Today</h1>
      <p className="page-subtitle">
        Choose an available volunteer opportunity below and register to join our community initiatives.
      </p>

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

      {loading && <p>Loading opportunities...</p>}
      {loadError && <p className="error">{loadError}</p>}

      <div className="card-grid">
        {filtered.map((o) => (
          <div className="opportunity-card" key={o.id}>
            <div className="opportunity-card-header">
              <span className="badge">{o.type.toUpperCase()}</span>
              <span className="spots-pill"> {o.spotsLeft} spots left</span>
            </div>
            <h3>{o.name}</h3>
            <p>{o.description}</p>
            <button type="button" className="btn btn-primary btn-block" onClick={() => handleApply(o)}>
              Apply Now
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
