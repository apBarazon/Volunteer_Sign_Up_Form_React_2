import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { submitApplication } from "../api/api";
import { applicationSchema } from "../schemas/application.schema";
import {
  initialFormData,
  type ApplicationFormData,
  DAYS,
  TIME_BLOCKS,
  SKILL_OPTIONS,
  HEARD_ABOUT_OPTIONS,
} from "../types/ApplicationFormData";

type Errors = Partial<Record<keyof ApplicationFormData, string>>;

function getValidationErrors(data: ApplicationFormData): Errors {
  const result = applicationSchema.safeParse(data);
  if (result.success) return {};

  const errors: Errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof ApplicationFormData;
    if (field && !errors[field]) errors[field] = issue.message;
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
    const sanitizedValue =
      name === "firstName" || name === "lastName" || name === "city"
        ? value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s'-]/g, "")
        : name === "age"
          ? value.replace(/[^0-9]/g, "")
          : name === "phone"
            ? value.replace(/[^0-9]/g, "").slice(0, 11)
            : value;

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
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
    const stepFields: Record<1 | 2, Array<keyof ApplicationFormData>> = {
      1: ["firstName", "lastName", "email", "phone", "age", "city"],
      2: ["availability", "experience"],
    };
    const allErrors = getValidationErrors(formData);
    const stepErrors = Object.fromEntries(
      stepFields[step as 1 | 2]
        ?.filter((field) => allErrors[field])
        .map((field) => [field, allErrors[field]]) ?? []
    ) as Errors;
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) {
      setStep((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : prev));
    }
  }

  function handleBack() {
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : prev));
  }

  function handleReview() {
    const allErrors = getValidationErrors(formData);
    const step3Errors: Errors = allErrors.agreeTerms
      ? { agreeTerms: allErrors.agreeTerms }
      : {};
    setErrors(step3Errors);
    if (Object.keys(step3Errors).length === 0) setStep(4);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);
    try {
      const validation = applicationSchema.safeParse(formData);
      if (!validation.success) {
        setErrors(getValidationErrors(formData));
        return;
      }
      await submitApplication(opportunity.id, validation.data);
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
    <div className="page signup-page">
      <div className="signup-layout">
        <main className="card signup-card">
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
            <input
              name="phone"
              inputMode="numeric"
              maxLength={11}
              value={formData.phone}
              onChange={handleChange}
            />
            {errors.phone && <p className="error">{errors.phone}</p>}

            <label>Age (Optional)</label>
            <input
              name="age"
              inputMode="numeric"
              value={formData.age}
              onChange={handleChange}
            />
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
              <div className="review-row"><strong>Role</strong><span>{selectedOpportunity.name}</span></div>
              <div className="review-row"><strong>Name</strong><span>{formData.firstName} {formData.lastName}</span></div>
              <div className="review-row"><strong>Email</strong><span>{formData.email}</span></div>
              <div className="review-row"><strong>Phone</strong><span>{formData.phone}</span></div>
              <div className="review-row">
                <strong>Availability</strong>
                <span>{formData.availability.length > 0 ? formData.availability.map(formatSlot).join(", ") : "None specified"}</span>
              </div>
              <div className="review-row"><strong>Experience</strong><span>{formData.experience || "None specified"}</span></div>
              <div className="review-row"><strong>Skills</strong><span>{formData.skills.length > 0 ? formData.skills.join(", ") : "None specified"}</span></div>
              <div className="review-row"><strong>Heard about us via</strong><span>{formData.heardAbout || "Not specified"}</span></div>
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
        </main>
        <aside className="signup-summary">
          <p className="eyebrow">Your application</p>
          <h2>{selectedOpportunity.name}</h2>
          <p className="subtitle">{selectedOpportunity.description}</p>
          <div className="summary-divider" />
          <p className="summary-step">Step {step} <span>of 4</span></p>
          <p className="subtitle">
            {step === 1 && "Tell us a little about yourself."}
            {step === 2 && "Share when and how you can help."}
            {step === 3 && "Add the details that complete your application."}
            {step === 4 && "Review everything before you send it."}
          </p>
        </aside>
      </div>
    </div>
  );
}

export default SignUpPage;
