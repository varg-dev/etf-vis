import { ForecastModelSingleton } from './ForecastModel';
import { numberOfMonthsOfAYear, isLastMonthOfAYear, clamp, isFirstMonthOfAYear } from '../helpers/utils';
import cloneDeep from 'lodash.clonedeep';

import { ICostConfiguration, IConfigOptions } from '../components/Visualization';

const basicRateOfInterest = 0.007;
const partialExemption = 0.7;
const corporateTaxRatio = 0.26375;
const inflationRate = 0.01;
const defaultDividendAmount = 0.025;

interface IETFShares {
    [etfIdentifier: string]: number;
}

export type ETFRatio = IETFShares;

type ETFPrizes = IETFShares;

type ETFMoney = IETFShares;

export interface InvestmentStep {
    date: Date;
    newShares: IETFShares;
    totalShares: IETFShares;
    dividendNewShares: IETFShares;
    dividendTotalShares: IETFShares;
    totalCosts: number;
    sharePrizes: ETFPrizes;
    totalInvestedMoney: ETFMoney;
    newInvestedMoney: ETFMoney;
    newInvestment: number;
    totalTaxes: number;
    totalPayout: ETFMoney;
    newPayout: ETFMoney;
    inflation: number;
}

interface IPayoutStats {
    [etfIdentifier: string]: IPayoutStat;
}

interface IPayoutStat {
    investmentStepsIdx: number;
    alreadySoldShares: number;
}

export function getTotalShareValue(etfIdentifier: string, investmentStep: InvestmentStep) {
    return investmentStep.totalShares[etfIdentifier] * investmentStep.sharePrizes[etfIdentifier];
}

export function getTotalDividenShareValue(etfIdentifier: string, investmentStep: InvestmentStep) {
    return investmentStep.dividendTotalShares[etfIdentifier] * investmentStep.sharePrizes[etfIdentifier];
}


function getNextMonthDate(date: Date) {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + 1);
    return newDate;
}

function calculateDividend(etfIdentifier: string, date: Date) {
    if (!isLastMonthOfAYear(date)) {
        return 0;
    } else {
        const dividendAmount = ForecastModelSingleton.getInstance().predictDividend(etfIdentifier, date.getFullYear());
        const sharePrize = ForecastModelSingleton.getInstance().predictCourse(etfIdentifier, date);
        return dividendAmount > 0 ? dividendAmount : defaultDividendAmount * sharePrize;
    }
}

function calculateCosts(amount: number, costConfiguration: ICostConfiguration) {
    let costs = amount * costConfiguration.percentageCosts + costConfiguration.fixedCosts;
    const amountWithoutCosts = Math.max(amount - costs, 0);
    costs = amount - amountWithoutCosts;
    return [amountWithoutCosts, costs];
}

function subtractTaxFreeGain(taxAmount: number, taxFreeAmount: number) {
    const leftoverTaxes = Math.max(0, taxAmount - taxFreeAmount);
    const leftoverTaxFreeAmount = Math.max(0, taxFreeAmount - taxAmount);
    return [leftoverTaxes, leftoverTaxFreeAmount];
}

function getNewShareValue(etfIdentifier: string, investmentStep: InvestmentStep) {
    return investmentStep.newShares[etfIdentifier] * investmentStep.sharePrizes[etfIdentifier];
}

function sumOfTotalValues(investmentStep: InvestmentStep) {
    let sum = 0;
    for (const etfIdentifier in investmentStep.totalShares) {
        sum += getTotalShareValue(etfIdentifier, investmentStep);
    }
    return sum;
}

function calculateAndAddInflation(investmentStep: InvestmentStep, initialDate: Date, endDate: Date) {
    // TODO predict inflationRate??? if so how should I predict it?
    const sumTotalValues = sumOfTotalValues(investmentStep);
    const timeFactor =
        endDate.getFullYear() -
        initialDate.getFullYear() +
        (endDate.getMonth() - initialDate.getMonth()) / numberOfMonthsOfAYear;
    investmentStep.inflation = sumTotalValues - sumTotalValues * Math.pow(1 - inflationRate, timeFactor);
}

function calculateForecastInterval(
    age: number,
    lifeExpectation: number,
    savingPhaseLength: number,
    fadeOutYears: number = 10
) {
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

function calculateTaxes(
    investmentSteps: InvestmentStep[],
    date: Date,
    leftoverTaxFreeAmount: number,
    etfToRatio: ETFRatio
) {
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

function addAccumulationMonth(
    investmentSteps: InvestmentStep[],
    investment: number,
    date: Date,
    initialDate: Date,
    etfToRatio: ETFRatio,
    configOptions: IConfigOptions
) {
    const forecast = ForecastModelSingleton.getInstance();
    let costs = 0;
    const prevInvestmentStep = investmentSteps[investmentSteps.length - 1];
    const newInvestmentStep: InvestmentStep = {
        date: date,
        newShares: {},
        totalShares: { ...prevInvestmentStep.totalShares },
        dividendNewShares: {},
        dividendTotalShares: { ...prevInvestmentStep.dividendTotalShares },
        totalCosts: prevInvestmentStep.totalCosts,
        sharePrizes: {},
        totalInvestedMoney: { ...prevInvestmentStep.totalInvestedMoney },
        newInvestedMoney: {},
        newInvestment: 0,
        totalTaxes: prevInvestmentStep.totalTaxes,
        totalPayout: { ...prevInvestmentStep.totalPayout },
        newPayout: {},
        inflation: 0,
    };
    for (const etfIdentifier in etfToRatio) {
        const investmentOfEtfWithCosts = etfToRatio[etfIdentifier] * investment;
        newInvestmentStep.newInvestment += investmentOfEtfWithCosts;
        const [investmentOfEtfWithoutCosts, newCosts] = calculateCosts(
            investmentOfEtfWithCosts,
            configOptions.costConfig
        );
        costs += newCosts;
        newInvestmentStep.newInvestedMoney[etfIdentifier] = investmentOfEtfWithoutCosts;
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
    calculateAndAddInflation(newInvestmentStep, initialDate, date);
    investmentSteps.push(newInvestmentStep);

    return newLeftoverTaxFreeAmount;
}

function addPayoutMonth(
    investmentSteps: InvestmentStep[],
    sellingAmount: number,
    etfToRatio: ETFRatio,
    date: Date,
    initialDate: Date,
    configOptions: IConfigOptions,
    leftoverAlreadyPaidTaxes: number,
    leftoverTaxFreeAmount: number,
    payoutStats: IPayoutStats
) {
    if (isFirstMonthOfAYear(date)) {
        leftoverTaxFreeAmount = configOptions.taxFreeAmount;
    }
    const forecast = ForecastModelSingleton.getInstance();
    let costs = 0;
    let taxes = 0;
    const prevInvestmentStep = investmentSteps[investmentSteps.length - 1];
    const newInvestmentStep: InvestmentStep = {
        date: date,
        newShares: {},
        totalShares: { ...prevInvestmentStep.totalShares },
        dividendNewShares: {},
        dividendTotalShares: { ...prevInvestmentStep.dividendTotalShares },
        totalCosts: prevInvestmentStep.totalCosts,
        sharePrizes: {},
        totalInvestedMoney: { ...prevInvestmentStep.totalInvestedMoney },
        newInvestedMoney: {},
        newInvestment: 0,
        totalTaxes: prevInvestmentStep.totalTaxes,
        totalPayout: { ...prevInvestmentStep.totalPayout },
        newPayout: {},
        inflation: 0,
    };
    for (const etfIdentifier in etfToRatio) {
        const etfSharePrize = forecast.predictCourse(etfIdentifier, date);
        newInvestmentStep.sharePrizes[etfIdentifier] = etfSharePrize;
        newInvestmentStep.newPayout[etfIdentifier] = 0;
        newInvestmentStep.newInvestedMoney[etfIdentifier] = 0;
        // Skip payout if there are no shares left to sell.
        if (payoutStats[etfIdentifier].investmentStepsIdx < investmentSteps.length) {
            // Handle payout.
            const amountToSell = sellingAmount * etfToRatio[etfIdentifier];
            let amountAlreadySold = 0;
            const costsToPay = calculateCosts(amountToSell, configOptions.costConfig)[1];
            let alreadyPaidCosts = 0;
            let payoutInvestmentStepIdxForFIFO = payoutStats[etfIdentifier].investmentStepsIdx;
            let currentSharesLeft =
                investmentSteps[payoutInvestmentStepIdxForFIFO].newShares[etfIdentifier] -
                payoutStats[etfIdentifier].alreadySoldShares;
            for (; payoutInvestmentStepIdxForFIFO < investmentSteps.length; payoutInvestmentStepIdxForFIFO++) {
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

                const initialValueOfShares =
                    amountOfSharesToSell * currentInvestmentStepForFIFO.sharePrizes[etfIdentifier];
                let amountToPayTaxes = Math.max(0, amountToSellWithoutCosts - initialValueOfShares);

                [amountToPayTaxes, leftoverTaxFreeAmount] = subtractTaxFreeGain(
                    amountToPayTaxes,
                    leftoverTaxFreeAmount
                );
                let taxesToPay = amountToPayTaxes * partialExemption * corporateTaxRatio;
                [taxesToPay, leftoverAlreadyPaidTaxes] = subtractTaxFreeGain(taxesToPay, leftoverAlreadyPaidTaxes);
                taxes += taxesToPay;
                const payoutAmount = amountToSellWithoutCosts - taxesToPay;

                newInvestmentStep.newPayout[etfIdentifier] += payoutAmount;
                newInvestmentStep.totalPayout[etfIdentifier] += payoutAmount;

                newInvestmentStep.totalShares[etfIdentifier] -= amountOfSharesToSell;
                amountAlreadySold += amountToSellWithCosts;

                // Handle the decrease of the dividendShares.
                let amountOfDividendSharesLeft = 0;
                if (payoutInvestmentStepIdxForFIFO === payoutStats[etfIdentifier].investmentStepsIdx) {
                    amountOfDividendSharesLeft = Math.max(
                        0,
                        currentInvestmentStepForFIFO.dividendNewShares[etfIdentifier] -
                            payoutStats[etfIdentifier].alreadySoldShares
                    );
                } else {
                    amountOfDividendSharesLeft = currentInvestmentStepForFIFO.dividendNewShares[etfIdentifier];
                }
                const amountOfDividendSharesSold = Math.min(amountOfDividendSharesLeft, amountOfSharesToSell);
                newInvestmentStep.dividendTotalShares[etfIdentifier] -= amountOfDividendSharesSold;

                // Use break in order to not change the value of payoutInvestmentStepIdxForFIFO.
                if (amountAlreadySold >= amountToSell) {
                    break;
                }
            }
            costs += alreadyPaidCosts;
            // Handle update payoutStats.
            payoutStats[etfIdentifier].investmentStepsIdx = payoutInvestmentStepIdxForFIFO;
            payoutStats[etfIdentifier].investmentStepsIdx += currentSharesLeft === 0 ? 1 : 0;

            payoutStats[etfIdentifier].alreadySoldShares =
                payoutInvestmentStepIdxForFIFO < investmentSteps.length
                    ? investmentSteps[payoutInvestmentStepIdxForFIFO].newShares[etfIdentifier] - currentSharesLeft
                    : 0;
        }

        // Handle dividend.
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
    calculateAndAddInflation(newInvestmentStep, initialDate, date);
    investmentSteps.push(newInvestmentStep);
    return [leftoverAlreadyPaidTaxes, leftoverTaxFreeAmount];
}

function generateEmptyInvestmentStep(etfToRatio: ETFRatio, date: Date) {
    const forecast = ForecastModelSingleton.getInstance();
    const emptyInvestmentStep: InvestmentStep = {
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
        newInvestedMoney: {},
        newInvestment: 0,
        inflation: 0,
    };
    for (const etfIdentifier in etfToRatio) {
        emptyInvestmentStep.newShares[etfIdentifier] = 0;
        emptyInvestmentStep.totalShares[etfIdentifier] = 0;
        emptyInvestmentStep.dividendNewShares[etfIdentifier] = 0;
        emptyInvestmentStep.dividendTotalShares[etfIdentifier] = 0;
        emptyInvestmentStep.totalInvestedMoney[etfIdentifier] = 0;
        emptyInvestmentStep.totalPayout[etfIdentifier] = 0;
        emptyInvestmentStep.newPayout[etfIdentifier] = 0;
        emptyInvestmentStep.newInvestedMoney[etfIdentifier] = 0;
        emptyInvestmentStep.sharePrizes[etfIdentifier] = forecast.predictCourse(etfIdentifier, date);
    }
    return emptyInvestmentStep;
}

export class InvestmentModel {
    private startCapital: number;
    private monthlyInvestment: number;
    private monthlyPayout: number;
    private savingPhaseLength: number;
    private etfToRatio: ETFRatio;
    private configOptions: IConfigOptions;
    private expectationOfLife: number;
    private age: number;

    private savingDates: Date[] = [];
    private payoutDates: Date[] = [];
    private initialDate: Date = new Date();
    private investmentSteps: InvestmentStep[] = [];

    constructor(
        startCapital: number,
        monthlyInvestment: number,
        monthlyPayout: number,
        savingPhaseLength: number,
        etfToRatio: ETFRatio,
        configOptions: IConfigOptions,
        age: number,
        expectationOfLife: number
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

    private _calculateTimestampsForModel() {
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
        this.initialDate = startDate;
    }

    private _calculateModel() {
        let investmentSteps = [generateEmptyInvestmentStep(this.etfToRatio, this.savingDates[0])];
        addAccumulationMonth(
            investmentSteps,
            this.monthlyInvestment + this.startCapital,
            this.savingDates[0],
            this.initialDate,
            this.etfToRatio,
            this.configOptions
        );
        for (const savingDate of this.savingDates.slice(1)) {
            addAccumulationMonth(
                investmentSteps,
                this.monthlyInvestment,
                savingDate,
                this.initialDate,
                this.etfToRatio,
                this.configOptions
            );
        }
        // Discard the empty investment step.
        investmentSteps = investmentSteps.slice(1);

        let leftoverAlreadyPaidTaxes = investmentSteps[investmentSteps.length - 1].totalTaxes;
        let leftoverTaxFreeAmount = this.configOptions.taxFreeAmount;
        const payoutStats: IPayoutStats = {};
        for (const etfIdentifier in this.etfToRatio) {
            payoutStats[etfIdentifier] = { investmentStepsIdx: 0, alreadySoldShares: 0 };
        }
        for (const payoutDate of this.payoutDates) {
            [leftoverAlreadyPaidTaxes, leftoverTaxFreeAmount] = addPayoutMonth(
                investmentSteps,
                this.monthlyPayout,
                this.etfToRatio,
                payoutDate,
                this.initialDate,
                this.configOptions,
                leftoverAlreadyPaidTaxes,
                leftoverTaxFreeAmount,
                payoutStats
            );
        }
        this.investmentSteps = investmentSteps;
    }

    getInvestmentSteps(numberOfEntriesPerYear: number) {
        if (!Number.isInteger(numberOfMonthsOfAYear / numberOfEntriesPerYear)) {
            throw new Error(
                `The numberOfEntriesPerYear need to be dividable by ${numberOfMonthsOfAYear} in order to make sense.`
            );
        }

        if (numberOfEntriesPerYear === numberOfMonthsOfAYear) {
            return this.investmentSteps;
        }
        const selectedInvestmentSteps = [];
        const numberOfMonthsToMerge = numberOfMonthsOfAYear / numberOfEntriesPerYear;
        for (let i = 0; i < this.investmentSteps.length; i += numberOfMonthsToMerge) {
            // Take the start date as representative.
            const adjustedInvestmentStep = cloneDeep(this.investmentSteps[i]);
            for (let offset = 1; offset < numberOfMonthsToMerge; offset++) {
                adjustedInvestmentStep.newInvestment += this.investmentSteps[i + offset].newInvestment;
                for (const etfIdentifier in this.investmentSteps[i + offset].newPayout) {
                    adjustedInvestmentStep.newPayout[etfIdentifier] += this.investmentSteps[i + offset].newPayout[
                        etfIdentifier
                    ];
                }
            }
            selectedInvestmentSteps.push(adjustedInvestmentStep);
        }
        return selectedInvestmentSteps;
    }

    getPayoutPhaseBeginDate() {
        return this.payoutDates[0];
    }
}
