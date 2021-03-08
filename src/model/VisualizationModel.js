import * as d3 from 'd3';
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
        costFunction,
        age,
        intervalLengthInMonths = 12
    ) {
        this.startCapital = startCapital;
        this.investmentPerPeriod = monthlyInvestment * intervalLengthInMonths;
        this.savingPhaseLength = savingPhaseLength;
        this.etfIdentifierToRatio = etfIdentifierToRatio;
        this.costFunction = costFunction;
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
        const dividendFunction = year => {
            return this.startCapital * 0.05;
        };
        const etfIdentifiersToAmount = {};
        const initialModelValues = AccumulateModel.getInitialModelValues(
            this.startCapital,
            this.etfIdentifierToRatio,
            this.costFunction
        );
        const yearModels = [
            new AccumulateModel(
                this.dates[0],
                this.dates[1],
                this.investmentPerPeriod,
                this.etfIdentifierToRatio,
                this.costFunction,
                dividendFunction,
                initialModelValues
            ),
        ];
        for (let i = 0; i < this.dates.length - 1; i++) {
            const previousYearValues = yearModels[yearModels.length - 1].values;
            yearModels.push(
                new AccumulateModel(
                    this.dates[i],
                    this.dates[i + 1],
                    this.investmentPerPeriod,
                    this.etfIdentifierToRatio,
                    this.costFunction,
                    dividendFunction,
                    previousYearValues
                )
            );
        }
        if (this.dates.length > 1) {
            yearModels.push(
                new AccumulateModel(
                    this.dates[this.dates.length - 1],
                    this.nextFutureDate,
                    this.investmentPerPeriod,
                    this.etfIdentifierToRatio,
                    this.costFunction,
                    dividendFunction,
                    yearModels[yearModels.length - 1].values
                )
            );
            this.yearModels = yearModels;
        }
    }

    renderVisualization(renderDivRef) {
        const svgID = 'firstSVG';

        const marginW = 100,
            marginH = 40,
            width = 1000,
            height = 400;

        const svg = d3
            .select(renderDivRef)
            .append('svg')
            .attr('id', svgID)
            .attr('height', '100%')
            .attr('width', '100%')
            .attr('viewBox', `0 0 ${width + 2 * marginW} ${height + 2 * marginH}`)
            .append('g')
            .attr('transform', `translate(${[marginW, marginH]})`);

        /*const svgBBox = document.querySelector(`svg#${svgID}`).getBoundingClientRect();
        const totalWidth = svgBBox.width;
        const totalHeight = svgBBox.height;


        const marginW = totalWidth * 0.2,
            marginH = totalHeight * 0.1;
        const width = totalWidth - 2 * marginW,
            height = totalHeight - 2 * marginH;

            
            const svg = svgElement.attr('viewBox', `0 0 ${width + 2 * marginW} ${height + 2 * marginH}`)
            .append('g')
            .attr('transform', `translate(${[marginW, marginH]})`);*/

        console.log(document.querySelector('svg').getBoundingClientRect());

        console.log(width, height);

        // create scales
        const renderData = this.yearModels.map(a => a.getD3Representation());
        const dataExtend = renderData.map(a => a[0]);
        const minVal = d3.min(dataExtend.map(a => a[0]));
        const maxVal = d3.max(dataExtend.map(a => a[1]));

        const yScale = d3.scaleLinear().domain([minVal, maxVal]).range([height, 0]);

        const xScale = d3.scaleTime().domain([this.dates[0], this.nextFutureDate]).range([0, width]);

        const xWidth = (width / this.dates.length) * 0.9;

        for (let i = 0; i < this.yearModels.length; i++) {
            const yearModel = this.yearModels[i];
            const x = yearModel.date;
            const currentYearClass = x.toDateString().split(' ').join('_');
            const data = yearModel.getD3Representation()[1];
            console.log(data);
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

            svg.append('g')
                //.attr("font-family", "sans")
                .style('font-size', '20px')
                //.attr("transform","translate(42, 2)")
                .call(d3.axisLeft(yScale));

            svg.append('g')
                //.attr("font-family", "sans")
                .style('font-size', '20px')
                .attr('transform', `translate(0, ${height})`)
                .call(d3.axisBottom(xScale));

            svg.append('g')
                .append('line')
                .attr('x1', xScale(this.dates[0]))
                .attr('y1', yScale(0))
                .attr('x2', xScale(this.nextFutureDate))
                .attr('y2', yScale(0))
                .attr('stroke-width', 1)
                .attr('stroke', 'black');
        }
    }

    updateVisualization() {}
}

export default VisualizationModel;
