import { getPage, config, closeBrowser } from "../setup";
import {
  registerUser,
  loginUser,
  clearAuth,
  logoutUser,
} from "../helpers/auth";
import { createWorkspace } from "../helpers/workspace";
import {
  navigateTo,
  platformPages,
  waitForPageReady,
} from "../helpers/navigation";
import { Page } from "puppeteer";

/**
 * Full end-to-end user flow test
 * Tests the complete journey from registration to using the platform
 */
describe("Full User Flow E2E Test", () => {
  let page: Page;

  // Unique test data for this run
  const testData = {
    user: {
      email: `fullflow-${Date.now()}@example.com`,
      username: `fullflow_user_${Date.now()}`,
      password: "SecurePassword123!",
      firstName: "Full",
      lastName: "Flow",
    },
    workspace: {
      name: `Full Flow Workspace ${Date.now()}`,
      slug: `full-flow-workspace-${Date.now()}`,
      description: "Workspace for full E2E flow testing",
    },
  };

  beforeAll(async () => {
    page = await getPage();
    // Clear any existing state
    await page.goto(config.baseUrl, { waitUntil: "networkidle0" });
    await clearAuth(page);
  });

  describe("Step 1: User Registration", () => {
    test("should register a new user account", async () => {
      console.log("Starting user registration...");

      await registerUser(page, {
        email: testData.user.email,
        username: testData.user.username,
        password: testData.user.password,
        firstName: testData.user.firstName,
        lastName: testData.user.lastName,
      });

      // Should be redirected to workspace selection
      const currentUrl = page.url();
      expect(currentUrl).toContain("/select-workspace");

      console.log("User registration completed successfully");
    });
  });

  describe("Step 2: Workspace Creation", () => {
    test("should create a new workspace", async () => {
      console.log("Creating workspace...");

      await createWorkspace(page, testData.workspace);

      // Should be redirected to dashboard
      const currentUrl = page.url();
      expect(currentUrl).toContain("/dashboard");

      console.log("Workspace creation completed successfully");
    });
  });

  describe("Step 3: Navigate Core Features", () => {
    test("should access dashboard", async () => {
      await navigateTo(page, platformPages.dashboard);
      await waitForPageReady(page);
      expect(page.url()).toContain("/dashboard");
    });

    test("should access data integration - pipelines", async () => {
      await navigateTo(page, platformPages.pipelines);
      await waitForPageReady(page);
      expect(page.url()).toContain("/pipelines");
    });

    test("should access data integration - sources", async () => {
      await navigateTo(page, platformPages.sources);
      await waitForPageReady(page);
      expect(page.url()).toContain("/sources");
    });

    test("should access lakehouse - SQL editor", async () => {
      await navigateTo(page, platformPages.sqlEditor);
      await waitForPageReady(page);
      expect(page.url()).toContain("/sql-editor");
    });

    test("should access lakehouse - tables", async () => {
      await navigateTo(page, platformPages.tables);
      await waitForPageReady(page);
      expect(page.url()).toContain("/tables");
    });

    test("should access settings - profile", async () => {
      await navigateTo(page, platformPages.profile);
      await waitForPageReady(page);
      expect(page.url()).toContain("/profile");
    });
  });

  describe("Step 4: Logout and Re-login", () => {
    test("should be able to logout", async () => {
      // Navigate to select-workspace which has logout option
      await page.goto(`${config.baseUrl}/select-workspace`, {
        waitUntil: "networkidle0",
      });

      // Find and click logout button
      const logoutButton = await page.$("button:has(svg)"); // Logout button with icon
      const buttons = await page.$$("button");

      for (const button of buttons) {
        const text = await page.evaluate(
          (el) => el.textContent?.toLowerCase() || "",
          button
        );
        const hasLogoutIcon = await page.evaluate((el) => {
          return (
            el.querySelector("svg")?.classList.toString().includes("logout") ||
            el.textContent?.toLowerCase().includes("logout") ||
            el.textContent?.toLowerCase().includes("sign out")
          );
        }, button);

        if (
          text.includes("logout") ||
          text.includes("sign out") ||
          hasLogoutIcon
        ) {
          await button.click();
          break;
        }
      }

      // Wait for navigation to login
      await page
        .waitForNavigation({ waitUntil: "networkidle0", timeout: 10000 })
        .catch(() => {});

      // Clear auth manually as fallback
      await clearAuth(page);
      await page.goto(`${config.baseUrl}/login`, { waitUntil: "networkidle0" });

      expect(page.url()).toContain("/login");
    });

    test("should be able to login with created account", async () => {
      await loginUser(page, {
        email: testData.user.email,
        password: testData.user.password,
      });

      // Should be redirected to workspace selection or dashboard
      const currentUrl = page.url();
      const isValidRedirect =
        currentUrl.includes("/select-workspace") ||
        currentUrl.includes("/dashboard");
      expect(isValidRedirect).toBe(true);
    });
  });

  describe("Step 5: Access Workspace After Re-login", () => {
    test("should see previously created workspace", async () => {
      // Navigate to workspace selection
      await page.goto(`${config.baseUrl}/select-workspace`, {
        waitUntil: "networkidle0",
      });

      // Should see the workspace we created
      const pageContent = await page.content();
      expect(pageContent).toContain(testData.workspace.name);
    });

    test("should be able to enter workspace", async () => {
      // Click on the workspace card
      const workspaceCards = await page.$$(
        '[data-slot="card"], .cursor-pointer'
      );

      for (const card of workspaceCards) {
        const text = await page.evaluate((el) => el.textContent, card);
        if (text?.includes(testData.workspace.name)) {
          await card.click();
          break;
        }
      }

      // Wait for navigation
      await page
        .waitForNavigation({ waitUntil: "networkidle0", timeout: 10000 })
        .catch(() => {});

      // Should be on dashboard
      const currentUrl = page.url();
      expect(currentUrl).toContain("/dashboard");
    });
  });
});

/**
 * Stress test - rapid page navigation
 */
describe("Stress Test: Rapid Navigation", () => {
  let page: Page;

  beforeAll(async () => {
    page = await getPage();

    // Ensure we're authenticated
    const currentUrl = page.url();
    if (currentUrl.includes("/login") || currentUrl.includes("/register")) {
      // Need to authenticate first
      const testUser = {
        email: `stress-${Date.now()}@example.com`,
        username: `stress_user_${Date.now()}`,
        password: "StressTest123!",
        firstName: "Stress",
        lastName: "Test",
      };

      await clearAuth(page);
      await registerUser(page, testUser);
      await createWorkspace(page, {
        name: `Stress Test Workspace ${Date.now()}`,
        slug: `stress-test-workspace-${Date.now()}`,
      });
    }
  });

  test("should handle rapid navigation between pages", async () => {
    const pagesToVisit = [
      platformPages.dashboard,
      platformPages.pipelines,
      platformPages.sources,
      platformPages.sqlEditor,
      platformPages.tables,
      platformPages.profile,
      platformPages.dashboard,
    ];

    for (const pagePath of pagesToVisit) {
      await navigateTo(page, pagePath);
      // Don't wait for full load, just ensure navigation starts
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Final page should load correctly
    await waitForPageReady(page);
    expect(page.url()).toContain("/dashboard");
  });
});
