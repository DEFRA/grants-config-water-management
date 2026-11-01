import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'
import Ajv2020 from 'ajv/dist/2020.js'
import { authenticateTo } from '../utils/auth.js'
import { clearApplicationData } from '../utils/backend.js'
import { analyzeAccessibility } from '../utils/accessibility.js'
import { getApplicationSubmission } from '../utils/gas.js'

const gasConfig = JSON.parse(
  readFileSync(
    new URL(
      '../../../../configurations/water-management/gas/gas.json',
      import.meta.url
    ),
    'utf8'
  )
)

const CRN = '9000000035'
const SBI = '800000026'
const GRANT_CODE = 'water-management'

test.describe('Water Management Grant application', () => {
  test.beforeEach(async () => {
    await clearApplicationData(SBI, GRANT_CODE)
  })

  test(
    'Apply for a Water Management grant round 3 (WMG R3)',
    { tag: ['@cdp', '@ci', '@runme'] },
    async ({ page }) => {
      let referenceNumber
      await test.step('authentication', async () => {
        await authenticateTo(page, 'water-management', CRN)
      })

      await test.step('check-details', async () => {
        await expect(page).toHaveURL('/water-management/check-details')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Confirm your details'
        )
        await analyzeAccessibility(page)
      })

      await test.step('check-details -> update-details -> check-details', async () => {
        await page.getByRole('radio', { name: 'No' }).click()
        await page.getByRole('button', { name: 'Continue' }).click()

        await expect(page).toHaveURL('/water-management/update-details')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Update your details'
        )
        await analyzeAccessibility(page)
        await page.getByRole('link', { name: 'Back', exact: true }).click()

        await expect(page).toHaveURL('/water-management/check-details')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Confirm your details'
        )
      })

      await test.step('check-details -> tasks', async () => {
        await page.getByRole('radio', { name: 'Yes' }).click()
        await page.getByRole('button', { name: 'Continue' }).click()
      })

      await test.step('tasks -> Check your project eligibility', async () => {
        await expect(page).toHaveURL('/water-management/tasks')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Apply for a Water Management grant round 3 (WMG R3)'
        )
        await analyzeAccessibility(page)
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
      })

      await test.step('eligibility-land-registered -> exit-sectors-irrigated-somethingelse -> back -> select Arable sector', async () => {
        await expect(page).toHaveURL('/water-management/sectors-irrigated')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'What crops will be irrigated using the water from this project?'
        )
        await verifyAllSectors(page)
        await analyzeAccessibility(page)
        await page.getByRole('checkbox', { name: 'Something else' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/exit-sectors-irrigated-somethingelse'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'You cannot apply for a grant from this scheme'
        )
        await analyzeAccessibility(page)
        await page.getByRole('link', { name: 'Back', exact: true }).click()

        await expect(page).toHaveURL('/water-management/sectors-irrigated')

        await page.getByRole('checkbox', { name: 'Arable' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step('where-project-located', async () => {
        await expect(page).toHaveURL('/water-management/where-project-located')
        // BUG - This should be a top level heading but it is currently a legend
        // await expect(page.getByRole('heading', { level: 1 })).toContainText(
        //   'Where is your project?'
        // )

        // Accessibility failure as there is no level 1 header
        //await analyzeAccessibility(page)
        await expect(page.locator('#projectLocated-hint')).toHaveText(
          'Select the centre of your project on the map (for example the centre of your reservoir). If you are planning more than one reservoir; water tank or underground distribution main, select the middle point between all the items.'
        )
        await page.locator('#projectLocated__easting').fill('374980')
        await page.locator('#projectLocated__northing').fill('448127')
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step('work-started-yet -> select Yes, we have begun project work -> exit-work-started-yet-begunwork -> back -> preparatory work - continue', async () => {
        await expect(page).toHaveURL('/water-management/work-started-yet')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Have you started work?'
        )
        await analyzeAccessibility(page)
        await page
          .getByRole('radio', { name: 'Yes, we have begun project work' })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL(
          '/water-management/exit-work-started-yet-begunwork'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'You cannot apply for a grant from this scheme'
        )
        await expect(
          page.getByText(
            'You cannot apply for a grant. Starting work on the project or committing to costs (such as placing orders) are against the rules of the scheme.'
          )
        ).toBeVisible()
        await analyzeAccessibility(page)
        await page.getByRole('link', { name: 'Back', exact: true }).click()

        await expect(page).toHaveURL('/water-management/work-started-yet')
        await page.getByRole('radio', { name: 'Yes, preparatory work' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step('eligible-organisation', async () => {
        await expect(page).toHaveURL('/water-management/eligible-organisation')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Are you a National Parks authority or a government department, executive agency or non-departmental public body?'
        )
        await analyzeAccessibility(page)
        await page.getByRole('radio', { name: 'Yes' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/exit-eligible-organisation-no'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'You cannot apply for a grant from this scheme'
        )
        await expect(
          page.getByText(
            'This grant is only available to farm owners, landlords, farm tenants, and water management companies.'
          )
        ).toBeVisible()
        await expect(
          page.getByRole('link', {
            name: 'See other grants you may be eligible for',
            exact: true
          })
        ).toBeVisible()
        await analyzeAccessibility(page)
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL('/water-management/eligible-organisation')
        await page.getByRole('radio', { name: 'No' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step('organisation-type -> Landowner landlord -> what-landlords-need-to-do', async () => {
        await expect(page).toHaveURL('/water-management/organisation-type')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'What type of organisation are you applying on behalf of?'
        )
        await verifyAllOrganisationTypes(page)
        await analyzeAccessibility(page)

        await page.getByRole('radio', { name: 'Landowner landlord' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/what-landlords-need-to-do'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'What you need to do'
        )
        await analyzeAccessibility(page)
        await expect(
          page.getByText(
            'Because you are a landlord not farming or growing on the land, you should consult your tenants (if you have any) to ensure they agree to this project proceeding.'
          )
        ).toBeVisible()
        await page.getByRole('link', { name: 'Back', exact: true }).click()
      })

      await test.step('organisation-type -> Tenant farmer, grower or forester -> what-tenants-need-to-do', async () => {
        await expect(page).toHaveURL('/water-management/organisation-type')
        await page
          .getByRole('radio', { name: 'Tenant farmer, grower or forester' })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/what-tenants-need-to-do'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'What you need to do'
        )
        await analyzeAccessibility(page)
        await expect(
          page.getByText(
            'Because you are a tenant farmer, grower or forester you should consult your landlord and make sure the correct permissions are in place.'
          )
        ).toBeVisible()
        await page.getByRole('link', { name: 'Back', exact: true }).click()
      })

      await test.step('organisation-type -> Water management company -> what-water-companys-need-to-do', async () => {
        await expect(page).toHaveURL('/water-management/organisation-type')
        await page
          .getByRole('radio', { name: 'Water management company' })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/what-water-companys-need-to-do'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'What you need to do'
        )
        await analyzeAccessibility(page)
        await expect(
          page.getByText(
            'Because you are a water management company you must have the consent of any land owners and tenants in place before starting work on this project.'
          )
        ).toBeVisible()
        await page.getByRole('link', { name: 'Back', exact: true }).click()
      })

      await test.step('organisation-type -> Landowner farmer, grower or forester', async () => {
        await expect(page).toHaveURL('/water-management/organisation-type')
        await page
          .getByRole('radio', { name: 'Landowner farmer, grower or forester' })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step('how-many-businesses-will-use-the-water', async () => {
        await expect(page).toHaveURL(
          '/water-management/how-many-businesses-will-use-the-water'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'How many business will use the water for irrigation?'
        )
        await expect(page.locator('#businessesUsingWater-hint')).toHaveText(
          'Tell us the total number of businesses that will use the water for irrigation (including the one you are applying on behalf of)'
        )
        await verifyHowManyBusinessesWillUseTheWater(page)
        await analyzeAccessibility(page)
        await page.getByRole('radio', { name: 'One' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step('where-water-will-come-from -> exit-where-water-will-come-from -> back -> select Surface water', async () => {
        await expect(page).toHaveURL(
          '/water-management/where-water-will-come-from'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Where will the water come from?'
        )
        await verifyWhereWaterWillComeFrom(page)
        await analyzeAccessibility(page)
        await page.getByRole('checkbox', { name: 'Something else' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/exit-where-water-will-come-from'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'You cannot apply for a grant from this scheme'
        )
        await expect(
          page.getByText(
            'This grant will only fund projects that will store water from surface water abstraction, rainwater harvesting or a borehole / aquifer.'
          )
        ).toBeVisible()
        await expect(
          page.getByRole('link', {
            name: 'See other grants you may be eligible for',
            exact: true
          })
        ).toBeVisible()
        await analyzeAccessibility(page)

        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          '/water-management/where-water-will-come-from'
        )
        await page
          .getByRole('checkbox', {
            name: 'Surface water abstraction for storage'
          })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step('have-planning-permission -> no -> planning-permission-is-needed -> need-abstraction-licence -> back -> back -> have-planning-permission', async () => {
        await expect(page).toHaveURL(
          '/water-management/have-planning-permission'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Do you have confirmed planning permission?'
        )
        await analyzeAccessibility(page)
        await expect(page.locator('#havePlanningPermission-hint')).toHaveText(
          "If you are building a reservoir you'll need to have planning permission from your local planning authority before starting construction work. This could be through the prior notification or full planning permission process. If you are applying for a water storage tank you should consult your Local Planning Authority regarding the type of consent you will need."
        )
        await page.getByRole('radio', { name: 'No' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/planning-permission-is-needed'
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
              "You'll need to provide evidence that you have planning permission if you are invited to stage 2 of the application process."
          })
        ).toBeVisible()

        await page.getByRole('button', { name: 'Confirm and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/need-abstraction-licence'
        )
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await page.getByRole('link', { name: 'Back', exact: true }).click()
      })

      await test.step("have-planning-permission -> I don't need planning permission -> planning-permission-why-not-needed -> Something else -> details-planning-permission-why-not-needed -> need-abstraction-licence -> back -> back - planning-permission-why-not-needed", async () => {
        await expect(page).toHaveURL(
          '/water-management/have-planning-permission'
        )
        await page
          .getByRole('radio', { name: "I don't need planning permission" })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/planning-permission-why-not-needed'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Tell us why you do not need planning permission'
        )
        await analyzeAccessibility(page)
        await expect(
          page.locator('#planningPermissionWhyNotNeeded-hint')
        ).toHaveText('Select all reasons that apply')
        await verifyPlanningPermissionWhyNotNeeded(page)
        await page.getByRole('checkbox', { name: 'Something else' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/details-planning-permission-why-not-needed'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Give more details'
        )
        await analyzeAccessibility(page)
        await page
          .locator('#detailsPlanningPermissionWhyNotNeeded')
          .fill('I have a special exemption from the local council.')
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL(
          '/water-management/need-abstraction-licence'
        )

        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          '/water-management/planning-permission-why-not-needed'
        )
        await page.getByRole('checkbox', { name: 'Something else' }).uncheck()
      })

      await test.step('planning-permission-why-not-needed -> Project does not include a new reservoir -> need-abstraction-licence -> back -> planning-permission-why-not-needed', async () => {
        await page
          .getByRole('checkbox', {
            name: 'Project does not include a new reservoir'
          })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL(
          '/water-management/need-abstraction-licence'
        )

        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          '/water-management/planning-permission-why-not-needed'
        )
        await page
          .getByRole('checkbox', {
            name: 'Project does not include a new reservoir'
          })
          .uncheck()
      })

      await test.step('planning-permission-why-not-needed -> Exemption under General Permitted Development Order 2015 -> need-abstraction-licence -> back -> planning-permission-why-not-needed -> back -> have-planning-permission', async () => {
        await page
          .getByRole('checkbox', {
            name: 'Exemption under General Permitted Development Order 2015'
          })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL(
          '/water-management/need-abstraction-licence'
        )
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          '/water-management/planning-permission-why-not-needed'
        )
        await page
          .getByRole('checkbox', {
            name: 'Exemption under General Permitted Development Order 2015'
          })
          .uncheck()
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          '/water-management/have-planning-permission'
        )
      })

      await test.step('have-planning-permission -> Yes -> planning-permission-reference-number -> need-abstraction-licence', async () => {
        await page.getByRole('radio', { name: 'Yes' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL(
          '/water-management/planning-permission-reference-number'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Enter the planning permission reference number'
        )
        await analyzeAccessibility(page)
        await expect(
          page.locator('#planningPermissionReferenceNumber-hint')
        ).toHaveText(
          'Your reference number will be on the planning decision notice issued by your local planning authority (for example, 24/01234/FUL)'
        )
        await page
          .locator('#planningPermissionReferenceNumber')
          .fill('24/01234/FUL')
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step('need-abstraction-licence -> I need a licence but I have not got one yet -> abstraction-licence-is-not-yet-secured -> score-results -> back -> back -> need-abstraction-licence', async () => {
        await expect(page).toHaveURL(
          '/water-management/need-abstraction-licence'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Will you need an abstraction licence?'
        )
        await analyzeAccessibility(page)
        await page
          .getByRole('radio', {
            name: 'I need a licence but I have not got one yet'
          })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/abstraction-licence-is-not-yet-secured'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'You must have an abstraction licence before you start construction work'
        )
        await analyzeAccessibility(page)
        await expect(
          page.getByText(
            'You can continue with the application for grant funding.'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            "You'll need to provide evidence that you have an abstraction licence from the Environment Agency if you are invited to stage 2 of the application process."
          )
        ).toBeVisible()
        await page.getByRole('button', { name: 'Confirm and continue' }).click()
        await expect(page).toHaveURL('/water-management/score-results')
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          '/water-management/need-abstraction-licence'
        )
      })

      await test.step('need-abstraction-licence -> I do not need a licence -> why-abstraction-licence-is-not-needed -> Something else -> details-why-abstraction-licence-is-not-needed -> score-results -> back -> back -> why-abstraction-licence-is-not-needed', async () => {
        await page
          .getByRole('radio', { name: 'I do not need a licence' })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL(
          '/water-management/why-abstraction-licence-is-not-needed'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Tell us why you do not need an abstraction licence'
        )
        await analyzeAccessibility(page)
        await expect(
          page.locator('#whyAbstractionLicenceIsNotNeeded-hint')
        ).toHaveText('Select all reasons that apply')
        await page.getByRole('checkbox', { name: 'Something else' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL(
          '/water-management/details-why-abstraction-licence-is-not-needed'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Give more details'
        )
        await analyzeAccessibility(page)
        await page
          .locator('textarea#detailsWhyAbstractionLicenceIsNotNeeded')
          .fill('I have a special exemption from the Environment Agency.')
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL('/water-management/score-results')
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          '/water-management/why-abstraction-licence-is-not-needed'
        )
        await page.getByRole('checkbox', { name: 'Something else' }).uncheck()
      })

      await test.step('why-abstraction-licence-is-not-needed -> Water will be sourced from rainwater harvesting only -> score-results -> back -> uncheck Water will be sourced from rainwater harvesting only -> back -> need-abstraction-licence', async () => {
        await page
          .getByRole('checkbox', {
            name: 'Water will be sourced from rainwater harvesting only'
          })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL('/water-management/score-results')
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await page
          .getByRole('checkbox', {
            name: 'Water will be sourced from rainwater harvesting only'
          })
          .uncheck()
        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          '/water-management/need-abstraction-licence'
        )
      })

      await test.step('need-abstraction-licence -> I already have a licence -> abstraction-licence-consent-number -> score-results', async () => {
        await page
          .getByRole('radio', { name: 'I already have a licence' })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL(
          '/water-management/abstraction-licence-consent-number'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Confirm the licence consent number'
        )
        await analyzeAccessibility(page)
        await expect(
          page.locator('#abstractionLicenceConsentNumber-hint')
        ).toHaveText(
          'You will find this reference number on the information provided by the Environment Agency'
        )
        await page
          .locator('input#abstractionLicenceConsentNumber')
          .fill('24/01234/FUL')
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL('/water-management/score-results')
      })

      await test.step('score-results -> confirm and continue -> tasks', async () => {
        await expect(page).toHaveURL('/water-management/score-results')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Your eligibility score'
        )
        await analyzeAccessibility(page)
        await expect(
          page.getByText(
            'Based on the answers provided, your project has scored'
          )
        ).toBeVisible()
        await expect(
          page.locator('.govuk-inset-text .govuk-body')
        ).toContainText('80 out of 100')
        await expect(
          page.locator('.govuk-warning-text .govuk-body')
        ).toContainText(
          "The likelihood of your application being successful will depend on the total number of applications received for this grant, and the relative scores of all projects as they relate to RPA's policy objectives and budget."
        )
        await page.getByRole('button', { name: 'Confirm and continue' }).click()
        await expect(page).toHaveURL('/water-management/tasks')
      })

      await test.step('tasks -> Your project details', async () => {
        await assertTaskStatuses(page, [
          { name: 'Check your project eligibility', status: 'Completed' },
          {
            name: 'Your project details',
            status: 'Incomplete'
          },
          {
            name: 'Check and submit your stage 1 application',
            status: 'Cannot start yet'
          }
        ])
        await page.getByRole('link', { name: 'Your project details' }).click()
      })

      await test.step('expected-project-start-date', async () => {
        await expect(page).toHaveURL(
          '/water-management/expected-project-start-date'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'When do you expect the project work to start?'
        )
        await expect(page.locator('#expectedProjectStartDate-hint')).toHaveText(
          'This is when you expect to start digging, signing contracts or placing orders. For example, 3 2027'
        )
        await analyzeAccessibility(page)
        await page.locator('input#expectedProjectStartDate__month').fill('01')
        await page.locator('input#expectedProjectStartDate__year').fill('2028')
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step('items-planning-to-install', async () => {
        await expect(page).toHaveURL(
          '/water-management/items-planning-to-install'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'What are you planning to build or install?'
        )
        await analyzeAccessibility(page)
        await expect(page.locator('#itemsPlanningToInstall-hint')).toHaveText(
          'Select all that apply'
        )

        // Selecting Only Clay-lined reservoir and continuing to the next page
        await page
          .getByRole('checkbox', { name: 'Clay-lined reservoir' })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL(
          '/water-management/reservoir-storage-capacity'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'How much water can your reservoir hold?'
        )
        await analyzeAccessibility(page)
        await expect(page.locator('#howMuchWater-hint')).toHaveText(
          'Enter the maximum volume of water your reservoir can hold in cubic metres. Use a whole number, without decimals.'
        )
        await expect(page.locator('input#howMuchWater')).toBeVisible()
        await expect(page.locator('.govuk-input__suffix')).toHaveText('m³')

        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          '/water-management/items-planning-to-install'
        )
        await page
          .getByRole('checkbox', { name: 'Clay-lined reservoir' })
          .uncheck()

        // Selecting Only Synthetic-lined reservoir and continuing to the next page
        await page
          .getByRole('checkbox', { name: 'Synthetic-lined reservoir' })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL(
          '/water-management/reservoir-storage-capacity'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'How much water can your reservoir hold?'
        )
        await analyzeAccessibility(page)
        await expect(page.locator('#howMuchWater-hint')).toHaveText(
          'Enter the maximum volume of water your reservoir can hold in cubic metres. Use a whole number, without decimals.'
        )
        await expect(page.locator('input#howMuchWater')).toBeVisible()
        await expect(page.locator('.govuk-input__suffix')).toHaveText('m³')

        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          '/water-management/items-planning-to-install'
        )
        await page
          .getByRole('checkbox', { name: 'Synthetic-lined reservoir' })
          .uncheck()

        // Selecting Only Above-ground water storage tanks and continuing to the next page
        await page
          .getByRole('checkbox', { name: 'Above-ground water storage tanks' })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page).toHaveURL('/water-management/water-storage-capacity')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'How much water will your storage tanks hold?'
        )
        await analyzeAccessibility(page)
        await expect(page.locator('#waterStorageCapacity-hint')).toHaveText(
          'Enter the total capacity of all the water storage tanks you plan to install in cubic metres. Use a whole number, without decimals.'
        )
        await expect(page.locator('#waterStorageCapacity')).toBeVisible()
        await expect(page.locator('.govuk-input__suffix')).toHaveText('m³')

        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          '/water-management/items-planning-to-install'
        )
        await page
          .getByRole('checkbox', { name: 'Above-ground water storage tanks' })
          .uncheck()

        // Selecting Only Underground water distribution main and continuing to the next page
        await page
          .getByRole('checkbox', {
            name: 'Underground water distribution main'
          })
          .click()
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/water-distribution-length'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'How long will your underground water distribution main be?'
        )
        await analyzeAccessibility(page)
        await expect(page.locator('#waterDistributionLength-hint')).toHaveText(
          'Enter the planned length in metres. Use a whole number, without decimals.'
        )
        await expect(page.locator('#waterDistributionLength')).toBeVisible()
        await expect(page.locator('.govuk-input__suffix')).toHaveText('m')

        await page.getByRole('link', { name: 'Back', exact: true }).click()
        await expect(page).toHaveURL(
          '/water-management/items-planning-to-install'
        )
        await page
          .getByRole('checkbox', {
            name: 'Underground water distribution main'
          })
          .uncheck()

        // Selecting multiple mixed items and continue to fill in the details for each item in the correct order
        await page
          .getByRole('checkbox', { name: 'Clay-lined reservoir' })
          .click()
        await page
          .getByRole('checkbox', { name: 'Above-ground water storage tanks' })
          .click()

        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL(
          '/water-management/reservoir-storage-capacity'
        )
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'How much water can your reservoir hold?'
        )
        await expect(page.locator('#howMuchWater-hint')).toHaveText(
          'Enter the maximum volume of water your reservoir can hold in cubic metres. Use a whole number, without decimals.'
        )
        await page.locator('input#howMuchWater').fill('10000')
        await expect(page.locator('.govuk-input__suffix')).toHaveText('m³')
        await page.getByRole('button', { name: 'Save and continue' }).click()

        await expect(page).toHaveURL('/water-management/water-storage-capacity')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'How much water will your storage tanks hold?'
        )
        await analyzeAccessibility(page)
        await expect(page.locator('#waterStorageCapacity-hint')).toHaveText(
          'Enter the total capacity of all the water storage tanks you plan to install in cubic metres. Use a whole number, without decimals.'
        )
        await page.locator('input#waterStorageCapacity').fill('10000')
        await expect(page.locator('.govuk-input__suffix')).toHaveText('m³')
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step('total-estimated-cost -> Confirm and continue', async () => {
        await expect(page).toHaveURL('/water-management/total-estimated-cost')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Total estimated grant based on estimated costs'
        )
        await analyzeAccessibility(page)
        await expect(
          page.getByText(
            'The amount of grant you can apply for is based on the reference cost contribution for the items you need. If successful, you will be able to claim this amount or 40% of your actual invoice costs at claim stage, whichever is the lower amount.'
          )
        ).toBeVisible()
        await expect(
          page.getByText('The total estimated grant is as follows:')
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText:
              'Reservoir – clay lined: 10,000m³ at £10/m³ for the first 10,000m³, with any additional volume charged at £2/m³, giving a total of £100,000'
          })
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText: 'Water storage tank(s): 10,000m³ at £50 per m³ = £500,000'
          })
        ).toBeVisible()
        await expect(
          page.getByText('Total estimated grant = £240,000')
        ).toBeVisible()
        await page.getByRole('button', { name: 'Confirm and continue' }).click()
        await expect(page).toHaveURL('/water-management/tasks')
      })

      await test.step('tasks -> Your project details -> Check and submit your stage 1 application -> summary', async () => {
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
        await page
          .getByRole('link', {
            name: 'Check and submit your stage 1 application'
          })
          .click()
        await expect(page).toHaveURL('/water-management/summary')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Check your answers'
        )
        await analyzeAccessibility(page)
        await page.getByRole('button', { name: 'Continue' }).click()
      })

      await test.step('potential-funding', async () => {
        await expect(page).toHaveURL('/water-management/potential-funding')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Potential grant funding'
        )
        await analyzeAccessibility(page)
        await expect(
          page.getByText(
            'You may be able to apply for a grant of £240,000 if you are invited to stage 2 of the application process. This is based on your estimated costs of £600,000.'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'You will need to be able to fund the remainder of your project costs.'
          )
        ).toBeVisible()
        await expect(page.locator('.govuk-warning-text__text')).toContainText(
          'Warning'
        )
        await expect(page.locator('.govuk-warning-text__text')).toContainText(
          'There is no guarantee that your stage 2 grant application will be successful'
        )
        await expect(
          page.getByText('Based on your answers, your project score is')
        ).toBeVisible()
        await expect(page.locator('strong.govuk-tag--yellow')).toHaveText(
          '80 out of 100'
        )
        await page.getByRole('button', { name: 'Confirm and continue' }).click()
      })

      await test.step('declaration - submit your application', async () => {
        await expect(page).toHaveURL('/water-management/declaration')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Submit your application'
        )
        await analyzeAccessibility(page)
        await expect(
          page.getByText('By submitting your application, you confirm that:')
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText:
              'the information you have provided is correct to the best of your knowledge'
          })
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText:
              'you have read and understand the information in the Water Management guidance (opens in new tab) about this application'
          })
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText:
              'you are capable of fulfilling the obligations which will be required of you if your application is successful'
          })
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText:
              'you agree to let any authorised person access the land and relevant records related to this application so they can inspect or audit them to verify the information you’ve provided to the Rural Payments Agency (RPA) and to check that you are complying with this agreement'
          })
        ).toBeVisible()
        await expect(page.getByText('you agree to disclose all')).toHaveText(
          'you agree to disclose all information relevant to this application, provide any additional information as may be required by the RPA, field officers or auditors and co-operate with or take part in any economic, environmental or other monitoring and evaluation of the scheme (including any research and development studies) conducted by RPA or by anyone appointed by them for that purpose'
        )
        await page
          .getByRole('button', { name: 'Submit your application' })
          .click()
      })

      await test.step('confirmation', async () => {
        await expect(page).toHaveURL('/water-management/confirmation')
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
            'Thank you for submitting your stage 1 application for a Water Management grant round 3 (WMG R3).'
          )
        ).toBeVisible()
        await expect(
          page.getByText(
            'We will now assess your application against our eligibility criteria and RPA funding priorities. If you are successful in stage 1, we will invite you to complete stage 2 of the application process where you will need to show:'
          )
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText: 'Evidence of planning permission'
          })
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText: 'A plan showing existing and proposed irrigation systems'
          })
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText:
              'Evidence of a water-abstraction licence, if necessary for the project'
          })
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText:
              'Letters of support from any other farms the project will supply water to'
          })
        ).toBeVisible()
        await expect(
          page.locator('li').filter({
            hasText:
              'A letter from your accountant confirming you can pay the remaining costs of the project'
          })
        ).toBeVisible()
        await expect(
          page.getByRole('link', {
            name: 'View / Print submitted application (opens in new tab)',
            exact: true
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
              name: 'View / Print submitted application (opens in new tab)'
            })
            .click()
        ])
        await printTab.waitForLoadState()
        await expect(printTab).toHaveURL(
          '/water-management/print-submitted-application'
        )
        await expect(printTab.getByRole('heading', { level: 1 })).toContainText(
          'Apply for a Water Management grant round 3 (WMG R3) application'
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

async function assertTaskStatuses(page, tasks) {
  for (const { name, status } of tasks) {
    const item = page.locator('.govuk-task-list__item', { hasText: name })
    await expect(item.locator('.govuk-task-list__status')).toContainText(status)
  }
}

async function verifyAllOrganisationTypes(page) {
  const organisationTypes = [
    'Landowner landlord',
    'Landowner farmer, grower or forester',
    'Tenant farmer, grower or forester',
    'Water management company'
  ]

  for (const type of organisationTypes) {
    await expect(page.getByRole('radio', { name: type })).toBeVisible()
  }
}

async function verifyAllSectors(page) {
  const sectors = [
    'Arable',
    'Field scale vegetables',
    'Forest nursery',
    'Grass for commercial turf or feeding livestock',
    'Ornamentals',
    'Protected edible crops',
    'Soft and cane fruit',
    'Top and stone fruit',
    'Vineyards',
    'Something else'
  ]

  for (const sector of sectors) {
    await expect(page.getByRole('checkbox', { name: sector })).toBeVisible()
  }
}

async function verifyHowManyBusinessesWillUseTheWater(page) {
  const options = ['One', 'Two to four', 'Five or more']
  for (const option of options) {
    await expect(page.getByRole('radio', { name: option })).toBeVisible()
  }
}

async function verifyWhereWaterWillComeFrom(page) {
  const options = [
    'Surface water abstraction for storage',
    'Rainwater harvesting',
    'Borehole / aquifer',
    'Something else'
  ]
  for (const option of options) {
    await expect(page.getByRole('checkbox', { name: option })).toBeVisible()
  }
}

async function verifyPlanningPermissionWhyNotNeeded(page) {
  const options = [
    'Exemption under General Permitted Development Order 2015',
    'Project does not include a new reservoir',
    'Something else'
  ]
  for (const option of options) {
    await expect(page.getByRole('checkbox', { name: option })).toBeVisible()
  }
}
