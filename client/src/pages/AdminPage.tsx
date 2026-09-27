import { useEffect, useState } from "react";
import {
  createAdminOpportunity,
  deleteAdminApplication,
  deleteAdminOpportunity,
  fetchAdminApplications,
  fetchAdminOpportunities,
  updateAdminApplicationStatus,
  updateAdminOpportunity,
  type AdminApplication,
  type AdminOpportunity,
} from "../api/api";

type OpportunityForm = Omit<AdminOpportunity, "id">;

const emptyForm: OpportunityForm = {
  name: "",
  type: "",
  description: "",
  spotsLeft: 0,
};
type AdminTab = "opportunities" | "applications";
type ApplicationStatus = AdminApplication["status"];
const statusFilters: Array<"all" | ApplicationStatus> = ["pending", "approved", "rejected", "all"];
const applicationsPerPage = 15;

function AdminPage() {
  const [opportunities, setOpportunities] = useState<AdminOpportunity[]>([]);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [form, setForm] = useState<OpportunityForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("opportunities");
  const [statusFilter, setStatusFilter] = useState<"all" | ApplicationStatus>("all");
  const [applicationSearch, setApplicationSearch] = useState("");
  const [applicationPage, setApplicationPage] = useState(1);
  const [expandedApplications, setExpandedApplications] = useState<Set<number>>(new Set());

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const [opportunityData, applicationData] = await Promise.all([
        fetchAdminOpportunities(),
        fetchAdminApplications(),
      ]);
      setOpportunities(opportunityData);
      setApplications(applicationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the admin dashboard.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadDashboard();
  }, []);

  function updateField(field: keyof OpportunityForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: field === "spotsLeft" ? Number(value) : value,
    }));
  }

  function startEdit(opportunity: AdminOpportunity) {
    setEditingId(opportunity.id);
    setForm({
      name: opportunity.name,
      type: opportunity.type,
      description: opportunity.description,
      spotsLeft: opportunity.spotsLeft,
    });
    setNotice("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveOpportunity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      if (editingId === null) {
        await createAdminOpportunity(form);
        setNotice("Opportunity created.");
      } else {
        await updateAdminOpportunity(editingId, form);
        setNotice("Opportunity updated.");
      }
      resetForm();
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save opportunity.");
    }
  }

  async function removeOpportunity(id: number) {
    if (!window.confirm("Delete this opportunity? Opportunities with applications cannot be deleted.")) return;
    setError("");
    try {
      await deleteAdminOpportunity(id);
      setNotice("Opportunity deleted.");
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete opportunity.");
    }
  }

  async function removeApplication(id: number) {
    if (!window.confirm("Delete this application and return its spot to the opportunity?")) return;
    setError("");
    try {
      await deleteAdminApplication(id);
      setNotice("Application deleted and the opportunity spot was restored.");
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete application.");
    }
  }

  async function changeApplicationStatus(id: number, status: ApplicationStatus) {
    setError("");
    try {
      await updateAdminApplicationStatus(id, status);
      setApplications((current) => current.map((application) => application.id === id ? { ...application, status } : application));
      setNotice("Application status updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update application status.");
    }
  }

  function toggleApplication(id: number) {
    setExpandedApplications((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const normalizedSearch = applicationSearch.trim().toLowerCase();
  const filteredApplications = applications.filter((application) => {
    const matchesStatus = statusFilter === "all" || application.status === statusFilter;
    const applicant = `${application.firstName} ${application.lastName} ${application.email}`.toLowerCase();
    return matchesStatus && applicant.includes(normalizedSearch);
  });
  const totalApplicationPages = Math.max(1, Math.ceil(filteredApplications.length / applicationsPerPage));
  const visibleApplications = filteredApplications.slice((applicationPage - 1) * applicationsPerPage, applicationPage * applicationsPerPage);

  function selectStatus(status: "all" | ApplicationStatus) {
    setStatusFilter(status);
    setApplicationPage(1);
  }

  return (
    <div className="page page-wide admin-page">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">Manage opportunities and review submitted applications.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={loadDashboard} disabled={loading}>
          Refresh data
        </button>
      </div>

      {error && <p className="error admin-message">{error}</p>}
      {notice && <p className="success admin-message">{notice}</p>}
      {loading && <p>Loading admin data...</p>}

      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        <button type="button" role="tab" aria-selected={activeTab === "opportunities"} className={`admin-tab ${activeTab === "opportunities" ? "admin-tab-active" : ""}`} onClick={() => setActiveTab("opportunities")}>Opportunities</button>
        <button type="button" role="tab" aria-selected={activeTab === "applications"} className={`admin-tab ${activeTab === "applications" ? "admin-tab-active" : ""}`} onClick={() => setActiveTab("applications")}>Applications <span className="tab-count">{applications.length}</span></button>
      </div>

      {activeTab === "opportunities" && <section className="admin-section" role="tabpanel">
        <div className="admin-section-header">
          <div>
            <h2>Volunteer opportunities</h2>
            <p className="subtitle">Create, edit, or remove the roles shown on the public home page.</p>
          </div>
          {editingId !== null && <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel edit</button>}
        </div>

        <form className="admin-form" onSubmit={saveOpportunity}>
          <label>
            Name
            <input value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
          </label>
          <label>
            Type
            <input value={form.type} onChange={(event) => updateField("type", event.target.value)} placeholder="Education" required />
          </label>
          <label>
            Spots left
            <input type="number" min="0" value={form.spotsLeft} onChange={(event) => updateField("spotsLeft", event.target.value)} required />
          </label>
          <label className="admin-form-wide">
            Description
            <textarea rows={3} value={form.description} onChange={(event) => updateField("description", event.target.value)} />
          </label>
          <button type="submit" className="btn btn-primary">{editingId === null ? "Create opportunity" : "Save changes"}</button>
        </form>

        <div className="admin-list">
          {opportunities.map((opportunity) => (
            <article className="admin-row" key={opportunity.id}>
              <div>
                <strong>{opportunity.name}</strong>
                <span className="admin-row-meta">{opportunity.type} · {opportunity.spotsLeft} spots left</span>
                <p>{opportunity.description}</p>
              </div>
              <div className="actions admin-row-actions">
                <button type="button" className="btn btn-secondary" onClick={() => startEdit(opportunity)}>Edit</button>
                <button type="button" className="btn btn-danger" onClick={() => removeOpportunity(opportunity.id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>}

      {activeTab === "applications" && <section className="admin-section" role="tabpanel">
        <div className="admin-section-header">
          <div>
            <h2>Applications</h2>
            <p className="subtitle">Review, filter, and update submitted applications.</p>
          </div>
          <span className="badge">{filteredApplications.length} matching</span>
        </div>
        <div className="application-controls">
          <input aria-label="Search applications" placeholder="Search applicant name or email..." value={applicationSearch} onChange={(event) => { setApplicationSearch(event.target.value); setApplicationPage(1); }} />
          <div className="status-filters" role="group" aria-label="Application status filter">
            {statusFilters.map((status) => <button type="button" key={status} className={`chip ${statusFilter === status ? "chip-active" : ""}`} onClick={() => selectStatus(status)}>{status === "all" ? "All" : status}</button>)}
          </div>
        </div>
        <div className="admin-list application-list">
          {visibleApplications.length === 0 && <p className="subtitle">No applications match these filters.</p>}
          {visibleApplications.map((application) => {
            const expanded = expandedApplications.has(application.id);
            return <article className={`admin-row application-row ${expanded ? "application-row-expanded" : ""}`} key={application.id}>
              <button type="button" className="application-summary" onClick={() => toggleApplication(application.id)} aria-expanded={expanded}>
                <span><strong>{application.firstName} {application.lastName}</strong><small>{application.volunteerName} · {application.email}</small></span>
                <span className={`status-tag status-${application.status}`}>{application.status}</span><span className="expand-mark" aria-hidden="true">{expanded ? "−" : "+"}</span>
              </button>
              {expanded && <div className="application-details">
                <div><strong>Phone</strong><span>{application.phone}</span></div><div><strong>City / Age</strong><span>{application.city || "Not provided"} {application.age ? `· ${application.age}` : ""}</span></div><div><strong>Availability</strong><span>{application.availability.join(", ") || "None specified"}</span></div><div><strong>Skills</strong><span>{application.skills.join(", ") || "None specified"}</span></div><div><strong>Experience</strong><span>{application.experience || "None specified"}</span></div><div><strong>Heard about us</strong><span>{application.heardAbout || "Not specified"}</span></div>
                <div className="application-actions"><label>Status<select value={application.status} onChange={(event) => changeApplicationStatus(application.id, event.target.value as ApplicationStatus)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label><button type="button" className="btn btn-danger" onClick={() => removeApplication(application.id)}>Delete application</button></div>
              </div>}
            </article>;
          })}
        </div>
        <div className="pagination" aria-label="Applications pagination"><button type="button" className="btn btn-secondary" disabled={applicationPage === 1} onClick={() => setApplicationPage((page) => page - 1)}>Previous</button><span>Page {applicationPage} of {totalApplicationPages}</span><button type="button" className="btn btn-secondary" disabled={applicationPage === totalApplicationPages} onClick={() => setApplicationPage((page) => page + 1)}>Next</button></div>
      </section>}
    </div>
  );
}

export default AdminPage;
