import { test, expect } from '@playwright/test'
import { authenticateTo } from '../utils/auth.js'
import { clearApplicationData } from '../utils/backend.js'
import { analyzeAccessibility } from '../utils/accessibility.js'

const CRN = '1106298365'
const SBI = '106480734'
const GRANT_CODE = 'water-management'

test.describe('Water Management Grant application', () => {
  test.beforeEach(async () => {
    await clearApplicationData(SBI, GRANT_CODE)
  })

  test(
    'Automation POC - Sectors irrigated - something else',
    { tag: ['@cdp', '@ci'] },
    async ({ page }) => {
      await test.step('authentication', async () => {
        await authenticateTo(page, 'water-management', CRN)
      })

      await test.step('check-details', async () => {
        await expect(page).toHaveURL('/water-management/check-details')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Confirm your details'
        )
        await analyzeAccessibility(page)
      })

      await test.step('check-details -> update-details -> check-details', async () => {
        await page.getByRole('radio', { name: 'No' }).click()
        await page.getByRole('button', { name: 'Continue' }).click()

        await expect(page).toHaveURL('/water-management/update-details')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Update your details'
        )
        await analyzeAccessibility(page)
        await page.getByRole('link', { name: 'Back', exact: true }).click()

        await expect(page).toHaveURL('/water-management/check-details')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Confirm your details'
        )
      })

      await test.step('check-details -> tasks', async () => {
        await page.getByRole('radio', { name: 'Yes' }).click()
        await page.getByRole('button', { name: 'Continue' }).click()
      })

      await test.step('tasks', async () => {
        await expect(page).toHaveURL('/water-management/tasks')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Apply for a Water Management grant round 3 (WMG R3)'
        )
        await analyzeAccessibility(page)
        await assertTaskStatuses(page, [
          { name: 'Check your project eligibility', status: 'Incomplete' },
          {
            name: 'Your project details and estimated costs',
            status: 'Cannot start yet'
          },
          {
            name: 'Check and submit your stage 1 application',
            status: 'Cannot start yet'
          }
        ])
        await page
          .getByRole('link', { name: 'Check your project eligibility' })
          .click()
      })

      await test.step('eligibility-land-registered', async () => {
        await expect(page).toHaveURL('/water-management/sectors-irrigated')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'What crops will be irrigated using the water from this project?'
        )
        await analyzeAccessibility(page)
        await page.getByRole('checkbox', { name: 'Something else' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/exit-sectors-irrigated-somethingelse'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'You cannot apply for a grant from this scheme'
        )
        await analyzeAccessibility(page)
        await page.getByRole('link', { name: 'Back', exact: true }).click()

        await expect(page).toHaveURL('/water-management/sectors-irrigated')
      })
    }
  )
})

async function assertTaskStatuses(page, tasks) {
  for (const { name, status } of tasks) {
    const item = page.locator('.govuk-task-list__item', { hasText: name })
    await expect(item.locator('.govuk-task-list__status')).toContainText(status)
  }
}
