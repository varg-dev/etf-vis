import * as d3 from 'd3';
import { getTotalShareValue, getTotalDividenShareValue } from '../model/InvestmentModel';
import { D3ChartStrategy, generateLabelWithValueText } from './D3ChartStrategy';
import { ETF_SYMBOL_TO_NAME } from '../components/App';

function generateEtfValueText(investmentValue = undefined, totalValue = undefined) {
    return `Inv: ${investmentValue == null ? '-' : investmentValue}, Tot: ${totalValue == null ? '-' : totalValue}`;
}

const negativeLabels = ['costs', 'taxes', 'inflation'];
const negativeLabelsToInvestmentStepIdentifier = { costs: 'totalCosts', taxes: 'totalTaxes', inflation: 'inflation' };
const capitalIdentifier = 'capital';
const investedIdentifier = 'invested';

export class AreaChartD3 extends D3ChartStrategy {
    constructor(investmentSteps, renderDivRef, payoutPhaseStartDate, tooltipDate, yExtent) {
        super(investmentSteps, renderDivRef, payoutPhaseStartDate, 'firstSVG', tooltipDate, yExtent);

        this.etfLineColors = {
            'SP5C.PAR': { total: '#0562a0', invested: '#71c1f7' },
            ESGE: { total: '#ff1eff', invested: '#ff63ff' },
            SUSA: { total: '#23ff01', invested: '#7dff69' },
        };
        this.colors = { inflation: '#ff7f00', costs: '#be3bff', taxes: '#e31a1c' };
        this.lineOpacity = 0.7;

        this.etfIdentifiers = Object.keys(this.investmentSteps[0].totalShares);
    }

    _prepareData() {
        this.dataToIndex = {
            costs: 0,
            taxes: 1,
            inflation: 2,
        };

        let currentIdx = 3;
        for (const etfIdentifier of this.etfIdentifiers) {
            this.dataToIndex[etfIdentifier + investedIdentifier] = currentIdx++;
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
                const totalDividendShareValue = getTotalDividenShareValue(etfIdentifier, investmentStep);
                this.dataArray[this.dataToIndex[etfIdentifier + capitalIdentifier]].push({
                    yStart: totalShareValue + heightOffset,
                    yEnd: totalShareValue - totalDividendShareValue + heightOffset,
                    date: investmentStep.date,
                });
                this.dataArray[this.dataToIndex[etfIdentifier + investedIdentifier]].push({
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
            this.dataArray[this.dataToIndex[etfIdentifier + investedIdentifier]].color = this.etfLineColors[
                etfIdentifier
            ].invested;
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
        const paddingW = this.width * 0.005;
        const paddingH = this.standardFontSize * 0.3;

        for (let i = 0; i < negativeLabels.length; i++) {
            this.textProperties[negativeLabels[i]] = {
                text: generateLabelWithValueText(negativeLabels[i]),
                x: this.xScale(this.dateExtent[1]) + paddingW,
                y: this.yScale(0) + (this.standardFontSize + paddingH) * i + this.standardFontSize,
                fontSize: this.standardFontSize,
                textAnchor: 'start',
                fontWeight: 'normal',
                color: this.colors[negativeLabels[i]],
            };
        }

        // Add ETF Labels.
        for (let i = 0; i < this.etfIdentifiers.length; i++) {
            this.textProperties[this.etfIdentifiers[i]] = {
                text: ETF_SYMBOL_TO_NAME[this.etfIdentifiers[i]],
                x: this.xScale(this.dateExtent[1]) + paddingW,
                y: this.yScale(0) - (this.standardFontSize + paddingH) * i * 2 - 2 * this.standardFontSize,
                fontSize: this.standardFontSize,
                textAnchor: 'start',
                fontWeight: 'normal',
                color: this.etfLineColors[this.etfIdentifiers[i]].total,
            };
        }

        // Add ETF values of Labels.
        for (let i = 0; i < this.etfIdentifiers.length; i++) {
            this.textProperties[this.etfIdentifiers[i] + this.labelValueIdentifier] = {
                text: generateEtfValueText(),
                x: this.xScale(this.dateExtent[1]) + paddingW,
                y: this.yScale(0) - (this.standardFontSize + paddingH) * i * 2 - 1 * this.standardFontSize,
                fontSize: this.standardFontSize,
                textAnchor: 'start',
                fontWeight: 'normal',
                color: this.etfLineColors[this.etfIdentifiers[i]].total,
            };
        }
    }

    _updateTooltip(investmentStepIndex) {
        for (const etfIdentifier of this.etfIdentifiers) {
            const totalValue = getTotalShareValue(etfIdentifier, this.investmentSteps[investmentStepIndex]);
            const totalDividendValue = getTotalDividenShareValue(
                etfIdentifier,
                this.investmentSteps[investmentStepIndex]
            );
            const investedValue = totalValue - totalDividendValue;
            const updatedValueText = generateEtfValueText(
                this.valueToDisplayText(investedValue, true),
                this.valueToDisplayText(totalValue, true)
            );
            this.textProperties[etfIdentifier + this.labelValueIdentifier].text = updatedValueText;
        }
        for (const negativeLabel of negativeLabels) {
            const value = this.investmentSteps[investmentStepIndex][
                negativeLabelsToInvestmentStepIdentifier[negativeLabel]
            ];
            const updatedValueText = generateLabelWithValueText(negativeLabel, this.valueToDisplayText(value, true));
            this.textProperties[negativeLabel].text = updatedValueText;
        }
    }
}

export default AreaChartD3;
