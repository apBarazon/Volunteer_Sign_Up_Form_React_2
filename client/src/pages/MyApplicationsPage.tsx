import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchApplications, type ApplicationRecord } from "../api/api";

function MyApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    fetchApplications()
      .then(setApplications)
      .catch(() => setLoadError("Could not load applications. Is the API server running?"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page page-wide">
      <h1 className="page-title">My Applications</h1>
      <p className="page-subtitle">A record of every volunteer application stored in your MySQL database.</p>

      {loading && <p>Loading...</p>}
      {loadError && <p className="error">{loadError}</p>}

      {!loading && !loadError && applications.length === 0 && (
        <p className="subtitle">
          You haven't submitted any applications yet.{" "}
          <Link to="/" className="link">Browse opportunities</Link> to get started.
        </p>
      )}

      <div className="applications-list">
        {applications.map((app) => (
          <div className="application-card" key={app.id}>
            <div className="opportunity-card-header">
              <span className="badge">{app.volunteerType.toUpperCase()}</span>
              <span className="spots-pill">
                Submitted {new Date(app.submittedAt).toLocaleDateString()}
              </span>
            </div>
            <h3>{app.volunteerName}</h3>
            <p><strong>Applicant:</strong> {app.firstName} {app.lastName}</p>
            <p><strong>Email:</strong> {app.email} &nbsp;|&nbsp; <strong>Phone:</strong> {app.phone}</p>
            {(app.age || app.city) && (
              <p>
                {app.age && <><strong>Age:</strong> {app.age} &nbsp;</>}
                {app.city && <><strong>City:</strong> {app.city}</>}
              </p>
            )}
            <p>
              <strong>Availability:</strong>{" "}
              {app.availability.length > 0
                ? app.availability.map((s) => s.replace("-", " ")).join(", ")
                : "None specified"}
            </p>
            {app.skills.length > 0 && (
              <p><strong>Skills:</strong> {app.skills.join(", ")}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyApplicationsPage;
