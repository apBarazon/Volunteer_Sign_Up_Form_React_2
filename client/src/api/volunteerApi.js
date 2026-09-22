const API_BASE_URL = "http://localhost:3000/api";

/**
 * Checks if the backend server is reachable.
 */
export async function checkServerHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/**
 * Fetches the list of upcoming volunteer events.
 */
export async function getEvents() {
  try {
    const res = await fetch(`${API_BASE_URL}/events`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with ${res.status}`);
    }
    const events = await res.json();
    return { ok: true, events };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/**
 * Submits the volunteer sign-up payload.
 */
export async function submitSignup(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/volunteers/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        error: data.error || "Failed to submit sign up",
        details: data.details || null,
      };
    }

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message || "Network error. Is the server running?" };
  }
}

