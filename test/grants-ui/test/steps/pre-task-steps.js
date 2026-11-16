import { expect, test } from '@playwright/test'
import { authenticateTo } from '../utils/auth.js'
import { formatUrlForPath } from '../utils/urls.js'
import { assertTaskStatuses } from '../utils/assertion.js'

export async function preTaskSteps(page, CRN) {
  await test.step('authentication', async () => {
    await authenticateTo(page, 'water-management', CRN)
  })

  await test.step('Complete pre-task steps', async () => {
    await expect(page).toHaveURL(formatUrlForPath('confirm-your-details'))
    await page.getByRole('radio', { name: 'Yes' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page).toHaveURL(formatUrlForPath('grant-overview'))
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page).toHaveURL(formatUrlForPath('task-list'))
    await assertTaskStatuses(page, [
      { name: 'Confirm legal status', status: 'Not started' },
      {
        name: 'Check your project eligibility',
        status: 'Cannot start yet'
      },
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
