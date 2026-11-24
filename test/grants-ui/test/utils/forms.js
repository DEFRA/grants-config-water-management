/**
 * Sets the value of a hidden input element and dispatches 'input' and 'change' events.
 * This is a workaround because Playwright's `fill` method only works on visible elements.
 *
 * @param {import('@playwright/test').Locator} locator - The Playwright locator for the hidden field.
 * @param {string} value - The value to set.
 */
export async function setHiddenFieldValue(locator, value) {
  await locator.evaluate((el, value) => {
    el.value = value
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
}
