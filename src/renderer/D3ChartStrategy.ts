import * as d3 from 'd3';
import { roundDateToBeginningOfMonth, numberOfMonthsOfAYear } from '../helpers/utils';
import { InvestmentStep } from '../model/InvestmentModel';

interface ITextProperty {
    text: string;
    x: number;
    y: number;
    fontSize: number;
    textAnchor: string;
    fontWeight: string;
    color: string;
}

interface ITextProperties {
    [textIdentifier: string]: ITextProperty;
}

export interface DataArrayEntry {
    yStart: number;
    yEnd: number;
    date: Date;
    color: string;
}

export type DataArray = DataArrayEntry[][];

const FIVE_MILLION = 5000000;
const ONE_THOUSAND = 1000;
const ONE_MILLION = 1000000;
const numberOfTicks = 7;

export function generateLabelWithValueText(name: string, value: string | undefined = undefined) {
    return `${name.charAt(0).toUpperCase()}${name.slice(1)}: ${value == null ? '-' : value}`;
}

function calculateInvestmentStepIndexForDate(date: Date, investmentSteps: InvestmentStep[]) {
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
    tooltipDate: Date;
    yExtent: [number, number];

    protected readonly lineStrokeWidth = 3;
    protected readonly standardFontSize = 20;
    protected readonly labelValueIdentifier = 'value';

    protected investmentSteps: InvestmentStep[];
    protected dateExtent: [Date, Date] = [new Date(), new Date()];
    protected marginW: number;
    protected marginH: number;
    protected width: number;
    protected height: number;
    protected maxIndex = 0;
    protected minIndex = 0;
    protected yScale: d3.ScaleLinear<number, number, never> = d3.scaleLinear();
    protected xScale: d3.ScaleTime<number, number, never> = d3.scaleTime();
    protected dataArray: DataArray = [];
    protected textProperties: ITextProperties = {};
    protected payoutPhaseStartDate: Date;

    protected svg: d3.Selection<SVGGElement, unknown, null, undefined>;

    private static activeStrategies: D3ChartStrategy[] = [];

    private hoverLine: d3.Selection<SVGLineElement, unknown, null, undefined>;
    private interaction: d3.Selection<SVGGElement, unknown, null, undefined>;
    private textGroup: d3.Selection<SVGGElement, unknown, null, undefined>;

    constructor(
        investmentSteps: InvestmentStep[],
        renderDivRef: HTMLDivElement,
        payoutPhaseStartDate: Date,
        svgID: string,
        tooltipDate: Date | undefined,
        yExtent: [number, number] | undefined,
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
        this.tooltipDate = tooltipDate != null ? tooltipDate : new Date(0);
        this.yExtent = yExtent != null ? yExtent : [0, 0];

        this.marginW = marginW;
        this.marginH = marginH;
        this.width = width;
        this.height = height;

        // Reset diagram by deletion.
        renderDivRef.innerHTML = '';

        this.svg = d3
            .select(renderDivRef)
            .append('svg')
            .attr('id', svgID)
            .attr('viewBox', `0 0 ${this.width + 2 * this.marginW} ${this.height + 2 * this.marginH}`)
            .append('g')
            .attr('transform', `translate(${[this.marginW / 2, this.marginH]})`);

        // Set default values needed by typescript.
        this.textGroup = this.svg;
        this.interaction = this.svg;
        this.hoverLine = this.svg.append('line');
    }

    static reset() {
        D3ChartStrategy.activeStrategies = [];
    }

    private static _setInteractionDisplayForActiveDiagrams(displayOption: string) {
        for (const activeDiagram of D3ChartStrategy.activeStrategies) {
            activeDiagram.interaction.style('visibility', displayOption);
        }
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

        if (this.tooltipDate >= this.dateExtent[0] && this.tooltipDate <= this.dateExtent[1]) {
            this._updateAllDiagrams();
        }
    }

    protected valueToDisplayText(value: number, hasToBePositive = false) {
        const labelDivisionFactor =
            Math.max(-this.yExtent[0], this.yExtent[1] as number) >= FIVE_MILLION ? ONE_MILLION : ONE_THOUSAND;
        const numberIndicator = labelDivisionFactor === ONE_MILLION ? 'M' : 'K';
        if (hasToBePositive) {
            value = Math.abs(value);
        }
        return `${(value / labelDivisionFactor).toLocaleString(undefined, {
            maximumFractionDigits: 2,
        })}${numberIndicator} €`;
    }

    private _calculateExtents() {
        this.dateExtent = d3.extent(this.dataArray[0], d => d.date) as [Date, Date];

        const lastImportantDateForYScale = new Date(this.payoutPhaseStartDate);
        lastImportantDateForYScale.setMonth(lastImportantDateForYScale.getMonth() + numberOfMonthsOfAYear);
        // Only calculate the y extent when it is undefined. Meaning the y axis is not locked.
        if (this.yExtent[0] === 0 && this.yExtent[1] === 0) {
            const filteredDataArrayForYMax = this.dataArray[this.maxIndex].filter(
                e => e.date <= lastImportantDateForYScale && e.date > this.dateExtent[0]
            );
            const filteredDataArrayForYMin = this.dataArray[this.minIndex].filter(
                e => e.date <= lastImportantDateForYScale
            );
            const maxVal = d3.max(filteredDataArrayForYMax.map(e => e.yStart)) as number;
            const minVal = d3.min(filteredDataArrayForYMin.map(e => e.yEnd)) as number;
            this.yExtent = [minVal, maxVal];
        }
    }

    private _createScales() {
        this.yScale = d3.scaleLinear().domain(this.yExtent).range([this.height, 0]);
        this.xScale = d3.scaleTime().domain(this.dateExtent).range([0, this.width]);
    }

    private _drawAxis() {
        this.svg
            .append('g')
            .style('font-size', '20px')
            .call(
                d3
                    .axisLeft(this.yScale)
                    .tickFormat(d => this.valueToDisplayText(d as number))
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

    private _addInteraction() {
        const interactionClass = 'interaction';
        const tooltipLineClass = 'tooltipLine';

        this.interaction = this.svg
            .append('g')
            .attr('class', interactionClass)
            .style('visibility', 'hidden')
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
            .on('mouseover', () => D3ChartStrategy._setInteractionDisplayForActiveDiagrams('visible'))
            .on('mouseout', () => D3ChartStrategy._setInteractionDisplayForActiveDiagrams('hidden'))
            .on('mousemove', mouseEvent => this._handleTooltipEvent(mouseEvent));
    }

    // Interaction inspired by: http://www.d3noob.org/2014/07/my-favourite-tooltip-method-for-line.html
    private _handleTooltipEvent(mouseEvent: any) {
        const x = d3.pointer(mouseEvent)[0];
        const date = this.xScale.invert(x);
        this.tooltipDate = roundDateToBeginningOfMonth(date);
        this._updateAllDiagrams();
    }

    private _updateAllDiagrams() {
        const investmentStepIndex = calculateInvestmentStepIndexForDate(this.tooltipDate, this.investmentSteps);
        for (const activeDiagram of D3ChartStrategy.activeStrategies) {
            activeDiagram.hoverLine.attr('x1', this.xScale(this.tooltipDate)).attr('x2', this.xScale(this.tooltipDate));
            activeDiagram._updateTooltip(investmentStepIndex);
            activeDiagram._updateDiagram();
        }
    }

    private _drawText() {
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

    private _updateDiagram() {
        this.textGroup.selectAll('text').text(d => (d as ITextProperty).text);
    }

    protected _prepareText() {
        const savingPhaseMid =
            this.xScale(this.dateExtent[0]) +
            (this.xScale(this.payoutPhaseStartDate) - this.xScale(this.dateExtent[0])) / 2;

        const payoutPhaseMid =
            this.xScale(this.payoutPhaseStartDate) +
            (this.xScale(this.dateExtent[1]) - this.xScale(this.payoutPhaseStartDate)) / 2;
        const yPos = -10;
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

    protected _prepareData() {
        throw new Error('Abstract method. Not Implemented');
    }

    protected _drawContent() {
        throw new Error('Abstract method. Not Implemented');
    }

    protected _updateTooltip(investmentStepIndex: number) {
        throw new Error('Abstract method. Not Implemented');
    }
}
