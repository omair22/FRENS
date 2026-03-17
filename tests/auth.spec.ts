import { test, expect } from '@playwright/test'

/**
 * Auth / Onboarding Flow Tests
 * Tests the 4-step onboarding UI without making real Supabase calls.
 */
test.describe('Onboarding - Landing Page (Step 1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/onboarding')
  })

  test('shows app title "frens"', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: 'frens' })).toBeVisible()
  })

  test('shows Sign In and Create Account buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible()
  })

  test('clicking Sign In advances to Step 2 (auth form)', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByText('Welcome back')).toBeVisible()
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByPlaceholder('Password')).toBeVisible()
  })

  test('clicking Create Account advances to Step 2 (signup form)', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(page.getByText('Create account')).toBeVisible()
  })
})

test.describe('Onboarding - Step 2 (Auth Form)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/onboarding')
    await page.getByRole('button', { name: 'Sign In' }).click()
  })

  test('submit button is disabled with empty fields', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: 'Sign In' }).last()
    await expect(submitBtn).toBeDisabled()
  })

  test('submit button is enabled when email and password are filled', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('test@example.com')
    await page.getByPlaceholder('Password').fill('password123')
    const submitBtn = page.getByRole('button', { name: 'Sign In' }).last()
    await expect(submitBtn).not.toBeDisabled()
  })

  test('Google OAuth button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible()
  })

  test('toggle to Sign Up works', async ({ page }) => {
    await page.getByRole('button', { name: /Don't have an account/i }).click()
    await expect(page.getByText('Create account')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible()
  })

  test('back button goes to Step 1', async ({ page }) => {
    await page.getByRole('button', { name: '←' }).click()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible()
  })

  test('progress bar renders', async ({ page }) => {
    const progressDots = page.locator('div.h-1.rounded-full')
    await expect(progressDots).toHaveCount(3)
  })
})
