import { InvestmentStep, ETFIdentifier } from '../model/InvestmentModel';
import { D3ChartStrategy, generateLabelWithValueText } from './D3ChartStrategy';

function getSumNewPayout(investmentStep: InvestmentStep) {
    let sumNewPayout = 0;
    for (const etfIdentifier of Object.keys(investmentStep.newPayout) as ETFIdentifier[]) {
        sumNewPayout += investmentStep.newPayout[etfIdentifier];
    }
    return sumNewPayout;
}

export class CashflowBarChart extends D3ChartStrategy {
    private readonly barPaddingPercentage = 0.9;
    private readonly colors = {
        payout: { first: '#3acc5c', second: '#2d9e45' },
        invested: { first: '#ff3e58', second: '#c32f46' },
    };

    private rectWidth = 0;

    constructor(
        investmentSteps: InvestmentStep[],
        renderDivRef: HTMLDivElement,
        payoutPhaseStartDate: Date,
        tooltipDate: Date | undefined,
        yExtent: [number, number] | undefined
    ) {
        super(investmentSteps, renderDivRef, payoutPhaseStartDate, 'secondSVG', tooltipDate, yExtent);
    }

    render() {
        super.render();
    }

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

    _updateTooltip(investmentStepIndex: number) {
        const payoutValue = getSumNewPayout(this.investmentSteps[investmentStepIndex]);
        const investedValue = this.investmentSteps[investmentStepIndex].newInvestment;
        this.textProperties.payout.text = generateLabelWithValueText('payout', this.valueToDisplayText(payoutValue));
        this.textProperties.invested.text = generateLabelWithValueText(
            'invested',
            this.valueToDisplayText(investedValue)
        );
    }

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
