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
        this.values = {
            costs: lastYearModelValues.costs,
            taxes: lastYearModelValues.taxes,
            etfs: {},
            yearBeginningCapital: isStartOfTheYear(this.startDate)
                ? lastYearModelValues.totalAmount
                : lastYearModelValues.yearBeginningCapital,
            totalAmount: 0,
            investedMoney: lastYearModelValues.investedMoney + newInvestmentAmount,
            leftoverTaxFreeAmount: isStartOfTheYear(this.startDate)
                ? taxFreeAmountForAYear
                : lastYearModelValues.leftoverTaxFreeAmount,
        };
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
        };
        for (const [etfIdentifier, etfRatio] of Object.entries(etfIdentifierToRatio)) {
            values.etfs[etfIdentifier] = {
                capital: etfRatio * subtractedStartCapital,
                dividend: 0,
            };
        }
        return { values: values, endDate: initialDate };
    }

    calculate() {
        const dateDiff = new Date(this.endDate - this.startDate);
        const compoundInterestTimeFactor =
            dateDiff.getFullYear() - new Date(0).getFullYear() + dateDiff.getMonth() / numberOfMonthsOfAYear;
        for (const etfIdentifier in this.lastYearModelValues.etfs) {
            const etfInvestmentAmount = this.etfIdentifierToRatio[etfIdentifier] * this.newInvestmentAmount;
            this.values.etfs[etfIdentifier] = {};
            this.calculateNextEtfValueAndCosts(etfIdentifier, etfInvestmentAmount, compoundInterestTimeFactor);
        }
        const [newInvestmentAmountNetto, ] = calculateCosts(this.newInvestmentAmount, this.costConfiguration);
        const totalGain = this.values.totalAmount - this.values.yearBeginningCapital - newInvestmentAmountNetto;
        const [taxes, leftoverTaxFreeAmount] = calculateTaxesOnThesaurierer(
            totalGain,
            this.values.leftoverTaxFreeAmount,
            this.values.yearBeginningCapital,
            this.startDate,
            this.endDate
        );
        this.values.taxes += taxes;
        this.values.leftoverTaxFreeAmount = leftoverTaxFreeAmount;
        // TODO calculation is probably wrong.
        this.values.inflation = calculateInflation(this.values.totalAmount, this.initialDate, this.endDate);
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

        this.values.etfs[etfIdentifier].capital = etfValueBrutto;
        this.values.etfs[etfIdentifier].dividend = prevETFData.dividend + dividendPayout + etfDividendGain;

        this.values.totalAmount += etfValueBrutto;
        this.values.costs += investmentCosts;
    }

    getD3Representation() {
        return null;
        /*if (this.d3Representation != null) {
            return this.d3Representation;
        }
        const totalAmountOfNegative = this.values.taxes + this.values.costs + this.values.inflation;
        const d3RepresentationArray = [
            // y extend = height, y start = upper right corner
            { height: this.values.inflation, yStart: 0, yEnd: 0 - this.values.inflation, class: 'inflation' },
            {
                height: this.values.taxes,
                yStart: -this.values.inflation,
                yEnd: -this.values.inflation - this.values.taxes,
                class: 'taxes',
            },
            {
                height: this.values.costs,
                yStart: -this.values.inflation - this.values.taxes,
                yEnd: -this.values.taxes - this.values.costs - this.values.inflation,
                class: 'costs',
            },
        ];
        let currentHeight = 0;
        for (const etfIdentifier in this.values.etfs) {
            const etf = this.values.etfs[etfIdentifier];
            // start capital
            d3RepresentationArray.push({
                height: etf.startCapital,
                yStart: currentHeight + etf.startCapital,
                yEnd: currentHeight,
                class: `${etfIdentifier}_start_capital`,
            });
            currentHeight += etf.startCapital;

            // dividend
            d3RepresentationArray.push({
                height: etf.dividend,
                yStart: currentHeight + etf.dividend,
                yEnd: currentHeight,
                class: `${etfIdentifier}_dividend`,
            });
            currentHeight += etf.dividend;
        }
        // extent, representation
        this.d3Representation = {
            extent: [-totalAmountOfNegative, currentHeight],
            bars: d3RepresentationArray,
            investedMoney: { money: this.values.investedMoney, date: this.endDate },
        };
        return this.d3Representation;*/
    }
}

export default AccumulateModel;
