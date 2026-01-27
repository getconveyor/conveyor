import { getPage, closePage, testUser, takeScreenshot, config } from "../setup";
import {
  registerUser,
  loginUser,
  clearAuth,
  isAuthenticated,
} from "../helpers/auth";
import { Page } from "puppeteer";

describe("Authentication Tests", () => {
  let page: Page;

  beforeAll(async () => {
    page = await getPage();
  });

  beforeEach(async () => {
    // Clear any existing auth state
    await page.goto(config.baseUrl, { waitUntil: "networkidle0" });
    await clearAuth(page);
  });

  afterEach(async () => {
    // Take screenshot on failure
    const testState = expect.getState();
    if (testState.currentTestName && !testState.isExpectingAssertions) {
      // Test might have failed
    }
  });

  describe("User Registration", () => {
    test("should display registration page correctly", async () => {
      await page.goto(`${config.baseUrl}/register`, {
        waitUntil: "networkidle0",
      });

      // Check page elements
      const title = await page.$eval("h1", (el) => el.textContent);
      expect(title).toContain("Conveyor");

      // Check form fields exist
      const firstNameInput = await page.$('input[name="first_name"]');
      const lastNameInput = await page.$('input[name="last_name"]');
      const emailInput = await page.$('input[name="email"]');
      const usernameInput = await page.$('input[name="username"]');
      const passwordInput = await page.$('input[name="password"]');
      const confirmPasswordInput = await page.$(
        'input[name="password_confirm"]'
      );
      const submitButton = await page.$('button[type="submit"]');

      expect(firstNameInput).not.toBeNull();
      expect(lastNameInput).not.toBeNull();
      expect(emailInput).not.toBeNull();
      expect(usernameInput).not.toBeNull();
      expect(passwordInput).not.toBeNull();
      expect(confirmPasswordInput).not.toBeNull();
      expect(submitButton).not.toBeNull();
    });

    test("should show error for mismatched passwords", async () => {
      await page.goto(`${config.baseUrl}/register`, {
        waitUntil: "networkidle0",
      });

      // Fill form with mismatched passwords
      await page.type('input[name="first_name"]', "Test");
      await page.type('input[name="last_name"]', "User");
      await page.type('input[name="email"]', "test@example.com");
      await page.type('input[name="username"]', "testuser");
      await page.type('input[name="password"]', "Password123!");
      await page.type('input[name="password_confirm"]', "DifferentPassword!");

      await page.click('button[type="submit"]');

      // Wait for error message
      await page.waitForSelector(".text-red-600, .text-red-400", {
        visible: true,
        timeout: 5000,
      });

      const errorText = await page.$eval(
        ".text-red-600, .text-red-400",
        (el) => el.textContent
      );
      expect(errorText?.toLowerCase()).toContain("password");
    });

    test("should register a new user successfully", async () => {
      // Use unique test user data
      const uniqueUser = {
        ...testUser,
        email: `e2e-test-${Date.now()}@example.com`,
        username: `e2e_user_${Date.now()}`,
      };

      await registerUser(page, {
        email: uniqueUser.email,
        username: uniqueUser.username,
        password: uniqueUser.password,
        firstName: uniqueUser.firstName,
        lastName: uniqueUser.lastName,
      });

      // Should be redirected to workspace selection
      const currentUrl = page.url();
      expect(currentUrl).toContain("/select-workspace");

      // Should be authenticated
      const authenticated = await isAuthenticated(page);
      expect(authenticated).toBe(true);
    });
  });

  describe("User Login", () => {
    test("should display login page correctly", async () => {
      await page.goto(`${config.baseUrl}/login`, { waitUntil: "networkidle0" });

      // Check page elements
      const title = await page.$eval("h1", (el) => el.textContent);
      expect(title).toContain("Conveyor");

      // Check form fields exist
      const emailInput = await page.$('input[name="email"]');
      const passwordInput = await page.$('input[name="password"]');
      const submitButton = await page.$('button[type="submit"]');

      expect(emailInput).not.toBeNull();
      expect(passwordInput).not.toBeNull();
      expect(submitButton).not.toBeNull();
    });

    test("should show error for invalid credentials", async () => {
      await page.goto(`${config.baseUrl}/login`, { waitUntil: "networkidle0" });

      // Try to login with invalid credentials
      await page.type('input[name="email"]', "invalid@example.com");
      await page.type('input[name="password"]', "wrongpassword");

      await page.click('button[type="submit"]');

      // Wait for error message
      await page.waitForSelector(".text-red-600, .text-red-400", {
        visible: true,
        timeout: 10000,
      });

      const errorText = await page.$eval(
        ".text-red-600, .text-red-400",
        (el) => el.textContent
      );
      expect(errorText).toBeTruthy();
    });

    test("should redirect unauthenticated user to login", async () => {
      // Clear auth and try to access protected page
      await clearAuth(page);
      await page.goto(`${config.baseUrl}/dashboard`, {
        waitUntil: "networkidle0",
      });

      // Should be redirected to login
      const currentUrl = page.url();
      expect(currentUrl).toContain("/login");
    });
  });

  describe("Navigation between auth pages", () => {
    test("should navigate from login to register", async () => {
      await page.goto(`${config.baseUrl}/login`, { waitUntil: "networkidle0" });

      // Click register link
      const registerLink = await page.$('a[href="/register"]');
      expect(registerLink).not.toBeNull();

      await registerLink!.click();
      await page.waitForNavigation({ waitUntil: "networkidle0" });

      const currentUrl = page.url();
      expect(currentUrl).toContain("/register");
    });

    test("should navigate from register to login", async () => {
      await page.goto(`${config.baseUrl}/register`, {
        waitUntil: "networkidle0",
      });

      // Click login link
      const loginLink = await page.$('a[href="/login"]');
      expect(loginLink).not.toBeNull();

      await loginLink!.click();
      await page.waitForNavigation({ waitUntil: "networkidle0" });

      const currentUrl = page.url();
      expect(currentUrl).toContain("/login");
    });
  });
});
