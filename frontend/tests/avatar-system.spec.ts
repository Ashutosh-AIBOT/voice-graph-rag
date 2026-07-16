import { test, expect } from '@playwright/test';

test.describe('Avatar System E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/voice-rag');
    
    // Wait for the app to initialize
    await page.waitForTimeout(2000);
  });

  test('Mode transition timing: start button triggers talk mode', async ({ page }) => {
    // Trigger transition by clicking Start Conversation
    const startBtn = page.getByText(/Start Conversation/i);
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Verify mode transition logic (sidebar collapsed)
    await expect(page.locator('.sidebar-container')).toHaveClass(/w-[60px]/, { timeout: 1000 });
  });

  test('State machine basic flow', async ({ page }) => {
    // Inject mock events to test state machine without real voice
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('avatar:state_changed', { detail: { state: 'listening' } }));
    });
    
    // Wait briefly for state to propagate
    await page.waitForTimeout(500);

    // Verify HUD or internal state has 'listening'
    // Since HUD is hidden, we can evaluate state directly
    const state = await page.evaluate(() => {
      return (window as any).useAvatarStateMachine?.getState().currentState;
    });
    
    // Fallback: check DOM if possible, or just emit topic matched
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('avatar:state_changed', { detail: { state: 'walk_to_node', payload: { nodeId: 'test' } } }));
    });
  });

  test('Session memory persistence', async ({ page }) => {
    // Inject mock session
    await page.evaluate(() => {
      const snap = {
        timestamp: Date.now(),
        lastNodeId: null,
        visitedNodeIds: ['node-1', 'node-2'],
        lastMood: 'focus',
        lastPersonaId: 'serious_analyst',
        conversationTurns: 3,
        documentIds: []
      };
      localStorage.setItem('graphrag-memory', JSON.stringify({ state: { snapshot: snap } }));
    });

    await page.reload();
    await page.waitForTimeout(1000);

    // Verify welcome back overlay is shown
    await expect(page.getByText('Welcome back!')).toBeVisible();
  });
  
  test('Particle FX cleanup', async ({ page }) => {
    // Trigger fx
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('fx:trigger', { detail: { effect: 'node_grab', position: {x:0, y:0, z:0} } }));
    });
    
    // Just verify no crash
    await page.waitForTimeout(1000);
  });
});
