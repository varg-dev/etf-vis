import { D3ChartStrategy } from './D3ChartStrategy';

export class CashflowBarChart extends D3ChartStrategy {
    constructor(investmentSteps, renderDivRef, payoutPhaseStartDate) {
        super(investmentSteps, renderDivRef, payoutPhaseStartDate, 'secondSVG');
        this.barPaddingPercentage = 0.9;

        this.zeroLineStrokeWidth = 3;
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
        for (const investmentStep of this.investmentSteps) {
            let sumNewInvestedMoney = 0;
            let sumNewPayout = 0;
            for (const etfIdentifier in investmentStep.newInvestedMoney) {
                sumNewInvestedMoney += investmentStep.newInvestedMoney[etfIdentifier];
                sumNewPayout += investmentStep.newPayout[etfIdentifier];
            }
            this.dataArray[dataToIndex.invested].push({
                yStart: 0,
                yEnd: -sumNewInvestedMoney,
                date: investmentStep.date,
                color: '#b4291f',
            });
            this.dataArray[dataToIndex.payout].push({
                yStart: sumNewPayout,
                yEnd: 0,
                date: investmentStep.date,
                color: '#0562a0',
            });
        }

        this.rectWidth = (this.width / this.dataArray[dataToIndex.invested].length) * this.barPaddingPercentage;
    }

    _drawContent() {
        for (const barArray of this.dataArray) {
            this.svg
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

    _updateTooltip() {}
}

export default CashflowBarChart;
