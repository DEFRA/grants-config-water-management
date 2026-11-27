import { test, expect } from '@playwright/test'
import { clearApplicationData } from '../utils/backend.js'
import { authenticateTo } from '../utils/auth.js'
import { formatUrlForPath, formatUrlForPathWithUUID } from '../utils/urls.js'
import { setHiddenFieldValue } from '../utils/forms.js'
import {
  legalStatusOptionsSteps,
  legalStatusSteps
} from '../steps/legal-status-steps.js'
import { availableUsers } from '../data/test-users.js'

const CRN = availableUsers.get(2).crn
const SBI = availableUsers.get(2).sbi

test.describe(
  'Water Management Grant Round 3',
  { lock: `${CRN}-${SBI}` },
  () => {
    test.beforeEach(async () => {
      await clearApplicationData(SBI)
    })

    test(
      'Input field validation and error messages',
      { tag: ['@ci', '@input-validation'] },
      async ({ page }) => {
        await test.step('authentication', async () => {
          await authenticateTo(page, 'water-management', CRN, SBI)
        })

        await test.step('check-details -> no options selected -> verify error messages -> select yes and continue', async () => {
          await expect(page).toHaveURL(formatUrlForPath('check-details'))
          await page.getByRole('button', { name: 'Continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Select if these details are correct'
          ])
          await page.getByRole('radio', { name: 'Yes' }).check()
          await page.getByRole('button', { name: 'Continue' }).click()
        })

        await test.step('grant-overview -> continue', async () => {
          await expect(page).toHaveURL(formatUrlForPath('grant-overview'))
          await page.getByRole('button', { name: 'Continue' }).click()
        })

        await test.step('task-list -> Confirm legal status -> no option selected', async () => {
          await expect(page).toHaveURL(formatUrlForPath('task-list'))
          await page.getByRole('link', { name: 'Confirm legal status' }).click()
          // Click save and continue without selecting an option to trigger validation error
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, ['Select legal status'])
          await page
            .getByRole('link', { name: 'Back to task list', exact: true })
            .click()
        })

        // Go through legal status options and validate inputs where available
        await legalStatusOptionsSteps(page)

        // Select a legal status option and continue
        await legalStatusSteps(page)

        await test.step('task-list -> Check your project eligibility -> continue without selecting an option -> validate error messages -> select an option and continue', async () => {
          await expect(page).toHaveURL(formatUrlForPath('task-list'))
          await page
            .getByRole('link', { name: 'Check your project eligibility' })
            .click()
          await expect(page).toHaveURL(
            formatUrlForPath('eligibility-crops-irrigated')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Select crops to be irrigated'
          ])

          await page.getByRole('checkbox', { name: 'Arable crops' }).check()
          await page.getByRole('button', { name: 'Save and continue' }).click()
        })

        await test.step('eligibility-project-location -> continue without inputting or selecting any values -> validate error messages -> validate input field min and max -> fill in required fields and continue', async () => {
          await expect(page).toHaveURL(
            formatUrlForPath('eligibility-project-location')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Enter easting',
            'Enter northing',
            'You must confirm you understand and agree with the selected location to continue'
          ])

          await page
            .getByRole('checkbox', {
              name: 'I confirm I have selected the right location on the map'
            })
            .check()

          // Verify minimum input values for easting and northing
          await page.fill('#projectLocated__easting', '-1')
          await page.fill('#projectLocated__northing', '-1')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Easting for project location must be between 0 and 700000',
            'Northing for project location must be between 0 and 1300000'
          ])
          // Verify maximum input values for easting and northing
          await page.fill('#projectLocated__easting', '700001')
          await page.fill('#projectLocated__northing', '1300001')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Easting for project location must be between 0 and 700000',
            'Northing for project location must be between 0 and 1300000'
          ])

          await page.locator('#projectLocated__easting').fill('613413')
          await page.locator('#projectLocated__northing').fill('154146')
          await setHiddenFieldValue(
            page.locator('#projectLocatedDescription'),
            'CT4, Canterbury'
          )

          await page.getByRole('button', { name: 'Save and continue' }).click()
        })

        await test.step('eligibility-work-started -> continue without selecting an option -> validate error messages', async () => {
          await expect(page).toHaveURL(
            formatUrlForPath('eligibility-work-started')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, ['Select status of work'])

          await page
            .getByRole('radio', { name: 'I’ve only started preparatory work' })
            .click()
          await page.getByRole('button', { name: 'Save and continue' }).click()
        })

        await test.step('eligibility-organisation -> continue without selecting an option -> validate error messages', async () => {
          await expect(page).toHaveURL(
            formatUrlForPath('eligibility-organisation')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Select organisation eligibility'
          ])

          await page
            .getByRole('radio', {
              name: 'Yes, I confirm my organisation can apply'
            })
            .click()
          await page.getByRole('button', { name: 'Save and continue' }).click()
        })

        await test.step('eligibility-applicant-type -> continue without selecting an option -> validate error messages', async () => {
          await expect(page).toHaveURL(
            formatUrlForPath('eligibility-applicant-type')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, ['Select business type'])

          // Select the applicant type as 'Landowner landlord (not a farmer or grower)'
          await page
            .getByRole('radio', {
              name: 'Landowner landlord (not a farmer or grower)'
            })
            .click()
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await expect(page).toHaveURL(
            formatUrlForPath('eligibility-landowner-landlord-requirements')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            "You must confirm you understand and agree with the applicant's responsibilities to continue"
          ])
          await page.getByRole('link', { name: 'Back', exact: true }).click()

          // Select the applicant type as 'Tenant farmer or grower' after going back
          await page
            .getByRole('radio', { name: 'Tenant farmer or grower' })
            .click()
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await expect(page).toHaveURL(
            formatUrlForPath('eligibility-tenant-requirements')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            "You must confirm you understand and agree with the applicant's responsibilities to continue"
          ])
          await page.getByRole('link', { name: 'Back', exact: true }).click()

          // Select the applicant type as 'Water management company' after going back
          await page
            .getByRole('radio', { name: 'Water management company' })
            .click()
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await expect(page).toHaveURL(
            formatUrlForPath(
              'eligibility-water-management-company-requirements'
            )
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            "You must confirm you understand and agree with the applicant's responsibilities to continue"
          ])
          await page.getByRole('link', { name: 'Back', exact: true }).click()

          await page
            .getByRole('radio', { name: 'Landowner farmer or grower' })
            .click()
          await page.getByRole('button', { name: 'Save and continue' }).click()
        })

        await test.step('eligibility-other-businesses-use-water -> continue with no options selection -> validate error message', async () => {
          await expect(page).toHaveURL(
            formatUrlForPath('eligibility-other-businesses-use-water')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Select number of other businesses using the water'
          ])
          await page.getByRole('radio', { name: '1 to 4' }).click()
          await page.getByRole('button', { name: 'Save and continue' }).click()
        })

        await test.step('eligibility-water-source -> continue with no options selection -> validate error message', async () => {
          await expect(page).toHaveURL(
            formatUrlForPath('eligibility-water-source')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, ['Select water source'])
          await page
            .getByRole('checkbox', {
              name: 'Surface water source (for example a river or stream)'
            })
            .check()
          await page.getByRole('button', { name: 'Save and continue' }).click()
        })

        await test.step('eligibility-planning-permission -> continue with no options selection -> validate error message -> select yes/no continue -> validate inputs', async () => {
          await expect(page).toHaveURL(
            formatUrlForPath('eligibility-planning-permission')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Select planning permission status'
          ])

          // Select 'No' for planning permission and continue, then continue without confirming applying for permission
          await page
            .getByRole('radio', {
              name: 'No, I need to apply (or check if I need planning permission)'
            })
            .click()
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await expect(page).toHaveURL(
            formatUrlForPath('eligibility-planning-permission-required')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'You must confirm you understand and agree with the planning permission declaration to continue'
          ])
          await page.getByRole('link', { name: 'Back', exact: true }).click()

          // Select 'Yes' for planning permission and continue to validate inputs
          await page
            .getByRole('radio', {
              name: 'Yes, all planning permission is in place'
            })
            .click()
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await expect(page).toHaveURL(
            formatUrlForPath('eligibility-planning-permission-reference-number')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Enter planning permission reference number'
          ])
          await page
            .locator('#planningPermissionReferenceNumber')
            .fill('24/01234/FUL')
          await page.getByRole('button', { name: 'Save and continue' }).click()
        })

        await test.step('eligibility-abstraction-licence -> continue without selecting an option -> validate error message', async () => {
          await expect(page).toHaveURL(
            formatUrlForPath('eligibility-abstraction-licence')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Select abstraction licence status'
          ])

          // Select 'I need a licence but I do not have it yet' and continue
          await page
            .getByRole('radio', {
              name: 'I need a licence but I do not have it yet'
            })
            .click()
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await expect(page).toHaveURL(
            formatUrlForPath('eligibility-abstraction-licence-required')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'You must confirm you understand and agree with the abstraction licence declaration to continue'
          ])
          await page.getByRole('link', { name: 'Back', exact: true }).click()

          // Select 'I already have a licence' and continue then validate input
          await page
            .getByRole('radio', {
              name: 'I already have a licence'
            })
            .click()
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await expect(page).toHaveURL(
            formatUrlForPath('eligibility-abstraction-licence-number')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Enter abstraction licence number'
          ])
          await page
            .locator('textarea#abstractionLicenceConsentNumber')
            .fill('24/01234/FUL')
          await page.getByRole('button', { name: 'Save and continue' }).click()
        })

        await test.step('project-score-results -> continue without confirming the declaration', async () => {
          await expect(page).toHaveURL(
            formatUrlForPath('project-score-results')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'You must confirm you understand and agree with the declaration to continue'
          ])
          await page
            .getByRole('checkbox', {
              name: 'I confirm I want to continue with the application based on this project score'
            })
            .check()
          await page.getByRole('button', { name: 'Save and continue' }).click()
        })

        await test.step('task-list -> Your project details -> project-details-expected-start-date', async () => {
          await expect(page).toHaveURL(formatUrlForPath('task-list'))
          await page.getByRole('link', { name: 'Your project details' }).click()
          await expect(page).toHaveURL(
            formatUrlForPath('project-details-expected-start-date')
          )

          // input validation
          // input negative numbers for month and year
          await page.locator('input#expectedProjectStartDate__month').fill('-1')
          await page.locator('input#expectedProjectStartDate__year').fill('-1')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Estimated start date must be a real date'
          ])

          // input 0 as month
          await page.locator('input#expectedProjectStartDate__month').fill('0')
          await page
            .locator('input#expectedProjectStartDate__year')
            .fill('2028')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Estimated start date must be a real date'
          ])

          // input date before 03/2027
          await page.locator('input#expectedProjectStartDate__month').fill('2')
          await page
            .locator('input#expectedProjectStartDate__year')
            .fill('2027')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Estimated start date must be the same as or after 1 March 2027'
          ])

          // input date after 03/2030
          await page.locator('input#expectedProjectStartDate__month').fill('4')
          await page
            .locator('input#expectedProjectStartDate__year')
            .fill('2031')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Estimated start date must be the same as or before 1 March 2030'
          ])

          // input valid date within range
          await page.locator('input#expectedProjectStartDate__month').fill('3')
          await page
            .locator('input#expectedProjectStartDate__year')
            .fill('2028')
          await page.getByRole('button', { name: 'Save and continue' }).click()
        })

        await test.step('project-building-or-installation-details -> continue without selecting an option', async () => {
          await expect(page).toHaveURL(
            formatUrlForPath('project-building-or-installation-details')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Select type of build or installation'
          ])

          // Select all options
          await page
            .getByRole('checkbox', {
              name: 'Irrigation water storage reservoir'
            })
            .check()
          await page
            .getByRole('checkbox', { name: 'Above-ground water storage tanks' })
            .check()
          await page
            .getByRole('checkbox', {
              name: 'Underground water distribution main'
            })
            .check()
          await page.getByRole('button', { name: 'Save and continue' }).click()

          // Proceed without selecting an option for multiple reservoirs
          await expect(page).toHaveURL(
            formatUrlForPath('project-details-how-many-reservoirs')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Multiple reservoirs - select yes or no'
          ])

          // Select 'Yes' for multiple reservoirs
          await page.getByRole('radio', { name: 'Yes' }).check()
          await page.getByRole('button', { name: 'Save and continue' }).click()

          // Validate input fields for multiple reservoirs page after selecting 'Yes'
          await expect(page).toHaveURL(
            formatUrlForPathWithUUID('project-details-reservoir-details')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Enter a name for this reservoir',
            'Select type of reservoir',
            'Enter a value in cubic metres'
          ])

          // Validate input field for reservoir cubic metres (less than minimum value 1)
          await page
            .getByRole('textbox', {
              name: 'How much water will your reservoir hold?'
            })
            .fill('0')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Enter a value of 1 cubic metre or more'
          ])

          // Validate input field for reservoir cubic metres (greater than maximum value 1300000)
          await page
            .getByRole('textbox', {
              name: 'How much water will your reservoir hold?'
            })
            .fill('1300001')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Enter a value of not more than 1.3 million cubic metres'
          ])

          // Validate input field for non whole number value
          await page
            .getByRole('textbox', {
              name: 'How much water will your reservoir hold?'
            })
            .fill('1.5')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, ['Enter a whole number'])

          // Validate input field for non numeric value
          await page
            .getByRole('textbox', {
              name: 'How much water will your reservoir hold?'
            })
            .fill('abc!&*%')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, ['Enter a whole number'])

          // Now we are done validating the form for reservoir details go back and select no for multiple reservoirs
          await page
            .getByRole('link', { name: 'Go back to reservoir list' })
            .click()
          await page.getByRole('link', { name: 'Back', exact: true }).click()
          await page.getByRole('radio', { name: 'No' }).check()
          await page.getByRole('button', { name: 'Save and continue' }).click()

          await expect(page).toHaveURL(
            formatUrlForPath('project-details-type-of-reservoir')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Select type of reservoir'
          ])

          // Select type of reservoir and continue
          await page.getByRole('radio', { name: 'Clay lined' }).check()
          await page.getByRole('button', { name: 'Save and continue' }).click()

          await expect(page).toHaveURL(
            formatUrlForPath('project-details-reservoir-water-volume')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()

          // Validate input field for reservoir water volume (empty value)
          await validateInputFieldErrorMessages(page, [
            'Enter a value in cubic metres'
          ])

          // Validate input field for reservoir water volume (less than minimum value 1)
          await page
            .getByRole('textbox', {
              name: 'How much water will your reservoir hold?'
            })
            .fill('0')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Enter a value of 1 cubic metre or more'
          ])

          // Validate input field for reservoir water volume (greater than maximum value 1300000)
          await page
            .getByRole('textbox', {
              name: 'How much water will your reservoir hold?'
            })
            .fill('1300001')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Enter a value of not more than 1.3 million cubic metres'
          ])

          // Validate input field for reservoir water volume (non whole number)
          await page
            .getByRole('textbox', {
              name: 'How much water will your reservoir hold?'
            })
            .fill('1.5')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, ['Enter a whole number'])

          // Validate input field for reservoir water volume (non numeric value)
          await page
            .getByRole('textbox', {
              name: 'How much water will your reservoir hold?'
            })
            .fill('abc!&*%')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, ['Enter a whole number'])

          // Validate input field for reservoir water volume (valid value) and continue
          await page
            .getByRole('textbox', {
              name: 'How much water will your reservoir hold?'
            })
            .fill('10000')
          await page.getByRole('button', { name: 'Save and continue' }).click()

          // Validate input field for water storage tanks volume (empty value)
          await expect(page).toHaveURL(
            formatUrlForPath('project-details-water-storage-volume')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Enter a value in cubic metres'
          ])

          // Validate input field for water storage tanks volume (less than minimum value 100)
          await page
            .getByRole('textbox', {
              name: 'How much water will your storage tank or tanks hold?'
            })
            .fill('99')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Enter a value of 100 cubic metres or more'
          ])

          // Validate input field for water storage tanks volume (more than maximum value 10000)
          await page
            .getByRole('textbox', {
              name: 'How much water will your storage tank or tanks hold?'
            })
            .fill('10001')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Enter a value of not more than 10,000 cubic metres'
          ])

          // Validate input field for water storage tanks volume (non whole number)
          await page
            .getByRole('textbox', {
              name: 'How much water will your storage tank or tanks hold?'
            })
            .fill('100.5')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, ['Enter a whole number'])

          // Validate input field for water storage tanks volume (invalid characters)
          await page
            .getByRole('textbox', {
              name: 'How much water will your storage tank or tanks hold?'
            })
            .fill('abc!&*%')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, ['Enter a whole number'])

          // Validate input field for water storage tanks volume (valid value) and continue
          await page
            .getByRole('textbox', {
              name: 'How much water will your storage tank or tanks hold?'
            })
            .fill('10000')
          await page.getByRole('button', { name: 'Save and continue' }).click()

          // Validate input field for water distribution main length (empty value)
          await expect(page).toHaveURL(
            formatUrlForPath('project-details-water-distribution-length')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Enter a value in metres'
          ])

          // Validate input field for water distribution main length (less than minimum value 1)
          await page
            .getByRole('textbox', {
              name: 'How long will your underground water distribution main be?'
            })
            .fill('0')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Enter a value of 1 metre or more'
          ])

          // Validate more than maximum value for water distribution main length (100000)
          await page
            .getByRole('textbox', {
              name: 'How long will your underground water distribution main be?'
            })
            .fill('100001')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'Enter a value of not more than 100,000 metres'
          ])

          // Validate non whole number for water distribution main length
          await page
            .getByRole('textbox', {
              name: 'How long will your underground water distribution main be?'
            })
            .fill('1.5')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, ['Enter a whole number'])

          // Validate non numeric value for water distribution main length
          await page
            .getByRole('textbox', {
              name: 'How long will your underground water distribution main be?'
            })
            .fill('abc!*&^$')
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, ['Enter a whole number'])

          // Validate valid value for water distribution main length and continue
          await page
            .getByRole('textbox', {
              name: 'How long will your underground water distribution main be?'
            })
            .fill('10000')
          await page.getByRole('button', { name: 'Save and continue' }).click()
        })

        await test.step('project-details-total-estimated-grant -> validate confirmation checkbox when left unchecked', async () => {
          await expect(page).toHaveURL(
            formatUrlForPath('project-details-total-estimated-grant')
          )
          await page.getByRole('button', { name: 'Save and continue' }).click()
          await validateInputFieldErrorMessages(page, [
            'You must confirm you understand and agree with the declaration to continue'
          ])
          await page
            .getByRole('checkbox', {
              name: 'I understand there is no guarantee that my application will be successful'
            })
            .check()
          await page.getByRole('button', { name: 'Save and continue' }).click()
        })

        await test.step('task-list -> proceed to submit application', async () => {
          await expect(page).toHaveURL(formatUrlForPath('task-list'))
          await page
            .getByRole('link', {
              name: 'Check and submit your stage 1 application'
            })
            .click()
          await expect(page).toHaveURL(formatUrlForPath('summary'))
          await page.getByRole('button', { name: 'Continue' }).click()
        })

        await test.step('application-declaration -> submit without confirming terms and conditions -> validate error message', async () => {
          await expect(page).toHaveURL(
            formatUrlForPath('application-declaration')
          )
          await page
            .getByRole('button', {
              name: 'Confirm and submit your application'
            })
            .click()
          await validateInputFieldErrorMessages(page, [
            'You must confirm you understand and agree with the terms and conditions to continue'
          ])
        })

        await test.step('confirmation -> submit application with terms and conditions confirmed', async () => {
          await expect(page).toHaveURL(
            formatUrlForPath('application-declaration')
          )
          await page
            .getByRole('checkbox', {
              name: 'I accept the terms and conditions'
            })
            .check()
          await page
            .getByRole('button', {
              name: 'Confirm and submit your application'
            })
            .click()
          await expect(page).toHaveURL(formatUrlForPath('confirmation'))
          await expect(page.getByRole('heading', { level: 1 })).toContainText(
            'Application submitted'
          )
        })
      }
    )
  }
)

async function validateInputFieldErrorMessages(page, errorMessages) {
  await expect(
    page
      .locator('h2.govuk-error-summary__title')
      .filter({ hasText: 'There is a problem' })
  ).toBeVisible()
  for (const errorMessage of errorMessages) {
    await expect(
      page
        .locator('ul.govuk-error-summary__list li a')
        .filter({ hasText: errorMessage })
    ).toBeVisible()
  }
}
