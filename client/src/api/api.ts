import type { VolunteerOpportunity } from "../types/VolunteerOpportunity";
import type { ApplicationFormData } from "../types/ApplicationFormData";

// Requests go to /api/... which Vite proxies to http://localhost:3000 during dev.
const BASE_URL = "/api";

// ── Opportunities ─────────────────────────────────────────────────────────────

export async function fetchOpportunities(): Promise<VolunteerOpportunity[]> {
  const res = await fetch(`${BASE_URL}/volunteers`);
  if (!res.ok) throw new Error("Failed to load opportunities.");
  return res.json();
}

export async function fetchOpportunityById(
  id: number
): Promise<VolunteerOpportunity> {
  const res = await fetch(`${BASE_URL}/volunteers/${id}`);
  if (!res.ok) throw new Error("Opportunity not found.");
  return res.json();
}

// ── Applications ──────────────────────────────────────────────────────────────

export async function submitApplication(
  volunteerId: number,
  data: ApplicationFormData
) {
  const res = await fetch(`${BASE_URL}/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ volunteerId, ...data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Failed to submit application.");
  }
  return res.json();
}

export type ApplicationRecord = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  age: number | null;
  city: string | null;
  availability: string[];
  experience: string | null;
  skills: string[];
  heardAbout: string | null;
  agreeTerms: boolean;
  submittedAt: string;
  volunteerId: number;
  volunteerName: string;
  volunteerType: string;
};

export async function fetchApplications(): Promise<ApplicationRecord[]> {
  const res = await fetch(`${BASE_URL}/applications`);
  if (!res.ok) throw new Error("Failed to load applications.");
  return res.json();
}
