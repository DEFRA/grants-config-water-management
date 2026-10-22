import { test, expect } from '@playwright/test'
import { authenticateTo } from '../utils/auth.js'
import { clearApplicationData } from '../utils/backend.js'
import { analyzeAccessibility } from '../utils/accessibility.js'

const CRN = '9000000035'
const SBI = '800000026'
const GRANT_CODE = 'water-management'

test.describe('Water Management Grant application', () => {
  test.beforeEach(async () => {
    await clearApplicationData(SBI, GRANT_CODE)
  })

  test(
    'Automation POC - Sectors irrigated - something else',
    { tag: ['@cdp', '@ci'] },
    async ({ page }) => {
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

      await test.step('tasks', async () => {
        await expect(page).toHaveURL('/water-management/tasks')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Apply for a Water Management grant round 3 (WMG R3)'
        )
        await analyzeAccessibility(page)
        await assertTaskStatuses(page, [
          { name: 'Check your project eligibility', status: 'Incomplete' },
          {
            name: 'Your project details and estimated costs',
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

      await test.step('eligibility-land-registered', async () => {
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
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Where is your project?'
        )
        await analyzeAccessibility(page)
        await expect(page.locator('#projectLocated-hint')).toHaveText(
          'Select the centre of your project on the map (for example the centre of your reservoir). If you are planning more than one reservoir; water tank or underground distribution main, select the middle point between all the items.'
        )
        await page.getByRole('input', { name: 'Easting' }).fill('374980')
        await page.getByRole('input', { name: 'Northing' }).fill('448127')
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })

      await test.step('work-started-yet', async () => {
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
        await expect(page.locator('.govuk-body')).toContainText(
          'You cannot apply for a grant. Starting work on the project or committing to costs (such as placing orders) are against the rules of the scheme.'
        )
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
        await expect(page.locator('.govuk-body')).toContainText(
          'This grant is only available to farm owners, landlords, farm tenants, and water management companies.'
        )
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

      await test.step('organisation-type', async () => {
        await expect(page).toHaveURL('/water-management/organisation-type')
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'What type of organisation are you applying on behalf of?'
        )
        await verifyAllOrganisationTypes(page)
        await analyzeAccessibility(page)

        await page.getByRole('radio', { name: 'Landowner landlord' }).click()
        await page.getByRole('button', { name: 'Save and continue' }).click()
      })
    }
  )
})

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
    'Grass for feeding livestock or commercial turf',
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
