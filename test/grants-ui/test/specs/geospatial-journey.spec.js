import { test, expect } from '@playwright/test'
import { clearApplicationData } from '../utils/backend.js'
import { formatUrlForPath } from '../utils/urls.js'
import { analyzeAccessibility } from '../utils/accessibility.js'
import { preTaskSteps } from '../steps/pre-task-steps.js'
import { legalStatusSteps } from '../steps/legal-status-steps.js'
import { availableUsers } from '../data/test-users.js'

//ideally this would use a different test user, when we get more, but as this doesn't run on CI, we can use the same one for now
const CRN = availableUsers.get(1).crn
const SBI = availableUsers.get(1).sbi

test.describe('Water Management Grant Round 3', () => {
  test.beforeEach(async () => {
    await clearApplicationData(SBI)
  })

  test('Geospatial Journey', { tag: ['@cdp'] }, async ({ page }) => {
    await preTaskSteps(page, CRN)

    await legalStatusSteps(page)

    await test.step('Selecting a valid location in the Isle of Scilly that is covered by the grant should return a score and allow application to progress', async () => {
      await page
        .getByRole('link', { name: 'Check your project eligibility' })
        .click()

      await expect(page).toHaveURL(
        await formatUrlForPath('eligibility-crops-irrigated')
      )

      await page.getByRole('checkbox', { name: 'Arable crops' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('eligibility-project-location')
      )
      await page.locator('#projectLocated__easting').fill('92391')
      await page.locator('#projectLocated__northing').fill('10821')
      await page
        .getByRole('checkbox', {
          name: 'I confirm I have selected the right location on the map'
        })
        .check()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL(
        await formatUrlForPath('eligibility-work-started')
      )
    })

    await test.step('Selecting a location out of England and the Isle of Scilly should exit where project is located journey', async () => {
      await page.getByRole('link', { name: 'Back', exact: true }).click()
      await expect(page).toHaveURL(
        await formatUrlForPath('eligibility-project-location')
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
        await formatUrlForPath('exit-eligibility-project-location')
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
          'If your project is in England, return to the map page and select the correct location.'
        )
      ).toBeVisible()
      await expect(
        page.getByRole('link', { name: 'return to the map page' })
      ).toHaveAttribute(
        'href',
        await formatUrlForPath('eligibility-project-location')
      )
      await expect(
        page.getByRole('link', {
          name: 'Check what other grants you may be eligible for (opens in a new tab)'
        })
      ).toBeVisible()
    })
  })
})
