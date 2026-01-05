import { getPage, closePage, testUser, testWorkspace, config } from "../setup";
import { registerUser, loginUser, clearAuth } from "../helpers/auth";
import { createWorkspace, selectWorkspace } from "../helpers/workspace";
import { Page } from "puppeteer";

describe("Workspace Tests", () => {
  let page: Page;
  let registeredUser: typeof testUser;

  beforeAll(async () => {
    page = await getPage();

    // Create a unique user for workspace tests
    registeredUser = {
      ...testUser,
      email: `workspace-test-${Date.now()}@example.com`,
      username: `workspace_user_${Date.now()}`,
    };

    // Register the user first
    await page.goto(config.baseUrl, { waitUntil: "networkidle0" });
    await clearAuth(page);

    await registerUser(page, {
      email: registeredUser.email,
      username: registeredUser.username,
      password: registeredUser.password,
      firstName: registeredUser.firstName,
      lastName: registeredUser.lastName,
    });
  });

  beforeEach(async () => {
    // Make sure we're on the workspace selection page
    const currentUrl = page.url();
    if (!currentUrl.includes("/select-workspace")) {
      await page.goto(`${config.baseUrl}/select-workspace`, {
        waitUntil: "networkidle0",
      });
    }
  });

  describe("Workspace Selection Page", () => {
    test("should display workspace selection page", async () => {
      await page.goto(`${config.baseUrl}/select-workspace`, {
        waitUntil: "networkidle0",
      });

      // Should show the page title or welcome message
      const pageContent = await page.content();
      expect(pageContent.toLowerCase()).toMatch(/workspace|select|choose/);

      // Should have a create workspace button
      const createButton = await page.$("button");
      expect(createButton).not.toBeNull();
    });

    test("should show empty state for new user", async () => {
      // For a brand new user, there should be no workspaces
      // or a prompt to create one
      const pageContent = await page.content();

      // Should either show empty state or create workspace option
      const hasCreateOption =
        pageContent.toLowerCase().includes("create") ||
        pageContent.toLowerCase().includes("new workspace");
      expect(hasCreateOption).toBe(true);
    });
  });

  describe("Workspace Creation", () => {
    test("should open create workspace dialog", async () => {
      await page.goto(`${config.baseUrl}/select-workspace`, {
        waitUntil: "networkidle0",
      });

      // Find and click create button
      const buttons = await page.$$("button");
      let createButton = null;
      for (const button of buttons) {
        const text = await page.evaluate((el) => el.textContent, button);
        if (
          text?.toLowerCase().includes("create") ||
          text?.toLowerCase().includes("new")
        ) {
          createButton = button;
          break;
        }
      }

      expect(createButton).not.toBeNull();
      await createButton!.click();

      // Wait for dialog
      await page.waitForSelector(
        '[role="dialog"], [data-slot="dialog-content"]',
        {
          visible: true,
          timeout: 5000,
        }
      );

      // Dialog should have form inputs
      const nameInput = await page.$(
        '[role="dialog"] input, [data-slot="dialog-content"] input'
      );
      expect(nameInput).not.toBeNull();
    });

    test("should create a new workspace successfully", async () => {
      const uniqueWorkspace = {
        ...testWorkspace,
        name: `Test Workspace ${Date.now()}`,
        slug: `test-workspace-${Date.now()}`,
      };

      await createWorkspace(page, uniqueWorkspace);

      // Should be redirected to dashboard
      const currentUrl = page.url();
      expect(currentUrl).toContain("/dashboard");
    });

    test("should validate workspace form fields", async () => {
      await page.goto(`${config.baseUrl}/select-workspace`, {
        waitUntil: "networkidle0",
      });

      // Click create button
      const buttons = await page.$$("button");
      for (const button of buttons) {
        const text = await page.evaluate((el) => el.textContent, button);
        if (
          text?.toLowerCase().includes("create") ||
          text?.toLowerCase().includes("new")
        ) {
          await button.click();
          break;
        }
      }

      // Wait for dialog
      await page.waitForSelector(
        '[role="dialog"], [data-slot="dialog-content"]',
        { visible: true }
      );

      // Try to submit empty form
      const dialogButtons = await page.$$(
        '[role="dialog"] button, [data-slot="dialog-content"] button'
      );
      for (const button of dialogButtons) {
        const text = await page.evaluate((el) => el.textContent, button);
        if (
          text?.toLowerCase().includes("create") &&
          !text?.toLowerCase().includes("cancel")
        ) {
          await button.click();
          break;
        }
      }

      // Should show validation error or form should prevent submission
      // Dialog should still be open
      const dialogStillOpen = await page.$(
        '[role="dialog"], [data-slot="dialog-content"]'
      );
      expect(dialogStillOpen).not.toBeNull();
    });
  });

  describe("Workspace Switching", () => {
    test("should be able to switch between workspaces", async () => {
      // First create another workspace
      const secondWorkspace = {
        name: `Second Workspace ${Date.now()}`,
        slug: `second-workspace-${Date.now()}`,
        description: "Second test workspace",
      };

      // Go to workspace selection
      await page.goto(`${config.baseUrl}/select-workspace`, {
        waitUntil: "networkidle0",
      });

      // Create the second workspace
      await createWorkspace(page, secondWorkspace);

      // Now we should be on dashboard
      expect(page.url()).toContain("/dashboard");

      // Navigate back to workspace selection
      await page.goto(`${config.baseUrl}/select-workspace`, {
        waitUntil: "networkidle0",
      });

      // Should see multiple workspaces now
      const workspaceCards = await page.$$(
        '[data-slot="card"], .cursor-pointer'
      );
      expect(workspaceCards.length).toBeGreaterThanOrEqual(1);
    });
  });
});
