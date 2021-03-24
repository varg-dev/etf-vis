import ForecastModelSingleton from './ForecastModel';
import { numberOfMonthsOfAYear, isLastMonthOfAYear, clamp, isFirstMonthOfAYear } from '../helpers/utils';

const basicRateOfInterest = 0.007;
const partialExemption = 0.7;
const corporateTaxRatio = 0.26375;

function getNextMonthDate(date) {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + 1);
    return newDate;
}

function calculateDividend(etfIdentifier, date) {
    if (!isLastMonthOfAYear(date)) {
        return 0;
    } else {
        return ForecastModelSingleton.getInstance().predictDividend(etfIdentifier, date.getFullYear());
    }
}

function calculateCosts(amount, costConfiguration) {
    let costs = amount * costConfiguration.percentageCosts + costConfiguration.fixedCosts;
    const amountWithoutCosts = Math.max(amount - costs, 0);
    costs = amount - amountWithoutCosts;
    return [amountWithoutCosts, costs];
}

function subtractTaxFreeGain(taxAmount, taxFreeAmount) {
    const leftoverTaxes = Math.max(0, taxAmount - taxFreeAmount);
    const leftoverTaxFreeAmount = Math.max(0, taxFreeAmount - taxAmount);
    return [leftoverTaxes, leftoverTaxFreeAmount];
}

export function getTotalShareValue(etfIdentifier, investmentStep) {
    return investmentStep.totalShares[etfIdentifier] * investmentStep.sharePrizes[etfIdentifier];
}

function getNewShareValue(etfIdentifier, investmentStep) {
    return investmentStep.newShares[etfIdentifier] * investmentStep.sharePrizes[etfIdentifier];
}

function calculateForecastInterval(age, lifeExpectation, savingPhaseLength, fadeOutYears = 10) {
    const yearsLeft = lifeExpectation - age;
    const now = new Date();
    const beginningDate = new Date(now.getFullYear(), now.getMonth() + 1);
    // start next month.
    const endSavingPhaseDate = new Date(beginningDate);
    endSavingPhaseDate.setFullYear(beginningDate.getFullYear() + savingPhaseLength);
    const endDate = new Date(beginningDate);
    endDate.setFullYear(beginningDate.getFullYear() + yearsLeft + fadeOutYears);
    return [beginningDate, endSavingPhaseDate, endDate];
}

function calculateTaxes(investmentSteps, date, leftoverTaxFreeAmount, etfToRatio) {
    if (!isFirstMonthOfAYear(date) || investmentSteps.length < 2) {
        return [0, leftoverTaxFreeAmount];
    }
    let summedTaxes = 0;
    const decemberInvestmentStep = investmentSteps[investmentSteps.length - 1];
    // Use the second investment step if there are not enough meaning the investing started this year after january.
    // The second is the true first investment step the first is a dummy.
    const firstInvestmentStepOfThisYear =
        investmentSteps.length - numberOfMonthsOfAYear > 1
            ? investmentSteps[investmentSteps.length - numberOfMonthsOfAYear]
            : investmentSteps[1];
    for (const etfIdentifier in etfToRatio) {
        let accumulatedBasicProfit = 0;
        // Sum up all new investments from february to december.
        for (let i = 1; i < numberOfMonthsOfAYear && investmentSteps.length - i > 0; i++) {
            const currentInvestmentStep = investmentSteps[investmentSteps.length - i];
            accumulatedBasicProfit +=
                (getNewShareValue(etfIdentifier, currentInvestmentStep) * i) / numberOfMonthsOfAYear;
        }
        // Sum up total Investment of the first date of this year.
        accumulatedBasicProfit +=
            (getTotalShareValue(etfIdentifier, firstInvestmentStepOfThisYear) *
                (numberOfMonthsOfAYear - firstInvestmentStepOfThisYear.date.getMonth())) /
            numberOfMonthsOfAYear;
        accumulatedBasicProfit *= 0.7 * basicRateOfInterest;
        const currentShareValues = getTotalShareValue(etfIdentifier, decemberInvestmentStep);
        // Calculate profit of last year.
        const profitOverAllTime = currentShareValues - decemberInvestmentStep.totalInvestedMoney[etfIdentifier];
        let profitOfPreviousYears = 0;
        if (investmentSteps.length > numberOfMonthsOfAYear) {
            profitOfPreviousYears = Math.max(
                0,
                getTotalShareValue(etfIdentifier, investmentSteps[investmentSteps.length - 1 - numberOfMonthsOfAYear]) -
                    investmentSteps[investmentSteps.length - 1 - numberOfMonthsOfAYear].totalInvestedMoney[
                        etfIdentifier
                    ]
            );
        }

        const profitOfThisYear = profitOverAllTime - profitOfPreviousYears;
        let amountToApplyTaxes = clamp(profitOfThisYear, 0, accumulatedBasicProfit);
        [amountToApplyTaxes, leftoverTaxFreeAmount] = subtractTaxFreeGain(amountToApplyTaxes, leftoverTaxFreeAmount);
        summedTaxes += amountToApplyTaxes * partialExemption * corporateTaxRatio;
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
        totalShares: { ...prevInvestmentStep.totalShares },
        dividendNewShares: {},
        dividendTotalShares: { ...prevInvestmentStep.dividendTotalShares },
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
        newInvestmentStep.totalInvestedMoney[etfIdentifier] += investmentOfEtfWithoutCosts;

        const etfSharePrize = forecast.predictCourse(etfIdentifier, date);
        const newShares = investmentOfEtfWithoutCosts / etfSharePrize;
        newInvestmentStep.sharePrizes[etfIdentifier] = etfSharePrize;
        newInvestmentStep.newShares[etfIdentifier] = newShares;

        const dividendPayoutMoneyPerShare = calculateDividend(etfIdentifier, date);
        const dividendPayoutMoney = newInvestmentStep.totalShares[etfIdentifier] * dividendPayoutMoneyPerShare;
        const newSharesByDividend = dividendPayoutMoney / etfSharePrize;
        newInvestmentStep.newShares[etfIdentifier] += newSharesByDividend;
        newInvestmentStep.dividendNewShares[etfIdentifier] = newSharesByDividend;
        newInvestmentStep.dividendTotalShares[etfIdentifier] += newSharesByDividend;

        newInvestmentStep.totalShares[etfIdentifier] += newInvestmentStep.newShares[etfIdentifier];
        newInvestmentStep.newPayout[etfIdentifier] = 0;
    }
    newInvestmentStep.totalCosts += costs;
    const [newTaxes, newLeftoverTaxFreeAmount] = calculateTaxes(
        investmentSteps,
        date,
        configOptions.taxFreeAmount,
        etfToRatio
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
    if (isFirstMonthOfAYear(date)) {
        leftoverTaxFreeAmount = configOptions.taxFreeAmount;
    }
    const forecast = ForecastModelSingleton.getInstance();
    let costs = 0;
    let taxes = 0;
    const prevInvestmentStep = investmentSteps[investmentSteps.length - 1];
    const newInvestmentStep = {
        date: date,
        newShares: {},
        totalShares: { ...prevInvestmentStep.totalShares },
        dividendNewShares: {},
        dividendTotalShares: { ...prevInvestmentStep.dividendTotalShares },
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
        let amountAlreadySold = 0;
        const costsToPay = calculateCosts(amountToSell, configOptions.costConfig)[1];
        let alreadyPaidCosts = 0;
        const etfSharePrize = forecast.predictCourse(etfIdentifier, date);
        newInvestmentStep.sharePrizes[etfIdentifier] = etfSharePrize;
        let payoutInvestmentStepIdxForFIFO = payoutStats[etfIdentifier].investmentStepsIdx;
        let currentSharesLeft =
            investmentSteps[payoutInvestmentStepIdxForFIFO].newShares[etfIdentifier] -
            payoutStats[etfIdentifier].alreadySoldShares;
        payoutLoop: for (; payoutInvestmentStepIdxForFIFO < investmentSteps.length; payoutInvestmentStepIdxForFIFO++) {
            const leftoverAmountToSell = amountToSell - amountAlreadySold;
            const currentInvestmentStepForFIFO = investmentSteps[payoutInvestmentStepIdxForFIFO];

            const currentValueOfShares =
                etfSharePrize *
                (payoutInvestmentStepIdxForFIFO === payoutStats[etfIdentifier].investmentStepsIdx
                    ? currentInvestmentStepForFIFO.newShares[etfIdentifier] -
                      payoutStats[etfIdentifier].alreadySoldShares
                    : currentInvestmentStepForFIFO.newShares[etfIdentifier]);
            const amountToSellWithCosts = Math.min(currentValueOfShares, leftoverAmountToSell);
            const amountOfSharesToSell = amountToSellWithCosts / etfSharePrize;
            currentSharesLeft = currentInvestmentStepForFIFO.newShares[etfIdentifier] - amountOfSharesToSell;
            currentSharesLeft -=
                payoutInvestmentStepIdxForFIFO === payoutStats[etfIdentifier].investmentStepsIdx
                    ? payoutStats[etfIdentifier].alreadySoldShares
                    : 0;

            const amountToSellWithoutCosts = Math.max(0, amountToSellWithCosts - (costsToPay - alreadyPaidCosts));
            alreadyPaidCosts += Math.max(0, amountToSellWithCosts - amountToSellWithoutCosts);

            const initialValueOfShares = amountOfSharesToSell * currentInvestmentStepForFIFO.sharePrizes[etfIdentifier];
            let amountToPayTaxes = Math.max(0, amountToSellWithoutCosts - initialValueOfShares);

            [amountToPayTaxes, leftoverTaxFreeAmount] = subtractTaxFreeGain(amountToPayTaxes, leftoverTaxFreeAmount);
            let taxesToPay = amountToPayTaxes * partialExemption * corporateTaxRatio;
            [taxesToPay, leftoverAlreadyPaidTaxes] = subtractTaxFreeGain(taxesToPay, leftoverAlreadyPaidTaxes);
            taxes += taxesToPay;
            const payoutAmount = amountToSellWithoutCosts - taxesToPay;

            newInvestmentStep.newPayout[etfIdentifier] += payoutAmount;
            newInvestmentStep.totalPayout[etfIdentifier] += payoutAmount;

            newInvestmentStep.totalShares[etfIdentifier] -= amountOfSharesToSell;
            amountAlreadySold += amountToSellWithCosts;

            // Use break in order to not change the value of payoutInvestmentStepIdxForFIFO.
            if (amountAlreadySold >= amountToSellWithCosts) {
                break payoutLoop;
            }
        }
        costs += alreadyPaidCosts;
        // handle update payoutStats.
        payoutStats[etfIdentifier].investmentStepsIdx = payoutInvestmentStepIdxForFIFO;
        payoutStats[etfIdentifier].investmentStepsIdx += currentSharesLeft === 0 ? 1 : 0;
        payoutStats[etfIdentifier].alreadySoldShares =
            investmentSteps[payoutInvestmentStepIdxForFIFO].newShares[etfIdentifier] - currentSharesLeft;

        // handle dividend.
        const dividendPayoutMoney =
            newInvestmentStep.totalShares[etfIdentifier] * calculateDividend(etfIdentifier, date);
        const newSharesByDividend = dividendPayoutMoney / etfSharePrize;
        newInvestmentStep.newShares[etfIdentifier] = newSharesByDividend;
        newInvestmentStep.totalShares[etfIdentifier] += newSharesByDividend;
        newInvestmentStep.dividendNewShares[etfIdentifier] = newSharesByDividend;
        newInvestmentStep.dividendTotalShares[etfIdentifier] += newSharesByDividend;
    }

    newInvestmentStep.totalCosts += costs;
    newInvestmentStep.totalTaxes += taxes;
    investmentSteps.push(newInvestmentStep);
    return [leftoverAlreadyPaidTaxes, leftoverTaxFreeAmount];
}

function generateEmptyInvestmentStep(etfToRatio, date) {
    const forecast = ForecastModelSingleton.getInstance();
    const emptyInvestmentStep = {
        date: date,
        totalCosts: 0,
        totalTaxes: 0,
        newShares: {},
        totalShares: {},
        dividendNewShares: {},
        dividendTotalShares: {},
        totalInvestedMoney: {},
        totalPayout: {},
        newPayout: {},
        sharePrizes: {},
    };
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
        etfToRatio,
        configOptions,
        age,
        expectationOfLife
    ) {
        this.startCapital = startCapital;
        this.monthlyInvestment = monthlyInvestment;
        this.monthlyPayout = monthlyPayout;
        this.savingPhaseLength = savingPhaseLength;
        this.etfToRatio = etfToRatio;
        this.configOptions = configOptions;
        this.expectationOfLife = expectationOfLife;
        this.age = age;
        this._calculateTimestampsForModel();
        this._calculateModel();
    }

    _calculateTimestampsForModel() {
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
            savingDates.push(currentDate);
        }
        this.savingDates = savingDates;
        const payoutDates = [];
        for (let currentDate = endSavingPhaseDate; currentDate < endDate; currentDate = getNextMonthDate(currentDate)) {
            payoutDates.push(currentDate);
        }
        this.payoutDates = payoutDates;
    }

    _calculateModel() {
        console.log(this);
        let investmentSteps = [generateEmptyInvestmentStep(this.etfToRatio, this.savingDates[0])];
        let leftoverTaxFreeAmount = addAccumulationMonth(
            investmentSteps,
            this.monthlyInvestment + this.startCapital,
            this.savingDates[0],
            this.etfToRatio,
            this.configOptions
        );
        for (const savingDate of this.savingDates.slice(1)) {
            leftoverTaxFreeAmount = addAccumulationMonth(
                investmentSteps,
                this.monthlyInvestment,
                savingDate,
                this.etfToRatio,
                this.configOptions
            );
        }
        // Discard the empty investment step.
        investmentSteps = investmentSteps.slice(1);

        /*let leftoverAlreadyPaidTaxes = investmentSteps[investmentSteps.length - 1].totalTaxes;
        const payoutStats = {};
        for (const etfIdentifier in this.etfToRatio) {
            payoutStats[etfIdentifier] = { investmentStepsIdx: 0, alreadySoldShares: 0 };
        }
        for (const payoutDate of this.payoutDates) {
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
        }*/
        this.investmentSteps = investmentSteps;
    }
}
