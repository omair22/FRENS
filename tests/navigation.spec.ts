import { test, expect } from '@playwright/test'

/**
 * Navigation Tests
 * Tests routing behaviour for authenticated and unauthenticated users.
 * NOTE: Most protected-route tests require a real session, so they check
 * the redirect behaviour that unauthenticated users experience.
 */
test.describe('Protected Route Redirects', () => {
  test('unauthenticated user visiting / is redirected to /onboarding', async ({ page }) => {
    await page.goto('/')
    // The app redirects unauthenticated users to /onboarding
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/onboarding/)
  })

  test('unauthenticated user visiting /frens is redirected to /onboarding', async ({ page }) => {
    await page.goto('/frens')
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/onboarding/)
  })

  test('unauthenticated user visiting /profile is redirected to /onboarding', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/onboarding/)
  })

  test('unauthenticated user visiting /notifications is redirected to /onboarding', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/onboarding/)
  })

  test('unauthenticated user visiting /new is redirected to /onboarding', async ({ page }) => {
    await page.goto('/new')
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/onboarding/)
  })
})

test.describe('Onboarding page is publicly accessible', () => {
  test('/onboarding loads without redirect', async ({ page }) => {
    await page.goto('/onboarding')
    await expect(page).toHaveURL('/onboarding')
    await expect(page.locator('h1').filter({ hasText: 'frens' })).toBeVisible()
  })
})
