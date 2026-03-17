import { test, expect } from '@playwright/test'

/**
 * Feed Page Tests
 * The Feed is a protected route. These tests verify the public-facing
 * redirect for unauthenticated users and the structure of the onboarding
 * page that all users land on. Authenticated feed tests require a session.
 */
test.describe('Feed - Unauthenticated Redirect', () => {
  test('redirects to /onboarding when not logged in', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/onboarding/)
  })
})

/**
 * These tests run only if an authenticated session is available via env var.
 * Set PLAYWRIGHT_AUTHENTICATED=true and provide a valid storage state to run these.
 */
test.describe('Feed - Authenticated User', () => {
  test.skip(({ browserName }) => !process.env.PLAYWRIGHT_AUTHENTICATED,
    'Skipping authenticated tests — set PLAYWRIGHT_AUTHENTICATED=true to run')

  test('shows FRENS header', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1').filter({ hasText: 'FRENS' })).toBeVisible()
  })

  test('shows notification bell button', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('button').filter({ hasText: '🔔' })).toBeVisible()
  })

  test('shows "Your Week" availability strip with 7 days', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Your Week')).toBeVisible()
    // 7 day buttons in the availability strip
    const dayButtons = page.locator('button.flex-shrink-0.w-12.h-20')
    await expect(dayButtons).toHaveCount(7)
  })

  test('clicking a day opens the availability bottom sheet', async ({ page }) => {
    await page.goto('/')
    const firstDay = page.locator('button.flex-shrink-0.w-12.h-20').first()
    await firstDay.click()
    await expect(page.getByText('Set Availability')).toBeVisible()
  })

  test('availability sheet shows Free / Maybe / Busy options', async ({ page }) => {
    await page.goto('/')
    const firstDay = page.locator('button.flex-shrink-0.w-12.h-20').first()
    await firstDay.click()
    await expect(page.getByText("I'm Free / Down")).toBeVisible()
    await expect(page.getByText('Maybe / Depends')).toBeVisible()
    await expect(page.getByText('Busy / Locked in')).toBeVisible()
  })

  test('closing the availability sheet hides it', async ({ page }) => {
    await page.goto('/')
    const firstDay = page.locator('button.flex-shrink-0.w-12.h-20').first()
    await firstDay.click()
    await page.getByText('Cancel').click()
    await expect(page.getByText('Set Availability')).not.toBeVisible()
  })

  test('"Plan Something +" button navigates to /new when no hangouts', async ({ page }) => {
    await page.goto('/')
    const planBtn = page.getByRole('button', { name: /Plan Something/i })
    if (await planBtn.isVisible()) {
      await planBtn.click()
      await expect(page).toHaveURL('/new')
    } else {
      test.skip()
    }
  })
})
