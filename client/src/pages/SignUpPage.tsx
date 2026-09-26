import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { submitApplication } from "../api/api";
import {
  initialFormData,
  type ApplicationFormData,
  DAYS,
  TIME_BLOCKS,
  SKILL_OPTIONS,
  HEARD_ABOUT_OPTIONS,
} from "../types/ApplicationFormData";

type Errors = Partial<Record<keyof ApplicationFormData, string>>;

// ---- Validation, one function per step, same pattern as validateShow1/validateShow2 ----

function validateStep1(data: ApplicationFormData): Errors {
  const errors: Errors = {};
  if (!data.firstName.trim()) errors.firstName = "First name is required.";
  if (!data.lastName.trim()) errors.lastName = "Last name is required.";
  if (!data.email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Invalid email.";
  if (!data.phone.trim()) errors.phone = "Phone number is required.";
  else if (!/^[0-9+\-\s()]{7,}$/.test(data.phone)) errors.phone = "Invalid phone number.";
  if (data.age && (isNaN(Number(data.age)) || Number(data.age) < 0)) {
    errors.age = "Age must be a valid number.";
  }
  return errors;
}

function validateStep2(data: ApplicationFormData): Errors {
  const errors: Errors = {};
  if (data.availability.length === 0) {
    errors.availability = "Please select at least one available time slot.";
  }
  if (data.experience.length > 300) {
    errors.experience = "Please keep this under 300 characters.";
  }
  return errors;
}

function validateStep3(data: ApplicationFormData): Errors {
  const errors: Errors = {};
  if (!data.agreeTerms) {
    errors.agreeTerms = "You must agree to the volunteer terms and code of conduct.";
  }
  return errors;
}

function SignUpPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // which of the four steps is visible
  const [formData, setFormData] = useState<ApplicationFormData>(initialFormData);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const { selectedOpportunity, setSubmittedApplication } = useAppContext();
  const navigate = useNavigate();

  // Route guard: if someone lands here without picking an opportunity
  // first (e.g. refreshing the page directly), send them back Home.
  if (!selectedOpportunity) return <Navigate to="/" replace />;

  const opportunity = selectedOpportunity;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function toggleSlot(day: string, blockKey: string) {
    const slot = `${day}-${blockKey}`;
    setFormData((prev) => {
      const alreadySelected = prev.availability.includes(slot);
      const availability = alreadySelected
        ? prev.availability.filter((s) => s !== slot)
        : [...prev.availability, slot];
      return { ...prev, availability };
    });
    setErrors((prev) => ({ ...prev, availability: undefined }));
  }

  function toggleSkill(skill: string) {
    setFormData((prev) => {
      const alreadySelected = prev.skills.includes(skill);
      const skills = alreadySelected
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill];
      return { ...prev, skills };
    });
  }

  function handleNext() {
    let stepErrors: Errors = {};
    if (step === 1) stepErrors = validateStep1(formData);
    if (step === 2) stepErrors = validateStep2(formData);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) {
      setStep((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : prev));
    }
  }

  function handleBack() {
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : prev));
  }

  function handleReview() {
    const step3Errors = validateStep3(formData);
    setErrors(step3Errors);
    if (Object.keys(step3Errors).length === 0) setStep(4);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);
    try {
      await submitApplication(opportunity.id, formData);
      setSubmittedApplication(formData); // save to Context, same idea as setUser(formData)
      navigate("/my-applications");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClear() {
    setFormData(initialFormData);
    setErrors({});
    setStep(1);
  }

  function formatSlot(slot: string) {
    const [day, block] = slot.split("-");
    return `${day} ${block}`;
  }

  return (
    <div className="page">
      <div className="card">
        <div className="step-header">
          <p className="step-label">Step {step} of 4</p>
          <p className="role-label">
            Role: <strong>{selectedOpportunity.name}</strong>
          </p>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        {/* ---------- Step 1: Personal Information ---------- */}
        {step === 1 && (
          <div>
            <h2>Personal Information</h2>
            <label>First Name</label>
            <input name="firstName" value={formData.firstName} onChange={handleChange} />
            {errors.firstName && <p className="error">{errors.firstName}</p>}

            <label>Last Name</label>
            <input name="lastName" value={formData.lastName} onChange={handleChange} />
            {errors.lastName && <p className="error">{errors.lastName}</p>}

            <label>Email</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} />
            {errors.email && <p className="error">{errors.email}</p>}

            <label>Phone Number</label>
            <input name="phone" value={formData.phone} onChange={handleChange} />
            {errors.phone && <p className="error">{errors.phone}</p>}

            <label>Age (Optional)</label>
            <input name="age" value={formData.age} onChange={handleChange} />
            {errors.age && <p className="error">{errors.age}</p>}

            <label>City (Optional)</label>
            <input name="city" value={formData.city} onChange={handleChange} />

            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={handleNext}>
                Next: Availability →
              </button>
            </div>
          </div>
        )}

        {/* ---------- Step 2: Availability & Experience ---------- */}
        {step === 2 && (
          <div>
            <h2>Availability & Experience</h2>
            <h4>Weekly Shift Matrix</h4>
            <p className="subtitle">Click time slots to indicate when you are free to volunteer.</p>

            <div className="shift-matrix-wrapper">
              <table className="shift-matrix">
                <thead>
                  <tr>
                    <th>Time Block</th>
                    {DAYS.map((day) => (
                      <th key={day}>{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_BLOCKS.map((block) => (
                    <tr key={block.key}>
                      <td className="time-block-label">{block.label}</td>
                      {DAYS.map((day) => {
                        const slot = `${day}-${block.key}`;
                        const isSelected = formData.availability.includes(slot);
                        return (
                          <td key={slot}>
                            <button
                              type="button"
                              className={`slot-btn ${isSelected ? "slot-btn-active" : ""}`}
                              onClick={() => toggleSlot(day, block.key)}
                            >
                              {isSelected ? "✓" : "–"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {errors.availability && <p className="error">{errors.availability}</p>}

            <label>Previous Volunteer Experience (Optional)</label>
            <textarea
              name="experience"
              rows={3}
              maxLength={300}
              placeholder="Briefly share any relevant background..."
              value={formData.experience}
              onChange={handleChange}
            />
            <p className="char-counter">{formData.experience.length}/300</p>
            {errors.experience && <p className="error">{errors.experience}</p>}

            <div className="actions actions-spread">
              <button type="button" className="btn btn-secondary" onClick={handleBack}>
                ← Back
              </button>
              <button type="button" className="btn btn-primary" onClick={handleNext}>
                Next: More Info →
              </button>
            </div>
          </div>
        )}

        {/* ---------- Step 3: Additional Information ---------- */}
        {step === 3 && (
          <div>
            <h2>Additional Information</h2>
            
            <label>Relevant Skills (Optional)</label>
            <div className="skills-grid">
              {SKILL_OPTIONS.map((skill) => (
                <label key={skill} className="skill-chip">
                  <input
                    type="checkbox"
                    checked={formData.skills.includes(skill)}
                    onChange={() => toggleSkill(skill)}
                  />
                  <span>{skill}</span>
                </label>
              ))}
            </div>

            <label>How did you hear about us?</label>
            <select name="heardAbout" value={formData.heardAbout} onChange={handleChange}>
              <option value="">-- Select an option --</option>
              {HEARD_ABOUT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={formData.agreeTerms}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, agreeTerms: e.target.checked }))
                }
              />
              <span>I agree to the volunteer terms and code of conduct.</span>
            </label>
            {errors.agreeTerms && <p className="error">{errors.agreeTerms}</p>}

            <div className="actions actions-spread">
              <button type="button" className="btn btn-secondary" onClick={handleBack}>
                ← Back
              </button>
              <button type="button" className="btn btn-primary" onClick={handleReview}>
                Review Application →
              </button>
            </div>
          </div>
        )}
        {/* ---------- Step 4: Review & Submit ---------- */}
        {step === 4 && (
          <form onSubmit={handleSubmit}>
            <h2>Review Your Application</h2>
            <p className="subtitle">Please confirm your details before submitting.</p>

            <div className="review-box">
              <p><strong>Role:</strong> {selectedOpportunity.name}</p>
              <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
              <p><strong>Email:</strong> {formData.email}</p>
              <p><strong>Phone:</strong> {formData.phone}</p>
              <p>
                <strong>Availability:</strong>{" "}
                {formData.availability.length > 0
                  ? formData.availability.map(formatSlot).join(", ")
                  : "None specified"}
              </p>
              <p><strong>Experience:</strong> {formData.experience || "None specified"}</p>
              <p><strong>Skills:</strong> {formData.skills.length > 0 ? formData.skills.join(", ") : "None specified"}</p>
              <p><strong>Heard about us via:</strong> {formData.heardAbout || "Not specified"}</p>
            </div>

            {submitError && <p className="error">{submitError}</p>}

            <div className="actions actions-spread">
              <button type="button" className="btn btn-secondary" onClick={handleBack}>
                ← Back
              </button>
              <div className="actions">
                <button type="button" className="btn btn-danger" onClick={handleClear}>
                  Clear
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Confirm & Submit"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default SignUpPage;
