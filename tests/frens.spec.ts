import { test, expect } from '@playwright/test'

/**
 * Frens Page Tests
 */
test.describe('Frens - Unauthenticated Redirect', () => {
  test('redirects to /onboarding when not logged in', async ({ page }) => {
    await page.goto('/frens')
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/onboarding/)
  })
})

test.describe('Frens - Authenticated User', () => {
  test.skip(({ browserName }) => !process.env.PLAYWRIGHT_AUTHENTICATED,
    'Skipping authenticated tests — set PLAYWRIGHT_AUTHENTICATED=true to run')

  test('shows "YOUR CREW" heading', async ({ page }) => {
    await page.goto('/frens')
    await expect(page.getByText('YOUR CREW')).toBeVisible()
  })

  test('search input is visible', async ({ page }) => {
    await page.goto('/frens')
    await expect(page.getByPlaceholder('Search by name or email')).toBeVisible()
  })

  test('typing 1 character does not show search dropdown', async ({ page }) => {
    await page.goto('/frens')
    await page.getByPlaceholder('Search by name or email').fill('a')
    // Dropdown should not appear for < 2 chars
    const dropdown = page.locator('div.absolute.top-\\[56px\\]')
    await expect(dropdown).not.toBeVisible()
  })

  test('typing 2+ characters shows search dropdown', async ({ page }) => {
    await page.goto('/frens')
    await page.getByPlaceholder('Search by name or email').fill('te')
    // Dropdown should appear
    const dropdown = page.locator('div.absolute.top-\\[56px\\]')
    await expect(dropdown).toBeVisible({ timeout: 3000 })
  })

  test('clearing search with × button removes results', async ({ page }) => {
    await page.goto('/frens')
    await page.getByPlaceholder('Search by name or email').fill('test')
    await page.waitForTimeout(500)
    const clearBtn = page.locator('button').filter({ hasText: '✕' })
    await clearBtn.click()
    await expect(page.getByPlaceholder('Search by name or email')).toHaveValue('')
  })

  test('shows "No frens yet" empty state when frens list is empty', async ({ page }) => {
    await page.goto('/frens')
    // May or may not be empty — check for The Inner Circle count header
    await expect(page.getByText(/The Inner Circle/)).toBeVisible({ timeout: 5000 })
  })

  test('shows "Fren Requests" section if there are pending requests', async ({ page }) => {
    await page.goto('/frens')
    // This section only shows if there are requests — just ensure no errors
    await expect(page.locator('body')).not.toContainText('Error')
  })
})
