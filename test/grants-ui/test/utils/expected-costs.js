import fs from 'node:fs'
import path from 'node:path'
import { load } from 'js-yaml'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const config = load(
  fs.readFileSync(path.join(__dirname, '../data/expected-costs.yml'), 'utf8')
)
const expectedCosts = config.costs
expectedCosts.maxRatePercentage = expectedCosts.grantMaxRate * 100

export function getExpectedDistributionNetworkCostText(volume) {
  return `${volume} metres at £${expectedCosts.distNetworkCostPerUnit} per metre`
}

export function getExpectedClayReservoirCostText(volume) {
  return `${volume} cubic metres at £${expectedCosts.reservoirClayHighCostPerUnit} per cubic metre for the first 10,000 cubic metres, with any additional volume charged at £${expectedCosts.reservoirClayLowCostPerUnit} per cubic metre`
}

export function getExpectedWaterStorageTankCostText(volume) {
  return `${volume} cubic metres at £${expectedCosts.tanksCostPerUnit} per cubic metre`
}

export function getExpectedSyntheticReservoirCostText(volume) {
  return `${volume} cubic metres at £${expectedCosts.reservoirSyntheticHighCostPerUnit} per cubic metre for the first 10,000 cubic metres, with any additional volume charged at £${expectedCosts.reservoirSyntheticLowCostPerUnit} per cubic metre`
}

export { expectedCosts }
