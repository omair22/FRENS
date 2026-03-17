import { test, expect } from '@playwright/test'

/**
 * Hangout Tests
 * New Hangout creation and Hangout Detail pages.
 */
test.describe('New Hangout - Unauthenticated Redirect', () => {
  test('redirects to /onboarding when not logged in', async ({ page }) => {
    await page.goto('/new')
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/onboarding/)
  })
})

test.describe('New Hangout - Authenticated User', () => {
  test.skip(({ browserName }) => !process.env.PLAYWRIGHT_AUTHENTICATED,
    'Skipping authenticated tests — set PLAYWRIGHT_AUTHENTICATED=true to run')

  test('shows New Hangout form on /new', async ({ page }) => {
    await page.goto('/new')
    // Expect form to be present
    await expect(page.locator('form, [data-testid="new-hangout-form"]').or(
      page.locator('input[placeholder*="hangout"], input[placeholder*="title"], input[placeholder*="vibe"]')
    )).toBeVisible({ timeout: 5000 })
  })

  test('submit is disabled with empty title', async ({ page }) => {
    await page.goto('/new')
    // Look for a submit-like button
    const submitBtn = page.getByRole('button', { name: /create|post|drop|submit/i })
    if (await submitBtn.isVisible()) {
      await expect(submitBtn).toBeDisabled()
    }
  })
})

test.describe('Hangout Detail - Unauthenticated Redirect', () => {
  test('redirects to /onboarding for unknown hangout', async ({ page }) => {
    await page.goto('/hangout/test-id-123')
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/onboarding/)
  })
})
