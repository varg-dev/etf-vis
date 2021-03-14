import * as d3 from 'd3';
import { interval } from 'd3';
import { numberOfMonthsOfAYear } from '../helpers/utils';
import AccumulateModel from './AccumulateModel';

function calculateForecastInterval(age, lifeExpectation = 80, fadeOutYears = 10) {
    const yearsLeft = lifeExpectation - age;
    const currentYearBeginning = new Date(0);
    currentYearBeginning.setFullYear(new Date().getFullYear());
    const lifeExpectationDate = new Date(0);
    lifeExpectationDate.setFullYear(new Date().getFullYear() + yearsLeft + fadeOutYears);
    return [currentYearBeginning, lifeExpectationDate];
}

// Calculate next date in a more complex way to avoid Date inconsistencies such as a leap year.
function getNextDate(forecastDate, intervalLengthInMonths) {
    const sumOfMonths = forecastDate.getMonth() + intervalLengthInMonths;
    const newMonth = sumOfMonths % numberOfMonthsOfAYear;
    const newYear = forecastDate.getFullYear() + Math.floor(sumOfMonths / numberOfMonthsOfAYear);
    return new Date(newYear, newMonth);
}

export class VisualizationModel {
    constructor(
        startCapital,
        monthlyInvestment,
        savingPhaseLength,
        etfIdentifierToRatio,
        costConfiguration,
        age,
        taxFreeAmount,
        intervalLengthInMonths = numberOfMonthsOfAYear
    ) {
        if (!Number.isInteger(intervalLengthInMonths / numberOfMonthsOfAYear)) {
            throw `currently only month lengths that are a factor of ${numberOfMonthsOfAYear} are allowed.`;
        }
        this.taxFreeAmount = taxFreeAmount;
        this.startCapital = startCapital;
        this.investmentPerPeriod = monthlyInvestment * intervalLengthInMonths;
        this.savingPhaseLength = savingPhaseLength;
        this.etfIdentifierToRatio = etfIdentifierToRatio;
        this.costConfiguration = costConfiguration;
        this.age = age;
        this.intervalLengthInMonths = intervalLengthInMonths;
        this._calculateTimestampsForVisualization();
        this._calculateAllYearModels();
    }
    _calculateTimestampsForVisualization() {
        const [forecastBeginning, forecastEnd] = calculateForecastInterval(this.age);
        const dates = [];
        let currentForecast = forecastBeginning;
        while (currentForecast <= forecastEnd) {
            dates.push(currentForecast);
            currentForecast = getNextDate(currentForecast, this.intervalLengthInMonths);
        }
        this.dates = dates;
        this.nextFutureDate = currentForecast;
    }

    _calculateAllYearModels() {
        const yearModels = [AccumulateModel.getInitialModelValues(
            this.startCapital,
            this.etfIdentifierToRatio,
            this.costConfiguration,
            this.taxFreeAmount,
            this.dates[0]
        )];
        for (let i = 0; i < this.dates.length - 1; i++) {
            const previousYearValues = yearModels[yearModels.length - 1];
            yearModels.push(
                new AccumulateModel(
                    this.dates[0],
                    this.dates[i],
                    this.dates[i + 1],
                    this.investmentPerPeriod,
                    this.etfIdentifierToRatio,
                    this.costConfiguration,
                    previousYearValues,
                    this.taxFreeAmount,
                )
            );
        }
        if (this.dates.length > 1) {
            yearModels.push(
                new AccumulateModel(
                    this.dates[0],
                    this.dates[this.dates.length - 1],
                    this.nextFutureDate,
                    this.investmentPerPeriod,
                    this.etfIdentifierToRatio,
                    this.costConfiguration,
                    yearModels[yearModels.length - 1],
                    this.taxFreeAmount
                )
            );
            this.yearModels = yearModels;
        }
    }

    renderVisualization(renderDivRef) {
        const svgID = 'firstSVG';
        const investedMoneyLineID = 'investedMoney';

        const marginW = 150,
            marginH = 40,
            width = 1000,
            height = 400;

        const zeroLineStrokeWidth = 3;

        const svg = d3
            .select(renderDivRef)
            .append('svg')
            .attr('id', svgID)
            .attr('height', '100%')
            .attr('width', '100%')
            .attr('viewBox', `0 0 ${width + 2 * marginW} ${height + 2 * marginH}`)
            .append('g')
            .attr('transform', `translate(${[marginW, marginH]})`);

        // create scales
        const renderData = this.yearModels.map(a => a.getD3Representation());
        const dataExtend = renderData.map(a => a.extent);
        const minVal = d3.min(dataExtend.map(a => a[0]));
        const maxVal = d3.max(dataExtend.map(a => a[1]));

        const yScale = d3.scaleLinear().domain([minVal, maxVal]).range([height, 0]);

        const xScale = d3.scaleTime().domain([this.dates[0], this.nextFutureDate]).range([0, width]);

        const xWidth = (width / this.dates.length) * 0.9;

        for (let i = 0; i < this.yearModels.length; i++) {
            const yearModel = this.yearModels[i];
            const x = yearModel.date;
            const currentYearClass = x.toDateString().split(' ').join('_');
            const data = yearModel.getD3Representation().bars;
            svg.selectAll(`rect.${currentYearClass}`)
                .append('g')
                .attr('class', currentYearClass)
                .data(data)
                .enter()
                .append('rect')
                .attr('x', xScale(x))
                .attr('y', d => yScale(d.yStart))
                .attr('width', xWidth)
                .attr('height', d => yScale(d.yEnd) - yScale(d.yStart))
                .attr('class', d => d.class);
        }
        // Draw axis
        svg.append('g')
            .style('font-size', '20px')
            .call(d3.axisLeft(yScale).tickFormat(d => `${d.toLocaleString()} EUR`));

        svg.append('g')
            .style('font-size', '20px')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));

        svg.append('g')
            .append('line')
            .attr('x1', xScale(this.dates[0]))
            .attr('y1', yScale(0))
            .attr('x2', xScale(this.nextFutureDate))
            .attr('y2', yScale(0))
            .attr('stroke-width', zeroLineStrokeWidth)
            .attr('stroke', 'black');

        // Draw invested Money line.
        const moneyDataArray = renderData.map(e => e.investedMoney);
        moneyDataArray.unshift({ date: this.dates[0], money: this.startCapital });

        svg.append('path')
            .datum(moneyDataArray)
            .attr('fill', 'none')
            .attr('id', investedMoneyLineID)
            .attr('stroke-width', 3)
            .attr(
                'd',
                d3
                    .line()
                    .x(d => xScale(d.date))
                    .y(d => yScale(d.money))
            );
    }

    updateVisualization() {}
}

export default VisualizationModel;
