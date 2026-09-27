import { useEffect, useState } from "react";
import {
  createAdminOpportunity,
  deleteAdminApplication,
  deleteAdminOpportunity,
  fetchAdminApplications,
  fetchAdminOpportunities,
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

function AdminPage() {
  const [opportunities, setOpportunities] = useState<AdminOpportunity[]>([]);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [form, setForm] = useState<OpportunityForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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

      <section className="admin-section">
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
      </section>

      <section className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2>Applications</h2>
            <p className="subtitle">Review every submitted application across all accounts.</p>
          </div>
          <span className="badge">{applications.length} total</span>
        </div>
        <div className="admin-list">
          {applications.length === 0 && <p className="subtitle">No applications have been submitted yet.</p>}
          {applications.map((application) => (
            <article className="admin-row" key={application.id}>
              <div>
                <strong>{application.firstName} {application.lastName}</strong>
                <span className="admin-row-meta">{application.volunteerName} · {application.email}</span>
                <p>{application.city || "No city provided"} · Submitted {new Date(application.submittedAt).toLocaleDateString()}</p>
              </div>
              <button type="button" className="btn btn-danger" onClick={() => removeApplication(application.id)}>Delete</button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminPage;
