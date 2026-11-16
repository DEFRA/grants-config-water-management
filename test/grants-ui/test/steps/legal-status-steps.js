import { expect, test } from '@playwright/test'
import { formatUrlForPath } from '../utils/urls.js'
import { assertTaskStatuses } from '../utils/assertion.js'

export async function legalStatusSteps(page) {
  await test.step('Complete legal status steps', async () => {
    await page.getByRole('link', { name: 'Confirm legal status' }).click()

    await expect(page).toHaveURL(formatUrlForPath('confirm-legal-status'))
    await page.getByRole('radio', { name: 'Private limited company' }).click()
    await page.getByRole('button', { name: 'Save and continue' }).click()

    await expect(page).toHaveURL(
      formatUrlForPath('company-or-organisation-number')
    )
    await page.locator('#companyNumber').fill('12351975')
    await page.getByRole('button', { name: 'Save and continue' }).click()

    await expect(page).toHaveURL(formatUrlForPath('task-list'))
    await assertTaskStatuses(page, [
      { name: 'Confirm legal status', status: 'Complete' },
      { name: 'Check your project eligibility', status: 'Not started' },
      {
        name: 'Your project details',
        status: 'Cannot start yet'
      },
      {
        name: 'Check and submit your stage 1 application',
        status: 'Cannot start yet'
      }
    ])
  })
}
