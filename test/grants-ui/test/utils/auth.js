import { expect } from '@playwright/test'

/**
 * Log in via the Defra ID OIDC provider.
 *
 * Each spec must pass its own CRN so tests can run in parallel without
 * sharing session state.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} path
 * @param {string} crn
 * @param {string} sbi
 */
export async function authenticateTo(page, path, crn, sbi = '') {
  await page.goto(path)
  const crnInput = page.locator('input#crn')
  if (await crnInput.isVisible({ timeout: 30_000 }).catch(() => false)) {
    await crnInput.fill(crn)
    await page.locator('input#password').fill('x')
    await page.locator('button[type="submit"]').click()

    if (sbi) {
      await expect(page).toHaveURL(/organisations/, {
        timeout: 30_000
      })
      await page.locator(`input[type="radio"][value="${sbi}"]`).click()
      await page.getByRole('button', { name: 'Continue' }).click()
    }

    await expect(page).toHaveURL(/\/(water-management|agreement)/, {
      timeout: 30_000
    })
  }
}
