import { test, expect } from '@playwright/test'
import { clearApplicationData } from '../utils/backend.js'
import { formatUrlForPath } from '../utils/urls.js'
import { assertTaskStatuses } from '../utils/assertion.js'
import { preTaskSteps } from '../steps/pre-task-steps.js'
import { legalStatusSteps } from '../steps/legal-status-steps.js'
import { projectEligibilitySteps } from '../steps/project-eligibility-steps.js'
import { startYourProjectDetailsTask } from '../utils/enter-valid-project-start.js'
import {
  expectedCosts,
  getExpectedClayReservoirCostText,
  getExpectedDistributionNetworkCostText,
  getExpectedSyntheticReservoirCostText,
  getExpectedWaterStorageTankCostText
} from '../utils/expected-costs.js'
import { availableUsers } from '../data/test-users.js'

const CRN = availableUsers.get(3).crn
const SBI = availableUsers.get(3).sbi

test.describe('Water Management Grant Round 3', () => {
  test.beforeEach(async () => {
    await clearApplicationData(SBI)
  })

  test('Reference costs', { tag: ['@cdp', '@ci'] }, async ({ page }) => {
    await preTaskSteps(page, CRN)

    await legalStatusSteps(page)

    await projectEligibilitySteps(page)

    await test.step('All items selected with grant amount over £35,000 should be able to submit application', async () => {
      await startYourProjectDetailsTask(page)
      await expect(page).toHaveURL(
        formatUrlForPath('project-building-or-installation-details')
      )
      await selectAllInstallableItems(page)
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        formatUrlForPath('project-details-how-many-reservoirs')
      )
      await page.getByRole('radio', { name: 'No' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        formatUrlForPath('project-details-type-of-reservoir')
      )
      await page.getByRole('radio', { name: 'Clay lined' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        formatUrlForPath('project-details-reservoir-water-volume')
      )
      await page.locator('input#howMuchWater').fill('1500')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await page.locator('input#waterStorageCapacity').fill('1500')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await page.locator('input#waterDistributionLength').fill('1500')
      await page.getByRole('button', { name: 'Save and continue' }).click()

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
      ).toContainText(getExpectedClayReservoirCostText('1,500'))
      await expect(
        page.locator('td').filter({
          hasText: '£13,500'
        })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({
          hasText: 'Water distribution network'
        })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({
          hasText: getExpectedDistributionNetworkCostText('1,500')
        })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({
          hasText: '£45,000'
        })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({
          hasText: 'Water storage tank(s)'
        })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({
          hasText: getExpectedWaterStorageTankCostText('1,500')
        })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({
          hasText: '£106,500'
        })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({ hasText: 'Total estimated grant' })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({
          hasText: `${expectedCosts.maxRatePercentage}% of £165,000`
        })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({
          hasText: '£66,000'
        })
      ).toBeVisible()
      await page
        .getByRole('checkbox', {
          name: 'I understand there is no guarantee that my application will be successful'
        })
        .check()
      await page.getByRole('button', { name: 'Save and continue' }).click()
    })

    await test.step('All items selected with grant amount under £35,000 should exit application', async () => {
      await startYourProjectDetailsTask(page)
      await expect(page).toHaveURL(
        formatUrlForPath('project-building-or-installation-details')
      )
      await selectAllInstallableItems(page)
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        formatUrlForPath('project-details-how-many-reservoirs')
      )
      await page.getByRole('radio', { name: 'No' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        formatUrlForPath('project-details-type-of-reservoir')
      )
      await page.getByRole('radio', { name: 'Synthetic lined' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        formatUrlForPath('project-details-reservoir-water-volume')
      )
      await page.locator('input#howMuchWater').fill('500')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await page.locator('input#waterStorageCapacity').fill('500')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await page.locator('input#waterDistributionLength').fill('500')
      await page.getByRole('button', { name: 'Save and continue' }).click()

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
          hasText: 'Synthetic lined'
        })
      ).toContainText(getExpectedSyntheticReservoirCostText('500'))
      await expect(
        page.locator('td').filter({
          hasText: '£5,500'
        })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({
          hasText: 'Water distribution network'
        })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({
          hasText: getExpectedDistributionNetworkCostText('500')
        })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({
          hasText: '£15,000'
        })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({
          hasText: 'Water storage tank(s)'
        })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({
          hasText: getExpectedWaterStorageTankCostText('500')
        })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({
          hasText: '£35,500'
        })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({ hasText: 'Total estimated grant' })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({
          hasText: `${expectedCosts.maxRatePercentage}% of £56,000`
        })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({
          hasText: '£22,400'
        })
      ).toBeVisible()
      await page
        .getByRole('checkbox', {
          name: 'I understand there is no guarantee that my application will be successful'
        })
        .check()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        formatUrlForPath('exit-project-details-total-estimated-grant')
      )
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        'Your project costs are too low to qualify for a grant'
      )
      await expect(
        page.getByText(
          'Your eligible project costs must be at least £87,500 to qualify for a grant.'
        )
      ).toBeVisible()
      await expect(
        page.getByText(
          `This is because the grant covers ${expectedCosts.maxRatePercentage}% of your eligible project costs and the minimum grant you can receive is £35,000.`
        )
      ).toBeVisible()
      await expect(
        page.getByRole('link', {
          name: 'Check what other grants you may be eligible for (opens in a new tab)'
        })
      ).toBeVisible()
      await page.goto(formatUrlForPath('task-list', false))
    })

    await test.step('Select Above-ground water storage tanks with grant amount over £15,000 should be able to submit application', async () => {
      await startYourProjectDetailsTask(page)
      await expect(page).toHaveURL(
        formatUrlForPath('project-building-or-installation-details')
      )
      await uncheckAllItems(page)
      await page
        .getByRole('checkbox', {
          name: 'Above-ground water storage tank or tanks'
        })
        .check()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await page.locator('input#waterStorageCapacity').fill('1000')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        formatUrlForPath('project-details-total-estimated-grant')
      )
      await expect(
        page.getByRole('cell', { name: 'Water storage tank(s)' })
      ).toBeVisible()
      await expect(
        page
          .getByRole('cell', {
            name: getExpectedWaterStorageTankCostText('1,000')
          })
          .locator('//following-sibling::td')
      ).toHaveText('£71,000')
      await expect(
        page.locator('td').filter({
          hasText: '£28,400'
        })
      ).toBeVisible()
      await page
        .getByRole('checkbox', {
          name: 'I understand there is no guarantee that my application will be successful'
        })
        .check()
      await page.getByRole('button', { name: 'Save and continue' }).click()
    })

    await test.step('Select Above-ground water storage tanks with grant amount under £15,000 should exit application', async () => {
      await startYourProjectDetailsTask(page)
      await expect(page).toHaveURL(
        formatUrlForPath('project-building-or-installation-details')
      )
      await uncheckAllItems(page)
      await page
        .getByRole('checkbox', {
          name: 'Above-ground water storage tank or tanks'
        })
        .check()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await page.locator('input#waterStorageCapacity').fill('500')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        formatUrlForPath('project-details-total-estimated-grant')
      )
      await expect(
        page.getByRole('cell', { name: 'Water storage tank(s)' })
      ).toBeVisible()
      await expect(
        page
          .getByRole('cell', {
            name: getExpectedWaterStorageTankCostText('500')
          })
          .locator('//following-sibling::td')
      ).toHaveText('£35,500')
      await expect(
        page.getByRole('cell', { name: 'Total estimated grant' })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', {
          name: `${expectedCosts.maxRatePercentage}% of £35,500`,
          exact: true
        })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', { name: '£14,200', exact: true })
      ).toBeVisible()
      await page
        .getByRole('checkbox', {
          name: 'I understand there is no guarantee that my application will be successful'
        })
        .check()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        formatUrlForPath('exit-project-details-total-estimated-grant')
      )
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        'Your project costs are too low to qualify for a grant'
      )
      await expect(
        page.getByText(
          'Your eligible project costs must be at least £35,500 to qualify for a grant.'
        )
      ).toBeVisible()
      await expect(
        page.getByText(
          `This is because the grant covers ${expectedCosts.maxRatePercentage}% of your eligible project costs and the minimum grant you can receive is £15,000.`
        )
      ).toBeVisible()
      await expect(
        page.getByRole('link', {
          name: 'Check what other grants you may be eligible for (opens in a new tab)'
        })
      ).toBeVisible()
      await page.goto(formatUrlForPath('task-list', false))
    })

    await test.step('Select all items with grant amount over £300,000 should cap grant amount at £300,000', async () => {
      await startYourProjectDetailsTask(page)
      await expect(page).toHaveURL(
        formatUrlForPath('project-building-or-installation-details')
      )
      await uncheckAllItems(page)
      await selectAllInstallableItems(page)
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        formatUrlForPath('project-details-how-many-reservoirs')
      )
      await page.getByRole('radio', { name: 'No' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        formatUrlForPath('project-details-type-of-reservoir')
      )
      await page.getByRole('radio', { name: 'Clay lined' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        formatUrlForPath('project-details-reservoir-water-volume')
      )
      await page.locator('input#howMuchWater').fill('250000')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await page.locator('input#waterStorageCapacity').fill('10000')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await page.locator('input#waterDistributionLength').fill('10000')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        formatUrlForPath('project-details-total-estimated-grant')
      )
      await expect(page.getByRole('cell', { name: 'Reservoir' })).toBeVisible()
      await expect(
        page.getByRole('cell', {
          name: 'Clay lined'
        })
      ).toContainText(getExpectedClayReservoirCostText('250,000'))
      await expect(
        page.getByRole('cell', {
          name: '£630,000'
        })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', { name: 'Water distribution network' })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', {
          name: getExpectedDistributionNetworkCostText('10,000')
        })
      ).toBeVisible()
      await expect(
        page
          .getByRole('cell', {
            name: getExpectedDistributionNetworkCostText('10,000')
          })
          .locator('//following-sibling::td')
      ).toHaveText('£300,000')
      await expect(
        page.getByRole('cell', { name: 'Water storage tank(s)' })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', {
          name: getExpectedWaterStorageTankCostText('10,000')
        })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', {
          name: '£710,000'
        })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', { name: 'Total estimated grant' })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', {
          name: `${expectedCosts.maxRatePercentage}% of £1,640,000`,
          exact: true
        })
      ).toBeVisible()
      await expect(
        page
          .getByRole('cell', {
            name: `${expectedCosts.maxRatePercentage}% of £1,640,000`,
            exact: true
          })
          .locator('//following-sibling::td')
      ).toHaveText('£300,000')
      await page
        .getByRole('checkbox', {
          name: 'I understand there is no guarantee that my application will be successful'
        })
        .check()
      await page.getByRole('button', { name: 'Save and continue' }).click()
      await expect(page).toHaveURL(formatUrlForPath('task-list'))
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

      await expect(page).toHaveURL(formatUrlForPath('summary'))
      await expect(
        page
          .locator('dt')
          .filter({ hasText: 'Estimated grant (£)' })
          .locator('//following-sibling::dd')
      ).toContainText('300000')
      await page.goto(formatUrlForPath('task-list', false))
    })

    await test.step('Total estimate grant should be rounded 2dp and not break submission', async () => {
      await startYourProjectDetailsTask(page)
      await expect(page).toHaveURL(
        formatUrlForPath('project-building-or-installation-details')
      )
      await uncheckAllItems(page)
      await page.getByRole('checkbox', { name: 'Reservoir' }).check()
      await page
        .getByRole('checkbox', {
          name: 'Above-ground water storage tank or tanks'
        })
        .check()
      await page.getByRole('button', { name: 'Save and continue' }).click()
      await expect(page).toHaveURL(
        formatUrlForPath('project-details-how-many-reservoirs')
      )
      await page.getByRole('radio', { name: 'No' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        formatUrlForPath('project-details-type-of-reservoir')
      )
      await page.getByRole('radio', { name: 'Synthetic lined' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        formatUrlForPath('project-details-reservoir-water-volume')
      )
      await page.locator('input#howMuchWater').fill('15222')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await page.locator('input#waterStorageCapacity').fill('5644')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        formatUrlForPath('project-details-total-estimated-grant')
      )

      await expect(page.getByRole('cell', { name: 'Reservoir' })).toBeVisible()
      await expect(
        page.getByRole('cell', {
          name: 'Synthetic lined'
        })
      ).toContainText(getExpectedSyntheticReservoirCostText('15,222'))
      await expect(
        page.getByRole('cell', {
          name: '£124,360.50'
        })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', { name: 'Water storage tank(s)' })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', {
          name: getExpectedWaterStorageTankCostText('5,644')
        })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', {
          name: '£400,724'
        })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', { name: 'Total estimated grant' })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', {
          name: `${expectedCosts.maxRatePercentage}% of £525,084.50`,
          exact: true
        })
      ).toBeVisible()
      await expect(
        page
          .getByRole('cell', {
            name: `${expectedCosts.maxRatePercentage}% of £525,084.50`,
            exact: true
          })
          .locator('//following-sibling::td')
      ).toHaveText('£210,033.80')
      await page
        .getByRole('checkbox', {
          name: 'I understand there is no guarantee that my application will be successful'
        })
        .check()
      await page.getByRole('button', { name: 'Save and continue' }).click()
      await expect(page).toHaveURL(formatUrlForPath('task-list'))
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

      await expect(page).toHaveURL(formatUrlForPath('summary'))
      await expect(
        page
          .locator('dt')
          .filter({ hasText: 'Estimated grant (£)' })
          .locator('//following-sibling::dd')
      ).toContainText('210033.8')
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(formatUrlForPath('application-declaration'))
      await page
        .getByRole('checkbox', {
          name: 'I accept the terms and conditions'
        })
        .check()
      await page
        .getByRole('button', { name: 'Confirm and submit your application' })
        .click()
      await expect(page).toHaveURL(formatUrlForPath('confirmation'))
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        'Application submitted'
      )
      await expect(
        page.locator('.govuk-panel--confirmation .govuk-panel__body')
      ).toContainText('Your application number')
      await expect(page.locator('.govuk-panel__body')).toContainText(
        /WMG-[A-Z0-9]+-[A-Z0-9]+/
      )
    })
  })
})

async function selectAllInstallableItems(page) {
  await page.getByRole('checkbox', { name: 'Reservoir' }).check()
  await page
    .getByRole('checkbox', { name: 'Above-ground water storage tank or tanks' })
    .check()
  await page
    .getByRole('checkbox', {
      name: 'Underground water distribution main'
    })
    .check()
}

async function uncheckAllItems(page) {
  await page.getByRole('checkbox', { name: 'Reservoir' }).uncheck()
  await page
    .getByRole('checkbox', { name: 'Above-ground water storage tank or tanks' })
    .uncheck()
  await page
    .getByRole('checkbox', {
      name: 'Underground water distribution main'
    })
    .uncheck()
}
