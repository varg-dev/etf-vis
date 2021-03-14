import { numberOfMonthsOfAYear, isStartOfTheYear } from '../helpers/utils';
import {
    calculatePrizeGain,
    calculateNewInvestmentOfETFAndCosts,
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
        this.initialDate = initialDate; // required for forecasting later on.
        this.lastYearModelValues = lastYearModelValues;
        this.startDate = date;
        this.newInvestmentAmount = newInvestmentAmount;
        this.endDate = nextDate;
        this.etfIdentifierToRatio = etfIdentifierToRatio;
        this.costConfiguration = costConfiguration;
        // TODO maybe remove values and put values directly on object. and take startDate from lastYearModelValues
        this.costs = lastYearModelValues.costs;
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
            endDate: initialDate,
        };
        for (const [etfIdentifier, etfRatio] of Object.entries(etfIdentifierToRatio)) {
            values.etfs[etfIdentifier] = {
                capital: etfRatio * subtractedStartCapital,
                dividend: 0,
            };
        }
        return values;
    }

    calculate() {
        const dateDiff = new Date(this.endDate - this.startDate);
        const compoundInterestTimeFactor =
            dateDiff.getFullYear() - new Date(0).getFullYear() + dateDiff.getMonth() / numberOfMonthsOfAYear;
        for (const etfIdentifier in this.lastYearModelValues.etfs) {
            const etfInvestmentAmount = this.etfIdentifierToRatio[etfIdentifier] * this.newInvestmentAmount;
            this.etfs[etfIdentifier] = {};
            this.calculateNextEtfValueAndCosts(etfIdentifier, etfInvestmentAmount, compoundInterestTimeFactor);
        }
        const [newInvestmentAmountNetto] = calculateCosts(this.newInvestmentAmount, this.costConfiguration);
        const totalGain = this.totalAmount - this.yearBeginningCapital - newInvestmentAmountNetto;
        const [taxes, leftoverTaxFreeAmount] = calculateTaxesOnThesaurierer(
            totalGain,
            this.leftoverTaxFreeAmount,
            this.yearBeginningCapital,
            this.startDate,
            this.endDate
        );
        this.taxes += taxes;
        this.leftoverTaxFreeAmount = leftoverTaxFreeAmount;
        // TODO calculation is probably wrong.
        this.inflation = calculateInflation(this.totalAmount, this.initialDate, this.endDate);
    }

    calculateNextEtfValueAndCosts(etfIdentifier, investmentAmount, compoundInterestTimeFactor) {
        const prevETFData = this.lastYearModelValues.etfs[etfIdentifier];
        const etfPrizeGain = calculatePrizeGain(prevETFData.capital);
        const etfDividendGain = calculatePrizeGain(prevETFData.dividend);
        const [investment, investmentGain, investmentCosts] = calculateNewInvestmentOfETFAndCosts(
            investmentAmount,
            compoundInterestTimeFactor,
            this.costConfiguration
        );
        const dividendPayout = calculateNewDividendPayout(etfIdentifier, this.startDate, this.endDate);
        const totalGainBrutto = etfPrizeGain + etfDividendGain + investmentGain + dividendPayout;
        const etfValueBrutto = prevETFData.capital + totalGainBrutto + investment;

        this.etfs[etfIdentifier].capital = etfValueBrutto;
        this.etfs[etfIdentifier].dividend = prevETFData.dividend + dividendPayout + etfDividendGain;

        this.totalAmount += etfValueBrutto;
        this.costs += investmentCosts;
    }
}

export default AccumulateModel;
