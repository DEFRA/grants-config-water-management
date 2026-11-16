import { test, expect } from '@playwright/test'
import { clearApplicationData } from '../utils/backend.js'
import { formatUrlForPath, formatUrlForPathWithUUID } from '../utils/urls.js'
import { preTaskSteps } from '../steps/pre-task-steps.js'
import { legalStatusSteps } from '../steps/legal-status-steps.js'
import { projectEligibilitySteps } from '../steps/project-eligibility-steps.js'
import { startYourProjectDetailsTask } from '../utils/enter-valid-project-start.js'
import { assertTaskStatuses } from '../utils/assertion.js'
import { analyzeAccessibility } from '../utils/accessibility.js'

const CRN = '9000000035'
const SBI = '800000026'
const GRANT_CODE = 'water-management'

test.describe('Water Management Grant Round 3', () => {
  test.beforeEach(async () => {
    await clearApplicationData(SBI, GRANT_CODE)
  })

  test(
    'Multiple reservoirs',
    { tag: ['@cdp', '@ci', '@runme'] },
    async ({ page }) => {
      await preTaskSteps(page, CRN)

      await legalStatusSteps(page)

      await projectEligibilitySteps(page)

      await test.step('Add first of multiple reservoirs', async () => {
        await startYourProjectDetailsTask(page)

        await page.getByRole('checkbox', { name: 'Reservoir' }).check()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('project-details-how-many-reservoirs')
        )
        await page.getByRole('radio', { name: 'Yes' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPathWithUUID('project-details-reservoir-details')
        )

        //analyse reservoir details entry page
        await analyzeAccessibility(page)

        //add 1st reservoir
        await createReservoirDetails(page)
        await page.getByRole('button', { name: 'Save and continue' }).click()

        //back on summary page
        await expect(page).toHaveURL(
          formatUrlForPath('project-details-reservoir-details/summary')
        )

        //analyse summary page
        await analyzeAccessibility(page)

        await expect(
          page.locator('h1').filter({ hasText: 'You have added 1 reservoir' })
        ).toBeVisible()
      })
      await test.step('Add second reservoir', async () => {
        await page.getByRole('button', { name: 'Add another' }).click()

        //add second reservoir
        await createReservoirDetails(page, {
          reservoir: 2,
          lining: 'Synthetic',
          size: 1500
        })
        await page.getByRole('button', { name: 'Save and continue' }).click()

        //back on summary page
        await expect(page).toHaveURL(
          formatUrlForPath('project-details-reservoir-details/summary')
        )

        await expect(
          page.locator('h1').filter({ hasText: 'You have added 2 reservoirs' })
        ).toBeVisible()
      })

      await test.step('Amend first reservoir', async () => {
        // amend first reservoir
        await page.getByRole('link', { name: 'Change   item 1' }).click()
        await createReservoirDetails(page, {
          reservoir: '1 updated',
          lining: 'Clay',
          size: 62000
        })
        await page.getByRole('button', { name: 'Save and continue' }).click()

        //back on summary page
        await expect(page).toHaveURL(
          formatUrlForPath('project-details-reservoir-details/summary')
        )

        await expect(
          page.locator('h1').filter({ hasText: 'You have added 2 reservoirs' })
        ).toBeVisible()
      })

      await test.step('delete reservoir', async () => {
        // delete second one (but cancel)
        await page.getByRole('link', { name: 'Remove   item 2' }).click()
        await expect(page).toHaveURL(
          formatUrlForPathWithUUID(
            'project-details-reservoir-details',
            '/confirm-delete'
          )
        )
        //analyse confirm delete page
        await analyzeAccessibility(page)
        await page.getByRole('button', { name: 'Cancel' }).click()

        //back on summary page
        await expect(page).toHaveURL(
          formatUrlForPath('project-details-reservoir-details/summary')
        )

        // delete second one
        await page.getByRole('link', { name: 'Remove   item 2' }).click()
        await expect(page).toHaveURL(
          formatUrlForPathWithUUID(
            'project-details-reservoir-details',
            '/confirm-delete'
          )
        )
        await page.getByRole('button', { name: 'Remove' }).click()

        //back on summary page
        await expect(page).toHaveURL(
          formatUrlForPath('project-details-reservoir-details/summary')
        )

        await expect(
          page.locator('h1').filter({ hasText: 'You have added 1 reservoir' })
        ).toBeVisible()
      })

      await test.step('Continue with multiple reservoir journey', async () => {
        await page.getByRole('button', { name: 'Continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('project-details-total-estimated-grant')
        )
        await expect(
          page.locator('td').filter({
            hasText: 'Reservoir'
          })
        ).toBeVisible()
        await expect(
          page.locator('td').filter({
            hasText: 'Clay lined'
          })
        ).toBeVisible()
        await expect(
          page.locator('td').filter({
            hasText:
              '62,000 cubic metres at £9 per cubic metre for the first 10,000 cubic metres, with any additional volume charged at £2.25 per cubic metre'
          })
        ).toBeVisible()
        await expect(page.getByRole('cell', { name: '£' }).nth(1)).toHaveText(
          '£207,000'
        )

        await expect(
          page.locator('td').filter({ hasText: 'Total estimated grant' })
        ).toBeVisible()
        await expect(
          page.locator('td').filter({
            hasText: '40% of £207,000'
          })
        ).toBeVisible()
        await expect(
          page.locator('td').filter({
            hasText: '£82,800'
          })
        ).toBeVisible()
        await page
          .getByRole('checkbox', {
            name: 'I understand there is no guarantee that my application will be successful'
          })
          .check()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(formatUrlForPath('task-list'))
      })

      await test.step('task-list -> Check and submit your stage 1 application -> summary', async () => {
        await assertTaskStatuses(page, [
          { name: 'Confirm legal status', status: 'Completed' },
          { name: 'Check your project eligibility', status: 'Completed' },
          {
            name: 'Your project details',
            status: 'Completed'
          },
          {
            name: 'Check and submit your stage 1 application',
            status: 'Not started'
          }
        ])
        await page
          .getByRole('link', {
            name: 'Check and submit your stage 1 application'
          })
          .click()
        await expect(page).toHaveURL(formatUrlForPath('check-your-answers'))
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Check your answers'
        )

        await expect(
          page
            .locator('dt')
            .filter({ hasText: 'Multiple reservoirs' })
            .locator('//following-sibling::dd')
            .nth(0)
        ).toContainText('Yes')

        await expect(
          page.locator('h3').filter({ hasText: 'Reservoir 1' })
        ).toBeVisible()

        await expect(
          page
            .locator('dt')
            .filter({ hasText: 'Name of reservoir' })
            .locator('//following-sibling::dd')
            .nth(0)
        ).toContainText('Test reservoir 1 updated')

        await expect(
          page
            .locator('dt')
            .filter({ hasText: 'Type of reservoir' })
            .locator('//following-sibling::dd')
            .nth(0)
        ).toContainText('Clay lined')

        await expect(
          page
            .locator('dt')
            .filter({ hasText: 'Reservoir volume (m³)' })
            .locator('//following-sibling::dd')
            .nth(0)
        ).toContainText('62000')
      })
    }
  )
})

async function createReservoirDetails(
  page,
  { reservoir, lining, size } = { reservoir: 1, lining: 'Clay', size: 1000 }
) {
  await page
    .getByRole('textbox', { name: 'Name of your reservoir' })
    .fill(`Test reservoir ${reservoir}`)
  await page.getByRole('radio', { name: `${lining} lined` }).click()
  await page
    .getByRole('textbox', {
      name: 'How much water will your reservoir hold?'
    })
    .fill(size.toString(10))
}
