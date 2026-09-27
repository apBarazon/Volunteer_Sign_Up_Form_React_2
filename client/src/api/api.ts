import type { VolunteerOpportunity } from "../types/VolunteerOpportunity";
import type { ApplicationFormData } from "../types/ApplicationFormData";

// Requests go to /api/... which Vite proxies to http://localhost:3000 during dev.
const BASE_URL = "/api";
const TOKEN_KEY = "volunteer_portal_token";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function redirectToLoginAfterUnauthorized() {
  localStorage.removeItem(TOKEN_KEY);
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const loginUrl = new URL("/login", window.location.origin);
  loginUrl.searchParams.set("message", "Your session expired, please log in again.");
  loginUrl.searchParams.set("returnTo", returnTo);
  window.location.assign(loginUrl.toString());
}

async function parseError(res: Response, fallback: string, authenticated = false) {
  if (res.status === 401 && authenticated) {
    redirectToLoginAfterUnauthorized();
  }
  const body = await res.json().catch(() => ({}));
  throw new Error(body.message || body.error || fallback);
}

export type AuthAccount = {
  id: number;
  username: string | null;
  email: string;
  role: "user" | "admin";
  createdAt: string;
};

type AuthResponse = { token: string; account: AuthAccount };

export async function registerAccount(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) await parseError(res, "Could not create your account.");
  return res.json();
}

export async function loginAccount(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) await parseError(res, "Could not log you in.");
  return res.json();
}

export async function getCurrentAccount(): Promise<AuthAccount> {
  const res = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders() });
  if (!res.ok) await parseError(res, "Your session has expired.", true);
  const body = await res.json();
  return body.account;
}

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
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ volunteerId, ...data }),
  });
  if (!res.ok) {
    await parseError(res, "Failed to submit application.", true);
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
  status: "pending" | "approved" | "rejected";
};

export async function fetchApplications(): Promise<ApplicationRecord[]> {
  const res = await fetch(`${BASE_URL}/applications`, { headers: authHeaders() });
  if (!res.ok) await parseError(res, "Failed to load applications.", true);
  return res.json();
}

export type AdminOpportunity = VolunteerOpportunity;

export type AdminApplication = ApplicationRecord & {
  accountEmail: string | null;
};

export async function fetchAdminOpportunities(): Promise<AdminOpportunity[]> {
  const res = await fetch(`${BASE_URL}/admin/opportunities`, { headers: authHeaders() });
  if (!res.ok) await parseError(res, "Failed to load admin opportunities.", true);
  return res.json();
}

export async function createAdminOpportunity(data: Omit<AdminOpportunity, "id">) {
  const res = await fetch(`${BASE_URL}/admin/opportunities`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) await parseError(res, "Failed to create opportunity.", true);
  return res.json() as Promise<AdminOpportunity>;
}

export async function updateAdminOpportunity(id: number, data: Partial<Omit<AdminOpportunity, "id">>) {
  const res = await fetch(`${BASE_URL}/admin/opportunities/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) await parseError(res, "Failed to update opportunity.", true);
  return res.json() as Promise<AdminOpportunity>;
}

export async function deleteAdminOpportunity(id: number) {
  const res = await fetch(`${BASE_URL}/admin/opportunities/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) await parseError(res, "Failed to delete opportunity.", true);
}

export async function fetchAdminApplications(): Promise<AdminApplication[]> {
  const res = await fetch(`${BASE_URL}/admin/applications`, { headers: authHeaders() });
  if (!res.ok) await parseError(res, "Failed to load all applications.", true);
  return res.json();
}

export async function deleteAdminApplication(id: number) {
  const res = await fetch(`${BASE_URL}/admin/applications/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) await parseError(res, "Failed to delete application.", true);
}

export async function updateAdminApplicationStatus(
  id: number,
  status: AdminApplication["status"],
) {
  const res = await fetch(`${BASE_URL}/admin/applications/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) await parseError(res, "Failed to update application status.", true);
  return res.json() as Promise<{ id: number; status: AdminApplication["status"] }>;
}
