import { test, expect } from '@playwright/test'
import { authenticateTo } from '../utils/auth.js'
import { clearApplicationData } from '../utils/backend.js'
import { formatUrlForPath } from '../utils/urls.js'
import { analyzeAccessibility } from '../utils/accessibility.js'
import { assertTaskStatuses } from '../utils/assertion.js'

const CRN = '9000000035'
const SBI = '800000026'
const GRANT_CODE = 'water-management'

test.describe('Water Management Grant Round 3', () => {
  test.beforeEach(async () => {
    await clearApplicationData(SBI, GRANT_CODE)
  })

  test('Geospatial Journey', { tag: ['@cdp'] }, async ({ page }) => {
    await test.step('authentication', async () => {
      await authenticateTo(page, 'water-management', CRN)
    })

    await test.step('Selecting a valid location in the Isle of Scilly that is covered by the grant should return a score and allow application to progress', async () => {
      await expect(page).toHaveURL(await formatUrlForPath('check-details'))
      await page.getByRole('radio', { name: 'Yes' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('grant-guidance-summary')
      )
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(await formatUrlForPath('tasks'))
      await assertTaskStatuses(page, [
        { name: 'Your legal status', status: 'Not started' },
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
      await page.getByRole('link', { name: 'Your legal status' }).click()

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
        { name: 'Your legal status', status: 'Complete' },
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
      await page.locator('#projectLocated__easting').fill('92391')
      await page.locator('#projectLocated__northing').fill('10821')
      await page
        .getByRole('checkbox', {
          name: 'I confirm I have selected the right location on the map'
        })
        .check()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(await formatUrlForPath('work-started-yet'))
    })

    await test.step('Selecting a location out of England and the Isle of Scilly should exit where project is located journey', async () => {
      await page.getByRole('link', { name: 'Back', exact: true }).click()
      await expect(page).toHaveURL(
        await formatUrlForPath('where-project-located')
      )
      // BUG: This will not work locally as it does not seem to be validating the location is in England.
      // Enter a location outside of England (A rock in Isle of Scilly) (Easting: 83727, Northing: 5203)
      await page.locator('#projectLocated__easting').fill('83727')
      await page.locator('#projectLocated__northing').fill('5203')
      await page
        .getByRole('checkbox', {
          name: 'I confirm I have selected the right location on the map'
        })
        .check()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('exit-where-project-located')
      )
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Your project must be in England'
      )
      await analyzeAccessibility(page)
      await expect(
        page.getByText(
          'You cannot apply for this grant because you have selected a location that is not in England.'
        )
      ).toBeVisible()
      await expect(
        page.getByText(
          'If your project is in England, return to the maps page and select the correct location.'
        )
      ).toBeVisible()
      await expect(
        page.getByRole('link', { name: 'return to the maps page' })
      ).toHaveAttribute('href', await formatUrlForPath('where-project-located'))
      await expect(
        page.getByRole('link', {
          name: 'Check what other grants you may be eligible for (opens in a new tab)'
        })
      ).toBeVisible()
    })
  })
})
