import { test, expect } from '@playwright/test'

/**
 * Notifications Page Tests
 */
test.describe('Notifications - Unauthenticated Redirect', () => {
  test('redirects to /onboarding when not logged in', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/onboarding/)
  })
})

test.describe('Notifications - Authenticated User', () => {
  test.skip(({ browserName }) => !process.env.PLAYWRIGHT_AUTHENTICATED,
    'Skipping authenticated tests — set PLAYWRIGHT_AUTHENTICATED=true to run')

  test('shows notifications page without errors', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page.locator('body')).not.toContainText('Error')
  })

  test('shows notifications heading or empty state', async ({ page }) => {
    await page.goto('/notifications')
    const heading = page.getByText(/Notifications|All caught up|No notifications/i)
    await expect(heading).toBeVisible({ timeout: 5000 })
  })
})
