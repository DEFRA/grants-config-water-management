import { test, expect } from '@playwright/test'
import { authenticateTo } from '../utils/auth.js'
import { clearApplicationData } from '../utils/backend.js'

const CRN = '1106298365'
const SBI = '106480734'
const GRANT_CODE = 'water-management'

test.describe('Water Management Grant Round 3', () => {
  test.beforeEach(async () => {
    await clearApplicationData(SBI, GRANT_CODE)
  })

  test(
    'Reference costs',
    { tag: ['@cdp', '@ci', '@runme'] },
    async ({ page }) => {
      await test.step('authentication', async () => {
        await authenticateTo(page, 'water-management', CRN)
      })

      await test.step('Fill out application', async () => {
        await expect(page).toHaveURL('/water-management/check-details')
        await page.getByRole('radio', { name: 'Yes' }).click()
        await page.getByRole('button', { name: 'Continue' }).click()

        await expect(page).toHaveURL('/water-management/tasks')
        await assertTaskStatuses(page, [
          { name: 'Check your project eligibility', status: 'Incomplete' },
          {
            name: 'Your project details',
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

        await expect(page).toHaveURL('/water-management/sectors-irrigated')

        await page.getByRole('checkbox', { name: 'Arable' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL('/water-management/where-project-located')
        await page.locator('#projectLocated__easting').fill('374980')
        await page.locator('#projectLocated__northing').fill('448127')
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL('/water-management/work-started-yet')
        await page.getByRole('radio', { name: 'Yes, preparatory work' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL('/water-management/eligible-organisation')
        await page.getByRole('radio', { name: 'No' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL('/water-management/organisation-type')
        await page
          .getByRole('radio', { name: 'Landowner farmer, grower or forester' })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/how-many-businesses-will-use-the-water'
        )
        await page.getByRole('radio', { name: 'One' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/where-water-will-come-from'
        )
        await page
          .getByRole('checkbox', {
            name: 'Surface water abstraction for storage'
          })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/have-planning-permission'
        )
        await page.getByRole('radio', { name: 'Yes' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/planning-permission-reference-number'
        )
        await page
          .locator('#planningPermissionReferenceNumber')
          .fill('24/01234/FUL')
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/need-abstraction-licence'
        )
        await page
          .getByRole('radio', { name: 'I already have a licence' })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/abstraction-licence-consent-number'
        )
        await page
          .locator('input#abstractionLicenceConsentNumber')
          .fill('24/01234/FUL')
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL('/water-management/score-results')
        await page.getByRole('button', { name: 'Confirm and continue' }).click()
      })

      await test.step('All items selected with grant amount over £35,000 should be able to submit application', async () => {
        await startYourProjectDetailsTask(page)
        await expect(page).toHaveURL(
          '/water-management/items-planning-to-install'
        )
        await selectAllInstallableItems(page)
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await page.locator('input#howMuchWater').fill('1500')
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await page.locator('input#waterDistributionLength').fill('1500')
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await page.locator('input#waterStorageCapacity').fill('1500')
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL('/water-management/total-estimated-cost')
        await expect(
          page.locator('li').filter({
            hasText:
              'Reservoir – clay lined: 1,500m³ at £10/m³ for the first 10,000m³, with any additional volume charged at £2/m³, giving a total of £15,000'
          })
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText:
              'Reservoir – synthetic lined: 0m³ at £10/m³ for the first 10,000m³, with any additional volume charged at £2/m³, giving a total of £0.00'
          })
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText: 'Water distribution network: 1,500m at £25 per m = £37,500'
          })
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText: 'Water storage tank(s): 1,500m³ at £50 per m³ = £75,000'
          })
        ).toBeVisible()
        await expect(
          page.getByText('Total estimated grant = £51,000')
        ).toBeVisible()
        await page.getByRole('button', { name: 'Confirm and continue' }).click()
      })

      await test.step('All items selected with grant amount under £35,000 should exit application', async () => {
        await startYourProjectDetailsTask(page)
        await expect(page).toHaveURL(
          '/water-management/items-planning-to-install'
        )
        await selectAllInstallableItems(page)
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await page.locator('input#howMuchWater').fill('500')
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await page.locator('input#waterDistributionLength').fill('500')
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await page.locator('input#waterStorageCapacity').fill('500')
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL('/water-management/total-estimated-cost')
        await expect(
          page.locator('li').filter({
            hasText:
              'Reservoir – clay lined: 500m³ at £10/m³ for the first 10,000m³, with any additional volume charged at £2/m³, giving a total of £5,000'
          })
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText:
              'Reservoir – synthetic lined: 0m³ at £10/m³ for the first 10,000m³, with any additional volume charged at £2/m³, giving a total of £0.00'
          })
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText: 'Water distribution network: 500m at £25 per m = £12,500'
          })
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText: 'Water storage tank(s): 500m³ at £50 per m³ = £25,000'
          })
        ).toBeVisible()
        await expect(
          page.getByText('Total estimated grant = £17,000')
        ).toBeVisible()
        await page.getByRole('button', { name: 'Confirm and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/exit-total-estimated-cost'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'You cannot apply for a grant from this scheme'
        )
        await expect(
          page.getByText(
            'Your costs must be at least £87,500 because the minimum grant is £35,000 (40% of your confirmed costs).'
          )
        ).toBeVisible()
        await expect(
          page.getByRole('link', {
            name: 'See other grants you may be eligible for',
            exact: true
          })
        ).toBeVisible()
        page.goto('/water-management/tasks')
      })

      await test.step('Select Above-ground water storage tanks with grant amount over £15,000 should be able to submit application', async () => {
        await startYourProjectDetailsTask(page)
        await expect(page).toHaveURL(
          '/water-management/items-planning-to-install'
        )
        await uncheckAllItems(page)
        await page
          .getByRole('checkbox', { name: 'Above-ground water storage tanks' })
          .check()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await page.locator('input#waterStorageCapacity').fill('1000')
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL('/water-management/total-estimated-cost')
        await expect(
          page.locator('li').filter({
            hasText: 'Water storage tank(s): 1,000m³ at £50 per m³ = £50,000'
          })
        ).toBeVisible()
        await expect(
          page.getByText('Total estimated grant = £20,000')
        ).toBeVisible()
        await page.getByRole('button', { name: 'Confirm and continue' }).click()
      })

      await test.step('Select Above-ground water storage tanks with grant amount under £15,000 should exit application', async () => {
        await startYourProjectDetailsTask(page)
        await expect(page).toHaveURL(
          '/water-management/items-planning-to-install'
        )
        await uncheckAllItems(page)
        await page
          .getByRole('checkbox', { name: 'Above-ground water storage tanks' })
          .check()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await page.locator('input#waterStorageCapacity').fill('500')
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL('/water-management/total-estimated-cost')
        await expect(
          page.locator('li').filter({
            hasText: 'Water storage tank(s): 500m³ at £50 per m³ = £25,000'
          })
        ).toBeVisible()
        await expect(
          page.getByText('Total estimated grant = £10,000')
        ).toBeVisible()
        await page.getByRole('button', { name: 'Confirm and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/exit-total-estimated-cost'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'You cannot apply for a grant from this scheme'
        )
        await expect(
          page.getByText(
            'Your costs must be at least £35,500 because the minimum grant is £15,000 (40% of your confirmed costs).'
          )
        ).toBeVisible()
        await expect(
          page.getByRole('link', {
            name: 'See other grants you may be eligible for',
            exact: true
          })
        ).toBeVisible()
        page.goto('/water-management/tasks')
      })

      await test.step('Select all items with grant amount over £350,000 should cap grant amount at £350,000', async () => {
        await startYourProjectDetailsTask(page)
        await expect(page).toHaveURL(
          '/water-management/items-planning-to-install'
        )
        await uncheckAllItems(page)
        await selectAllInstallableItems(page)
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await page.locator('input#howMuchWater').fill('250000')
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await page.locator('input#waterDistributionLength').fill('10000')
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await page.locator('input#waterStorageCapacity').fill('10000')
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL('/water-management/total-estimated-cost')
        await expect(
          page.locator('li').filter({
            hasText:
              'Reservoir – clay lined: 250,000m³ at £10/m³ for the first 10,000m³, with any additional volume charged at £2/m³, giving a total of £580,000'
          })
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText:
              'Reservoir – synthetic lined: 0m³ at £10/m³ for the first 10,000m³, with any additional volume charged at £2/m³, giving a total of £0.00'
          })
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText:
              'Water distribution network: 10,000m at £25 per m = £250,000'
          })
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText: 'Water storage tank(s): 10,000m³ at £50 per m³ = £500,000'
          })
        ).toBeVisible()
        await expect(
          page.getByText('Total estimated grant = £300,000')
        ).toBeVisible()
        await page.getByRole('button', { name: 'Confirm and continue' }).click()
        await expect(page).toHaveURL('/water-management/tasks')
        await assertTaskStatuses(page, [
          { name: 'Check your project eligibility', status: 'Completed' },
          {
            name: 'Your project details',
            status: 'Completed'
          },
          {
            name: 'Check and submit your stage 1 application',
            status: 'Incomplete'
          }
        ])
      })
    }
  )
})

async function selectAllInstallableItems(page) {
  await page.getByRole('checkbox', { name: 'Clay-lined reservoir' }).check()
  await page
    .getByRole('checkbox', { name: 'Synthetic-lined reservoir' })
    .check()
  await page
    .getByRole('checkbox', { name: 'Above-ground water storage tanks' })
    .check()
  await page
    .getByRole('checkbox', {
      name: 'Underground water distribution main'
    })
    .check()
}

async function uncheckAllItems(page) {
  await page.getByRole('checkbox', { name: 'Clay-lined reservoir' }).uncheck()
  await page
    .getByRole('checkbox', { name: 'Synthetic-lined reservoir' })
    .uncheck()
  await page
    .getByRole('checkbox', { name: 'Above-ground water storage tanks' })
    .uncheck()
  await page
    .getByRole('checkbox', {
      name: 'Underground water distribution main'
    })
    .uncheck()
}

async function startYourProjectDetailsTask(page) {
  await expect(page).toHaveURL('/water-management/tasks')

  await page.getByRole('link', { name: 'Your project details' }).click()

  await expect(page).toHaveURL('/water-management/expected-project-start-date')
  await page.locator('input#expectedProjectStartDate__month').fill('01')
  await page.locator('input#expectedProjectStartDate__year').fill('2028')
  await page.getByRole('button', { name: 'Save and continue' }).click()
}

async function assertTaskStatuses(page, tasks) {
  for (const { name, status } of tasks) {
    const item = page.locator('.govuk-task-list__item', { hasText: name })
    await expect(item.locator('.govuk-task-list__status')).toContainText(status)
  }
}
