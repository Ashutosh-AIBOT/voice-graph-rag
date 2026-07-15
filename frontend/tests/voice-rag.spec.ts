import { test, expect } from '@playwright/test';

test.describe('Voice RAG Connect & Select Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept and mock the Django backend WSS token generation
    // This removes the dependency on an active LiveKit room for UI testing!
    await page.route('**/livekit-token/', async (route) => {
      const json = {
        token: 'mock-jwt-token',
        url: 'wss://mock-livekit-server-xyz',
        room: 'mock-room-id',
        doc_summary: 'This is a mocked summary for E2E testing.'
      };
      await route.fulfill({ json });
    });

    await page.goto('/voice-rag');
  });

  test('deterministic connection flow utilizing test-ids and mocking', async ({ page }) => {
    // 1. Locate the connect button using the data-testid we injected previously
    const connectBtn = page.getByTestId('connect-rag-button');
    
    // 2. Assert the UI loaded the button correctly without hard sleeps
    await expect(connectBtn).toBeVisible({ timeout: 15000 });

    // 3. Test the document selection UI (Select All)
    const selectAllBtn = page.getByTestId('select-all-docs-button');
    // It will only be visible if there are documents, but if it is, we click it
    if (await selectAllBtn.isVisible()) {
        await selectAllBtn.click();
    }

    // 4. Trigger the connection
    await connectBtn.click();

    // 5. The network request to /livekit-token/ is intercepted and fulfilled instantly.
    // The LiveKit SDK will attempt to connect to 'wss://mock-livekit-server-xyz'.
    // The connection button should immediately disappear as the UI enters the 'connecting' state.
    await expect(connectBtn).toBeHidden({ timeout: 5000 });
  });
});
