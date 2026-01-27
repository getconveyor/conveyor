# E2E Tests for Conveyor Web

This directory contains end-to-end tests using Puppeteer and Jest.

## Structure

```
e2e/
├── setup.ts              # Global test setup, browser configuration
├── helpers/
│   ├── auth.ts           # Authentication helpers (login, register, logout)
│   ├── workspace.ts      # Workspace management helpers
│   └── navigation.ts     # Page navigation helpers
├── tests/
│   ├── auth.test.ts      # Authentication tests
│   ├── workspace.test.ts # Workspace creation/selection tests
│   ├── pages.test.ts     # Platform pages accessibility tests
│   └── full-flow.test.ts # Complete user journey test
└── screenshots/          # Test failure screenshots
```

## Running Tests

### Prerequisites

1. Make sure the backend server is running:

   ```bash
   docker compose up -d
   ```

2. Start the frontend dev server:
   ```bash
   cd conveyor-web
   yarn dev
   ```

### Test Commands

```bash
# Run all E2E tests (headless)
yarn test:e2e

# Run tests in watch mode
yarn test:e2e:watch

# Run tests with browser visible (headed mode)
yarn test:e2e:headed

# Run tests with slow motion for debugging
yarn test:e2e:debug

# Run specific test file
yarn test:e2e -- e2e/tests/auth.test.ts

# Run tests matching a pattern
yarn test:e2e -- --testNamePattern="registration"
```

## Configuration

Environment variables:

- `E2E_BASE_URL` - Frontend URL (default: http://localhost:3000)
- `E2E_API_URL` - Backend API URL (default: http://localhost:8000)
- `E2E_HEADLESS` - Run headless (default: true, set to 'false' for headed)
- `E2E_SLOW_MO` - Slow down actions by ms (default: 0)

## Test Coverage

### Authentication (`auth.test.ts`)

- Registration page display
- Password mismatch validation
- Successful user registration
- Login page display
- Invalid credentials error
- Protected route redirect
- Navigation between auth pages

### Workspace (`workspace.test.ts`)

- Workspace selection page display
- Empty state for new users
- Create workspace dialog
- Successful workspace creation
- Form validation
- Workspace switching

### Platform Pages (`pages.test.ts`)

- Dashboard
- Data Integration (Pipelines, Sources)
- Lakehouse (Catalog, Tables, SQL Editor, Query History)
- Data Warehouse (Tables, Queries)
- Real-time Analytics (Streams, Events, Dashboards)
- Data Governance (Catalog, Lineage, Quality)
- Data Science (Notebooks, Models, Experiments)
- Monitoring (System Health, Alerts, Logs)
- Settings (Profile, Workspace, Team, Security)

### Full Flow (`full-flow.test.ts`)

- Complete user journey from registration to feature usage
- Logout and re-login
- Stress test for rapid navigation

## Writing New Tests

```typescript
import { getPage, config } from "../setup";
import { registerUser, clearAuth } from "../helpers/auth";
import { Page } from "puppeteer";

describe("My Feature Tests", () => {
  let page: Page;

  beforeAll(async () => {
    page = await getPage();
    // Setup: register user, create workspace, etc.
  });

  test("should do something", async () => {
    await page.goto(`${config.baseUrl}/my-page`);

    // Interact with page
    await page.type('input[name="field"]', "value");
    await page.click('button[type="submit"]');

    // Assert
    const result = await page.$eval(".result", (el) => el.textContent);
    expect(result).toContain("expected");
  });
});
```

## Troubleshooting

### Tests timing out

- Increase timeout in `jest.config.js` or individual tests
- Check if backend/frontend servers are running
- Check network connectivity

### Element not found

- Use `waitForSelector` before interacting
- Check selector accuracy with browser devtools
- Add `{ visible: true }` option to wait for visibility

### Flaky tests

- Add explicit waits (`waitForNavigation`, `waitForSelector`)
- Use `waitForPageReady` helper
- Avoid relying on timing

### Screenshots

Screenshots are saved to `e2e/screenshots/` on test failures.
Use `takeScreenshot('name')` to capture manually.
