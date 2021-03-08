import numberOfMonthsOfAYear from '../helpers/utils';

const corporateTaxRatio = 0.25;

const growthRate = 0.025;

const inflationRate = 0.01;

function calculateTaxesOnDividend(dividendAmount) {
    return [dividendAmount * (1 - corporateTaxRatio), dividendAmount * corporateTaxRatio];
}

export class AccumulateModel {
    constructor(
        date,
        nextDate,
        newInvestmentAmount,
        etfIdentifierToRatio,
        costFunction,
        dividendFunction,
        lastYearModelValues
    ) {
        this.lastYarModelValues = lastYearModelValues;
        this.date = date;
        this.newInvestmentAmount = newInvestmentAmount;
        this.nextDate = nextDate;
        this.etfIdentifierToRatio = etfIdentifierToRatio;
        this.costFunction = costFunction;
        this.dividendFunction = dividendFunction;
        this.values = {
            costs: lastYearModelValues.costs,
            taxes: lastYearModelValues.taxes,
            inflation: lastYearModelValues.inflation,
            etfs: {},
        };
        this.calculate();
    }

    static getInitialModelValues(startCapital, etfIdentifierToRatio, costFunction) {
        const [subtractedStartCapital, costs] = costFunction(startCapital);
        const values = { costs: costs, taxes: 0, inflation: 0, etfs: {} };
        for (const [etfIdentifier, etfRatio] of Object.entries(etfIdentifierToRatio)) {
            values.etfs[etfIdentifier] = {
                startCapital: etfRatio * subtractedStartCapital,
                dividend: 0,
                monthlyInvestment: 0,
            };
        }
        return values;
    }

    calculate() {
        const dateDiff = new Date(this.nextDate - this.date);
        const compoundInterestTimeFactor =
            dateDiff.getFullYear() - new Date(0).getFullYear() + dateDiff.getMonth() / numberOfMonthsOfAYear;
        for (const etfIdentifier in this.lastYarModelValues.etfs) {
            const etfInvestmentAmount = this.etfIdentifierToRatio[etfIdentifier] * this.newInvestmentAmount;
            this.values.etfs[etfIdentifier] = {};
            this.calculateNextEtfValueAndCosts(etfIdentifier, etfInvestmentAmount, compoundInterestTimeFactor);
        }
    }

    calculateNewInvestmentOfETFAndCosts(etfInvestmentAmount, compoundInterestTimeFactor) {
        const numberOfInvestmentSteps = Math.round(compoundInterestTimeFactor * numberOfMonthsOfAYear);
        const monthlyInvestmentBrutto = etfInvestmentAmount / numberOfInvestmentSteps;
        const [monthlyInvestment, monthlyCosts] = this.costFunction(monthlyInvestmentBrutto);
        const costs = monthlyCosts * numberOfInvestmentSteps;
        let gain = 0;
        for (let i = numberOfInvestmentSteps; i > 0.0; i--) {
            gain += growthRate * (i / numberOfMonthsOfAYear) * monthlyInvestment + monthlyInvestment;
        }
        return [gain, costs];
    }

    accumulateDividendAndTaxes(etfIdentifier) {
        const numberOfYearsPassed = this.nextDate.getFullYear() - this.date.getFullYear();
        let totalTaxes = 0;
        let totalGain = 0;
        for (let i = 0; i < numberOfYearsPassed; i++) {
            const compoundInterestTimeFactor = Math.max(0, numberOfYearsPassed - 1 - i);
            const dividendAmount = this.dividendFunction(etfIdentifier, this.date.getFullYear() + i);
            const [gain, taxes] = calculateTaxesOnDividend(dividendAmount);
            totalGain += gain + gain * compoundInterestTimeFactor * growthRate;
            totalTaxes += taxes;
        }
        return [totalGain, totalTaxes];
    }

    calculateNextEtfValueAndCosts(etfIdentifier, investmentAmount, compoundInterestTimeFactor) {
        const prevETFData = this.lastYarModelValues.etfs[etfIdentifier];
        const newEtfStartCapital =
            growthRate * compoundInterestTimeFactor * prevETFData.startCapital + prevETFData.startCapital;
        const monthlyInvestmentGain = growthRate * compoundInterestTimeFactor * prevETFData.monthlyInvestment;
        const etfDividendGain = growthRate * compoundInterestTimeFactor * prevETFData.dividend;
        const [investmentGain, investmentCosts] = this.calculateNewInvestmentOfETFAndCosts(
            investmentAmount,
            compoundInterestTimeFactor
        );
        const [dividendGain, dividendTaxes] = this.accumulateDividendAndTaxes(etfIdentifier);
        // TODO missing: increase of costs over time.

        // deduce inflation from every value.
        const startGainInflationLoss = inflationRate * newEtfStartCapital;
        this.values.inflation += startGainInflationLoss;
        this.values.etfs[etfIdentifier].startCapital = newEtfStartCapital - startGainInflationLoss;

        const newMonthlyInvestment = prevETFData.monthlyInvestment + monthlyInvestmentGain + investmentGain;
        const monthlyInvestmentInflationLoss = newMonthlyInvestment * inflationRate;
        this.values.inflation += monthlyInvestmentInflationLoss;
        this.values.etfs[etfIdentifier].monthlyInvestment = newMonthlyInvestment - monthlyInvestmentInflationLoss;

        const newDividendGain = prevETFData.dividend + dividendGain + etfDividendGain;
        const dividendInflationLoss = newDividendGain * inflationRate;
        this.values.inflation += dividendInflationLoss;
        this.values.etfs[etfIdentifier].dividend = newDividendGain - dividendInflationLoss;

        this.values.costs += investmentCosts;
        this.values.taxes += dividendTaxes;
    }

    getD3Representation() {
        if (this.d3Representation != null) {
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

            // monthly Investment
            d3RepresentationArray.push({
                height: etf.monthlyInvestment,
                yStart: currentHeight + etf.monthlyInvestment,
                yEnd: currentHeight,
                class: `${etfIdentifier}_monthly_investment`,
            });
            currentHeight += etf.monthlyInvestment;
        }
        // extend, representation
        this.d3Representation = [[-totalAmountOfNegative, currentHeight], d3RepresentationArray];
        return this.d3Representation;
    }
}

export default AccumulateModel;
