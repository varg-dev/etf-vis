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

/**
 * Returns a formatted text containing the label and value. If the value is undefined '-' is used.
 *
 * @param name The label.
 * @param value The value of the data referenced by the label.
 * @returns The formatted text.
 */
export function generateLabelWithValueText(name: string, value: string | undefined = undefined): string {
    name = name.charAt(0).toUpperCase() + name.slice(1);
    // Regex from: https://stackoverflow.com/a/58861672
    name = name.replace(/(?!^)([A-Z]|\d+)/g, " $1");
    return `${name}: ${value == null ? '-' : value}`;
}

function calculateInvestmentStepIndexForDate(date: Date, investmentSteps: InvestmentStep[]): number {
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

/**
 * A rendering base class for d3 visualizations implementing the strategy design pattern.
 * Provides the rendering and interaction strategy and provides common behavior such as axis rendering.
 *
 * No update of the data is implemented.
 * In order to adjust the visualization to a new investment model, a complete re rendering is required.
 *
 * Keeps track of all active diagrams. Thus needs to be reset in the case of a redrawing of the graphs.
 * 
 * It ensures that all active diagrams are synced regarding the tooltip and x axis.
 */
export abstract class D3ChartStrategy {
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

    private readonly fadeOutGradientID = 'fadeOutGradient';

    private fadeOutYearsLength = 10;

    private hoverLine: d3.Selection<SVGLineElement, unknown, null, undefined>;
    private interaction: d3.Selection<SVGGElement, unknown, null, undefined>;
    private textGroup: d3.Selection<SVGGElement, unknown, null, undefined>;

    /**
     * Constructs the strategy and registers the object.
     *
     * @param investmentSteps The investment model.
     * @param renderDivRef The reference to the div to which the diagram should be rendered.
     * @param payoutPhaseStartDate The start date of the payout phase.
     * @param svgID The ID of the svg.
     * @param tooltipDate The tooltip date. Undefined if no tooltip was visible in the last diagram.
     * @param yExtent The yExtent. Undefined if it should be recalculated.
     * @param width The diagram width.
     * @param height The diagram height.
     * @param marginW The diagram margin width.
     * @param marginH The diagram margin height.
     */
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

    /**
     * Resets the static state that keeps track of every active diagram.
     * Needs to be called before re rendering the diagrams.
     */
    static reset(): void {
        D3ChartStrategy.activeStrategies = [];
    }

    /**
     * Sets the visibility option for all active diagram tooltips.
     *
     * @param displayOption The visibility option to apply to all active diagram tooltips.
     */
    private static _setInteractionVisibilityForActiveDiagrams(displayOption: 'hidden' | 'visible'): void {
        for (const activeDiagram of D3ChartStrategy.activeStrategies) {
            activeDiagram.interaction.style('visibility', displayOption);
        }
    }

    /**
     * The rendering strategy which defined the order in which the diagram is rendered.
     * Thus defined which part lies on top of the other. e.g. Text is rendered over the central content.
     */
    render(): void {
        this._prepareData();
        this._calculateExtents();
        this._createScales();
        this._drawContent();
        this._drawFadeOut();
        this._prepareText();
        this._drawText();
        this._drawAxis();
        this._addInteraction();

        if (this.tooltipDate >= this.dateExtent[0] && this.tooltipDate <= this.dateExtent[1]) {
            this._updateAllDiagrams();
        }
    }

    /**
     * Generates a human readable display text from the value.
     *
     * @param value The value to display.
     * @param hasToBePositive Optional parameter which can bes et to ensure the value is positive by ignoring the sign.
     * @returns The resulting text.
     */
    protected valueToDisplayText(value: number, hasToBePositive = false): string {
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

    /**
     * calculates the data and thus the axis extent for the time (x-Axis) and money (y-Axis).
     * The calculation of the y extent is skipped if it has already been set to a valid extent.
     * Thus if the extent has been set in the constructor the y extent is preserved.
     */
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

    /**
     * Creates the d3 scales for both axis.
     */
    private _createScales() {
        this.yScale = d3.scaleLinear().domain(this.yExtent).range([this.height, 0]);
        this.xScale = d3.scaleTime().domain(this.dateExtent).range([0, this.width]);
    }

    /**
     * Draws both scales, the zero line and the line that separates the saving and payout phase.
     */
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

    /**
     * Adds all necessary things for the interaction to the diagram.
     *
     * The interaction design is inspired by: http://www.d3noob.org/2014/07/my-favourite-tooltip-method-for-line.html
     */
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
            .style('stroke-width', this.lineStrokeWidth)
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
            .on('mouseover', () => D3ChartStrategy._setInteractionVisibilityForActiveDiagrams('visible'))
            .on('mousemove', mouseEvent => this._handleTooltipEvent(mouseEvent));
    }

    /**
     * Handles the tooltip event and updates all diagrams accordingly.
     *
     * @param mouseEvent The mouse event.
     */
    private _handleTooltipEvent(mouseEvent: MouseEvent) {
        const x = d3.pointer(mouseEvent)[0];
        const date = this.xScale.invert(x);
        this.tooltipDate = roundDateToBeginningOfMonth(date);
        this._updateAllDiagrams();
    }

    /**
     * Updates all tooltips of all diagrams.
     */
    private _updateAllDiagrams() {
        const investmentStepIndex = calculateInvestmentStepIndexForDate(this.tooltipDate, this.investmentSteps);
        D3ChartStrategy._setInteractionVisibilityForActiveDiagrams('visible');
        for (const activeDiagram of D3ChartStrategy.activeStrategies) {
            activeDiagram.hoverLine.attr('x1', this.xScale(this.tooltipDate)).attr('x2', this.xScale(this.tooltipDate));
            activeDiagram._updateTooltip(investmentStepIndex);
            activeDiagram._updateDiagram();
        }
    }

    /**
     * Draws all text that is stored in the textProperties.
     */
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

    /**
     * Updates a single diagram. The update currently only consists of the text update.
     */
    private _updateDiagram() {
        this.textGroup.selectAll('text').text(d => (d as ITextProperty).text);
    }

    /**
     * Prepares all text which should be displayed and stores them in the textProperties variable.
     *  Default text is included. Thus a super call is expected.
     */
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

    /**
     * Draws the opacity of the fade out years by using a svg linear gradient applied to a rectangle.
     */
    private _drawFadeOut() {
        const fadeOutGroup = this.svg.append('g').attr('class', 'fadeOut');
        const fadeOutStartDate = new Date(this.dateExtent[1]);
        fadeOutStartDate.setFullYear(fadeOutStartDate.getFullYear() - this.fadeOutYearsLength);

        const gradient = fadeOutGroup.append('linearGradient').attr('id', this.fadeOutGradientID);

        gradient
            .append('stop')
            .attr('class', 'start')
            .attr('offset', '0%')
            .attr('stop-color', 'white')
            .attr('stop-opacity', 0);

        gradient
            .append('stop')
            .attr('class', 'end')
            .attr('offset', '100%')
            .attr('stop-color', 'white')
            .attr('stop-opacity', 1);

        fadeOutGroup
            .append('rect')
            .attr('x', this.xScale(fadeOutStartDate))
            .attr('y', -this.marginH)
            .attr('width', this.xScale(this.dateExtent[1]) - this.xScale(fadeOutStartDate) + 1)
            .attr('height', this.yScale(this.yExtent[0]) - this.yScale(this.yExtent[1]) + this.marginH * 2)
            .style('fill', `url(#${this.fadeOutGradientID})`);
    }

    /**
     * Prepares the data needed for the rendering.
     */
    protected abstract _prepareData(): void;

    /**
     * Draws the main content of the diagram.
     */
    protected abstract _drawContent(): void;

    /**
     * Updates the textProperties according to the investment step the tooltip is currently on.
     *
     * @param investmentStepIndex The index of the investment step of at the current mouse position.
     */
    protected abstract _updateTooltip(investmentStepIndex: number): void;
}
