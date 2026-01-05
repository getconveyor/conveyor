import { Page } from "puppeteer";
import { config } from "../setup";

/**
 * Navigate to a platform page
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  const url = `${config.baseUrl}${path}`;
  console.log(`Navigating to: ${url}`);
  await page.goto(url, { waitUntil: "networkidle0" });
}

/**
 * Wait for page to be ready (no loading indicators)
 */
export async function waitForPageReady(page: Page): Promise<void> {
  // Wait for any loading spinners to disappear
  await page
    .waitForFunction(
      () => {
        const loaders = document.querySelectorAll(
          '[data-loading="true"], .animate-spin, [role="progressbar"]'
        );
        return loaders.length === 0;
      },
      { timeout: 30000 }
    )
    .catch(() => {
      // Timeout is okay, page might be ready
    });
}

/**
 * Navigate using the sidebar
 */
export async function navigateViaSidebar(
  page: Page,
  menuText: string
): Promise<void> {
  console.log(`Clicking sidebar menu: ${menuText}`);

  // Find and click sidebar menu item
  const sidebarItems = await page.$$('nav a, aside a, [data-slot="sidebar"] a');
  for (const item of sidebarItems) {
    const text = await page.evaluate((el) => el.textContent, item);
    if (text?.toLowerCase().includes(menuText.toLowerCase())) {
      await item.click();
      await page
        .waitForNavigation({ waitUntil: "networkidle0" })
        .catch(() => {});
      return;
    }
  }

  throw new Error(`Could not find sidebar menu item: ${menuText}`);
}

/**
 * Platform pages configuration
 */
export const platformPages = {
  dashboard: "/dashboard",

  // Data Integration
  pipelines: "/data-integration/pipelines",
  sources: "/data-integration/sources",

  // Lakehouse
  catalog: "/lakehouse/catalog",
  tables: "/lakehouse/tables",
  sqlEditor: "/lakehouse/sql-editor",
  queryHistory: "/lakehouse/query-history",

  // Data Warehouse
  warehouseTables: "/warehouse/tables",
  warehouseQueries: "/warehouse/queries",

  // Real-time Analytics
  streams: "/real-time-analytics/streams",
  events: "/real-time-analytics/events",
  dashboards: "/real-time-analytics/dashboards",

  // Data Governance
  dataCatalog: "/data-governance/catalog",
  lineage: "/data-governance/lineage",
  quality: "/data-governance/quality",

  // Data Science
  notebooks: "/data-science/notebooks",
  models: "/data-science/models",
  experiments: "/data-science/experiments",

  // Monitoring
  systemHealth: "/monitoring/system",
  alerts: "/monitoring/alerts",
  logs: "/monitoring/logs",

  // Settings
  profile: "/settings/profile",
  workspace: "/settings/workspace",
  team: "/settings/team",
  security: "/settings/security",
};

/**
 * Verify current page matches expected path
 */
export function verifyCurrentPage(page: Page, expectedPath: string): boolean {
  const currentUrl = page.url();
  return currentUrl.includes(expectedPath);
}

/**
 * Get page title
 */
export async function getPageTitle(page: Page): Promise<string> {
  return await page.title();
}

/**
 * Check if an element exists on the page
 */
export async function elementExists(
  page: Page,
  selector: string
): Promise<boolean> {
  const element = await page.$(selector);
  return element !== null;
}

/**
 * Wait for and click an element
 */
export async function waitAndClick(
  page: Page,
  selector: string,
  options?: { timeout?: number }
): Promise<void> {
  await page.waitForSelector(selector, {
    visible: true,
    timeout: options?.timeout || 10000,
  });
  await page.click(selector);
}

/**
 * Wait for text to appear on page
 */
export async function waitForText(
  page: Page,
  text: string,
  options?: { timeout?: number }
): Promise<void> {
  await page.waitForFunction(
    (searchText) => document.body.textContent?.includes(searchText),
    { timeout: options?.timeout || 10000 },
    text
  );
}
