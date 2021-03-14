import { numberOfMonthsOfAYear, intervalIsEndOfYear } from '../helpers/utils';

const corporateTaxRatio = 0.26375;
const basicRateOfInterest = 0.09;
const prizeGainRate = 0.025;
const inflationRate = 0.01;

export function calculateInflation(value, initialDate, endDate) {
    // TODO predict inflationRate??? if so how should I calculate it?
    const timeFactor =
        endDate.getFullYear() -
        initialDate.getFullYear() +
        (endDate.getMonth() - initialDate.getMonth()) / numberOfMonthsOfAYear;
    return value - value * Math.pow(1 - inflationRate, timeFactor);
}

export function calculatePrizeGain(amount, numberOfMonths = numberOfMonthsOfAYear) {
    // TODO add forecast.
    return amount * prizeGainRate;
}

export function calculateNewDividendPayout(etfIdentifier, startDate, endDate) {
    // Only pay out dividend if a year has passed.
    if (intervalIsEndOfYear(startDate, endDate)) {
        // TODO add forecasting
        return 500;
    }
    return 0;
}

export function calculateCosts(amount, costConfiguration) {
    const costs = amount * costConfiguration.percentageCosts + costConfiguration.fixedCosts;
    return [amount - costs, costs];
}

export function subtractTaxFreeGain(taxAmount, taxFreeAmount) {
    const leftoverTaxes = Math.max(0, taxAmount - taxFreeAmount);
    const leftoverTaxFreeAmount = Math.max(0, taxFreeAmount - taxAmount);
    return [leftoverTaxes, leftoverTaxFreeAmount];
}

export function calculateVorabpauschale(amountAtBeginningOfYear, gain) {
    // TODO basicRateOfInterest prediction???
    return Math.min(amountAtBeginningOfYear * 0.7 * basicRateOfInterest, gain);
}

export function calculateTaxesOnThesaurierer(totalGain, taxFreeAmount, amountAtBeginningOfYear, startDate, endDate) {
    if (!intervalIsEndOfYear(startDate, endDate)) {
        return [0, taxFreeAmount];
    }
    const amountToApplyTaxes = calculateVorabpauschale(amountAtBeginningOfYear, totalGain);
    const [leftoverToApplyTaxes, leftoverTaxFreeAmount] = subtractTaxFreeGain(amountToApplyTaxes, taxFreeAmount)
    const taxAmount = calculateTaxesOnAmount(leftoverToApplyTaxes);
    return [taxAmount, leftoverTaxFreeAmount]
}

export function calculateTaxesOnAmount(amount) {
    return amount * 0.7 * corporateTaxRatio;
}

export function calculateNewInvestmentOfETFAndCosts(
    etfInvestmentAmount,
    compoundInterestTimeFactor,
    costConfiguration
) {
    const numberOfInvestmentSteps = Math.round(compoundInterestTimeFactor * numberOfMonthsOfAYear);
    const monthlyInvestmentBrutto = etfInvestmentAmount / numberOfInvestmentSteps;
    const [monthlyInvestmentNetto, monthlyCosts] = calculateCosts(monthlyInvestmentBrutto, costConfiguration);
    const costs = monthlyCosts * numberOfInvestmentSteps;
    let invested = 0;
    let gain = 0;
    for (let i = numberOfInvestmentSteps; i > 0.0; i--) {
        invested += monthlyInvestmentNetto;
        gain += calculatePrizeGain(monthlyInvestmentNetto, i);
    }
    return [invested, gain, costs];
}
