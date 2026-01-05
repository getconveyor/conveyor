import { Page } from "puppeteer";
import { config } from "../setup";

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

/**
 * Register a new user account
 */
export async function registerUser(
  page: Page,
  userData: RegisterData
): Promise<void> {
  console.log(`Registering user: ${userData.email}`);

  // Navigate to register page
  await page.goto(`${config.baseUrl}/register`, { waitUntil: "networkidle0" });

  // Wait for the form to be visible
  await page.waitForSelector("form", { visible: true });

  // Fill in the registration form
  await page.type('input[name="first_name"]', userData.firstName);
  await page.type('input[name="last_name"]', userData.lastName);
  await page.type('input[name="email"]', userData.email);
  await page.type('input[name="username"]', userData.username);
  await page.type('input[name="password"]', userData.password);
  await page.type('input[name="password_confirm"]', userData.password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for navigation to workspace selection or dashboard
  await page
    .waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 })
    .catch(() => {
      // Might not navigate if staying on same page
    });

  // Check if we're on the select-workspace page or if there's an error
  const currentUrl = page.url();
  if (currentUrl.includes("/select-workspace")) {
    console.log("Registration successful - redirected to workspace selection");
  } else if (currentUrl.includes("/register")) {
    // Check for error message
    const errorElement = await page.$(".text-red-600, .text-red-400");
    if (errorElement) {
      const errorText = await page.evaluate(
        (el) => el?.textContent,
        errorElement
      );
      throw new Error(`Registration failed: ${errorText}`);
    }
  }
}

/**
 * Login with existing credentials
 */
export async function loginUser(
  page: Page,
  credentials: LoginData
): Promise<void> {
  console.log(`Logging in user: ${credentials.email}`);

  // Navigate to login page
  await page.goto(`${config.baseUrl}/login`, { waitUntil: "networkidle0" });

  // Wait for the form to be visible
  await page.waitForSelector("form", { visible: true });

  // Fill in the login form
  await page.type('input[name="email"]', credentials.email);
  await page.type('input[name="password"]', credentials.password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for navigation
  await page
    .waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 })
    .catch(() => {
      // Might not navigate if staying on same page
    });

  // Check if login was successful
  const currentUrl = page.url();
  if (currentUrl.includes("/login")) {
    // Check for error message
    const errorElement = await page.$(".text-red-600, .text-red-400");
    if (errorElement) {
      const errorText = await page.evaluate(
        (el) => el?.textContent,
        errorElement
      );
      throw new Error(`Login failed: ${errorText}`);
    }
  }

  console.log("Login successful");
}

/**
 * Logout the current user
 */
export async function logoutUser(page: Page): Promise<void> {
  console.log("Logging out user");

  // Click on user menu or logout button
  // This depends on your UI implementation
  const logoutButton = await page.$(
    'button:has-text("Logout"), [data-testid="logout-button"]'
  );
  if (logoutButton) {
    await logoutButton.click();
    await page.waitForNavigation({ waitUntil: "networkidle0" });
  } else {
    // Navigate directly to login (clears auth state)
    await page.goto(`${config.baseUrl}/login`, { waitUntil: "networkidle0" });
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Check for auth tokens in local storage
  const token = await page.evaluate(() => {
    return localStorage.getItem("access_token");
  });
  return !!token;
}

/**
 * Clear authentication state
 */
export async function clearAuth(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("workspace_id");
  });
}
