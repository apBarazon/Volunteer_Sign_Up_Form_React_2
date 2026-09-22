import { useState } from "react";
import { volunteerSignupSchema } from "../schemas/volunteer.schema.js";

export default function VolunteerForm({ events, onSubmit, isSubmitting, serverStatus }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    eventId: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [showDataPreview, setShowDataPreview] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for the field being edited
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setGeneralError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");

    // Validate using Zod schema
    const validation = volunteerSignupSchema.safeParse({
      ...formData,
      eventId: formData.eventId === "" ? undefined : Number(formData.eventId),
    });

    if (!validation.success) {
      const flattened = validation.error.flatten().fieldErrors;
      const cleanErrors = {};
      for (const key in flattened) {
        cleanErrors[key] = flattened[key][0];
      }
      setFieldErrors(cleanErrors);
      return;
    }

    setFieldErrors({});

    // Send valid payload to parent submit handler
    const result = await onSubmit(validation.data);
    if (!result.ok) {
      if (result.details) {
        const serverErrors = {};
        for (const key in result.details) {
          serverErrors[key] = result.details[key][0];
        }
        setFieldErrors(serverErrors);
      }
      setGeneralError(result.error || "An error occurred during submission.");
    } else {
      // Reset form on success
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        eventId: "",
      });
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="volunteer-form" noValidate>
        <h2>Register as a Volunteer</h2>
        <p className="form-desc">
          Fill out this simple form to join an upcoming community event.
        </p>

        {generalError && (
          <div className="alert-box alert-error" role="alert">
            ⚠️ {generalError}
          </div>
        )}

        {/* Event Select Dropdown */}
        <div className="form-group">
          <label htmlFor="eventId">
            Select an Event <span className="required">*</span>
          </label>
          <select
            id="eventId"
            name="eventId"
            value={formData.eventId}
            onChange={handleChange}
            className={fieldErrors.eventId ? "input-error" : ""}
          >
            <option value="">-- Choose an event --</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} {ev.eventDate ? `(${ev.eventDate})` : ""}
              </option>
            ))}
          </select>
          {fieldErrors.eventId && (
            <span className="error-text">{fieldErrors.eventId}</span>
          )}
          {events.length === 0 && (
            <small className="help-text">
              {serverStatus === "connected"
                ? "No events found in database. Seed sample events to begin."
                : "Waiting for backend server to connect..."}
            </small>
          )}
        </div>

        {/* Full Name */}
        <div className="form-group">
          <label htmlFor="fullName">
            Full Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            placeholder="e.g. Maria Santos"
            value={formData.fullName}
            onChange={handleChange}
            className={fieldErrors.fullName ? "input-error" : ""}
          />
          {fieldErrors.fullName && (
            <span className="error-text">{fieldErrors.fullName}</span>
          )}
        </div>

        {/* Email */}
        <div className="form-group">
          <label htmlFor="email">
            Email Address <span className="required">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="e.g. maria@example.com"
            value={formData.email}
            onChange={handleChange}
            className={fieldErrors.email ? "input-error" : ""}
          />
          {fieldErrors.email && (
            <span className="error-text">{fieldErrors.email}</span>
          )}
        </div>

        {/* Phone */}
        <div className="form-group">
          <label htmlFor="phone">Phone Number (Optional)</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            placeholder="e.g. 0917-123-4567"
            value={formData.phone}
            onChange={handleChange}
            className={fieldErrors.phone ? "input-error" : ""}
          />
          {fieldErrors.phone && (
            <span className="error-text">{fieldErrors.phone}</span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-primary submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Volunteer Sign-Up"}
        </button>
      </form>

      {/* Educational Data Inspector Box */}
      <div className="inspector-panel">
        <div
          className="inspector-header"
          onClick={() => setShowDataPreview(!showDataPreview)}
        >
          <span>🔍 <strong>Live Data Inspector</strong> (How data is held in React state)</span>
          <button type="button" className="btn-toggle">
            {showDataPreview ? "Hide" : "Show"}
          </button>
        </div>

        {showDataPreview && (
          <div className="inspector-body">
            <p className="inspector-hint">
              This preview shows how React tracks your form inputs in real-time before sending it to the backend:
            </p>
            <pre className="payload-display">
              {JSON.stringify(
                {
                  fullName: formData.fullName || "(empty)",
                  email: formData.email || "(empty)",
                  phone: formData.phone || "(none)",
                  eventId: formData.eventId ? Number(formData.eventId) : "(none selected)",
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

