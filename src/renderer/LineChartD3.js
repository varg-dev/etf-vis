import * as d3 from 'd3';
import { getTotalShareValue } from '../model/InvestmentModel';
import { D3ChartStrategy } from './D3ChartStrategy';

export class LineChartD3 extends D3ChartStrategy {
    constructor(investmentSteps, renderDivRef, payoutPhaseStartDate) {
        super(investmentSteps, renderDivRef, payoutPhaseStartDate, 'firstSVG');

        this.etfLineColors = { 'SP5C.PAR': { total: '#0562a0', dividend: '#71c1f7' } };
        this.colors = { inflation: '#ff7f00', costs: '#be3bff', taxes: '#e31a1c' };
        this.lineOpacity = 0.7;
    }

    _prepareData() {
        this.dataToIndex = {
            costs: 0,
            taxes: 1,
            inflation: 2,
        };

        let currentIdx = 3;
        const capitalIdentifier = 'capital';
        const dividendIdentifier = 'dividend';
        for (const etfIdentifier in this.investmentSteps[0].totalShares) {
            this.dataToIndex[etfIdentifier + dividendIdentifier] = currentIdx++;
            this.dataToIndex[etfIdentifier + capitalIdentifier] = currentIdx++;
        }

        this.minIndex = this.dataToIndex.inflation;
        this.maxIndex = currentIdx - 1;

        this.dataArray = [];
        for (let i = 0; i < currentIdx; i++) {
            this.dataArray.push([]);
        }
        for (const investmentStep of this.investmentSteps) {
            this.dataArray[this.dataToIndex.costs].push({
                yStart: 0,
                yEnd: -investmentStep.totalCosts,
                date: investmentStep.date,
            });
            this.dataArray[this.dataToIndex.taxes].push({
                yStart: -investmentStep.totalCosts,
                yEnd: -investmentStep.totalCosts - investmentStep.totalTaxes,
                date: investmentStep.date,
            });
            this.dataArray[this.dataToIndex.inflation].push({
                yStart: -investmentStep.totalCosts - investmentStep.totalTaxes,
                yEnd: -investmentStep.totalCosts - investmentStep.totalTaxes - investmentStep.inflation,
                date: investmentStep.date,
            });
            let heightOffset = 0;
            for (const etfIdentifier in investmentStep.totalShares) {
                const totalShareValue = getTotalShareValue(etfIdentifier, investmentStep);
                const totalDividendShareValue =
                    investmentStep.dividendTotalShares[etfIdentifier] * investmentStep.sharePrizes[etfIdentifier];
                this.dataArray[this.dataToIndex[etfIdentifier + capitalIdentifier]].push({
                    yStart: totalShareValue + heightOffset,
                    yEnd: totalShareValue - totalDividendShareValue + heightOffset,
                    date: investmentStep.date,
                });
                this.dataArray[this.dataToIndex[etfIdentifier + dividendIdentifier]].push({
                    yStart: totalShareValue - totalDividendShareValue + heightOffset,
                    yEnd: heightOffset,
                    date: investmentStep.date,
                });
                heightOffset += totalShareValue;
            }
        }

        // Append miscellaneous data to array.
        this.dataArray[this.dataToIndex.inflation].color = this.colors.inflation;
        this.dataArray[this.dataToIndex.taxes].color = this.colors.taxes;
        this.dataArray[this.dataToIndex.costs].color = this.colors.costs;
        for (const etfIdentifier in this.investmentSteps[0].totalShares) {
            this.dataArray[this.dataToIndex[etfIdentifier + dividendIdentifier]].color = this.etfLineColors[
                etfIdentifier
            ].dividend;
            this.dataArray[this.dataToIndex[etfIdentifier + capitalIdentifier]].color = this.etfLineColors[
                etfIdentifier
            ].total;
        }
    }

    _drawLines() {
        // Draw line chart.
        for (let i = 0; i < this.dataArray.length; i++) {
            this.svg
                .append('path')
                .datum(this.dataArray[i])
                .style('stroke', d => d.color)
                .style('stroke-width', this.lineStrokeWidth)
                .style('opacity', this.lineOpacity)
                .style('fill', 'none')
                .attr(
                    'd',
                    d3
                        .line()
                        .x(d => this.xScale(d.date))
                        .y(d => this.yScale(d.yStart))
                );
        }
    }
    _drawContent() {
        this._drawArea();
    }

    _drawArea() {
        // Draw stacked area chart.
        for (let i = 0; i < this.dataArray.length; i++) {
            this.svg
                .append('g')
                .attr('class', 'area')
                .append('path')
                .datum(this.dataArray[i])
                .style('opacity', this.lineOpacity)
                .style('fill', d => d.color)
                .attr(
                    'd',
                    d3
                        .area()
                        .curve(d3.curveMonotoneX)
                        .x(d => this.xScale(d.date))
                        .y0(d => this.yScale(d.yEnd))
                        .y1(d => this.yScale(d.yStart))
                );
        }
    }

    _prepareText() {
        super._prepareText();

        const costData = this.dataArray[this.dataToIndex.costs];
        const maxCostsMiddlePosition =
            this.yScale(0) + (this.yScale(costData[costData.length - 1].yStart) - this.yScale(0)) / 2;

        this.textProperties.push(
            ...[
                {
                    text: ' Inflation',
                    x: this.xScale(this.dateExtent[0]) + this.width / 40,
                    y: this.yScale(0) + (this.yScale(this.yExtent[0]) - this.yScale(0)) / 2,
                    fontSize: this.standardFontSize,
                    textAnchor: 'start',
                    fontWeight: 'normal',
                    color: this.colors.inflation,
                },
                {
                    text: ' Costs',
                    x: this.width * 1.005,
                    y: maxCostsMiddlePosition + this.standardFontSize / 2,
                    fontSize: this.standardFontSize,
                    textAnchor: 'start',
                    fontWeight: 'normal',
                    color: this.colors.costs,
                },
                {
                    text: ' Taxes',
                    x: this.width * 1.005,
                    y: maxCostsMiddlePosition + this.standardFontSize * 2,
                    fontSize: this.standardFontSize,
                    textAnchor: 'start',
                    fontWeight: 'normal',
                    color: this.colors.taxes,
                },
            ]
        );
    }

    _updateTooltip() {}
}

export default LineChartD3;
