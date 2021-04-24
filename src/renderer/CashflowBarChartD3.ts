import { InvestmentStep, getSumNewPayout } from '../model/InvestmentModel';
import { D3ChartStrategy, generateLabel } from './D3ChartStrategy';

export const payoutIdentifier = 'payout';
export const investedIdentifier = 'invested';
export const cashflowChartColors = {
    payout: { first: '#3acc5c', second: '#2d9e45' },
    invested: { first: '#ff3e58', second: '#c32f46' },
};

/**
 * Renders a cashflow diagram of the investment model.
 */
export class CashflowBarChart extends D3ChartStrategy {
    private readonly barPaddingPercentage = 0.9;

    private rectWidth = 0;

    /**
     * Just calls the constructor of the base class with the specific svg id.
     *
     * @param investmentSteps The investment model.
     * @param renderDivRef The div reference where the diagram should be placed.
     * @param payoutPhaseStartDate The start of the payout phase.
     * @param tooltipDate The tooltip date if the tooltip was active in the last rendered diagram.
     * @param yExtent The y extent if it should stay static.
     */
    constructor(
        investmentSteps: InvestmentStep[],
        renderDivRef: HTMLDivElement,
        payoutPhaseStartDate: Date,
        tooltipDate: Date | undefined,
        yExtent: [number, number] | undefined
    ) {
        super(investmentSteps, renderDivRef, payoutPhaseStartDate, 'secondSVG', tooltipDate, yExtent);
    }

    /**
     * Prepares the data for the diagram based on the investment model.
     */
    _prepareData() {
        // Create line array.
        const dataToIndex = {
            invested: 0,
            payout: 1,
        };

        this.minIndex = dataToIndex.invested;
        this.maxIndex = dataToIndex.payout;

        this.dataArray = [[], []];
        const startYear = this.investmentSteps[0].date.getFullYear();
        for (const investmentStep of this.investmentSteps) {
            let sumNewPayout = getSumNewPayout(investmentStep);
            const colorIdentifier = (investmentStep.date.getFullYear() - startYear) % 2 === 0 ? 'first' : 'second';

            this.dataArray[dataToIndex.invested].push({
                yStart: 0,
                yEnd: -investmentStep.newInvestment,
                date: investmentStep.date,
                color: cashflowChartColors.invested[colorIdentifier],
            });
            this.dataArray[dataToIndex.payout].push({
                yStart: sumNewPayout,
                yEnd: 0,
                date: investmentStep.date,
                color: cashflowChartColors.payout[colorIdentifier],
            });
        }

        this.rectWidth = (this.width / this.dataArray[dataToIndex.invested].length) * this.barPaddingPercentage;
    }

    /**
     * Prepares additional Text that should be displayed by adding it to the textProperties.
     */
    _prepareText() {
        super._prepareText();

        this.textProperties[payoutIdentifier] = {
            text: generateLabel(payoutIdentifier),
            x: this.xTextOffset,
            y: this.height * 0.25 - this.standardFontSize * 0.5,
            fontSize: this.standardFontSize,
            fontFamily: this.standardFont,
            textAnchor: this.startTextAnchor,
            fontWeight: this.boldText,
            color: cashflowChartColors[payoutIdentifier].second,
        };

        this.textProperties[payoutIdentifier + this.labelValueIdentifier] = {
            text: this.valueToDisplayText(undefined),
            x: this.xTextOffset + this.valueTextOffset,
            y: this.height * 0.25 - this.standardFontSize * 0.5,
            fontSize: this.standardFontSize,
            fontFamily: this.monospaceFont,
            textAnchor: this.endTextAnchor,
            fontWeight: this.boldText,
            color: cashflowChartColors[payoutIdentifier].second,
        };

        this.textProperties[investedIdentifier] = {
            text: generateLabel(investedIdentifier),
            x: this.xTextOffset,
            y: this.height * 0.75 - this.standardFontSize * 0.5,
            fontSize: this.standardFontSize,
            fontFamily: this.standardFont,
            textAnchor: this.startTextAnchor,
            fontWeight: this.boldText,
            color: cashflowChartColors[investedIdentifier].second,
        };
        this.textProperties[investedIdentifier + this.labelValueIdentifier] = {
            text: this.valueToDisplayText(undefined),
            x: this.xTextOffset + this.valueTextOffset,
            y: this.height * 0.75 - this.standardFontSize * 0.5,
            fontSize: this.standardFontSize,
            fontFamily: this.monospaceFont,
            textAnchor: this.endTextAnchor,
            fontWeight: this.boldText,
            color: cashflowChartColors[investedIdentifier].second,
        };
    }

    /**
     * Updates the textProperties according to the investment step the tooltip is currently on.
     *
     * @param investmentStepIndex The index of the investment step of at the current mouse position.
     */
    _updateTooltip(investmentStepIndex: number) {
        const payoutValue = getSumNewPayout(this.investmentSteps[investmentStepIndex]);
        const investedValue = this.investmentSteps[investmentStepIndex].newInvestment;
        this.textProperties[payoutIdentifier + this.labelValueIdentifier].text = this.valueToDisplayText(payoutValue);

        this.textProperties[investedIdentifier + this.labelValueIdentifier].text = this.valueToDisplayText(
            investedValue
        );
    }

    /**
     * Draws the main content of the diagram. In this case the bars of the cashflow barchart.
     */
    _drawContent() {
        // Skip the last bar if it is outside the graph.
        const needToSkipLastBar = this.dataArray[0][this.dataArray[0].length - 1].date === this.dateExtent[1];
        for (let barArray of this.dataArray) {
            if (needToSkipLastBar) {
                barArray = barArray.slice(0, -1);
            }

            this.svg
                .append('g')
                .attr('class', 'bars')
                .selectAll(`rect.none`)
                .data(barArray)
                .enter()
                .append('rect')
                .style('fill', d => d.color)
                .attr('x', d => this.xScale(d.date))
                .attr('width', this.rectWidth)
                .attr('y', d => this.yScale(d.yStart))
                .attr('height', d => this.yScale(d.yEnd) - this.yScale(d.yStart))
                .style('opacity', this.contentOpacity);
        }
    }
}
