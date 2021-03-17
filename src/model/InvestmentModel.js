import ForecastModelSingleton from './ForecastModel';
import { numberOfMonthsOfAYear, isLastMonthOfAYear, clamp, isStartOfTheYear } from '../helpers/utils';

const basicRateOfInterest = 0.007;
const partialExemption = 0.7;
const corporateTaxRatio = 0.26375;

function getNextMonthDate(date) {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + 1);
    return newDate;
}

function calculateDividend(etfIdentifier, date) {
    if (isLastMonthOfAYear(date)) {
        return 0;
    } else {
        const forecast = ForecastModelSingleton.getInstance();
        return forecast.predictDividend(etfIdentifier, date.getFullYear());
    }
}

function calculateCosts(amount, costConfiguration) {
    const costs = amount * costConfiguration.percentageCosts + costConfiguration.fixedCosts;
    return [amount - costs, costs];
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

function calculateForecastInterval(age, lifeExpectation, savingPhaseLength, fadeOutYears = 10) {
    const yearsLeft = lifeExpectation - age;
    const now = new Date();
    const beginningDate = new Date(now.getFullYear(), now.getMonth());
    // start next month.
    beginningDate.setMonth(beginningDate.getMonth() + 1);
    const endSavingPhaseDate = new Date(beginningDate);
    endSavingPhaseDate.setFullYear(beginningDate.getFullYear() + savingPhaseLength);
    const endDate = new Date(beginningDate);
    endDate.setFullYear(beginningDate.getFullYear() + yearsLeft + fadeOutYears);
    return [beginningDate, endSavingPhaseDate, endDate];
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
    return [summedTaxes, leftoverTaxFreeAmount];
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
        totalPayout: { ...prevInvestmentStep.totalPayout },
        newPayout: {},
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

        const dividendPayoutMoney =
            newInvestmentStep.totalShares[etfIdentifier] * calculateDividend(etfIdentifier, date);
        const newSharesByDividend = dividendPayoutMoney / etfSharePrize;
        newInvestmentStep.newShares[etfIdentifier] = newSharesByDividend;
        newInvestmentStep.totalShares[etfIdentifier] += newSharesByDividend;
        newInvestmentStep.dividendNewShares[etfIdentifier] = newSharesByDividend;
        newInvestmentStep.dividendTotalShares[etfIdentifier] += newSharesByDividend;

        newInvestmentStep.newPayout[etfIdentifier] = 0;
    }
    newInvestmentStep.totalCosts += costs;
    const [newTaxes, newLeftoverTaxFreeAmount] = calculateTaxes(
        investmentSteps,
        date,
        configOptions,
        Object.keys(etfToRatio)
    );
    newInvestmentStep.totalTaxes += newTaxes;

    investmentSteps.push(newInvestmentStep);
    return newLeftoverTaxFreeAmount;
}

function addPayoutMonth(
    investmentSteps,
    sellingAmount,
    etfToRatio,
    date,
    configOptions,
    leftoverAlreadyPaidTaxes,
    leftoverTaxFreeAmount,
    payoutStats
) {
    if (isStartOfTheYear(date)) {
        leftoverTaxFreeAmount = configOptions;
    }
    // TODO dividend
    const forecast = ForecastModelSingleton.getInstance();
    let costs = 0;
    let taxes = 0;
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
        totalPayout: { ...prevInvestmentStep.totalPayout },
        newPayout: {},
    };
    for (const etfIdentifier in etfToRatio) {
        // handle payout.
        newInvestmentStep.newPayout[etfIdentifier] = 0;
        const amountToSell = sellingAmount * etfToRatio[etfIdentifier];
        const amountAlreadySold = 0;
        const etfSharePrize = forecast.predictCourse(etfIdentifier, date);
        let payoutInvestmentStepIdxForFIFO = payoutStats[etfIdentifier].investmentStepsIdx;
        let currentSharesLeft = investmentSteps[payoutInvestmentStepIdxForFIFO].newShares[etfIdentifier] -
        payoutStats[etfIdentifier].alreadySoldShares;
        for (
            ;
            payoutInvestmentStepIdxForFIFO < investmentSteps.length && amountAlreadySold < amountToSell;
            payoutInvestmentStepIdxForFIFO++
        ) {
            const leftoverAmountToSell = amountToSell - amountAlreadySold;
            const currentInvestmentStepForFIFO = investmentSteps[payoutInvestmentStepIdxForFIFO];

            const currentValueOfShares =
                payoutInvestmentStepIdxForFIFO === payoutStats[etfIdentifiers].investmentStepsIdx
                    ? (currentInvestmentStepForFIFO.newShares[etfIdentifier] -
                          payoutStats[etfIdentifier].alreadySoldShares) *
                      currentInvestmentStepForFIFO.sharePrizes[etfIdentifier]
                    : currentInvestmentStepForFIFO.newShares[etfIdentifier] * etfSharePrize;
            const amountToSellWithCosts = Math.min(currentValueOfShares, leftoverAmountToSell);
            const amountOfSharesToSell = amountToSellWithCosts / etfSharePrize;
            currentSharesLeft = currentInvestmentStepForFIFO.newShares[etfIdentifier] - amountOfSharesToSell;
            currentSharesLeft -= payoutInvestmentStepIdxForFIFO === payoutStats[etfIdentifiers].investmentStepsIdx ? payoutStats[etfIdentifier].alreadySoldShares : 0;

            const buyValuesOfAmountOfSharesToSell =
                amountOfSharesToSell * currentValueOfShares.sharePrizes[etfSharePrize];
            const [amountToSellWithoutCosts, newCosts] = calculateCosts(
                amountToSellWithCosts,
                configOptions.costConfig
            );
            costs += newCosts;
            let amountToPayTaxes = Math.max(0, amountToSellWithoutCosts - buyValuesOfAmountOfSharesToSell);

            [amountToPayTaxes, leftoverTaxFreeAmount] = subtractTaxFreeGain(amountToPayTaxes, leftoverTaxFreeAmount);
            let taxesToPay = amountToPayTaxes * partialExemption * corporateTaxRatio;
            [taxesToPay, leftoverAlreadyPaidTaxes] = subtractTaxFreeGain(taxesToPay, leftoverAlreadyPaidTaxes);
            taxes += taxesToPay;
            const payoutAmount = amountToSellWithoutCosts - taxesToPay;

            newInvestmentStep.newPayout[etfIdentifier] += payoutAmount;
            newInvestmentStep.totalPayout[etfIdentifier] += payoutAmount;

            newInvestmentStep.totalShares[etfIdentifier] -= amountOfSharesToSell;
        }
        // handle update payoutStats.
        payoutStats[etfIdentifier].investmentStepsIdx = payoutInvestmentStepIdxForFIFO;
        payoutStats[etfIdentifier].investmentStepsIdx += currentSharesLeft === 0 ? 1 : 0;
        payoutStats[etfIdentifier].alreadySoldShares = investmentSteps[payoutInvestmentStepIdxForFIFO].newShares[etfIdentifier] - currentSharesLeft;

        // handle dividend.
        const dividendPayoutMoney =
            newInvestmentStep.totalShares[etfIdentifier] * calculateDividend(etfIdentifier, date);
        const newSharesByDividend = dividendPayoutMoney / etfSharePrize;
        newInvestmentStep.newShares[etfIdentifier] = newSharesByDividend;
        newInvestmentStep.totalShares[etfIdentifier] += newSharesByDividend;
    }

    newInvestmentStep.totalCosts += costs;
    newInvestmentStep.totalTaxes += taxes;
    investmentSteps.push(newInvestmentStep);
    return [leftoverAlreadyPaidTaxes, leftoverTaxFreeAmount];
}

function generateEmptyInvestmentStep(etfToRatio, date) {
    const forecast = ForecastModelSingleton.getInstance();
    const emptyInvestmentStep = { date: date, totalCosts: 0, totalTaxe: 0 };
    for (const etfIdentifier in etfToRatio) {
        emptyInvestmentStep.newShares[etfIdentifier] = 0;
        emptyInvestmentStep.totalShares[etfIdentifier] = 0;
        emptyInvestmentStep.dividendNewShares[etfIdentifier] = 0;
        emptyInvestmentStep.dividendTotalShares[etfIdentifier] = 0;
        emptyInvestmentStep.totalInvestedMoney[etfIdentifier] = 0;
        emptyInvestmentStep.totalPayout[etfIdentifier] = 0;
        emptyInvestmentStep.newPayout[etfIdentifier] = 0;
        emptyInvestmentStep.sharePrizes[etfIdentifier] = forecast.predictCourse(etfIdentifier, date);
    }
    return emptyInvestmentStep;
}

export class InvestmentModel {
    constructor(
        startCapital,
        monthlyInvestment,
        monthlyPayout,
        savingPhaseLength,
        etfIdentifierToRatio,
        configOptions,
        age,
        expectationOfLife,
    ) {
        this.startCapital = startCapital;
        this.monthlyInvestment = monthlyInvestment;
        this.monthlyPayout = monthlyPayout;
        this.savingPhaseLength = savingPhaseLength;
        this.etfIdentifierToRatio = etfIdentifierToRatio;
        this.configOptions = configOptions;
        this.expectationOfLife = expectationOfLife;
        this.age = age;
        this._calculateTimestampsForModel();
        this._calculateModel();
    }

    _calculateTimestampsForVisualization() {
        const [startDate, endSavingPhaseDate, endDate] = calculateForecastInterval(
            this.age,
            this.expectationOfLife,
            this.savingPhaseLength
        );
        const savingDates = [];
        for (
            let currentDate = startDate;
            currentDate < endSavingPhaseDate;
            currentDate = getNextMonthDate(currentDate)
        ) {
            savingDates.push(currentForecast);
        }
        this.savingDates = savingDates;
        const payoutDates = [];
        for (let currentDate = endSavingPhaseDate; currentDate < endDate; currentDate = getNextMonthDate(currentDate)) {
            payoutDates.push(currentForecast);
        }
        this.payoutDates = payoutDates;
    }

    _calculateModel() {
        const investmentSteps = [generateEmptyInvestmentStep(this.etfToRatio, date)];
        let leftoverTaxFreeAmount = this.configOptions.taxFreeAmount;
        for (const savingDate in this.savingDates) {
            leftoverTaxFreeAmount = addAccumulationMonth(
                investmentSteps,
                this.monthlyInvestment,
                savingDate,
                this.etfToRatio,
                this.configOptions
            );
        }
        let leftoverAlreadyPaidTaxes = investmentSteps[investmentSteps.length - 1].totalTaxes;
        const payoutStats = {};
        for (const etfIdentifier in this.etfToRatio) {
            payoutStats[etfIdentifier] = { investmentStepsIdx: 0 };
        }
        for (const payoutDate in this.payoutDates) {
            [leftoverAlreadyPaidTaxes, leftoverTaxFreeAmount] = addPayoutMonth(
                investmentSteps,
                this.monthlyPayout,
                this.etfToRatio,
                payoutDate,
                this.configOptions,
                leftoverAlreadyPaidTaxes,
                leftoverTaxFreeAmount,
                payoutStats
            );
        }
    }
}
