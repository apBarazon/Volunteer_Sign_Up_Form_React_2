import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const root = new URL("..", import.meta.url).pathname.replace(/^\/(.:)/, "$1");
const clientDir = `${root}/client`;
const serverDir = `${root}/server`;
const baseUrl = process.env.E2E_BASE_URL || "http://localhost:5173";
const apiUrl = process.env.E2E_API_URL || "http://localhost:3000";
const startedProcesses = [];

function startDevServer(directory) {
  const child = spawn("npm", ["run", "dev"], {
    cwd: directory,
    shell: true,
    stdio: "inherit",
    windowsHide: false,
  });
  startedProcesses.push(child);
  return child;
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

async function clearBrowserState(context) {
  await context.clearCookies();
}

async function run() {
  const serverHealth = await fetch(`${apiUrl}/api/health`).catch(() => null);
  if (!serverHealth?.ok) startDevServer(serverDir);
  await waitFor(`${apiUrl}/api/health`, "Backend");

  let clientWasAlreadyRunning = false;
  try {
    clientWasAlreadyRunning = (await fetch(baseUrl)).ok;
  } catch {
    // The client will be started below.
  }
  if (!clientWasAlreadyRunning) startDevServer(clientDir);
  await waitFor(baseUrl, "Frontend");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  await clearBrowserState(context);
  const page = await context.newPage();
  const email = `e2e-${Date.now()}@example.com`;
  const password = "TestPassword123!";
  const firstName = "Automation";
  const lastName = "Tester";
  let accountCreated = false;

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".opportunity-card").first().waitFor();
    if ((await page.locator(".opportunity-card").count()) < 1) {
      throw new Error("No volunteer opportunities were loaded.");
    }

    await page.getByRole("button", { name: "Apply Now" }).first().click();
    await page.getByRole("link", { name: "Create an account" }).click();

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password").fill("DifferentPassword123!");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.getByText("Passwords do not match.").waitFor();

    await page.getByLabel("Confirm password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
    accountCreated = true;
    try {
      await page.waitForURL(/\/signup/, { timeout: 30000 });
    } catch {
      const visibleErrors = await page.locator(".error").allTextContents();
      throw new Error(`Registration did not navigate to /signup (at ${page.url()}): ${visibleErrors.join(" | ") || "no visible error"}`);
    }
    await page.getByText("Step 1 of 4").waitFor();

    await page.getByRole("button", { name: /Next: Availability/ }).click();
    await page.getByText("First name is required.").waitFor();

    await page.locator('input[name="firstName"]').fill(firstName);
    await page.locator('input[name="lastName"]').fill(lastName);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="phone"]').fill("55512345678");
    await page.locator('input[name="age"]').fill("25");
    await page.locator('input[name="city"]').fill("Springfield");
    await page.getByRole("button", { name: /Next: Availability/ }).click();

    await page.locator(".slot-btn").first().click();
    await page.locator('textarea[name="experience"]').fill("Automated end-to-end test submission.");
    await page.getByRole("button", { name: /Next: More Info/ }).click();

    await page.locator('select[name="heardAbout"]').selectOption({ label: "School / University" });
    await page.locator('input[type="checkbox"]').last().check();
    await page.getByRole("button", { name: /Review Application/ }).click();
    await page.getByRole("heading", { name: "Review Your Application" }).waitFor();

    await page.getByRole("button", { name: "Confirm & Submit" }).click();
    await page.getByRole("heading", { name: "My Applications" }).waitFor();
    try {
      await page.getByText(`${firstName} ${lastName}`).waitFor();
    } catch {
      throw new Error(`Application was not visible after submission: ${(await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 600)}`);
    }

    await page.reload({ waitUntil: "networkidle" });
      try {
        await page.getByText(`${firstName} ${lastName}`).waitFor();
      } catch {
        throw new Error(`Application did not survive reload: ${(await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 600)}`);
      }
    console.log(`PASS: registration, validation, application submission, and database read-back (${email})`);
  } finally {
    if (accountCreated && !page.isClosed()) {
      try {
        await page.evaluate(async () => {
          const token = localStorage.getItem("volunteer_portal_token");
          const response = await fetch("/api/auth/me", {
            method: "DELETE",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!response.ok) throw new Error(`Cleanup returned HTTP ${response.status}.`);
        });
        console.log("Cleaned up the E2E account, application, and restored opportunity capacity.");
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
  for (const child of startedProcesses) {
    child.kill();
  }
}
