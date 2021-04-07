import { InvestmentStep } from '../model/InvestmentModel';
import { ETFIdentifier } from '../model/ForecastModel';
import { D3ChartStrategy, generateLabelWithValueText } from './D3ChartStrategy';

/**
 * Calculates the sum of all payout over all used etfs.
 *
 * @param investmentStep The concerning investmentStep.
 * @returns The sum of all payouts.
 */
function getSumNewPayout(investmentStep: InvestmentStep) {
    let sumNewPayout = 0;
    for (const etfIdentifier of Object.keys(investmentStep.newPayout) as ETFIdentifier[]) {
        sumNewPayout += investmentStep.newPayout[etfIdentifier];
    }
    return sumNewPayout;
}

/**
 * Renders a cashflow diagram of the investment model.
 */
export class CashflowBarChart extends D3ChartStrategy {
    private readonly barPaddingPercentage = 0.9;
    private readonly colors = {
        payout: { first: '#3acc5c', second: '#2d9e45' },
        invested: { first: '#ff3e58', second: '#c32f46' },
    };

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
                color: this.colors.invested[colorIdentifier],
            });
            this.dataArray[dataToIndex.payout].push({
                yStart: sumNewPayout,
                yEnd: 0,
                date: investmentStep.date,
                color: this.colors.payout[colorIdentifier],
            });
        }

        this.rectWidth = (this.width / this.dataArray[dataToIndex.invested].length) * this.barPaddingPercentage;
    }

    /**
     * Prepares additional Text that should be displayed by adding it to the textProperties.
     */
    _prepareText() {
        super._prepareText();

        const payoutX =
            this.xScale(this.payoutPhaseStartDate) +
            (this.xScale(this.dateExtent[1]) - this.xScale(this.payoutPhaseStartDate)) / 2;
        const payoutY = this.yScale(0) + (this.yScale(this.yExtent[0]) - this.yScale(0)) / 2;

        const payoutIdentifier = 'payout';
        this.textProperties[payoutIdentifier] = {
            text: generateLabelWithValueText(payoutIdentifier),
            x: payoutX,
            y: payoutY,
            fontSize: this.standardFontSize,
            textAnchor: 'middle',
            fontWeight: 'normal',
            color: this.colors[payoutIdentifier].first,
        };

        const investedX =
            this.xScale(this.dateExtent[0]) +
            (this.xScale(this.payoutPhaseStartDate) - this.xScale(this.dateExtent[0])) / 2;
        const investedY = this.yScale(0) - (this.yScale(0) - this.yScale(this.yExtent[1])) / 2;

        const investedIdentifier = 'invested';
        this.textProperties[investedIdentifier] = {
            text: generateLabelWithValueText(investedIdentifier),
            x: investedX,
            y: investedY,
            fontSize: this.standardFontSize,
            textAnchor: 'middle',
            fontWeight: 'normal',
            color: this.colors[investedIdentifier].first,
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
        this.textProperties.payout.text = generateLabelWithValueText('payout', this.valueToDisplayText(payoutValue));
        this.textProperties.invested.text = generateLabelWithValueText(
            'invested',
            this.valueToDisplayText(investedValue)
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
                .attr('height', d => this.yScale(d.yEnd) - this.yScale(d.yStart));
        }
    }
}
