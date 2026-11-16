import { formatUrlForPath } from './urls.js'
import { expect } from '@playwright/test'

export async function startYourProjectDetailsTask(page) {
  await expect(page).toHaveURL(formatUrlForPath('task-list'))

  await page.getByRole('link', { name: 'Your project details' }).click()

  await expect(page).toHaveURL(
    formatUrlForPath('project-details-expected-start-date')
  )
  await page.locator('input#expectedProjectStartDate__month').fill('01')
  await page.locator('input#expectedProjectStartDate__year').fill('2028')
  await page.getByRole('button', { name: 'Save and continue' }).click()
}
