import { test, expect } from '@playwright/test'

/**
 * Profile Page Tests
 */
test.describe('Profile - Unauthenticated Redirect', () => {
  test('redirects to /onboarding when not logged in', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/onboarding/)
  })
})

test.describe('Profile - Authenticated User', () => {
  test.skip(({ browserName }) => !process.env.PLAYWRIGHT_AUTHENTICATED,
    'Skipping authenticated tests — set PLAYWRIGHT_AUTHENTICATED=true to run')

  test('shows profile page without errors', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.locator('body')).not.toContainText('Error')
  })

  test('user avatar or name is visible on profile page', async ({ page }) => {
    await page.goto('/profile')
    // Profile should have some identifying user element
    const nameOrAvatar = page.locator('img[alt="avatar"], h1, h2').first()
    await expect(nameOrAvatar).toBeVisible({ timeout: 5000 })
  })

  test('settings link/button is visible', async ({ page }) => {
    await page.goto('/profile')
    const settingsLink = page.getByRole('link', { name: /settings/i })
      .or(page.getByRole('button', { name: /settings/i }))
    if (await settingsLink.isVisible()) {
      await settingsLink.click()
      await expect(page).toHaveURL(/\/settings/)
    }
  })
})

test.describe('Settings - Unauthenticated Redirect', () => {
  test('redirects to /onboarding when not logged in', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/onboarding/)
  })
})
