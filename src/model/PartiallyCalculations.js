import { numberOfMonthsOfAYear, intervalIsEndOfYear, roundToMoneyAmount } from '../helpers/utils';
import { ForecastModelSingleton } from '../model/ForecastModel';

const corporateTaxRatio = 0.26375;
const basicRateOfInterest = 0.005;
const inflationRate = 0.01;

export function calculateInflation(value, initialDate, endDate) {
    // TODO predict inflationRate??? if so how should I calculate it?
    const timeFactor =
        endDate.getFullYear() -
        initialDate.getFullYear() +
        (endDate.getMonth() - initialDate.getMonth()) / numberOfMonthsOfAYear;
    return value - value * Math.pow(1 - inflationRate, timeFactor);
}

export function calculatePrizeGain(amount, startDate, endDate, etfIdentifier) {
    const forecastModel = ForecastModelSingleton.getInstance();
    const startCourse = forecastModel.predictCourse(etfIdentifier, startDate);
    const endCourse = forecastModel.predictCourse(etfIdentifier, endDate);
    const courseChangeRatio = endCourse / startCourse;
    return roundToMoneyAmount(amount * courseChangeRatio - amount);
}

export function calculateNewDividendPayout(etfIdentifier, startDate, endDate) {
    // Only pay out dividend if a year has passed.
    if (intervalIsEndOfYear(startDate, endDate)) {
        // TODO look up the dividend value definition.
        const forecastModel = ForecastModelSingleton.getInstance();
        return roundToMoneyAmount(forecastModel.predictDividend(etfIdentifier, startDate.getFullYear()));
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
    const [leftoverToApplyTaxes, leftoverTaxFreeAmount] = subtractTaxFreeGain(amountToApplyTaxes, taxFreeAmount);
    const taxAmount = calculateTaxesOnAmount(leftoverToApplyTaxes);
    return [taxAmount, leftoverTaxFreeAmount];
}

export function calculateTaxesOnAmount(amount) {
    return amount * 0.7 * corporateTaxRatio;
}

export function calculateNewInvestmentOfETFAndCosts(
    etfInvestmentAmount,
    costConfiguration,
    etfIdentifier,
    startDate,
    endDate
) {
    const numberOfInvestmentSteps =
        (endDate.getFullYear() - startDate.getFullYear()) * numberOfMonthsOfAYear +
        endDate.getMonth() -
        startDate.getMonth();
    const monthlyInvestmentBrutto = etfInvestmentAmount / numberOfInvestmentSteps;
    const [monthlyInvestmentNetto, monthlyCosts] = calculateCosts(monthlyInvestmentBrutto, costConfiguration);
    const costs = monthlyCosts * numberOfInvestmentSteps;
    let invested = monthlyInvestmentNetto * numberOfInvestmentSteps;
    let gain = 0;
    for (let i = numberOfInvestmentSteps; i > 0.0; i--) {
        gain += calculatePrizeGain(monthlyInvestmentNetto, startDate, endDate, etfIdentifier);
    }
    return [invested, gain, costs];
}
