import { Page } from "puppeteer";
import { config } from "../setup";

export interface WorkspaceData {
  name: string;
  slug: string;
  description?: string;
}

/**
 * Create a new workspace
 */
export async function createWorkspace(
  page: Page,
  workspaceData: WorkspaceData
): Promise<void> {
  console.log(`Creating workspace: ${workspaceData.name}`);

  // Make sure we're on the workspace selection page
  const currentUrl = page.url();
  if (!currentUrl.includes("/select-workspace")) {
    await page.goto(`${config.baseUrl}/select-workspace`, {
      waitUntil: "networkidle0",
    });
  }

  // Wait for the page to load
  await page.waitForSelector("button", { visible: true });

  // Click "Create Workspace" button
  const createButton = await page
    .waitForSelector(
      'button:has-text("Create Workspace"), button:has-text("Create New Workspace"), [data-testid="create-workspace-button"]',
      {
        visible: true,
        timeout: 10000,
      }
    )
    .catch(async () => {
      // Try finding by icon or other patterns
      const buttons = await page.$$("button");
      for (const button of buttons) {
        const text = await page.evaluate((el) => el.textContent, button);
        if (
          text?.toLowerCase().includes("create") ||
          text?.toLowerCase().includes("new")
        ) {
          return button;
        }
      }
      return null;
    });

  if (!createButton) {
    throw new Error("Could not find Create Workspace button");
  }

  await createButton.click();

  // Wait for dialog to appear
  await page.waitForSelector('[role="dialog"], [data-slot="dialog-content"]', {
    visible: true,
  });

  // Fill in workspace details
  // Find the name input
  const nameInput = await page.$(
    'input[id*="name"], input[placeholder*="name"], input[name="name"]'
  );
  if (nameInput) {
    await nameInput.click({ clickCount: 3 }); // Select all
    await nameInput.type(workspaceData.name);
  }

  // Wait a bit for slug to auto-generate, then verify/update if needed
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Find the slug input and update if needed
  const slugInput = await page.$(
    'input[id*="slug"], input[placeholder*="slug"], input[name="slug"]'
  );
  if (slugInput) {
    await slugInput.click({ clickCount: 3 }); // Select all
    await slugInput.type(workspaceData.slug);
  }

  // Fill description if provided
  if (workspaceData.description) {
    const descInput = await page.$(
      'textarea[id*="description"], textarea[placeholder*="description"], textarea[name="description"]'
    );
    if (descInput) {
      await descInput.type(workspaceData.description);
    }
  }

  // Click create/submit button in the dialog
  const submitButton = await page.$(
    '[role="dialog"] button[type="submit"], [data-slot="dialog-content"] button:has-text("Create")'
  );
  if (submitButton) {
    await submitButton.click();
  } else {
    // Try finding by text content
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
  }

  // Wait for navigation to dashboard
  await page
    .waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 })
    .catch(() => {
      // Might already be on dashboard
    });

  // Verify we're on the dashboard
  const newUrl = page.url();
  if (newUrl.includes("/dashboard")) {
    console.log("Workspace created successfully");
  } else {
    // Check for any error messages
    const errorElement = await page.$(
      '.text-red-600, .text-red-400, [data-sonner-toast][data-type="error"]'
    );
    if (errorElement) {
      const errorText = await page.evaluate(
        (el) => el?.textContent,
        errorElement
      );
      throw new Error(`Failed to create workspace: ${errorText}`);
    }
  }
}

/**
 * Select an existing workspace
 */
export async function selectWorkspace(
  page: Page,
  workspaceName: string
): Promise<void> {
  console.log(`Selecting workspace: ${workspaceName}`);

  // Navigate to workspace selection
  await page.goto(`${config.baseUrl}/select-workspace`, {
    waitUntil: "networkidle0",
  });

  // Wait for workspaces to load
  await page
    .waitForSelector('[data-slot="card"], .workspace-card', {
      visible: true,
      timeout: 10000,
    })
    .catch(() => {
      // Cards might have different structure
    });

  // Find and click the workspace card
  const workspaceCards = await page.$$(
    '[data-slot="card"], .workspace-card, [role="button"]'
  );
  for (const card of workspaceCards) {
    const text = await page.evaluate((el) => el.textContent, card);
    if (text?.includes(workspaceName)) {
      await card.click();
      break;
    }
  }

  // Wait for navigation to dashboard
  await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 });

  console.log("Workspace selected");
}

/**
 * Get the current workspace name from the UI
 */
export async function getCurrentWorkspaceName(
  page: Page
): Promise<string | null> {
  // This depends on your UI showing the workspace name somewhere
  const workspaceElement = await page.$(
    '[data-testid="current-workspace"], .workspace-name'
  );
  if (workspaceElement) {
    return await page.evaluate(
      (el) => el?.textContent || null,
      workspaceElement
    );
  }
  return null;
}
