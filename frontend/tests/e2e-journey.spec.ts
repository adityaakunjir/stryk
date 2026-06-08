import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

test.describe('STRYK End-to-End User Journey', () => {
  // Use a unique email for each test run to ensure a "fresh" account
  const timestamp = Date.now();
  const testEmail = `test+clerk_test_${timestamp}@example.com`;
  const testUsername = `player_${timestamp}`.substring(0, 15);

  test('Complete journey from signup to leaderboard', async ({ page }) => {
    test.setTimeout(90000); // 90 seconds timeout for this full flow

    // 1. Setup Clerk test mode
    await setupClerkTestingToken({ page });

    console.log(`Starting E2E test with email: ${testEmail}`);

    // --- SIGNUP ---
    await page.goto('/');
    
    // Click "JOIN STRYK"
    await page.getByRole('button', { name: /JOIN STRYK/i }).click();

    // The Clerk modal is rendered in the DOM. Fill in the email.
    // Clerk's standard class name or aria labels can be used.
    await page.getByLabel(/Email/i).fill(testEmail);
    const testPassword = `StrykPass_${timestamp}!@`;
    await page.locator('input[name="password"]').fill(testPassword);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    
    // Clerk asks for OTP code. In test mode, it's 424242.
    const otpInput = page.getByRole('textbox', { name: 'Enter verification code' });
    await otpInput.waitFor({ state: 'visible' });
    await otpInput.focus();
    await page.waitForTimeout(1000);
    await page.keyboard.type('424242', { delay: 100 });

    // Wait for redirect to /identity
    try {
      await page.waitForURL('**/identity', { timeout: 10000 });
    } catch (e) {
      await page.screenshot({ path: 'clerk-stuck.png' });
      throw e;
    }
    
    // --- IDENTITY ---
    console.log('At Identity page');
    await expect(page.getByText(/Crop Profile Pic/i)).toBeHidden();
    
    // Fill Full Name
    await page.getByPlaceholder(/Enter your full name/i).fill('Test Player');
    // Fill Username
    await page.getByPlaceholder(/Enter your username/i).fill(testUsername);
    
    // Check username availability
    const checkPromise = page.waitForResponse(r => r.url().includes('/api/check-username'));
    await page.getByRole('button', { name: /CHECK/i }).click();
    await checkPromise;

    // Continue
    await page.getByRole('button', { name: /Continue/i }).click();

    // --- POSITION ---
    console.log('At Position page');
    await page.waitForURL('**/position');
    
    // Select 'ST'
    await page.getByRole('button', { name: /^ST$/i }).click();
    
    // Select Right Foot
    await page.getByRole('button', { name: /RIGHT FOOT/i }).click();

    await page.getByRole('button', { name: /Continue/i }).click();

    // --- PLAY STYLE ---
    console.log('At Play Style page');
    await page.waitForURL('**/play-style');
    
    // Select 'Poacher'
    await page.locator('article').filter({ hasText: 'Poacher' }).click();
    
    await page.getByRole('button', { name: /CREATE MY CARD/i }).click();

    // --- HOME ---
    console.log('At Home page');
    await page.waitForURL('**/home');
    await expect(page.getByText('Test Player')).toBeVisible();

    // --- CREATE TEAM ---
    console.log('Navigating to Team Builder');
    await page.goto('/team-builder');
    await page.waitForURL('**/team-builder');

    // Fill team name
    await page.getByPlaceholder(/e.g. Phoenix FC/i).fill(`FC ${testUsername}`);
    await page.getByRole('button', { name: /CREATE TEAM/i }).click();

    // Wait for Team view to load (we should see the team name)
    await expect(page.getByText(`FC ${testUsername}`)).toBeVisible();

    // Invite User
    console.log('Inviting User');
    await page.getByTitle('Invite Player').click();
    await page.getByPlaceholder(/Username/i).fill('nonexistentuser999');
    
    // Listen for the API response
    const invitePromise = page.waitForResponse('**/api/team/invite');
    await page.getByRole('button', { name: /SEND INVITATION/i }).click();
    await invitePromise;

    await page.keyboard.press('Escape');
    // Wait a moment for modal to animate out so clicks aren't intercepted
    await page.waitForTimeout(500);

    // --- CREATE MATCH ---
    console.log('Navigating to Matches');
    await page.goto('/matches');
    await page.waitForURL('**/matches');

    await page.getByTitle('Create Match').click();
    await page.locator('input[type="datetime-local"]').fill('2026-12-31T15:00');
    await page.getByRole('button', { name: /CREATE LOBBY/i }).click();
    
    await expect(page.getByText(/Match Lobby created successfully/i)).toBeVisible();

    // Match is created, toast should appear
    await expect(page.getByText(/Match Lobby created successfully/i)).toBeVisible();

    // --- LEADERBOARD ---
    console.log('Navigating to Leaderboards');
    await page.goto('/leaderboards');
    await page.waitForURL('**/leaderboards');
    
    // We navigated successfully and the page loaded.
    await expect(page.getByRole('heading', { name: /Global Leaderboard/i })).toBeVisible();
  });
});
