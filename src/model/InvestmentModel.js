import ForecastModelSingleton from './ForecastModel';
import { calculateCosts, numberOfMonthsOfAYear, isLastMonthOfAYear, clamp } from '../helpers/utils';
const basicRateOfInterest = 0.007;
const partialExemption = 0.7;
const corporateTaxRatio = 0.26375;

function calculateDividend(etfIdentifier, date) {
    if (isLastMonthOfAYear(date)) {
        return 0;
    } else {
        const forecast = ForecastModelSingleton.getInstance();
        return forecast.predictDividend(etfIdentifier, date.getFullYear());
    }
}

function subtractTaxFreeGain(taxAmount, taxFreeAmount) {
    const leftoverTaxes = Math.max(0, taxAmount - taxFreeAmount);
    const leftoverTaxFreeAmount = Math.max(0, taxFreeAmount - taxAmount);
    return [leftoverTaxes, leftoverTaxFreeAmount];
}

function getTotalShareValue(etfIdentifier, investmentStep) {
    return investmentStep.totalShares[etfIdentifier] * investmentStep.sharePrizes[etfIdentifier];
}

function getNewShareValue(etfIdentifier, investmentStep) {
    return investmentStep.newShares[etfIdentifier] * investmentStep.sharePrizes[etfIdentifier];
}

function calculateTaxes(investmentSteps, date, configOptions, etfIdentifiers) {
    if (!isLastMonthOfAYear(date)) {
        return 0;
    }
    let summedTaxes = 0;
    const decemberInvestmentStep = investmentSteps[investmentSteps.length - 1];
    const januaryInvestmentStep = investmentSteps[investmentSteps.length - numberOfMonthsOfAYear];
    let leftoverTaxFreeAmount = configOptions.taxFreeAmount;
    for (const etfIdentifier of etfIdentifiers) {
        let accumulatedBasicProfit = 0;
        // Sum up all new investments from february to december.
        for (let i = 0; i < numberOfMonthsOfAYear - 1; i++) {
            const currentInvestmentStep = investmentSteps[investmentSteps.length - 1 - i];
            accumulatedBasicProfit +=
                (getNewShareValue(etfIdentifier, currentInvestmentStep) * i) / numberOfMonthsOfAYear;
        }
        // Sum up total Investment of January.
        accumulatedBasicProfit += getTotalShareValue(etfIdentifier, januaryInvestmentStep);
        accumulatedBasicProfit *= 0.7 * basicRateOfInterest;
        const currentShareValues = getTotalShareValue(etfIdentifier, decemberInvestmentStep);
        // Calculate profit of last year.
        const profitOverAllTime = currentShareValues - decemberInvestmentStep.totalInvestedMoney[etfIdentifier];
        const profitOfPreviousYears =
            investmentSteps.length > numberOfMonthsOfAYear
                ? getTotalShareValue(etfIdentifier, investmentSteps[investmentSteps.length - 1 - numberOfMonthsOfAYear])
                : 0;
        const profitOfThisYear = profitOverAllTime - profitOfPreviousYears;
        const amountToApplyTaxes = clamp(profitOfThisYear, 0, accumulatedBasicProfit);
        const [leftoverAmountToApplyTaxes, updatedLeftoverTaxFreeAmount] = subtractTaxFreeGain(
            amountToApplyTaxes,
            leftoverTaxFreeAmount
        );
        leftoverTaxFreeAmount = updatedLeftoverTaxFreeAmount;
        summedTaxes += leftoverAmountToApplyTaxes * partialExemption * corporateTaxRatio;
    }
    return summedTaxes;
}

export function addAccumulationMonth(investmentSteps, investment, date, etfToRatio, configOptions) {
    const forecast = ForecastModelSingleton.getInstance();
    let costs = 0;
    const prevInvestmentStep = investmentSteps[investmentSteps.length - 1];
    const newInvestmentStep = {
        date: date,
        newShares: {},
        totalShares: { ...prevInvestmentStep.total },
        dividendNewShares: {},
        dividendTotalShares: {},
        totalCosts: prevInvestmentStep.totalCosts,
        sharePrizes: {},
        totalInvestedMoney: { ...prevInvestmentStep.totalInvestedMoney },
        totalTaxes: prevInvestmentStep.totalTaxes,
    };
    for (const etfIdentifier in etfToRatio) {
        const investmentOfEtfWithCosts = etfToRatio[etfIdentifier] * investment;
        const [investmentOfEtfWithoutCosts, newCosts] = calculateCosts(
            investmentOfEtfWithCosts,
            configOptions.costConfig
        );
        costs += newCosts;
        newInvestmentStep.totalInvestedMoney[etfIdentifiers] += investmentOfEtfWithoutCosts;

        const etfSharePrize = forecast.predictCourse(etfIdentifier, date);
        const newShares = investmentOfEtfWithoutCosts / etfSharePrize;
        newInvestmentStep.sharePrizes[etfIdentifier] = etfSharePrize;
        newInvestmentStep.newShares[etfIdentifier] = newShares;
        newInvestmentStep.totalShares[etfIdentifier] += newShares;

        const dividendPayoutMoney = newInvestmentStep.total[etfIdentifier] * calculateDividend(etfIdentifier, date);
        const newSharesByDividend = dividendPayoutMoney / etfSharePrize;
        newInvestmentStep.newShares[etfIdentifier] = newSharesByDividend;
        newInvestmentStep.totalShares[etfIdentifier] += newSharesByDividend;
        newInvestmentStep.dividendNewShares[etfIdentifier] = newSharesByDividend;
        newInvestmentStep.dividendTotalShares[etfIdentifier] += newSharesByDividend;
    }
    newInvestmentStep.totalCosts += costs;
    const newTaxes = calculateTaxes(investmentSteps, date, configOptions, Object.keys(etfToRatio));
    newInvestmentStep.totalTaxes += newTaxes;

    investmentSteps.push(newInvestmentStep);
}


function addPayoutMonth(investmentSteps, sellingAmount, etfToRatio, date, configOptions){
    
}
