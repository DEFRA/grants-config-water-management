import { test, expect } from '@playwright/test'
import { authenticateTo } from '../utils/auth.js'
import { clearApplicationData } from '../utils/backend.js'
import { formatUrlForPath } from '../utils/urls.js'
import { assertTaskStatuses } from '../utils/assertion.js'

const CRN = '9000000035'
const SBI = '800000026'
const GRANT_CODE = 'water-management'

test.describe('Water Management Grant Round 3', () => {
  test.beforeEach(async () => {
    await clearApplicationData(SBI, GRANT_CODE)
  })

  test('Reference costs', { tag: ['@cdp', '@ci'] }, async ({ page }) => {
    await test.step('authentication', async () => {
      await authenticateTo(page, 'water-management', CRN)
    })

    await test.step('Fill out application', async () => {
      await expect(page).toHaveURL(await formatUrlForPath('check-details'))
      await page.getByRole('radio', { name: 'Yes' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('grant-guidance-summary')
      )
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(await formatUrlForPath('tasks'))
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
      await page.getByRole('link', { name: 'Confirm legal status' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('type-of-business-or-organisation')
      )
      await page.getByRole('radio', { name: 'Private limited company' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(await formatUrlForPath('company-number'))
      await page.locator('#companyNumber').fill('12351975')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(await formatUrlForPath('tasks'))
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
      await page
        .getByRole('link', { name: 'Check your project eligibility' })
        .click()

      await expect(page).toHaveURL(await formatUrlForPath('sectors-irrigated'))

      await page.getByRole('checkbox', { name: 'Arable crops' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('where-project-located')
      )
      await page.locator('#projectLocated__easting').fill('374980')
      await page.locator('#projectLocated__northing').fill('448127')
      await page
        .getByRole('checkbox', {
          name: 'I confirm I have selected the right location on the map'
        })
        .check()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(await formatUrlForPath('work-started-yet'))
      await page
        .getByRole('radio', { name: 'I’ve only started preparatory work' })
        .click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('eligible-organisation')
      )
      await page
        .getByRole('radio', {
          name: 'Yes, I confirm my organisation can apply'
        })
        .click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(await formatUrlForPath('organisation-type'))
      await page
        .getByRole('radio', { name: 'Landowner farmer or grower' })
        .click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('how-many-businesses-will-use-the-water')
      )
      await page.getByRole('radio', { name: 'One' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('where-water-will-come-from')
      )
      await page
        .getByRole('checkbox', {
          name: 'A surface water source (for example a river or stream)'
        })
        .click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('have-planning-permission')
      )
      await page.getByRole('radio', { name: 'Yes' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('planning-permission-reference-number')
      )
      await page
        .locator('#planningPermissionReferenceNumber')
        .fill('24/01234/FUL')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('need-abstraction-licence')
      )
      await page
        .getByRole('radio', { name: 'I already have a licence' })
        .click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('abstraction-licence-consent-number')
      )
      await page
        .locator('textarea#abstractionLicenceConsentNumber')
        .fill('24/01234/FUL')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(await formatUrlForPath('score-results'))
      await page
        .getByRole('checkbox', {
          name: 'I confirm I want to continue with the application for this project'
        })
        .check()
      await page.getByRole('button', { name: 'Save and continue' }).click()
    })

    await test.step('All items selected with grant amount over £35,000 should be able to submit application', async () => {
      await startYourProjectDetailsTask(page)
      await expect(page).toHaveURL(
        await formatUrlForPath('items-planning-to-install')
      )
      await selectAllInstallableItems(page)
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('how-many-reservoirs')
      )
      await page.getByRole('radio', { name: 'No' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('what-type-of-reservoir')
      )
      await page.getByRole('radio', { name: 'Clay lined' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('how-much-water-reservoir')
      )
      await page.locator('input#howMuchWater').fill('1500')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await page.locator('input#waterStorageCapacity').fill('1500')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await page.locator('input#waterDistributionLength').fill('1500')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('total-estimated-cost')
      )
      await expect(
        page.locator('td').filter({
          hasText: 'Reservoir – clay lined'
        })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({
          hasText:
            'Reservoir 1,500m³ at £9/m³ for the first 10,000m³, with any additional volume charged at £2.25/m³'
        })
      ).toBeVisible()
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
          hasText: '1,500m at £30 per m'
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
          hasText: '1,500m³ at £71 per m³'
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
          hasText: '40% of £165,000'
        })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({
          hasText: '£66,000'
        })
      ).toBeVisible()
      await page
        .getByRole('checkbox', {
          name: 'I understand there is no guarantee that your stage 2 grant application will be successful'
        })
        .check()
      await page.getByRole('button', { name: 'Save and continue' }).click()
    })

    await test.step('All items selected with grant amount under £35,000 should exit application', async () => {
      await startYourProjectDetailsTask(page)
      await expect(page).toHaveURL(
        await formatUrlForPath('items-planning-to-install')
      )
      await selectAllInstallableItems(page)
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('how-many-reservoirs')
      )
      await page.getByRole('radio', { name: 'No' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('what-type-of-reservoir')
      )
      await page.getByRole('radio', { name: 'Synthetic lined' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('how-much-water-reservoir')
      )
      await page.locator('input#howMuchWater').fill('500')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await page.locator('input#waterStorageCapacity').fill('500')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await page.locator('input#waterDistributionLength').fill('500')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('total-estimated-cost')
      )
      await expect(
        page.locator('td').filter({
          hasText: 'Reservoir – synthetic lined'
        })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({
          hasText:
            'Reservoir 500m³ at £11/m³ for the first 10,000m³, with any additional volume charged at £2.75/m³'
        })
      ).toBeVisible()
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
          hasText: '500m at £30 per m'
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
          hasText: '500m³ at £71 per m³'
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
          hasText: '40% of £56,000'
        })
      ).toBeVisible()
      await expect(
        page.locator('td').filter({
          hasText: '£22,400'
        })
      ).toBeVisible()
      await page
        .getByRole('checkbox', {
          name: 'I understand there is no guarantee that your stage 2 grant application will be successful'
        })
        .check()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('exit-total-estimated-cost')
      )
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        'You cannot apply for a grant from this scheme'
      )
      await expect(
        page.getByText(
          'Your costs must be at least £87,500 because the minimum grant is £35,000 (40% of your confirmed costs).'
        )
      ).toBeVisible()
      await page.goto(await formatUrlForPath('tasks', false))
    })

    await test.step('Select Above-ground water storage tanks with grant amount over £15,000 should be able to submit application', async () => {
      await startYourProjectDetailsTask(page)
      await expect(page).toHaveURL(
        await formatUrlForPath('items-planning-to-install')
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
        await formatUrlForPath('total-estimated-cost')
      )
      await expect(
        page.getByRole('cell', { name: 'Water storage tank(s)' })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', {
          name: '1,000m³ at £71 per m³'
        })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', { name: '£71,000', exact: true })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', { name: 'Total estimated grant' })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', { name: '40% of £71,000' })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', { name: '£28,400', exact: true })
      ).toBeVisible()
      await page
        .getByRole('checkbox', {
          name: 'I understand there is no guarantee that your stage 2 grant application will be successful'
        })
        .check()
      await page.getByRole('button', { name: 'Save and continue' }).click()
    })

    await test.step('Select Above-ground water storage tanks with grant amount under £15,000 should exit application', async () => {
      await startYourProjectDetailsTask(page)
      await expect(page).toHaveURL(
        await formatUrlForPath('items-planning-to-install')
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
        await formatUrlForPath('total-estimated-cost')
      )
      await expect(
        page.getByRole('cell', { name: 'Water storage tank(s)' })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', {
          name: '500m³ at £71 per m³'
        })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', {
          name: '£35,500',
          exact: true
        })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', { name: 'Total estimated grant' })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', { name: '40% of £35,500', exact: true })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', { name: '£14,200', exact: true })
      ).toBeVisible()
      await page
        .getByRole('checkbox', {
          name: 'I understand there is no guarantee that your stage 2 grant application will be successful'
        })
        .check()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('exit-total-estimated-cost')
      )
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        'You cannot apply for a grant from this scheme'
      )
      await expect(
        page.getByText(
          'Your costs must be at least £37,500 because the minimum grant is £15,000 (40% of your confirmed costs).'
        )
      ).toBeVisible()
      await page.goto(await formatUrlForPath('tasks', false))
    })

    await test.step('Select all items with grant amount over £350,000 should cap grant amount at £350,000', async () => {
      await startYourProjectDetailsTask(page)
      await expect(page).toHaveURL(
        await formatUrlForPath('items-planning-to-install')
      )
      await uncheckAllItems(page)
      await selectAllInstallableItems(page)
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('how-many-reservoirs')
      )
      await page.getByRole('radio', { name: 'No' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('what-type-of-reservoir')
      )
      await page.getByRole('radio', { name: 'Clay lined' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('how-much-water-reservoir')
      )
      await page.locator('input#howMuchWater').fill('250000')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await page.locator('input#waterStorageCapacity').fill('10000')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await page.locator('input#waterDistributionLength').fill('10000')
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('total-estimated-cost')
      )
      await expect(
        page.getByRole('cell', { name: 'Reservoir – clay lined' })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', {
          name: 'Reservoir 250,000m³ at £9/m³ for the first 10,000m³, with any additional volume charged at £2.25/m³'
        })
      ).toBeVisible()
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
          name: '10,000m at £30 per m'
        })
      ).toBeVisible()
      await expect(
        page
          .getByRole('cell', {
            name: '10,000m at £30 per m'
          })
          .locator('//following-sibling::td')
      ).toHaveText('£300,000')
      await expect(
        page.getByRole('cell', { name: 'Water storage tank(s)' })
      ).toBeVisible()
      await expect(
        page.getByRole('cell', {
          name: '10,000m³ at £71 per m³'
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
          name: '40% of £1,640,000',
          exact: true
        })
      ).toBeVisible()
      await expect(
        page
          .getByRole('cell', {
            name: '40% of £1,640,000',
            exact: true
          })
          .locator('//following-sibling::td')
      ).toHaveText('£300,000')
      await page
        .getByRole('checkbox', {
          name: 'I understand there is no guarantee that your stage 2 grant application will be successful'
        })
        .check()
      await page.getByRole('button', { name: 'Save and continue' }).click()
      await expect(page).toHaveURL(await formatUrlForPath('tasks'))
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

      await expect(page).toHaveURL(await formatUrlForPath('summary'))
      await expect(
        page
          .locator('dt')
          .filter({ hasText: 'Total estimated grant (£)' })
          .locator('//following-sibling::dd')
      ).toContainText('300000')
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

async function startYourProjectDetailsTask(page) {
  await expect(page).toHaveURL(await formatUrlForPath('tasks'))

  await page.getByRole('link', { name: 'Your project details' }).click()

  await expect(page).toHaveURL(
    await formatUrlForPath('expected-project-start-date')
  )
  await page.locator('input#expectedProjectStartDate__month').fill('01')
  await page.locator('input#expectedProjectStartDate__year').fill('2028')
  await page.getByRole('button', { name: 'Save and continue' }).click()
}
