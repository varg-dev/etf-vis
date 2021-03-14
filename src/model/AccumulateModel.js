import { isStartOfTheYear, numberOfMonthsOfAYear } from '../helpers/utils';
import {
    calculatePrizeGain,
    calculateNewDividendPayout,
    calculateTaxesOnThesaurierer,
    calculateCosts,
    calculateInflation,
} from './PartiallyCalculations';

export class AccumulateModel {
    constructor(
        initialDate,
        date,
        nextDate,
        newInvestmentAmount,
        etfIdentifierToRatio,
        costConfiguration,
        lastYearModelValues,
        taxFreeAmountForAYear
    ) {
        this.initialDate = initialDate; // required for inflation later on.
        this.lastYearModelValues = lastYearModelValues;
        this.startDate = date;
        this.newInvestmentAmount = newInvestmentAmount;
        this.endDate = nextDate;
        this.etfIdentifierToRatio = etfIdentifierToRatio;
        this.costConfiguration = costConfiguration;
        this.costs = lastYearModelValues.costs;
        this.taxes = lastYearModelValues.taxes;
        this.etfs = {};
        this.yearBeginningCapital = isStartOfTheYear(this.startDate)
            ? lastYearModelValues.totalAmount
            : lastYearModelValues.yearBeginningCapital;
        this.totalAmount = 0;
        this.investedMoney = lastYearModelValues.investedMoney + newInvestmentAmount;
        this.leftoverTaxFreeAmount = isStartOfTheYear(this.startDate)
            ? taxFreeAmountForAYear
            : lastYearModelValues.leftoverTaxFreeAmount;
        this.investmentSteps = {};
        this.alreadyPaidTaxesForAmount = 0;
        this.calculate();
    }

    static getInitialModelValues(startCapital, etfIdentifierToRatio, costConfiguration, taxFreeAmount, initialDate) {
        const [subtractedStartCapital, costs] = calculateCosts(startCapital, costConfiguration);
        const values = {
            costs: costs,
            taxes: 0,
            inflation: 0,
            investedMoney: startCapital,
            etfs: {},
            yearBeginningCapital: subtractedStartCapital,
            totalAmount: subtractedStartCapital,
            leftoverTaxFreeAmount: taxFreeAmount,
            startDate: initialDate,
            endDate: initialDate,
            investmentSteps: { [initialDate]: {} },
        };
        for (const [etfIdentifier, etfRatio] of Object.entries(etfIdentifierToRatio)) {
            values.etfs[etfIdentifier] = {
                capital: etfRatio * subtractedStartCapital,
                dividend: 0,
            };
            values.investmentSteps[initialDate][etfIdentifier] = etfRatio * subtractedStartCapital;
        }
        return values;
    }

    calculate() {
        let newInvestmentAmountNetto = 0;
        for (const etfIdentifier in this.lastYearModelValues.etfs) {
            const etfInvestmentAmount = this.etfIdentifierToRatio[etfIdentifier] * this.newInvestmentAmount;
            this.etfs[etfIdentifier] = {};
            newInvestmentAmountNetto += this.calculateNextEtfValueAndCosts(etfIdentifier, etfInvestmentAmount);
        }
        const totalGain = this.totalAmount - this.yearBeginningCapital - newInvestmentAmountNetto;
        const [taxes, leftoverTaxFreeAmount, alreadyPaidTaxesForAmount] = calculateTaxesOnThesaurierer(
            totalGain,
            this.leftoverTaxFreeAmount,
            this.yearBeginningCapital,
            this.startDate,
            this.endDate
        );
        this.alreadyPaidTaxesForAmount = alreadyPaidTaxesForAmount;
        this.taxes += taxes;
        this.leftoverTaxFreeAmount = leftoverTaxFreeAmount;
        this.inflation = calculateInflation(this.totalAmount, this.initialDate, this.endDate);
    }

    calculateNextEtfValueAndCosts(etfIdentifier, investmentAmount) {
        const prevETFData = this.lastYearModelValues.etfs[etfIdentifier];
        const etfPrizeGain = calculatePrizeGain(prevETFData.capital, this.startDate, this.endDate, etfIdentifier);
        const etfDividendGain = calculatePrizeGain(prevETFData.dividend, this.startDate, this.endDate, etfIdentifier);
        const [investment, investmentGain, investmentCosts] = this._calculateNewInvestmentOfETFAndCosts(
            investmentAmount,
            etfIdentifier,
        );
        const dividendPayout = calculateNewDividendPayout(etfIdentifier, this.startDate, this.endDate);
        const totalGainBrutto = etfPrizeGain + etfDividendGain + investmentGain + dividendPayout;
        const etfValueBrutto = prevETFData.capital + totalGainBrutto + investment;

        this.etfs[etfIdentifier].capital = etfValueBrutto;
        this.etfs[etfIdentifier].dividend = prevETFData.dividend + dividendPayout + etfDividendGain;

        this.totalAmount += etfValueBrutto;
        this.costs += investmentCosts;
        return investment;
    }

    _calculateNewInvestmentOfETFAndCosts(etfInvestmentAmount, etfIdentifier) {
        const numberOfInvestmentSteps =
            (this.endDate.getFullYear() - this.startDate.getFullYear()) * numberOfMonthsOfAYear +
            this.endDate.getMonth() -
            this.startDate.getMonth();
        const monthlyInvestmentBrutto = etfInvestmentAmount / numberOfInvestmentSteps;
        const [monthlyInvestmentNetto, monthlyCosts] = calculateCosts(monthlyInvestmentBrutto, this.costConfiguration);
        const costs = monthlyCosts * numberOfInvestmentSteps;
        let invested = monthlyInvestmentNetto * numberOfInvestmentSteps;
        let gain = 0;
        for (let i = numberOfInvestmentSteps; i > 0.0; i--) {
            const currentDate = new Date(this.startDate);
            currentDate.setMonth(currentDate.getMonth() + i);
            gain += calculatePrizeGain(monthlyInvestmentNetto, currentDate, this.endDate, etfIdentifier);
            this._addInvestmentStep(monthlyInvestmentNetto, etfIdentifier, currentDate);
        }
        return [invested, gain, costs];
    }

    _addInvestmentStep(amount, etfIdentifier, date = null) {
        if (date == null) {
            date = this.startDate;
        }
        if (!(date in this.investmentSteps)) {
            this.investmentSteps[date] = {};
        }
        if (etfIdentifier in this.investmentSteps[date]) {
            this.investmentSteps[date][etfIdentifier] += amount;
        } else {
            this.investmentSteps[date][etfIdentifier] = amount;
        }
    }
}

export default AccumulateModel;
