import * as d3 from 'd3';
import { roundDateToBeginningOfMonth, numberOfMonthsOfAYear } from '../helpers/utils';
import { InvestmentStep } from '../model/InvestmentModel';

export interface DataArrayEntry {
    yStart: number;
    yEnd: number;
    date: Date;
    color: string;
}

export type DataArray = DataArrayEntry[][];

interface ITextProperty {
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string | null;
    textAnchor: string;
    fontWeight: string;
    color: string;
}

interface IOptionalTextProperty {
    text: string;
    x: number;
    y: number;
    fontSize?: number;
    fontFamily?: string | null;
    textAnchor?: string;
    fontWeight?: string;
    color: string;
}

interface ITextProperties {
    [textIdentifier: string]: ITextProperty;
}

const FIVE_MILLION = 5000000;
const ONE_THOUSAND = 1000;
const ONE_MILLION = 1000000;
const numberOfTicks = 6;

/**
 * Returns a formatted text to fit the text. If the value is undefined '-' is used.
 *
 * @param name The label.
 * @param value The value of the data referenced by the label.
 * @returns The formatted text.
 */
export function generateLabel(name: string): string {
    name = name.charAt(0).toUpperCase() + name.slice(1);
    // Regex from: https://stackoverflow.com/a/58861672
    name = name.replace(/(?!^)([A-Z]|\d+)/g, ' $1');
    return `${name}:`;
}

/**
 * Calculates the element index which contains the given date.
 *
 * @param date The concerning date.
 * @param investmentSteps The investment steps where the date position should be calculated.
 * @returns The index of the date in the investment steps.
 */
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
    public tooltipDate: Date;
    public yExtent: [number, number];
    public textProperties: ITextProperties = {};

    protected readonly lineStrokeWidth = 3;
    protected readonly contentOpacity: number = 0.65;

    protected readonly valueTextOffset = 200;
    protected readonly standardFontSize = 18;
    protected readonly labelValueIdentifier = 'value';
    protected readonly deltaIdentifier = 'delta';
    protected readonly monospaceFont = 'monospace';
    protected readonly standardFont = null;
    protected readonly startTextAnchor = 'start';
    protected readonly endTextAnchor = 'end';
    protected readonly boldText = 'bold';
    protected readonly normalText = 'normal';
    protected readonly totalColor = '#b59554';
    protected readonly totalIdentifier = 'total';

    protected investmentSteps: InvestmentStep[];
    protected dateExtent: [Date, Date] = [new Date(), new Date()];
    protected marginW: number;
    protected marginH: number;
    protected width: number;
    protected height: number;
    protected maxIndex = 0;
    protected minIndex = 0;
    protected xTextOffset;
    protected yScale: d3.ScaleLinear<number, number, never> = d3.scaleLinear();
    protected xScale: d3.ScaleTime<number, number, never> = d3.scaleTime();
    protected dataArray: DataArray = [];
    protected payoutPhaseStartDate: Date;

    protected svg: d3.Selection<SVGGElement, unknown, null, undefined>;

    private static activeStrategies: D3ChartStrategy[] = [];

    private readonly fadeOutGradientID = 'fadeOutGradient';
    private readonly fadeOutYearsLength = 10;
    private readonly gridOpacity = 0.2;
    private readonly gridColor = 'grey';
    private readonly gridStrokeWidth = 2;

    private labelDivisionFactor = 1;
    private numberIndicator = 'K';
    private hoverLine: d3.Selection<SVGLineElement, unknown, null, undefined>;
    private interaction: d3.Selection<SVGGElement, unknown, null, undefined>;
    private textGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
    private xAxis: d3.Axis<d3.NumberValue | Date>;
    private yAxis: d3.Axis<d3.NumberValue | Date>;

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
        captionSpace = 0,
        width = 1100,
        height = 300,
        marginW = 250,
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
        this.xTextOffset = this.width * 1.02;

        // Reset diagram by deletion.
        renderDivRef.innerHTML = '';

        this.svg = d3
            .select(renderDivRef)
            .append('svg')
            .attr('class', 'img-fluid')
            .attr('id', svgID)
            .attr('viewBox', `0 0 ${this.width + 2 * this.marginW} ${this.height + 2 * this.marginH + captionSpace}`)
            .append('g')
            .attr('transform', `translate(${[this.marginW / 2, this.marginH]})`);

        // Set default values needed by typescript.
        this.textGroup = this.svg;
        this.interaction = this.svg;
        this.hoverLine = this.svg.append('line');
        this.yAxis = d3.axisLeft(this.yScale);
        this.xAxis = d3.axisBottom(this.xScale);
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
    public render(): void {
        this._prepareData();
        this._calculateExtents();
        this._createScales();
        this._createAxis();
        this._drawGrid();
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
     * Transforms the value to the number that would be used to display it.
     * Is used by valueToDisplayText().
     *
     * @param value The value to display.
     * @param hasToBePositive Optional parameter which can bes et to ensure the value is positive by ignoring the sign.
     * @returns The resulting text.
     */
    protected valueToDisplayNumber(value: number, hasToBePositive = false): number {
        if (hasToBePositive && value != null) {
            value = Math.abs(value);
        }
        return value / this.labelDivisionFactor;
    }

    /**
     * Generates a human readable display text from the value. Returns '-' as a placeholder when value is undefined.
     *
     * @param value The value to display.
     * @param hasToBePositive Optional parameter which can bes et to ensure the value is positive by ignoring the sign.
     * @param skipDecimalPlaces Optional parameter which can be used to force skipping the decimal places.
     * @returns The resulting text.
     */
    protected valueToDisplayText(
        value: number | undefined,
        hasToBePositive = false,
        skipDecimalPlaces = false
    ): string {
        const decimalPlaces = skipDecimalPlaces ? 0 : 2;
        return `${
            value != null
                ? this.valueToDisplayNumber(value, hasToBePositive).toLocaleString(undefined, {
                      maximumFractionDigits: decimalPlaces,
                      minimumFractionDigits: decimalPlaces,
                  })
                : ' - '
        }${this.numberIndicator} €`;
    }

    /**
     * Adds the text property to the object variable textProperties. Makes some options optional.
     * Should be used when adding a text property since it reduces the code repetition by having some default values.
     *
     * @param identifier The identifier of the text property.
     * @param property The text properties where some properties are optional.
     */
    protected addTextProperty(identifier: string, property: IOptionalTextProperty) {
        this.textProperties[identifier] = {
            text: property.text,
            x: property.x,
            y: property.y,
            fontSize: property.fontSize ? property.fontSize : this.standardFontSize,
            fontFamily: property.fontFamily ? property.fontFamily : this.standardFont,
            textAnchor: property.textAnchor ? property.textAnchor : this.startTextAnchor,
            fontWeight: property.fontWeight ? property.fontWeight : this.boldText,
            color: property.color,
        };
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
        // Set label constants.
        this.labelDivisionFactor =
            Math.max(-this.yExtent[0], this.yExtent[1] as number) >= FIVE_MILLION ? ONE_MILLION : ONE_THOUSAND;
        this.numberIndicator = this.labelDivisionFactor === ONE_MILLION ? 'M' : 'K';
    }

    /**
     * Creates the d3 scales for both axis.
     */
    private _createScales() {
        this.yScale = d3.scaleLinear().domain(this.yExtent).range([this.height, 0]);
        this.xScale = d3.scaleTime().domain(this.dateExtent).range([0, this.width]);
    }

    /**
     * Creates the axis but does not draw it.
     */
    private _createAxis() {
        // Only skip decimal Places if all axis numbers are integers.
        const skipDecimalPlaces = this.yScale
            .ticks(numberOfTicks)
            .every(tick => Number.isInteger(this.valueToDisplayNumber(tick, false)));
        this.yAxis = d3
            .axisLeft(this.yScale)
            .tickFormat(d => this.valueToDisplayText(d as number, false, skipDecimalPlaces))
            .ticks(numberOfTicks);

        this.xAxis = d3.axisBottom(this.xScale);
    }

    /**
     * Draws the grid in the background which is aligned to the ticks of the axes.
     */
    private _drawGrid() {
        const gridGroup = this.svg.append('g').attr('class', 'grid');
        const yGridGroup = gridGroup.append('g').attr('class', 'yGrid');
        const xGridGroup = gridGroup.append('g').attr('class', 'xGrid');

        yGridGroup
            .selectAll('line')
            .data(this.yScale.ticks(numberOfTicks))
            .enter()
            .append('line')
            .attr('x1', this.xScale(this.dateExtent[0]))
            .attr('y1', d => this.yScale(d))
            .attr('x2', this.xScale(this.dateExtent[1]))
            .attr('y2', d => this.yScale(d))
            .style('stroke-width', this.gridStrokeWidth)
            .style('stroke', this.gridColor)
            .style('opacity', this.gridOpacity);

        xGridGroup
            .selectAll('line')
            .data(this.xScale.ticks())
            .enter()
            .append('line')
            .attr('x1', d => this.xScale(d))
            .attr('y1', this.yScale(this.yExtent[0]))
            .attr('x2', d => this.xScale(d))
            .attr('y2', this.yScale(this.yExtent[1]))
            .style('stroke-width', this.gridStrokeWidth)
            .style('stroke', this.gridColor)
            .style('opacity', this.gridOpacity);
    }

    /**
     * Draws both scales, the zero line and the line that separates the saving and payout phase.
     */
    private _drawAxis() {
        this.svg.append('g').style('font-size', '20px').call(this.yAxis);

        this.svg
            .append('g')
            .style('font-size', '20px')
            .attr('transform', `translate(0, ${this.height})`)
            .call(this.xAxis);

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
            .style('font-family', d => d.fontFamily)
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
        this.addTextProperty('savingBold', {
            x: savingPhaseMid,
            y: yPos,
            text: 'SAVING',
            textAnchor: this.endTextAnchor,
            color: 'black',
            fontSize: this.standardFontSize * 1.5,
        });
        this.addTextProperty('savingPhase', {
            x: savingPhaseMid,
            y: yPos,
            text: 'Phase',
            textAnchor: this.startTextAnchor,
            fontWeight: this.normalText,
            color: 'black',
            fontSize: this.standardFontSize * 1.5,
        });
        this.addTextProperty('payoutBold', {
            x: payoutPhaseMid,
            y: yPos,
            text: 'PAYOUT',
            textAnchor: this.endTextAnchor,
            color: 'black',
            fontSize: this.standardFontSize * 1.5,
        });
        this.addTextProperty('payoutPhase', {
            x: payoutPhaseMid,
            y: yPos,
            text: 'Phase',
            textAnchor: this.startTextAnchor,
            fontWeight: this.normalText,
            color: 'black',
            fontSize: this.standardFontSize * 1.5,
        });
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
            .attr('class', 'gradientStart')
            .attr('offset', '0%')
            .attr('stop-color', 'white')
            .attr('stop-opacity', 0);

        gradient
            .append('stop')
            .attr('class', 'gradientEnd')
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
