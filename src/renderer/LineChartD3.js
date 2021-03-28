import * as d3 from 'd3';
import { getTotalShareValue } from '../model/InvestmentModel';
import { D3ChartStrategy } from './D3ChartStrategy';

export class LineChartD3 extends D3ChartStrategy {
    constructor(investmentSteps, renderDivRef, payoutPhaseStartDate) {
        super(investmentSteps, renderDivRef, payoutPhaseStartDate, 'firstSVG');

        this.etfLineColors = { IBM: { total: '#0562a0', dividend: '#71c1f7' } };
        this.lineOpacity = 0.7;
    }

    _prepareData() {
        const dataToIndex = {
            costs: 0,
            taxes: 1,
            inflation: 2,
        };

        let currentIdx = 3;
        const capitalIdentifier = 'capital';
        const dividendIdentifier = 'dividend';
        for (const etfIdentifier in this.investmentSteps[0].totalShares) {
            dataToIndex[etfIdentifier + dividendIdentifier] = currentIdx++;
            dataToIndex[etfIdentifier + capitalIdentifier] = currentIdx++;
        }

        this.minIndex = dataToIndex.inflation;
        this.maxIndex = currentIdx - 1;

        this.dataArray = [];
        for (let i = 0; i < currentIdx; i++) {
            this.dataArray.push([]);
        }
        for (const investmentStep of this.investmentSteps) {
            this.dataArray[dataToIndex.costs].push({
                yStart: 0,
                yEnd: -investmentStep.totalCosts,
                date: investmentStep.date,
            });
            this.dataArray[dataToIndex.taxes].push({
                yStart: -investmentStep.totalCosts,
                yEnd: -investmentStep.totalCosts - investmentStep.totalTaxes,
                date: investmentStep.date,
            });
            this.dataArray[dataToIndex.inflation].push({
                yStart: -investmentStep.totalCosts - investmentStep.totalTaxes,
                yEnd: -investmentStep.totalCosts - investmentStep.totalTaxes - investmentStep.inflation,
                date: investmentStep.date,
            });
            let heightOffset = 0;
            for (const etfIdentifier in investmentStep.totalShares) {
                const totalShareValue = getTotalShareValue(etfIdentifier, investmentStep);
                const totalDividendShareValue =
                    investmentStep.dividendTotalShares[etfIdentifier] * investmentStep.sharePrizes[etfIdentifier];
                this.dataArray[dataToIndex[etfIdentifier + capitalIdentifier]].push({
                    yStart: totalShareValue + heightOffset,
                    yEnd: totalShareValue - totalDividendShareValue + heightOffset,
                    date: investmentStep.date,
                });
                this.dataArray[dataToIndex[etfIdentifier + dividendIdentifier]].push({
                    yStart: totalShareValue - totalDividendShareValue + heightOffset,
                    yEnd: heightOffset,
                    date: investmentStep.date,
                });
                heightOffset += totalShareValue;
            }
        }

        // Append miscellaneous data to array.
        this.dataArray[dataToIndex.inflation].color = '#ff7f00';
        this.dataArray[dataToIndex.taxes].color = '#e31a1c';
        this.dataArray[dataToIndex.costs].color = '#be3bff';
        for (const etfIdentifier in this.investmentSteps[0].totalShares) {
            this.dataArray[dataToIndex[etfIdentifier + dividendIdentifier]].color = this.etfLineColors[
                etfIdentifier
            ].dividend;
            this.dataArray[dataToIndex[etfIdentifier + capitalIdentifier]].color = this.etfLineColors[
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

    _updateTooltip() {}
}

export default LineChartD3;
