import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("..", import.meta.url));
const clientDir = `${root}/client`;
const serverDir = `${root}/server`;
const baseUrl = process.env.E2E_BASE_URL || "http://localhost:5173";
const apiUrl = process.env.E2E_API_URL || "http://localhost:3000";
const startedProcesses = [];
const tokenKey = "volunteer_portal_token";

function readLocalEnvValue(name) {
  try {
    const envFile = readFileSync(`${serverDir}/.env`, "utf8");
    const line = envFile.split(/\r?\n/).find((entry) => entry.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim() || "";
  } catch {
    return "";
  }
}

const adminEmail = process.env.E2E_ADMIN_EMAIL || process.env.ADMIN_EMAIL || readLocalEnvValue("ADMIN_EMAIL");
const adminPassword = process.env.E2E_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || readLocalEnvValue("ADMIN_PASSWORD");

function startDevServer(directory) {
  const child = spawn("npm", ["run", "dev"], {
    cwd: directory,
    shell: true,
    stdio: "inherit",
    windowsHide: false,
  });
  startedProcesses.push(child);
}

async function waitFor(url, label, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = `${response.status} ${response.statusText}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await delay(500);
  }
  throw new Error(`${label} did not become ready: ${lastError}`);
}

async function ensureServers() {
  if (!(await fetch(`${apiUrl}/api/health`).catch(() => null))?.ok) startDevServer(serverDir);
  await waitFor(`${apiUrl}/api/health`, "Backend");
  if (!(await fetch(baseUrl).catch(() => null))?.ok) startDevServer(clientDir);
  await waitFor(baseUrl, "Frontend");
}

async function expectText(page, text) {
  await page.getByText(text, { exact: true }).waitFor();
}

async function expectUrl(page, pattern) {
  if (pattern.test(page.url())) return;
  try {
    await page.waitForURL(pattern, { timeout: 10000 });
  } catch {
    throw new Error(`Expected URL ${pattern}, received ${page.url()}.`);
  }
}

async function clearSession(page) {
  await page.context().clearCookies();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
}

async function login(page, email, password) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  try {
    await expectUrl(page, /\/$/);
  } catch (error) {
    const message = await page.locator(".error").allTextContents();
    throw new Error(`${error instanceof Error ? error.message : String(error)} Login errors: ${message.join(" | ") || "none"}`);
  }
}

async function logout(page) {
  await page.getByRole("button", { name: "Log out" }).click();
  await page.getByRole("link", { name: "Log in" }).waitFor();
  if (await page.getByRole("link", { name: "My Applications" }).count()) {
    throw new Error("My Applications remained visible after logout.");
  }
}

async function fillValidStepOne(page, email) {
  await page.locator('input[name="firstName"]').fill("Automation");
  await page.locator('input[name="lastName"]').fill("Tester");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="phone"]').fill("55512345678");
  await page.locator('input[name="age"]').fill("25");
  await page.locator('input[name="city"]').fill("Springfield");
}

async function openFirstOpportunity(page) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.locator(".opportunity-card").first().waitFor();
  const card = page.locator(".opportunity-card").first();
  const name = (await card.locator("h3").innerText()).trim();
  await card.getByRole("button", { name: "Apply Now" }).click();
  await expectUrl(page, /\/signup$/);
  return name;
}

async function testHomeAndTheme(page) {
  await clearSession(page);
  const cards = page.locator(".opportunity-card");
  await cards.first().waitFor();
  const initialCount = await cards.count();
  if (initialCount < 1) throw new Error("Home page did not load opportunities.");

  await page.getByRole("button", { name: "Toggle color theme" }).click();
  if (!(await page.locator(".app-shell.dark").count())) throw new Error("Theme toggle did not enable dark mode.");
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  if (await page.locator(".app-shell.dark").count()) throw new Error("Theme toggle did not restore light mode.");

  const firstName = (await cards.first().locator("h3").innerText()).trim();
  await page.getByPlaceholder("Search opportunities...").fill(firstName);
  if ((await cards.count()) < 1) throw new Error("Opportunity search hid the matching result.");
  await page.getByPlaceholder("Search opportunities...").fill("no-opportunity-with-this-name");
  await expectText(page, "No opportunities match your search.");
  await page.getByPlaceholder("Search opportunities...").fill("");

  for (const category of ["Education", "Environment", "Outreach"]) {
    await page.getByRole("button", { name: category, exact: true }).click();
    const visibleCards = page.locator(".opportunity-card");
    for (let index = 0; index < await visibleCards.count(); index += 1) {
      const badge = await visibleCards.nth(index).locator(".badge").innerText();
      if (badge.trim().toLowerCase() !== category.toLowerCase()) {
        throw new Error(`${category} filter displayed a ${badge} opportunity.`);
      }
    }
  }
  await page.getByRole("button", { name: "All", exact: true }).click();
  if ((await cards.count()) !== initialCount) throw new Error("All filter did not restore the opportunity list.");

  const errorPage = await page.context().newPage();
  await errorPage.route("**/api/volunteers", (route) => route.fulfill({ status: 500, body: "{}" }));
  await errorPage.goto(baseUrl, { waitUntil: "networkidle" });
  await expectText(errorPage, "Could not load opportunities. Is the API server running?");
  await errorPage.close();

  const opportunityResponse = await page.request.get(`${apiUrl}/api/volunteers/1`);
  if (!opportunityResponse.ok()) throw new Error("Existing opportunity lookup failed.");
  const missingOpportunityResponse = await page.request.get(`${apiUrl}/api/volunteers/999999999`);
  if (missingOpportunityResponse.status() !== 404) throw new Error("Missing opportunity did not return 404.");
}

async function testAuthAndGuards(page, email, password) {
  await clearSession(page);
  await page.goto(`${baseUrl}/my-applications`, { waitUntil: "networkidle" });
  await expectUrl(page, /\/login\?returnTo=%2Fmy-applications/);
  await page.goto(`${baseUrl}/admin`, { waitUntil: "networkidle" });
  await expectUrl(page, /\/login\?returnTo=%2Fadmin/);

  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  const passwordInput = page.getByLabel("Password", { exact: true });
  await passwordInput.fill(password);
  const toggle = page.getByRole("button", { name: "Show password" });
  await toggle.click();
  if (await passwordInput.getAttribute("type") !== "text") throw new Error("Show password did not reveal the password.");
  await page.getByRole("button", { name: "Hide password" }).click();
  if (await passwordInput.getAttribute("type") !== "password") throw new Error("Hide password did not mask the password.");

  await page.getByLabel("Email").fill("invalid-email");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  if (await page.getByLabel("Email").evaluate((input) => input.validity.valid)) {
    throw new Error("Invalid login email was not rejected by browser validation.");
  }
  await page.getByLabel("Email").fill(email);
  await passwordInput.fill("short");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expectText(page, "Password must be at least 8 characters.");
  await passwordInput.fill("WrongPassword123!");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expectText(page, "Email or password is incorrect.");

  await page.goto(`${baseUrl}/register`, { waitUntil: "networkidle" });
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.locator(".password-input-wrapper").first().getByRole("button", { name: "Show password" }).click();
  if (await page.getByLabel("Password", { exact: true }).getAttribute("type") !== "text") throw new Error("Registration password toggle failed.");
  await page.locator(".password-input-wrapper").first().getByRole("button", { name: "Hide password" }).click();
  await page.getByLabel("Email").fill("invalid-email");
  await page.getByRole("button", { name: "Create account" }).click();
  if (await page.getByLabel("Email").evaluate((input) => input.validity.valid)) {
    throw new Error("Invalid registration email was not rejected by browser validation.");
  }

}

async function testRegistrationAndWizard(page, email, password) {
  await clearSession(page);
  await page.goto(`${baseUrl}/register`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill("DifferentPassword123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expectText(page, "Passwords do not match.");
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expectUrl(page, /\/$/);

  if (!(await page.getByRole("link", { name: "My Applications" }).count())) throw new Error("Authenticated navbar is missing My Applications.");
  await page.goto(`${baseUrl}/my-applications`, { waitUntil: "networkidle" });
  await expectText(page, "No applications yet");
  const duplicateResponse = await page.request.post(`${apiUrl}/api/auth/register`, {
    data: { email, password },
  });
  if (duplicateResponse.status() !== 409) throw new Error("Duplicate registration was not rejected with 409.");
  await page.goto(`${baseUrl}/admin`, { waitUntil: "networkidle" });
  await expectUrl(page, /\/$/);
  const forbiddenResponse = await page.request.get(`${apiUrl}/api/admin/opportunities`, {
    headers: { Authorization: `Bearer ${await page.evaluate((key) => localStorage.getItem(key), tokenKey)}` },
  });
  if (forbiddenResponse.status() !== 403) throw new Error("Regular user admin API access was not rejected with 403.");
  await logout(page);
  await login(page, email, password);

  const opportunityName = await openFirstOpportunity(page);

  await page.getByRole("button", { name: /Next: Availability/ }).click();
  await expectText(page, "First name is required.");
  await fillValidStepOne(page, email);
  await page.getByRole("button", { name: /Next: Availability/ }).click();
  await page.getByRole("main").getByText("Step 2 of 4", { exact: true }).waitFor();
  await page.getByRole("button", { name: /Next: More Info/ }).click();
  await expectText(page, "Please select at least one available time slot.");
  await page.locator(".slot-btn").first().click();
  await page.locator('textarea[name="experience"]').fill("Automated end-to-end test submission.");
  await page.getByRole("button", { name: /Next: More Info/ }).click();
  await page.getByRole("main").getByText("Step 3 of 4", { exact: true }).waitFor();

  const firstSkill = page.locator('input[type="checkbox"]').first();
  await firstSkill.check();
  await page.getByRole("button", { name: /Review Application/ }).click();
  await expectText(page, "You must agree to the volunteer terms and code of conduct.");
  await page.locator('select[name="heardAbout"]').selectOption({ label: "School / University" });
  await page.locator('input[type="checkbox"]').last().check();
  await page.getByRole("button", { name: /Review Application/ }).click();
  await expectText(page, "Review Your Application");
  await page.getByRole("heading", { name: opportunityName, exact: true }).waitFor();
  await expectText(page, "Automation Tester");
  await expectText(page, "Automated end-to-end test submission.");

  await page.getByRole("button", { name: "← Back" }).click();
  await page.getByRole("main").getByText("Step 3 of 4", { exact: true }).waitFor();
  if (!(await firstSkill.isChecked())) throw new Error("Wizard Back lost selected skills.");
  await page.getByRole("button", { name: /Review Application/ }).click();
  await page.getByRole("button", { name: "Clear" }).click();
  await page.getByRole("main").getByText("Step 1 of 4", { exact: true }).waitFor();
  if ((await page.locator('input[name="firstName"]').inputValue()) !== "") throw new Error("Clear did not reset the wizard.");

  await fillValidStepOne(page, email);
  await page.getByRole("button", { name: /Next: Availability/ }).click();
  await page.locator(".slot-btn").first().click();
  await page.locator('textarea[name="experience"]').fill("Automated end-to-end test submission.");
  await page.getByRole("button", { name: /Next: More Info/ }).click();
  await page.locator('select[name="heardAbout"]').selectOption({ label: "School / University" });
  await page.locator('input[type="checkbox"]').last().check();
  await page.getByRole("button", { name: /Review Application/ }).click();
  await page.getByRole("button", { name: "Confirm & Submit" }).click();
  await expectUrl(page, /\/my-applications$/);
  await page.locator(".application-card").filter({ hasText: "Automation Tester" }).first().waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".application-card").filter({ hasText: "Automation Tester" }).first().waitFor();
}

async function testAdmin(page, userEmail, userPassword) {
  if (!adminEmail || !adminPassword) throw new Error("Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin E2E coverage.");
  await logout(page);
  await login(page, adminEmail, adminPassword);
  await page.goto(`${baseUrl}/admin`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Admin Panel", exact: true }).waitFor();
  await expectText(page, "Volunteer opportunities");

  const uniqueName = `E2E Opportunity ${Date.now()}`;
  const form = page.locator(".admin-form");
  await form.locator("input").nth(0).fill(uniqueName);
  await form.locator("input").nth(1).fill("Outreach");
  await form.locator('input[type="number"]').fill("2");
  await form.locator("textarea").fill("Created by comprehensive E2E coverage.");
  await form.getByRole("button", { name: "Create opportunity" }).click();
  await expectText(page, "Opportunity created.");
  await expectText(page, uniqueName);

  const row = page.locator(".admin-row").filter({ hasText: uniqueName });
  await row.getByRole("button", { name: "Edit" }).click();
  await form.locator("textarea").fill("Updated by comprehensive E2E coverage.");
  await form.getByRole("button", { name: "Save changes" }).click();
  await expectText(page, "Opportunity updated.");
  await expectText(page, "Updated by comprehensive E2E coverage.");

  const applicationTab = page.getByRole("tab", { name: /Applications/ });
  await applicationTab.click();
  await expectText(page, "Applications");
  const applicationRows = page.locator(".application-row");
  if ((await applicationRows.count()) < 1) throw new Error("Admin application list did not show the submitted application.");
  const userApplication = applicationRows.filter({ hasText: userEmail });
  await userApplication.first().getByRole("button", { name: /Automation Tester/ }).click();
  await expectText(page, "Automated end-to-end test submission.");
  await userApplication.first().locator("select").selectOption("approved");
  await expectText(page, "Application status updated.");
  await page.getByPlaceholder("Search applicant name or email...").fill("not-a-real-applicant");
  await expectText(page, "No applications match these filters.");
  await page.getByPlaceholder("Search applicant name or email...").fill(userEmail);
  await page.getByRole("button", { name: "rejected", exact: true }).click();
  if ((await page.locator(".application-row").count()) !== 0) throw new Error("Rejected filter showed an approved application.");
  await page.getByRole("button", { name: "All", exact: true }).click();

  const token = await page.evaluate((key) => localStorage.getItem(key), tokenKey);
  const applicationsResponse = await page.request.get(`${apiUrl}/api/admin/applications`, { headers: { Authorization: `Bearer ${token}` } });
  if (!applicationsResponse.ok()) throw new Error("Admin applications API failed.");
  const applications = await applicationsResponse.json();
  const createdApplication = applications.find((application) => application.email === userEmail);
  if (!createdApplication) throw new Error("Submitted application was not found in the admin API.");

  await page.getByRole("tab", { name: "Opportunities" }).click();
  const applicationOpportunityRow = page.locator(".admin-row").filter({ hasText: createdApplication.volunteerName });
  page.once("dialog", (dialog) => {
    dialog.accept();
  });
  await applicationOpportunityRow.getByRole("button", { name: "Delete" }).click();
  await expectText(page, "This opportunity has applications and cannot be deleted. Edit it instead.");
  await page.getByRole("tab", { name: /Applications/ }).click();
  page.once("dialog", (dialog) => {
    dialog.accept();
  });
  await page.getByRole("button", { name: "Delete application" }).first().click();
  await expectText(page, "Application deleted and the opportunity spot was restored.");

  await page.getByRole("tab", { name: "Opportunities" }).click();
  const createdRow = page.locator(".admin-row").filter({ hasText: uniqueName });
  page.once("dialog", (dialog) => {
    dialog.accept();
  });
  await createdRow.getByRole("button", { name: "Delete" }).click();
  await expectText(page, "Opportunity deleted.");
}

async function run() {
  await ensureServers();
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const userEmail = `e2e-comprehensive-${Date.now()}@example.com`;
  const userPassword = "TestPassword123!";
  let userCreated = false;

  try {
    await testHomeAndTheme(page);
    await testAuthAndGuards(page, userEmail, userPassword);
    await testRegistrationAndWizard(page, userEmail, userPassword);
    userCreated = true;
    await testAdmin(page, userEmail, userPassword);
    console.log("PASS: home, auth, guards, password visibility, wizard validation/navigation, persistence, admin CRUD, filters, status, and cleanup workflows");
  } finally {
    if (userCreated && !page.isClosed()) {
      try {
        const loginResponse = await page.request.post(`${apiUrl}/api/auth/login`, {
          data: { email: userEmail, password: userPassword },
        });
        if (!loginResponse.ok()) throw new Error(`Cleanup login returned HTTP ${loginResponse.status()}.`);
        const { token } = await loginResponse.json();
        const deleteResponse = await page.request.delete(`${apiUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!deleteResponse.ok()) throw new Error(`Cleanup returned HTTP ${deleteResponse.status()}.`);
        console.log("Cleaned up the comprehensive E2E account and application.");
      } catch (error) {
        console.error(`WARNING: E2E cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    await browser.close();
  }
}

try {
  await run();
} catch (error) {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  for (const child of startedProcesses) child.kill();
}
