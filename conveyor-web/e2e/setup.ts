import puppeteer, { Browser, Page } from "puppeteer";

// Global browser and page instances
let browser: Browser | null = null;
let page: Page | null = null;

// Configuration
export const config = {
  baseUrl: process.env.E2E_BASE_URL || "http://localhost:3000",
  apiUrl: process.env.E2E_API_URL || "http://localhost:8000",
  headless: process.env.E2E_HEADLESS !== "false", // Default to headless
  slowMo: parseInt(process.env.E2E_SLOW_MO || "0", 10), // Slow down for debugging
  defaultTimeout: 30000,
};

// Test user credentials for E2E tests
export const testUser = {
  email: `e2e-test-${Date.now()}@example.com`,
  username: `e2e_user_${Date.now()}`,
  password: "TestPassword123!",
  firstName: "E2E",
  lastName: "Tester",
};

// Test workspace data
export const testWorkspace = {
  name: `E2E Test Workspace ${Date.now()}`,
  slug: `e2e-test-workspace-${Date.now()}`,
  description: "Workspace created by E2E tests",
};

/**
 * Get or create the browser instance
 */
export async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: config.headless,
      slowMo: config.slowMo,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920,1080",
      ],
    });
  }
  return browser;
}

/**
 * Get or create a new page
 */
export async function getPage(): Promise<Page> {
  const browserInstance = await getBrowser();
  if (!page || page.isClosed()) {
    page = await browserInstance.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    page.setDefaultTimeout(config.defaultTimeout);
  }
  return page;
}

/**
 * Close the page
 */
export async function closePage(): Promise<void> {
  if (page && !page.isClosed()) {
    await page.close();
    page = null;
  }
}

/**
 * Close the browser
 */
export async function closeBrowser(): Promise<void> {
  await closePage();
  if (browser) {
    await browser.close();
    browser = null;
  }
}

// Cleanup after all tests
afterAll(async () => {
  await closeBrowser();
});

// Helper to take screenshots on failure
export async function takeScreenshot(name: string): Promise<void> {
  const currentPage = await getPage();
  await currentPage.screenshot({
    path: `e2e/screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}
