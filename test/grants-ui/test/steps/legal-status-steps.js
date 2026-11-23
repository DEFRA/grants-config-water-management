import { expect, test } from '@playwright/test'
import { formatUrlForPath } from '../utils/urls.js'
import { assertTaskStatuses } from '../utils/assertion.js'
import { analyzeAccessibility } from '../utils/accessibility.js'

export async function legalStatusSteps(page) {
  await test.step('task-list -> Confirm legal status', async () => {
    await page.getByRole('link', { name: 'Confirm legal status' }).click()

    await expect(page).toHaveURL(formatUrlForPath('confirm-legal-status'))
    await page.getByRole('radio', { name: 'Private limited company' }).click()
    await page.getByRole('button', { name: 'Save and continue' }).click()

    await expect(page).toHaveURL(formatUrlForPath('company-number'))
    await page.locator('#companyNumber').fill('12351975')
    await page.getByRole('button', { name: 'Save and continue' }).click()

    await expect(page).toHaveURL(formatUrlForPath('task-list'))
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
  })
}

export async function legalStatusOptionsSteps(page) {
  await test.step('task-list -> Confirm legal status -> verify all combinations', async () => {
    expect(page).toHaveURL(await formatUrlForPath('task-list'))
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

    await expect(page).toHaveURL(formatUrlForPath('confirm-legal-status'))
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'What is the legal status of your business or organisation?'
    )
    await analyzeAccessibility(page)

    await verifyAllLegalStatusOptions(page)

    await page.goto(formatUrlForPath('task-list', false))
  })
}

async function verifyAllLegalStatusOptions(page) {
  const legalStatusOptions = [
    {
      text: 'Charitable incorporated organisation',
      slug: 'charity-number',
      input: '#charityNumber',
      optional: true
    },
    {
      text: 'Charitable trust',
      slug: 'charity-number',
      input: '#charityNumber',
      optional: true
    },
    {
      text: 'Community interest company',
      slug: 'company-number',
      input: '#companyNumber',
      optional: false
    },
    {
      text: 'Government (central)',
      slug: null,
      input: null,
      optional: null
    },
    {
      text: 'Government (local)',
      slug: null,
      input: null,
      optional: null
    },
    {
      text: 'Limited liability partnership',
      slug: 'company-number',
      input: '#companyNumber',
      optional: false
    },
    {
      text: 'Limited partnership',
      slug: 'company-number',
      input: '#companyNumber',
      optional: false
    },
    {
      text: 'Partnership',
      slug: null,
      input: null,
      optional: null
    },
    {
      text: 'Private limited company',
      slug: 'company-number',
      input: '#companyNumber',
      optional: false
    },
    {
      text: 'Public limited company',
      slug: 'company-number',
      input: '#companyNumber',
      optional: false
    },
    {
      text: 'Sole proprietorship',
      slug: null,
      input: null,
      optional: null
    },
    {
      text: 'The Crown',
      slug: null,
      input: null,
      optional: null
    },
    {
      text: 'Unlimited company',
      slug: 'company-number',
      input: '#companyNumber',
      optional: false
    }
  ]
  for (const legalStatusOption of legalStatusOptions) {
    await page
      .getByRole('radio', { name: legalStatusOption.text, exact: true })
      .click()
    await page.getByRole('button', { name: 'Save and continue' }).click()

    if (legalStatusOption.slug !== null) {
      await expect(page).toHaveURL(formatUrlForPath(legalStatusOption.slug))
    }
    if (legalStatusOption.input !== null) {
      await expect(page.locator(legalStatusOption.input)).toBeVisible()
    }

    if (legalStatusOption.slug === 'charity-number') {
      let heading = 'Enter your charity number'
      if (legalStatusOption.optional === true) {
        heading = `${heading} (optional)`
      }
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        heading
      )
      await expect(
        page.getByText(
          "You can find this on your charity's registration certificate or on the Charity Commission for England and Wales charity register (opens in a new tab)"
        )
      ).toBeVisible()
      await expect(
        page.getByRole('link', {
          name: 'Charity Commission for England and Wales charity register (opens in a new tab)'
        })
      ).toBeVisible()
      if (legalStatusOption.optional !== true) {
        await page.locator(legalStatusOption.input).fill('')
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page.getByText('There is a problem')).toBeVisible()
        await expect(
          page.getByRole('link', {
            name: 'Enter charity or organisation number'
          })
        ).toBeVisible()
      }
    } else if (legalStatusOption.slug === 'company-number') {
      let heading = 'Enter your company number'
      if (legalStatusOption.optional === true) {
        heading = `${heading} (optional)`
      }
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        heading
      )
      await expect(
        page.getByText(
          'You can find this on your certificate of incorporation or by searching the Companies House register (opens in a new tab)'
        )
      ).toBeVisible()
      await expect(
        page.getByRole('link', {
          name: 'Companies House register (opens in a new tab)'
        })
      ).toBeVisible()
      if (legalStatusOption.optional !== true) {
        await page.locator(legalStatusOption.input).fill('')
        await page.getByRole('button', { name: 'Save and continue' }).click()
        await expect(page.getByText('There is a problem')).toBeVisible()
        await expect(
          page.getByRole('link', {
            name: 'Enter company number'
          })
        ).toBeVisible()
      }
    }

    if (legalStatusOption.input !== null) {
      await page.locator(legalStatusOption.input).fill('12351975')
      await page.getByRole('button', { name: 'Save and continue' }).click()
    }

    await expect(page).toHaveURL(formatUrlForPath('task-list'))
    await assertTaskStatuses(page, [
      { name: 'Confirm legal status', status: 'Completed' },
      {
        name: 'Check your project eligibility',
        status: 'Not started'
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

    await expect(page).toHaveURL(formatUrlForPath('confirm-legal-status'))
  }
}
