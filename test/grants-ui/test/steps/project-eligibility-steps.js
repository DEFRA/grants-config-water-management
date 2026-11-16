import { formatUrlForPath } from '../utils/urls.js'
import { test, expect } from '@playwright/test'

export async function projectEligibilitySteps(page) {
  await test.step('Complete project eligibility steps', async () => {
    await page
      .getByRole('link', { name: 'Check your project eligibility' })
      .click()

    await expect(page).toHaveURL(
      formatUrlForPath('eligibility-crops-irrigated')
    )

    await page.getByRole('checkbox', { name: 'Arable crops' }).click()
    await page.getByRole('button', { name: 'Save and continue' }).click()

    await expect(page).toHaveURL(
      formatUrlForPath('eligibility-project-location')
    )
    await page.locator('#projectLocated__easting').fill('374980')
    await page.locator('#projectLocated__northing').fill('448127')
    await page
      .getByRole('checkbox', {
        name: 'I confirm I have selected the right location on the map'
      })
      .check()
    await page.getByRole('button', { name: 'Save and continue' }).click()

    await expect(page).toHaveURL(formatUrlForPath('eligibility-work-started'))
    await page
      .getByRole('radio', { name: 'I’ve only started preparatory work' })
      .click()
    await page.getByRole('button', { name: 'Save and continue' }).click()

    await expect(page).toHaveURL(formatUrlForPath('eligibility-organisation'))
    await page
      .getByRole('radio', {
        name: 'Yes, I confirm my organisation can apply'
      })
      .click()
    await page.getByRole('button', { name: 'Save and continue' }).click()

    await expect(page).toHaveURL(formatUrlForPath('eligibility-applicant-type'))
    await page
      .getByRole('radio', { name: 'Landowner farmer or grower' })
      .click()
    await page.getByRole('button', { name: 'Save and continue' }).click()

    await expect(page).toHaveURL(
      formatUrlForPath('eligibility-other-businesses-use-water')
    )
    await page.getByRole('radio', { name: 'One' }).click()
    await page.getByRole('button', { name: 'Save and continue' }).click()

    await expect(page).toHaveURL(formatUrlForPath('eligibility-water-source'))
    await page
      .getByRole('checkbox', {
        name: 'A surface water source (for example a river or stream)'
      })
      .click()
    await page.getByRole('button', { name: 'Save and continue' }).click()

    await expect(page).toHaveURL(
      formatUrlForPath('eligibility-planning-permission')
    )
    await page.getByRole('radio', { name: 'Yes' }).click()
    await page.getByRole('button', { name: 'Save and continue' }).click()

    await expect(page).toHaveURL(
      formatUrlForPath('eligibility-planning-permission-reference-number')
    )
    await page
      .locator('#planningPermissionReferenceNumber')
      .fill('24/01234/FUL')
    await page.getByRole('button', { name: 'Save and continue' }).click()

    await expect(page).toHaveURL(
      formatUrlForPath('eligibility-abstraction-licence')
    )
    await page.getByRole('radio', { name: 'I already have a licence' }).click()
    await page.getByRole('button', { name: 'Save and continue' }).click()

    await expect(page).toHaveURL(
      formatUrlForPath('eligibility-abstraction-licence-number')
    )
    await page
      .locator('textarea#abstractionLicenceConsentNumber')
      .fill('24/01234/FUL')
    await page.getByRole('button', { name: 'Save and continue' }).click()

    await expect(page).toHaveURL(formatUrlForPath('eligibility-score-results'))
    await page
      .getByRole('checkbox', {
        name: 'I confirm I want to continue with the application for this project'
      })
      .check()
    await page.getByRole('button', { name: 'Save and continue' }).click()
  })
}
