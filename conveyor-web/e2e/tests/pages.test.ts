import { getPage, testUser, testWorkspace, config } from "../setup";
import { registerUser, clearAuth } from "../helpers/auth";
import { createWorkspace } from "../helpers/workspace";
import {
  navigateTo,
  platformPages,
  waitForPageReady,
  elementExists,
  waitForText,
} from "../helpers/navigation";
import { Page } from "puppeteer";

describe("Platform Pages Tests", () => {
  let page: Page;

  beforeAll(async () => {
    page = await getPage();

    // Create a unique user and workspace for page tests
    const uniqueUser = {
      ...testUser,
      email: `pages-test-${Date.now()}@example.com`,
      username: `pages_user_${Date.now()}`,
    };

    const uniqueWorkspace = {
      ...testWorkspace,
      name: `Pages Test Workspace ${Date.now()}`,
      slug: `pages-test-workspace-${Date.now()}`,
    };

    // Clear auth and register
    await page.goto(config.baseUrl, { waitUntil: "networkidle0" });
    await clearAuth(page);

    await registerUser(page, {
      email: uniqueUser.email,
      username: uniqueUser.username,
      password: uniqueUser.password,
      firstName: uniqueUser.firstName,
      lastName: uniqueUser.lastName,
    });

    // Create workspace
    await createWorkspace(page, uniqueWorkspace);
  });

  describe("Dashboard", () => {
    test("should load dashboard page", async () => {
      await navigateTo(page, platformPages.dashboard);
      await waitForPageReady(page);

      const currentUrl = page.url();
      expect(currentUrl).toContain("/dashboard");

      // Dashboard should have some content
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(1000);
    });

    test("should display sidebar navigation", async () => {
      await navigateTo(page, platformPages.dashboard);

      // Check for sidebar
      const sidebar = await page.$('aside, nav, [data-slot="sidebar"]');
      expect(sidebar).not.toBeNull();
    });
  });

  describe("Data Integration Pages", () => {
    test("should load pipelines page", async () => {
      await navigateTo(page, platformPages.pipelines);
      await waitForPageReady(page);

      expect(page.url()).toContain("/pipelines");

      // Should have page title or header
      await waitForText(page, "Pipeline").catch(() => {});
    });

    test("should load sources page", async () => {
      await navigateTo(page, platformPages.sources);
      await waitForPageReady(page);

      expect(page.url()).toContain("/sources");
    });
  });

  describe("Lakehouse Pages", () => {
    test("should load namespaces page", async () => {
      await navigateTo(page, platformPages.namespaces);
      await waitForPageReady(page);

      expect(page.url()).toContain("/namespaces");
    });

    test("should load tables page", async () => {
      await navigateTo(page, platformPages.tables);
      await waitForPageReady(page);

      expect(page.url()).toContain("/tables");
    });

    test("should load SQL editor page", async () => {
      await navigateTo(page, platformPages.sqlEditor);
      await waitForPageReady(page);

      expect(page.url()).toContain("/sql-editor");

      // SQL editor should have Monaco editor or similar
      const editor = await page.$(
        '.monaco-editor, [data-testid="sql-editor"], textarea'
      );
      expect(editor).not.toBeNull();
    });

    test("should load query history page", async () => {
      await navigateTo(page, platformPages.queryHistory);
      await waitForPageReady(page);

      expect(page.url()).toContain("/query-history");
    });
  });

  describe("Data Warehouse Pages", () => {
    test("should load warehouse tables page", async () => {
      await navigateTo(page, platformPages.warehouseTables);
      await waitForPageReady(page);

      expect(page.url()).toContain("/warehouse");
    });

    test("should load warehouse queries page", async () => {
      await navigateTo(page, platformPages.warehouseQueries);
      await waitForPageReady(page);

      expect(page.url()).toContain("/warehouse");
    });
  });

  describe("Real-time Analytics Pages", () => {
    test("should load streams page", async () => {
      await navigateTo(page, platformPages.streams);
      await waitForPageReady(page);

      expect(page.url()).toContain("/streams");
    });

    test("should load events page", async () => {
      await navigateTo(page, platformPages.events);
      await waitForPageReady(page);

      expect(page.url()).toContain("/events");
    });

    test("should load analytics dashboards page", async () => {
      await navigateTo(page, platformPages.dashboards);
      await waitForPageReady(page);

      expect(page.url()).toContain("/dashboards");
    });
  });

  describe("Data Governance Pages", () => {
    test("should load data catalog page", async () => {
      await navigateTo(page, platformPages.dataCatalog);
      await waitForPageReady(page);

      expect(page.url()).toContain("/catalog");
    });

    test("should load lineage page", async () => {
      await navigateTo(page, platformPages.lineage);
      await waitForPageReady(page);

      expect(page.url()).toContain("/lineage");
    });

    test("should load data quality page", async () => {
      await navigateTo(page, platformPages.quality);
      await waitForPageReady(page);

      expect(page.url()).toContain("/quality");
    });
  });

  describe("Data Science Pages", () => {
    test("should load notebooks page", async () => {
      await navigateTo(page, platformPages.notebooks);
      await waitForPageReady(page);

      expect(page.url()).toContain("/notebooks");
    });

    test("should load models page", async () => {
      await navigateTo(page, platformPages.models);
      await waitForPageReady(page);

      expect(page.url()).toContain("/models");
    });

    test("should load experiments page", async () => {
      await navigateTo(page, platformPages.experiments);
      await waitForPageReady(page);

      expect(page.url()).toContain("/experiments");
    });
  });

  describe("Monitoring Pages", () => {
    test("should load system health page", async () => {
      await navigateTo(page, platformPages.systemHealth);
      await waitForPageReady(page);

      expect(page.url()).toContain("/monitoring");
    });

    test("should load alerts page", async () => {
      await navigateTo(page, platformPages.alerts);
      await waitForPageReady(page);

      expect(page.url()).toContain("/alerts");
    });

    test("should load logs page", async () => {
      await navigateTo(page, platformPages.logs);
      await waitForPageReady(page);

      expect(page.url()).toContain("/logs");
    });
  });

  describe("Settings Pages", () => {
    test("should load profile settings page", async () => {
      await navigateTo(page, platformPages.profile);
      await waitForPageReady(page);

      expect(page.url()).toContain("/profile");
    });

    test("should load workspace settings page", async () => {
      await navigateTo(page, platformPages.workspace);
      await waitForPageReady(page);

      expect(page.url()).toContain("/workspace");
    });

    test("should load team settings page", async () => {
      await navigateTo(page, platformPages.team);
      await waitForPageReady(page);

      expect(page.url()).toContain("/team");
    });

    test("should load security settings page", async () => {
      await navigateTo(page, platformPages.security);
      await waitForPageReady(page);

      expect(page.url()).toContain("/security");
    });
  });
});
