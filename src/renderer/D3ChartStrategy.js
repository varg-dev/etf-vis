import * as d3 from 'd3';
import { roundDateToBeginningOfMonth, numberOfMonthsOfAYear } from '../helpers/utils';

const FIVE_MILLION = 5000000;
const ONE_THOUSAND = 1000;
const ONE_MILLION = 1000000;
const numberOfTicks = 7;

export function generateLabelWithValueText(name, value = undefined) {
    return `${name.charAt(0).toUpperCase()}${name.slice(1)}: ${value == null ? '-' : value}`;
}

function setInteractionDisplayForActiveDiagrams(displayOption) {
    for (const activeDiagram of D3ChartStrategy.activeStrategies) {
        activeDiagram.interaction.style('display', displayOption);
    }
}

function calculateInvestmentStepIndexForDate(date, investmentSteps) {
    const firstDate = investmentSteps[0].date;
    const secondDate = investmentSteps[1].date;
    const numberOfMonthsSinceStartDate =
        (date.getFullYear() - firstDate.getFullYear()) * numberOfMonthsOfAYear +
        (date.getMonth() - firstDate.getMonth());
    const numberOfMonthsPerInvestmentStep =
        (secondDate.getFullYear() - firstDate.getFullYear()) * numberOfMonthsOfAYear +
        (secondDate.getMonth() - firstDate.getMonth());

    return Math.floor(numberOfMonthsSinceStartDate / numberOfMonthsPerInvestmentStep);
}

export class D3ChartStrategy {
    static activeStrategies = [];
    constructor(
        investmentSteps,
        renderDivRef,
        payoutPhaseStartDate,
        svgID,
        tooltipDate,
        width = 1100,
        height = 300,
        marginW = 200,
        marginH = 40
    ) {
        if (this.constructor === D3ChartStrategy) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        D3ChartStrategy.activeStrategies.push(this);
        this.investmentSteps = investmentSteps;
        this.payoutPhaseStartDate = payoutPhaseStartDate;
        this.tooltipDate = tooltipDate;

        this.marginW = marginW;
        this.marginH = marginH;
        this.width = width;
        this.height = height;

        this.lineStrokeWidth = 3;
        this.labelValueIdentifier = 'value';

        // Reset diagram by deletion.
        renderDivRef.innerHTML = '';

        this.svg = d3
            .select(renderDivRef)
            .append('svg')
            .attr('id', svgID)
            .attr('viewBox', `0 0 ${this.width + 2 * this.marginW} ${this.height + 2 * this.marginH}`)
            .append('g')
            .attr('transform', `translate(${[this.marginW / 2, this.marginH]})`);
    }

    static reset() {
        D3ChartStrategy.activeStrategies = [];
    }

    render() {
        this._prepareData();
        this._calculateExtents();
        this._createScales();
        this._drawContent();
        this._prepareText();
        this._drawText();
        this._drawAxis();
        this._addInteraction();

        if(this.tooltipDate != null){
            this._updateAllDiagrams();
        }
    }

    _calculateExtents() {
        this.dateExtent = d3.extent(this.dataArray[0], d => d.date);

        const lastImportantDateForYScale = new Date(this.payoutPhaseStartDate);
        lastImportantDateForYScale.setMonth(lastImportantDateForYScale.getMonth() + numberOfMonthsOfAYear);
        const filteredDataArrayForYMax = this.dataArray[this.maxIndex].filter(
            e => e.date <= lastImportantDateForYScale && e.date > this.dateExtent[0]
        );
        const filteredDataArrayForYMin = this.dataArray[this.minIndex].filter(
            e => e.date <= lastImportantDateForYScale
        );
        const maxVal = d3.max(filteredDataArrayForYMax.map(e => e.yStart));
        const minVal = d3.min(filteredDataArrayForYMin.map(e => e.yEnd));
        this.yExtent = [minVal, maxVal];
    }

    _createScales() {
        this.yScale = d3.scaleLinear().domain(this.yExtent).range([this.height, 0]);
        this.xScale = d3.scaleTime().domain(this.dateExtent).range([0, this.width]);
    }

    valueToDisplayText(value, hasToBePositive = false) {
        const labelDivisionFactor =
            Math.max(-this.yExtent[0], this.yExtent[1]) >= FIVE_MILLION ? ONE_MILLION : ONE_THOUSAND;
        const numberIndicator = labelDivisionFactor === ONE_MILLION ? 'M' : 'K';
        if (hasToBePositive) {
            value = Math.abs(value);
        }
        return `${(value / labelDivisionFactor).toLocaleString(undefined, {
            maximumFractionDigits: 2,
        })}${numberIndicator} €`;
    }

    _drawAxis() {
        this.svg
            .append('g')
            .style('font-size', '20px')
            .call(
                d3
                    .axisLeft(this.yScale)
                    .tickFormat(d => this.valueToDisplayText(d))
                    .ticks(numberOfTicks)
            );

        this.svg
            .append('g')
            .style('font-size', '20px')
            .attr('transform', `translate(0, ${this.height})`)
            .call(d3.axisBottom(this.xScale));

        // Draw zero line.
        this.svg
            .append('g')
            .append('line')
            .attr('x1', this.xScale(this.dateExtent[0]))
            .attr('y1', this.yScale(0))
            .attr('x2', this.xScale(this.dateExtent[1]))
            .attr('y2', this.yScale(0))
            .style('stroke-width', this.lineStrokeWidth)
            .style('stroke', 'black');

        // Draw phase division line.
        this.svg
            .append('g')
            .append('line')
            .attr('x1', this.xScale(this.payoutPhaseStartDate) - this.lineStrokeWidth / 2)
            .attr('y1', this.yScale(this.yExtent[0]))
            .attr('x2', this.xScale(this.payoutPhaseStartDate) - this.lineStrokeWidth / 2)
            .attr('y2', this.yScale(this.yExtent[1]))
            .style('stroke-width', this.lineStrokeWidth)
            .style('stroke', 'black');
    }

    _addInteraction() {
        const interactionClass = 'interaction';
        const tooltipLineClass = 'tooltipLine';

        this.interaction = this.svg
            .append('g')
            .attr('class', interactionClass)
            .style('display', 'none')
            .attr('transform', `translate(${[0, -this.marginH]})`);

        this.hoverLine = this.interaction
            .append('line')
            .attr('class', tooltipLineClass)
            .style('stroke', 'blue')
            .style('stroke-dasharray', '3,3')
            .style('opacity', 0.5)
            .attr('y1', this.height + 2 * this.marginH)
            .attr('y2', 0);

        // Add rectangle to catch mouse events.
        this.svg
            .append('rect')
            .attr('class', 'mouseEvent')
            .attr('transform', `translate(${[0, -this.marginH]})`)
            .attr('height', this.height + 2 * this.marginH)
            .attr('width', this.width)
            .attr('fill', 'none')
            .style('pointer-events', 'all')
            .on('mouseover', () => setInteractionDisplayForActiveDiagrams(null))
            .on('mouseout', () => setInteractionDisplayForActiveDiagrams('none'))
            .on('mousemove', mouseEvent => this._handleTooltipEvent(mouseEvent));
    }

    // Interaction inspired by: http://www.d3noob.org/2014/07/my-favourite-tooltip-method-for-line.html
    _handleTooltipEvent(mouseEvent) {
        const x = d3.pointer(mouseEvent)[0];
        const date = this.xScale.invert(x);
        this.tooltipDate = roundDateToBeginningOfMonth(date);
        this._updateAllDiagrams();
    }

    _updateAllDiagrams() {
        const investmentStepIndex = calculateInvestmentStepIndexForDate(this.tooltipDate, this.investmentSteps);
        for (const activeDiagram of D3ChartStrategy.activeStrategies) {
            activeDiagram.hoverLine.attr('x1', this.xScale(this.tooltipDate)).attr('x2', this.xScale(this.tooltipDate));
            activeDiagram._updateTooltip(investmentStepIndex);
            activeDiagram._updateDiagram();
        }
    }

    _drawText() {
        this.textGroup = this.svg.append('g').attr('class', 'textGroup');
        this.textGroup
            .selectAll('text')
            .data(Object.values(this.textProperties))
            .enter()
            .append('text')
            .text(d => d.text)
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .style('font-size', d => d.fontSize)
            .style('font-weight', d => d.fontWeight)
            .style('text-anchor', d => d.textAnchor)
            .style('fill', d => d.color);
    }

    _updateDiagram() {
        this.textGroup.selectAll('text').text(d => d.text);
    }

    _prepareText() {
        const savingPhaseMid =
            this.xScale(this.dateExtent[0]) +
            (this.xScale(this.payoutPhaseStartDate) - this.xScale(this.dateExtent[0])) / 2;

        const payoutPhaseMid =
            this.xScale(this.payoutPhaseStartDate) +
            (this.xScale(this.dateExtent[1]) - this.xScale(this.payoutPhaseStartDate)) / 2;
        const yPos = -10;
        this.standardFontSize = 20;
        this.textProperties = {
            savingBold: {
                text: 'SAVING',
                x: savingPhaseMid,
                y: yPos,
                fontSize: this.standardFontSize,
                textAnchor: 'end',
                fontWeight: 'bold',
                color: 'black',
            },
            savingPhase: {
                text: 'Phase',
                x: savingPhaseMid,
                y: yPos,
                fontSize: this.standardFontSize,
                textAnchor: 'start',
                fontWeight: 'normal',
                color: 'black',
            },
            payoutBold: {
                text: 'PAYOUT',
                x: payoutPhaseMid,
                y: yPos,
                fontSize: this.standardFontSize,
                textAnchor: 'end',
                fontWeight: 'bold',
                color: 'black',
            },
            payoutPhase: {
                text: 'Phase',
                x: payoutPhaseMid,
                y: yPos,
                fontSize: this.standardFontSize,
                textAnchor: 'start',
                fontWeight: 'normal',
                color: 'black',
            },
        };
    }

    _prepareData() {
        throw new Error('Abstract method. Not Implemented');
    }

    _drawContent() {
        throw new Error('Abstract method. Not Implemented');
    }

    _updateTooltip() {
        throw new Error('Abstract method. Not Implemented');
    }
}
