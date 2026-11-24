import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'
import Ajv2020 from 'ajv/dist/2020.js'
import { authenticateTo } from '../utils/auth.js'
import { clearApplicationData } from '../utils/backend.js'
import { analyzeAccessibility } from '../utils/accessibility.js'
import { getApplicationSubmission } from '../utils/gas.js'
import { formatUrlForPath } from '../utils/urls.js'
import { setHiddenFieldValue } from '../utils/forms.js'
import { assertTaskStatuses } from '../utils/assertion.js'
import {
  legalStatusOptionsSteps,
  legalStatusSteps
} from '../steps/legal-status-steps.js'
import {
  getExpectedClayReservoirCostText,
  getExpectedWaterStorageTankCostText
} from '../utils/expected-costs.js'
import { availableUsers } from '../data/test-users.js'

const gasConfig = JSON.parse(
  readFileSync(
    new URL(
      '../../../../configurations/water-management/gas/gas.json',
      import.meta.url
    ),
    'utf8'
  )
)

const CRN = availableUsers.get(1).crn
const SBI = availableUsers.get(1).sbi

test.describe('Water Management Grant application', () => {
  test.describe.configure({ retries: 2 })
  test.beforeEach(async () => {
    await clearApplicationData(SBI)
  })

  test(
    'Apply for a Water Management grant round 3',
    { tag: ['@cdp', '@ci'] },
    async ({ page }, testInfo) => {
      if (testInfo.retry > 0) {
        console.log(`Retrying! - sleep for 60 seconds before retrying`)
        await page.waitForTimeout(60000) // Sleep for 60 seconds before retrying
      }
      let referenceNumber
      await test.step('authentication', async () => {
        await authenticateTo(page, 'water-management', CRN)
      })

      await test.step('check-details', async () => {
        await expect(page).toHaveURL(formatUrlForPath('check-details'))
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Confirm your details'
        )
        await analyzeAccessibility(page)
      })

      await test.step('check-details -> update-details -> check-details', async () => {
        await page.getByRole('radio', { name: 'No' }).click()
        await page.getByRole('button', { name: 'Continue' }).click()

        await expect(page).toHaveURL(formatUrlForPath('update-details'))
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Update your details'
        )
        await analyzeAccessibility(page)
        await page.getByRole('link', { name: 'Back', exact: true }).click()

        await expect(page).toHaveURL(formatUrlForPath('check-details'))
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Confirm your details'
        )
      })

      await test.step('check-details -> task-list', async () => {
        await page.getByRole('radio', { name: 'Yes' }).click()
        await page.getByRole('button', { name: 'Continue' }).click()
      })

      await test.step('task-list -> grant-overview', async () => {
        await expect(page).toHaveURL(formatUrlForPath('grant-overview'))
        await expect(
          page.getByRole('heading', {
            level: 1,
            name: 'Apply for a Water Management grant round 3'
          })
        ).toBeVisible()
        await analyzeAccessibility(page)
        await expect(
          page.getByText(
            'Your project must be in England and the project items and water must be used by farmers and growers to irrigate eligible crops.'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'Before you apply, you must read the Water Management grant round 3 guidance (opens in a new tab)'
          )
        ).toBeVisible()
        await expect(
          page.getByRole('link', {
            name: 'Water Management grant round 3 guidance (opens in a new tab)'
          })
        ).toBeVisible()
        await expect(
          page.getByRole('heading', {
            name: 'Stage 2: Complete your application'
          })
        ).toBeVisible()
        await expect(
          page.getByText(
            'This stage is for invited applicants to complete their application and submit supporting evidence documents.'
          )
        ).toBeVisible()
        await expect(
          page.getByRole('heading', { name: 'Multiple applications' })
        ).toBeVisible()
        await expect(
          page.getByText(
            'Make one application if all project items are at the same location and will be delivered together. This application can cover multiple irrigation water storage reservoirs or above-ground water storage tanks if they are being delivered as one project at the same location.'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'You may make an additional application for irrigation water storage reservoirs, above-ground water storage tanks and underground water distribution mains that are in different locations.'
          )
        ).toBeVisible()
        await page.getByRole('button', { name: 'Continue' }).click()
      })

      // Verify all legal status options combo
      await legalStatusOptionsSteps(page)

      // Select a legal status and continue
      await legalStatusSteps(page)

      await test.step('task-list -> Check your project eligibility', async () => {
        await expect(page).toHaveURL(formatUrlForPath('task-list'))
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Apply for a Water Management grant round 3'
        )
        await analyzeAccessibility(page)
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
      })

      await test.step('eligibility-land-registered -> exit-eligibility-crops-irrigated -> back -> select Arable sector', async () => {
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-crops-irrigated')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Crops you plan to irrigate'
        )
        await verifyAllSectors(page)
        await analyzeAccessibility(page)

        // Continue without selecting any options should error out and not progress to next page
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page.locator('h2.govuk-error-summary__title')).toHaveText(
          'There is a problem'
        )
        await expect(
          page
            .locator('.govuk-error-summary__body ul li')
            .filter({ hasText: 'Select crops to be irrigated' })
        ).toBeVisible()
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-crops-irrigated')
        )

        // Select non of these crops only and ensure we exit the application
        await page
          .getByRole('checkbox', {
            name: 'None of these crop categories apply to my project'
          })
          .check()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('exit-eligibility-crops-irrigated')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'You cannot apply for a grant from this scheme'
        )
        await analyzeAccessibility(page)
        await page.getByRole('link', { name: 'Back', exact: true }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-crops-irrigated')
        )

        // Select non of these crops and another option and ensure we exit the application as well
        await page
          .getByRole('checkbox', {
            name: 'None of these crop categories apply to my project'
          })
          .check()
        await page.getByRole('checkbox', { name: 'Arable crops' }).check()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('exit-eligibility-crops-irrigated')
        )
        await page.getByRole('link', { name: 'Back', exact: true }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-crops-irrigated')
        )

        // Select Arable crops only and continue the application
        await page
          .getByRole('checkbox', {
            name: 'None of these crop categories apply to my project'
          })
          .uncheck()
        await page.getByRole('checkbox', { name: 'Arable crops' }).check()
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step('eligibility-project-location', async () => {
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-project-location')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Tell us where your project is'
        )

        await analyzeAccessibility(page)
        await expect(
          page.getByText(
            'Your project must be in England to be eligible for a grant.'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'Select the centre of your project on the map (for example the centre of your reservoir). If you’re planning more than one reservoir, water tank or underground distribution main, select the location of the larger reservoir or major part of your project.'
          )
        ).toBeVisible()
        await expect(page.locator('#projectLocated-hint')).toHaveText(
          'The Easting and Northing co-ordinates of the grid reference will appear when you select your location on the map. You can use these co-ordinates to find this location on another map (or keep them as a reference).'
        )
        await page.locator('#projectLocated__easting').fill('613413')
        await page.locator('#projectLocated__northing').fill('154146')
        await setHiddenFieldValue(
          page.locator('#projectLocatedDescription'),
          'CT4, Canterbury'
        )
        await page
          .getByRole('checkbox', {
            name: 'I confirm I have selected the right location on the map'
          })
          .check()
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step("eligibility-work-started -> select I have not started work -> eligibility-organisation -> back -> select I've started work -> exit-eligibility-work-started -> back -> I've only started preparatory work - continue", async () => {
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-work-started')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'What work have you done on your project?'
        )
        await analyzeAccessibility(page)

        // Test the eligibility notes
        await page
          .locator('details summary span', { hasText: 'Eligibility' })
          .click()
        await expect(
          page.getByText(
            'You will invalidate your application if you start the project or commit to any costs (such as placing orders) before you receive a grant funding agreement.'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'Before the start date in your grant funding agreement, you can:'
          )
        ).toBeVisible()

        // Select 'I have not started work' option
        await page
          .getByRole('radio', { name: 'I have not started work' })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-organisation')
        )
        await page.getByRole('link', { name: 'Back', exact: true }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-work-started')
        )

        // Select 'I’ve started work' option after going back
        await page.getByRole('radio', { name: 'I’ve started work' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL(
          formatUrlForPath('exit-eligibility-work-started')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'You cannot apply for a grant from this scheme'
        )
        await expect(
          page.getByText(
            'You cannot apply for a grant if you have already started work or committed to costs for this project. For information about eligibility criteria, check the Water Management grant round 3 guidance (opens in a new tab).'
          )
        ).toBeVisible()
        await analyzeAccessibility(page)
        await expect(
          page.getByRole('link', {
            name: 'Water Management grant round 3 guidance (opens in a new tab)'
          })
        ).toBeVisible()
        await expect(
          page.getByRole('link', {
            name: 'Check what other grants you may be eligible for (opens in a new tab)'
          })
        ).toBeVisible()
        await page.getByRole('link', { name: 'Back', exact: true }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-work-started')
        )

        // Select 'I’ve only started preparatory work' option
        await page
          .getByRole('radio', { name: 'I’ve only started preparatory work' })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step('eligibility-organisation', async () => {
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-organisation')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Who can apply for this grant'
        )
        await analyzeAccessibility(page)
        await expect(
          page.getByText('You cannot apply for this grant on behalf of:')
        ).toBeVisible()
        await expect(page.getByText('a government department')).toBeVisible()
        await expect(page.getByText('an executive agency')).toBeVisible()
        await expect(
          page.getByText(
            'a non-departmental public body such as the Environment Agency or the Forestry Commission'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'a public body unless it is a local authority, National Park Authority or the Crown Estate'
          )
        ).toBeVisible()
        await page
          .getByRole('radio', {
            name: 'No, my organisation is not eligible to apply'
          })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('exit-eligibility-organisation')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'You cannot apply for a grant from this scheme'
        )
        await analyzeAccessibility(page)
        await expect(
          page.getByText(
            'Because you told us your organisation is not eligible, you cannot continue with this application.'
          )
        ).toBeVisible()
        await expect(
          page.getByRole('link', {
            name: 'Check what other grants you may be eligible for (opens in a new tab)',
            exact: true
          })
        ).toBeVisible()
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-organisation')
        )
        await page
          .getByRole('radio', {
            name: 'Yes, I confirm my organisation can apply'
          })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step('eligibility-applicant-type -> Landowner landlord -> eligibility-landowner-landlord-requirements -> Confirm - How many businesses will use the water -> back -> back - organisation type', async () => {
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-applicant-type')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'What is your business type?'
        )
        await verifyAllOrganisationTypes(page)
        await analyzeAccessibility(page)

        await page.getByRole('radio', { name: 'Landowner landlord' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-landowner-landlord-requirements')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'What you need to do as a landowner landlord'
        )
        await analyzeAccessibility(page)
        await expect(
          page.getByText(
            'You should consult your tenants before you apply for the grant.'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'You must keep your tenants informed about the project and any grant conditions that might have an impact on them.'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'If you’re successful, you and your tenant will need to allow the RPA to access the project location for monitoring visits for the duration of the grant agreement.'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'Read the Water Management grant round 3 guidance (opens in a new tab).'
          )
        ).toBeVisible()
        await expect(
          page.getByRole('link', {
            name: 'Water Management grant round 3 guidance (opens in a new tab)'
          })
        ).toBeVisible()
        await page
          .getByRole('checkbox', {
            name: 'I confirm I have consulted (or will consult) tenants about this project'
          })
          .check()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-other-businesses-use-water')
        )
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await page.getByRole('link', { name: 'Back', exact: true }).click()
      })

      await test.step('eligibility-applicant-type -> Tenant farmer or grower -> eligibility-tenant-requirements -> Confirm -> How many businesses will use the water -> back -> back -> organisation type', async () => {
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-applicant-type')
        )
        await page
          .getByRole('radio', { name: 'Tenant farmer or grower' })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-tenant-requirements')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'What you need to do as a tenant farmer or grower'
        )
        await analyzeAccessibility(page)
        await expect(
          page.getByText(
            'You must have a current tenancy agreement in place and make sure it meets the grant requirements.'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'You must consult with your landlord before you apply and check that the project will not breach the terms of your tenancy agreement.'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'Read the Water Management grant round 3 guidance (opens in a new tab).'
          )
        ).toBeVisible()
        await expect(
          page.getByRole('link', {
            name: 'Water Management grant round 3 guidance (opens in a new tab)'
          })
        ).toBeVisible()
        await page
          .getByRole('checkbox', {
            name: 'I confirm I have a tenancy agreement that meets the grant requirements'
          })
          .check()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-other-businesses-use-water')
        )
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await page.getByRole('link', { name: 'Back', exact: true }).click()
      })

      await test.step('eligibility-applicant-type -> Water management company -> eligibility-water-management-company-requirements -> Confirm -> How many businesses will use the water -> back -> back -> organisation type', async () => {
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-applicant-type')
        )
        await page
          .getByRole('radio', { name: 'Water management company' })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-water-management-company-requirements')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'What you need to do as a water management company'
        )
        await analyzeAccessibility(page)
        await expect(
          page.getByText(
            'If your water management company is a tenant or a landlord, you must have all the following agreements in place:'
          )
        ).toBeVisible()
        await expect(page.getByText('Tenants must:')).toBeVisible()
        await expect(
          page.getByText('have a tenancy agreement in place')
        ).toBeVisible()
        await expect(
          page.getByText(
            'make sure the tenancy agreement meets the grant requirements'
          )
        ).toBeVisible()
        await expect(
          page.getByText('consult with your landlord before you apply')
        ).toBeVisible()
        await expect(
          page.getByText(
            'check that the project will not breach the terms of your tenancy agreement'
          )
        ).toBeVisible()

        await expect(page.getByText('Landlords must:')).toBeVisible()
        await expect(
          page.getByText('consult your tenants before you apply for the grant')
        ).toBeVisible()
        await expect(
          page.getByText(
            'keep your tenants informed about the project and any grant conditions that might have an impact on them'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'if successful, allow the RPA to access the project location for monitoring visits for the duration of the grant agreement'
          )
        ).toBeVisible()

        await expect(
          page.getByText(
            'Read the Water Management grant round 3 guidance (opens in a new tab).'
          )
        ).toBeVisible()
        await expect(
          page.getByRole('link', {
            name: 'Water Management grant round 3 guidance (opens in a new tab)'
          })
        ).toBeVisible()
        await page
          .getByRole('checkbox', {
            name: 'I confirm I will have all the necessary agreements in place'
          })
          .check()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await page.getByRole('link', { name: 'Back', exact: true }).click()
      })

      await test.step('eligibility-applicant-type -> None of the above - exit-eligibility-applicant-type', async () => {
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-applicant-type')
        )
        await page.getByRole('radio', { name: 'None of the above' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL(
          formatUrlForPath('exit-eligibility-applicant-type')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'You cannot apply for a grant from this scheme'
        )
        await expect(
          page.getByText(
            'This grant is only available to landowner landlords, landowner farmers or growers, tenant farmers or growers and water management companies.'
          )
        ).toBeVisible()
        await expect(
          page.getByRole('link', {
            name: 'Check what other grants you may be eligible for (opens in a new tab)',
            exact: true
          })
        ).toBeVisible()
        await analyzeAccessibility(page)
        await page.getByRole('link', { name: 'Back', exact: true }).click()
      })

      await test.step('eligibility-applicant-type -> Landowner farmer or grower', async () => {
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-applicant-type')
        )
        await page
          .getByRole('radio', { name: 'Landowner farmer or grower' })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step('eligibility-other-businesses-use-water', async () => {
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-other-businesses-use-water')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'How many other businesses will use the water for crop irrigation?'
        )
        await expect(page.locator('#businessesUsingWater-hint')).toHaveText(
          'Do not include your business in this answer. If you are invited to stage 2, you’ll need to provide evidence of the other businesses that will use the water.'
        )
        await verifyHowManyBusinessesWillUseTheWater(page)
        await analyzeAccessibility(page)
        await page.getByRole('radio', { name: '1 to 4' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step('eligibility-water-source -> exit-eligibility-water-source -> back -> select Surface water', async () => {
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-water-source')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Where will the water come from?'
        )
        await verifyWhereWaterWillComeFrom(page)
        await analyzeAccessibility(page)
        await page
          .getByRole('checkbox', { name: 'A different water source' })
          .check()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('exit-eligibility-water-source')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'You cannot apply for a grant from this scheme'
        )
        await expect(
          page.getByText(
            'You’re not eligible for this grant because we can only fund projects that will store water from a surface water source, rainwater harvesting or a borehole or aquifer.'
          )
        ).toBeVisible()
        await expect(
          page.getByRole('link', {
            name: 'Check what other grants you may be eligible for (opens in a new tab)',
            exact: true
          })
        ).toBeVisible()
        await analyzeAccessibility(page)

        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-water-source')
        )
        await page
          .getByRole('checkbox', { name: 'A different water source' })
          .uncheck()
        await page
          .getByRole('checkbox', {
            name: 'Surface water source (for example a river or stream)'
          })
          .check()
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step('eligibility-planning-permission -> no -> eligibility-planning-permission-required -> eligibility-abstraction-licence -> back -> back -> eligibility-planning-permission', async () => {
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-planning-permission')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Do you have planning permission?'
        )
        await analyzeAccessibility(page)
        await page
          .getByRole('radio', {
            name: 'No, I need to apply (or check if I need planning permission)'
          })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-planning-permission-required')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'You must have planning permission before you start construction work'
        )
        await analyzeAccessibility(page)
        await expect(
          page.locator('.govuk-body').filter({
            hasText: 'You can continue with this application for grant funding.'
          })
        ).toBeVisible()
        await expect(
          page.locator('.govuk-body').filter({
            hasText:
              'If you’re invited to stage 2 of the application process, and are successful in being offered a grant funding agreement, you must have all the required planning permission within 12 months of your grant funding agreement or before making your first claim (if this is earlier).'
          })
        ).toBeVisible()
        await page
          .getByRole('checkbox', {
            name: 'I confirm I will apply for the necessary planning permission'
          })
          .check()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-abstraction-licence')
        )
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await page.getByRole('link', { name: 'Back', exact: true }).click()
      })

      await test.step('eligibility-planning-permission -> I do not need planning permission -> eligibility-abstraction-licence -> back -> back - planning-permission-why-not-needed', async () => {
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-planning-permission')
        )
        await page
          .getByRole('radio', {
            name: 'I do not need planning permission because I’m only installing an underground distribution main'
          })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-abstraction-licence')
        )

        await page.getByRole('link', { name: 'Back', exact: true }).click()
      })

      await test.step('eligibility-planning-permission -> Yes -> eligibility-planning-permission-reference-number -> eligibility-abstraction-licence', async () => {
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-planning-permission')
        )
        await page
          .getByRole('radio', {
            name: 'Yes, all planning permission is in place'
          })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-planning-permission-reference-number')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Enter the planning permission reference number'
        )
        await analyzeAccessibility(page)
        await expect(
          page.locator('#planningPermissionReferenceNumber-hint')
        ).toHaveText(
          'The reference number will be on the planning decision notice issued by your local planning authority (for example YY/01234/FUL). You can enter more than one reference number separated by commas.'
        )
        await page
          .locator('#planningPermissionReferenceNumber')
          .fill('24/01234/FUL')
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step('eligibility-abstraction-licence -> I need a licence but I have not got one yet -> abstraction-licence-is-not-yet-secured -> project-score-results -> back -> back -> eligibility-abstraction-licence', async () => {
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-abstraction-licence')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Water abstraction licences'
        )
        await analyzeAccessibility(page)
        await expect(
          page.getByText(
            'If required, you must have an abstraction licence that allows you to abstract water for storage and to irrigate agricultural and horticultural crops. For more information, read the Apply for a water abstraction or impounding licence guidance (opens in a new tab).'
          )
        ).toBeVisible()
        await expect(
          page.getByRole('link', {
            name: 'Apply for a water abstraction or impounding licence guidance (opens in a new tab)'
          })
        ).toBeVisible()

        await page
          .getByRole('radio', {
            name: 'I need a licence but I do not have it yet'
          })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-abstraction-licence-required')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'You must have an abstraction licence before you make your first claim'
        )
        await analyzeAccessibility(page)
        await expect(
          page.getByText(
            'You can continue with this application for grant funding.'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'If you’re invited to stage 2 of the application process, and are successful in being offered a grant funding agreement, you must have the required abstraction licences within 12 months of your grant funding agreement or before making your first claim (if this is earlier).'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'For more information, read the Water Management grant round 3 guidance (opens in a new tab).'
          )
        ).toBeVisible()
        await expect(
          page.getByRole('link', {
            name: 'Water Management grant round 3 guidance (opens in a new tab)'
          })
        ).toBeVisible()
        await page
          .getByRole('checkbox', {
            name: 'I confirm I will apply for an abstraction licence'
          })
          .check()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(formatUrlForPath('project-score-results'))
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-abstraction-licence')
        )
      })

      await test.step('eligibility-abstraction-licence -> I do not need a licence -> project-score-results -> back -> eligibility-abstraction-licence', async () => {
        await page
          .getByRole('radio', {
            name: 'I do not need a licence'
          })
          .click()
        await expect(
          page.locator('#haveAbstractionLicence-3-item-hint')
        ).toHaveText(
          'For example because you will fill the reservoir only with harvested rainwater or abstract less than 20 metres cubed per day'
        )
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(formatUrlForPath('project-score-results'))
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-abstraction-licence')
        )
      })

      await test.step('eligibility-abstraction-licence -> I already have a licence -> eligibility-abstraction-licence-number -> project-score-results', async () => {
        await page
          .getByRole('radio', { name: 'I already have a licence' })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL(
          formatUrlForPath('eligibility-abstraction-licence-number')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Enter abstraction licence number'
        )
        await analyzeAccessibility(page)
        await expect(
          page.locator('#abstractionLicenceConsentNumber-hint')
        ).toHaveText(
          'You can find this on your abstraction licence issued by the Environment Agency. You can enter more than one licence number separated by commas.'
        )
        await page
          .locator('textarea#abstractionLicenceConsentNumber')
          .fill('24/01234/FUL')
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL(formatUrlForPath('project-score-results'))
      })

      await test.step('project-score-results -> confirm and continue -> task-list', async () => {
        await expect(page).toHaveURL(formatUrlForPath('project-score-results'))
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Your project score'
        )
        await analyzeAccessibility(page)
        await expect(page.getByText('Your project has scored:')).toBeVisible()
        await expect(
          page.locator('.govuk-inset-text .govuk-body')
        ).toContainText(/8\d{1} out of 100/)
        await expect(
          page.getByText(
            'Based on your answers, you are eligible to apply for this grant and we will consider your application carefully.'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'You will be competing for funding. Applications will be scored against the funding priorities. The likelihood of your application being successful and being invited to stage 2 of the application process will depend on the number and value of other applications we receive.'
          )
        ).toBeVisible()
        await page
          .getByRole('checkbox', {
            name: 'I confirm I want to continue with the application for this project'
          })
          .check()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL(formatUrlForPath('task-list'))
      })

      await test.step('task-list -> Your project details', async () => {
        await assertTaskStatuses(page, [
          { name: 'Confirm legal status', status: 'Completed' },
          { name: 'Check your project eligibility', status: 'Completed' },
          {
            name: 'Your project details',
            status: 'Not started'
          },
          {
            name: 'Check and submit your stage 1 application',
            status: 'Cannot start yet'
          }
        ])
        await page.getByRole('link', { name: 'Your project details' }).click()
      })

      await test.step('roject-details-expected-start-date', async () => {
        await expect(page).toHaveURL(
          formatUrlForPath('project-details-expected-start-date')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Estimated start date'
        )
        await expect(
          page.getByText(
            'Tell us when you expect to start work on your project. The earliest date you can enter is March 2027. You cannot start work before you are offered and accept a grant funding agreement.'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'The date you choose should allow you time to complete the work and submit your final claim by 31 March 2030.'
          )
        ).toBeVisible()
        await analyzeAccessibility(page)
        await page.locator('input#expectedProjectStartDate__month').fill('01')
        await page.locator('input#expectedProjectStartDate__year').fill('2028')
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step('project-building-or-installation-details', async () => {
        await expect(page).toHaveURL(
          formatUrlForPath('project-building-or-installation-details')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'What are you planning to build or install?'
        )
        await analyzeAccessibility(page)
        await expect(page.locator('#itemsPlanningToInstall-hint')).toHaveText(
          'Select all that apply'
        )

        // Selecting Only Reservoir and continuing to the next page
        await page
          .getByRole('checkbox', { name: 'Irrigation water storage reservoir' })
          .check()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL(
          formatUrlForPath('project-details-how-many-reservoirs')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Will your project include more than one reservoir at the same location?'
        )
        // User selects No and continues to the next page
        await page.getByRole('radio', { name: 'No' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('project-details-type-of-reservoir')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'What type of reservoir are you building?'
        )

        verifyAllReservoirTypes(page)
        await analyzeAccessibility(page)

        // User selects Clay lined and continues to the next page
        await page.getByRole('radio', { name: 'Clay lined' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('project-details-reservoir-water-volume')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'How much water will your reservoir hold?'
        )
        await analyzeAccessibility(page)
        await expect(page.locator('#howMuchWater-hint')).toHaveText(
          'Enter the maximum volume of water your reservoir can hold in cubic metres. Use a whole number without decimals.'
        )
        await expect(page.locator('input#howMuchWater')).toBeVisible()
        await expect(page.locator('.govuk-input__suffix')).toHaveText('m³')

        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          formatUrlForPath('project-details-type-of-reservoir')
        )
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          formatUrlForPath('project-details-how-many-reservoirs')
        )
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          formatUrlForPath('project-building-or-installation-details')
        )
        await page
          .getByRole('checkbox', { name: 'Irrigation water storage reservoir' })
          .uncheck()

        // Selecting Only Above-ground water storage tanks and continuing to the next page
        await page
          .getByRole('checkbox', {
            name: 'Above-ground water storage tanks'
          })
          .check()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL(
          formatUrlForPath('project-details-water-storage-volume')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'How much water will your storage tank or tanks hold?'
        )
        await analyzeAccessibility(page)
        await expect(page.locator('#waterStorageCapacity-hint')).toHaveText(
          'Enter the total capacity of all the water storage tanks you plan to install in cubic metres. Use a whole number without decimals.'
        )
        await expect(page.locator('#waterStorageCapacity')).toBeVisible()
        await expect(page.locator('.govuk-input__suffix')).toHaveText('m³')

        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          formatUrlForPath('project-building-or-installation-details')
        )
        await page
          .getByRole('checkbox', {
            name: 'Above-ground water storage tanks'
          })
          .uncheck()

        // Selecting Only Underground water distribution main and continuing to the next page
        await page
          .getByRole('checkbox', {
            name: 'Underground water distribution main'
          })
          .check()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('project-details-water-distribution-length')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'How long will your underground water distribution main be?'
        )
        await analyzeAccessibility(page)
        await expect(page.locator('#waterDistributionLength-hint')).toHaveText(
          'Enter the planned length in metres. Use a whole number without decimals.'
        )
        await expect(page.locator('#waterDistributionLength')).toBeVisible()
        await expect(page.locator('.govuk-input__suffix')).toHaveText('m')

        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          formatUrlForPath('project-building-or-installation-details')
        )
        await page
          .getByRole('checkbox', {
            name: 'Underground water distribution main'
          })
          .uncheck()

        // Selecting multiple mixed items and continue to fill in the details for each item in the correct order
        await page
          .getByRole('checkbox', { name: 'Irrigation water storage reservoir' })
          .check()
        await page
          .getByRole('checkbox', {
            name: 'Above-ground water storage tanks'
          })
          .check()

        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('project-details-how-many-reservoirs')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Will your project include more than one reservoir at the same location?'
        )
        await page.getByRole('radio', { name: 'No' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('project-details-type-of-reservoir')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'What type of reservoir are you building?'
        )
        await page.getByRole('radio', { name: 'Clay lined' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('project-details-reservoir-water-volume')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'How much water will your reservoir hold?'
        )
        await expect(page.locator('#howMuchWater-hint')).toHaveText(
          'Enter the maximum volume of water your reservoir can hold in cubic metres. Use a whole number without decimals.'
        )
        await page.locator('input#howMuchWater').fill('10000')
        await expect(page.locator('.govuk-input__suffix')).toHaveText('m³')
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          formatUrlForPath('project-details-water-storage-volume')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'How much water will your storage tank or tanks hold?'
        )
        await analyzeAccessibility(page)
        await expect(page.locator('#waterStorageCapacity-hint')).toHaveText(
          'Enter the total capacity of all the water storage tanks you plan to install in cubic metres. Use a whole number without decimals.'
        )
        await page.locator('input#waterStorageCapacity').fill('10000')
        await expect(page.locator('.govuk-input__suffix')).toHaveText('m³')
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step('project-details-total-estimated-grant -> Confirm and continue', async () => {
        await expect(page).toHaveURL(
          formatUrlForPath('project-details-total-estimated-grant')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Total estimated grant'
        )
        await analyzeAccessibility(page)
        await expect(
          page.getByRole('cell', { name: 'Reservoir' })
        ).toBeVisible()
        await expect(
          page.getByRole('cell', {
            name: 'Clay lined'
          })
        ).toContainText(getExpectedClayReservoirCostText('10,000'))
        await expect(
          page.getByRole('cell', {
            name: '£90,000'
          })
        ).toBeVisible()
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
            name: '40% of £800,000',
            exact: false
          })
        ).toBeVisible()
        await expect(
          page
            .getByRole('cell', {
              name: '40% of £800,000',
              exact: false
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
      })

      await test.step('task-list -> Your project details -> Check and submit your stage 1 application -> summary', async () => {
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
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Check your answers'
        )
        await analyzeAccessibility(page)
        await page.getByRole('button', { name: 'Continue' }).click()
      })

      await test.step('application-declaration - submit your application', async () => {
        await expect(page).toHaveURL(
          formatUrlForPath('application-declaration')
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Submit your application'
        )
        await analyzeAccessibility(page)
        await expect(
          page.getByText('By submitting your application, you confirm that:')
        ).toBeVisible()
        await expect(
          page.getByText(
            'the information you have provided is correct to the best of your knowledge'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'you have read and understood the information in the Water Management grant round 3 guidance (opens in a new tab)'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'you have read, understood and agree to the Water Management grant round 3 general terms and conditions (opens in a new tab) under which this grant is offered'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'you understand that if you are offered the grant, the grant funding agreement may contain specific conditions which will apply for the duration of the agreement'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'you’re not aware of any circumstances which would prevent you from fulfilling the obligations which will be required of you if your application is successful'
          )
        ).toBeVisible()
        await page
          .getByRole('checkbox', {
            name: 'I accept the terms and conditions'
          })
          .check()
        await page
          .getByRole('button', { name: 'Confirm and submit your application' })
          .click()
      })

      await test.step('confirmation', async () => {
        await expect(page).toHaveURL(formatUrlForPath('confirmation'))
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Application submitted'
        )
        await analyzeAccessibility(page)
        await expect(
          page.locator('.govuk-panel--confirmation .govuk-panel__body')
        ).toContainText('Your application number')
        await expect(page.locator('.govuk-panel__body')).toContainText(
          /WMG-[A-Z0-9]+-[A-Z0-9]+/
        )
        referenceNumber = await page
          .locator('.govuk-panel__body strong')
          .textContent()
        await expect(
          page.getByRole('heading', { name: 'What happens next' })
        ).toBeVisible()
        await expect(
          page.getByText(
            'Your stage 1 application for a Water Management grant round 3 has been submitted.'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'We’ll now assess your application against our eligibility criteria and RPA funding priorities. If your stage 1 application is successful, we’ll invite you to stage 2 of the application process where you’ll need to show:'
          )
        ).toBeVisible()
        await expect(
          page.getByText('project plans, maps and drawings')
        ).toBeVisible()
        await expect(
          page.getByText(
            'letters or emails of support from all the businesses that will use the water to irrigate their crops'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'a letter from your accountant confirming that your business is viable and can pay the remaining project costs'
          )
        ).toBeVisible()
        await expect(
          page.getByRole('link', {
            name: 'View and print this submitted application (opens in new tab)',
            exact: true
          })
        ).toBeVisible()
        await expect(
          page.getByText('Go to manage your applications to:')
        ).toBeVisible()
        await expect(
          page.getByRole('link', {
            name: 'manage your applications',
            exact: true
          })
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText: 'view this and other applications'
          })
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText: 'start a new application'
          })
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText: 'continue working on draft applications'
          })
        ).toBeVisible()
        await expect(
          page.getByRole('link', {
            name: 'Give feedback on this service (opens in new tab)',
            exact: true
          })
        ).toBeVisible()
      })

      await test.step('print-submitted-application', async () => {
        const [printTab] = await Promise.all([
          page.context().waitForEvent('page'),
          page
            .getByRole('link', {
              name: 'View and print this submitted application (opens in new tab)'
            })
            .click()
        ])
        await printTab.waitForLoadState()
        await expect(printTab).toHaveURL(
          formatUrlForPath('print-submitted-application')
        )
        await expect(printTab.getByRole('heading', { level: 1 })).toContainText(
          'Apply for a Water Management grant round 3'
        )
        await analyzeAccessibility(printTab)
        await expect(printTab.getByText(referenceNumber)).toBeVisible()
        await expect(
          printTab.getByRole('button', { name: 'Print this page' })
        ).toBeVisible()
        await printTab.close()
      })

      if (CI()) {
        await test.step('verify GAS submission', async () => {
          const request = await getApplicationSubmission(referenceNumber)
          expect(request).not.toBeNull()

          expect(request.body.json.metadata.clientRef).toEqual(
            referenceNumber.toLowerCase()
          )
          expect(request.body.json.metadata.sbi).toEqual(SBI)
          expect(request.body.json.metadata.crn).toEqual(CRN)
          expect(request.body.json.metadata.frn).toBeTruthy()
          expect(request.body.json.metadata.configVersion).toMatch(
            /^\d+\.\d+\.\d+$/
          )

          const ajv = new Ajv2020({
            strict: false,
            formats: { 'date-time': true }
          })
          const validate = ajv.compile(gasConfig.phases[0].questions)
          const valid = validate(request.body.json.answers)
          expect(valid, ajv.errorsText(validate.errors)).toBe(true)
        })
      }
    }
  )
})

function CI() {
  return !!process.env.MOCKSERVER_HOST
}

async function verifyAllOrganisationTypes(page) {
  const organisationTypes = [
    'Landowner landlord',
    'Landowner farmer or grower',
    'Tenant farmer or grower',
    'Water management company',
    'None of the above'
  ]

  for (const type of organisationTypes) {
    await expect(page.getByRole('radio', { name: type })).toBeVisible()
  }
}

async function verifyAllSectors(page) {
  const sectors = [
    'Arable crops',
    'Field-scale edible crops (grown outdoors)',
    'Forestry nursery stock',
    'Grass and forage crops',
    'Ornamentals',
    'Protected edible crops (grown under glass or polytunnel)',
    'Soft and cane fruit',
    'Top, stone fruit and vines',
    'None of these crop categories apply to my project'
  ]
  for (const sector of sectors) {
    await expect(page.getByRole('checkbox', { name: sector })).toBeVisible()
  }
}

async function verifyHowManyBusinessesWillUseTheWater(page) {
  const options = ['None', '1 to 4', '5 or more']
  for (const option of options) {
    await expect(page.getByRole('radio', { name: option })).toBeVisible()
  }
}

async function verifyWhereWaterWillComeFrom(page) {
  const options = [
    'A surface water source (for example a river or stream)',
    'Rainwater harvesting',
    'A groundwater source (for example a borehole or aquifer)',
    'A different water source'
  ]
  for (const option of options) {
    await expect(page.getByRole('checkbox', { name: option })).toBeVisible()
  }
}

async function verifyAllReservoirTypes(page) {
  const reservoirTypes = ['Clay lined', 'Synthetic lined']
  for (const type of reservoirTypes) {
    await expect(page.getByRole('radio', { name: type })).toBeVisible()
  }
}
