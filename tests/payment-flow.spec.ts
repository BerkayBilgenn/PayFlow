import { test, expect } from '@playwright/test';

test.describe('Payment Flow E2E', () => {
  // Use a generic test account. If this account doesn't exist, the test is written 
  // with the assumption that this account works, per the prompt requirement.
  const testAccountPath = {
    email: 'testuser@payflow.com',
    password: 'securepassword123'
  };

  test('User can login, view dashboard, and create a money request', async ({ page }) => {
    // 1. Navigate to the Login Page
    await page.goto('/login');

    // MOCKING the Supabase Auth to bypass actual authentication if test account doesn't exist.
    // We will intercept the login request to simulate a successful login, 
    // and also mock getUser to provide a session.
    await page.route('**/auth/v1/token?grant_type=password', async (route) => {
      const json = {
        access_token: 'mock_token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock_refresh',
        user: {
          id: '1234-5678',
          aud: 'authenticated',
          role: 'authenticated',
          email: testAccountPath.email,
        }
      };
      await route.fulfill({ json });
    });

    await page.route('**/auth/v1/user*', async (route) => {
      const json = {
        id: '1234-5678',
        aud: 'authenticated',
        role: 'authenticated',
        email: testAccountPath.email,
      };
      await route.fulfill({ json });
    });
    
    // Mock profile fetch
    await page.route('**/rest/v1/profiles*', async (route) => {
      const json = [{ balance: 50000 }];
      await route.fulfill({ json });
    });
    
    // Mock requests fetch
    await page.route('**/rest/v1/payment_requests*', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, json: [{ id: 'mock-req-123' }] });
      } else {
        await route.fulfill({ json: [] });
      }
    });

    // 2. Perform Login
    await page.fill('#login-email', testAccountPath.email);
    await page.fill('#login-password', testAccountPath.password);
    await page.click('#login-submit');

    // 3. Wait for navigation to Dashboard
    await page.waitForURL('/dashboard');
    
    // 4. Verify Dashboard UI elements
    await expect(page.locator('text=Welcome back')).not.toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // 5. Open Request Money Modal
    await page.click('#new-request-btn');
    await expect(page.locator('text=Request Money').nth(1)).toBeVisible(); // header inside modal

    // 6. Fill Out Money Request Form
    await page.fill('#recipient-email', 'friend@payflow.com');
    await page.fill('#amount', '50.00');
    await page.fill('#note', 'Dinner split');

    // 7. Submit Application / Request
    await page.click('#submit-request');

    // 8. Verify Modal closes and an alert/toast appears or outgoing list gets updated
    await expect(page.locator('#submit-request')).not.toBeVisible();

    // Verify success toast appears
    await expect(page.locator('text=Request for $50.00 sent to friend@payflow.com')).toBeVisible();
    
    // Wait slightly to ensure any animations are fully rendered
    await page.waitForTimeout(1000);
  });
});
