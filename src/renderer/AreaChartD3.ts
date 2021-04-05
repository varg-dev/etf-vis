import * as d3 from 'd3';
import {
    getTotalShareValue,
    getTotalDividenShareValue,
    InvestmentStep,
    NegativeInvestmentStepIdentifier,
    ETFIdentifier,
    ETFRatio,
} from '../model/InvestmentModel';
import { D3ChartStrategy, generateLabelWithValueText, DataArrayEntry } from './D3ChartStrategy';
import { ETF_SYMBOL_TO_NAME } from '../components/App';

interface IDataToIndex {
    [identifier: string]: number;
}

type ETFIdentifierToColors = { [key in ETFIdentifier]: { total: string; invested: string } };

type NegativeInvestmentToColorMap = { [key in NegativeInvestmentStepIdentifier]: string };

function generateEtfValueText(
    investmentValue: string | undefined = undefined,
    totalValue: string | undefined = undefined
) {
    return `Inv: ${investmentValue == null ? '-' : investmentValue}, Tot: ${totalValue == null ? '-' : totalValue}`;
}

export class AreaChartD3 extends D3ChartStrategy {
    private readonly etfLineColors: ETFIdentifierToColors = {
        'SP5C.PAR': { total: '#0562a0', invested: '#71c1f7' },
        ESGE: { total: '#ff1eff', invested: '#ff63ff' },
        SUSA: { total: '#23ff01', invested: '#7dff69' },
    };
    private readonly colors: NegativeInvestmentToColorMap = {
        inflation: '#ff7f00',
        totalCosts: '#be3bff',
        totalTaxes: '#e31a1c',
    };
    private readonly lineOpacity = 0.7;
    private readonly negativeLabels: NegativeInvestmentStepIdentifier[] = ['totalCosts', 'totalTaxes', 'inflation'];
    private readonly investedIdentifier = 'invested';
    private readonly capitalIdentifier = 'capital';

    private etfIdentifiers: ETFIdentifier[];
    private dataToIndex: IDataToIndex = {};

    constructor(
        investmentSteps: InvestmentStep[],
        renderDivRef: HTMLDivElement,
        payoutPhaseStartDate: Date,
        tooltipDate: Date | undefined,
        yExtent: [number, number] | undefined,
        etfRatio: ETFRatio
    ) {
        super(investmentSteps, renderDivRef, payoutPhaseStartDate, 'firstSVG', tooltipDate, yExtent);

        this.etfIdentifiers = [];
        for (const etfIdentifier of Object.keys(etfRatio) as ETFIdentifier[]){
            const ratio = etfRatio[etfIdentifier];
            if (ratio!= null && ratio > 0.0){
                this.etfIdentifiers.push(etfIdentifier);
            }
        }
    }

    _prepareData() {
        this.dataToIndex = {
            totalCosts: 0,
            totalTaxes: 1,
            inflation: 2,
        };

        let currentIdx = 3;
        for (const etfIdentifier of this.etfIdentifiers) {
            this.dataToIndex[etfIdentifier + this.investedIdentifier] = currentIdx++;
            this.dataToIndex[etfIdentifier + this.capitalIdentifier] = currentIdx++;
        }

        this.minIndex = this.dataToIndex.inflation;
        this.maxIndex = currentIdx - 1;

        this.dataArray = [];
        for (let i = 0; i < currentIdx; i++) {
            this.dataArray.push([]);
        }
        for (const investmentStep of this.investmentSteps) {
            this.dataArray[this.dataToIndex.totalCosts].push({
                yStart: 0,
                yEnd: -investmentStep.totalCosts,
                date: investmentStep.date,
                color: this.colors.totalCosts,
            });
            this.dataArray[this.dataToIndex.totalTaxes].push({
                yStart: -investmentStep.totalCosts,
                yEnd: -investmentStep.totalCosts - investmentStep.totalTaxes,
                date: investmentStep.date,
                color: this.colors.totalTaxes,
            });
            this.dataArray[this.dataToIndex.inflation].push({
                yStart: -investmentStep.totalCosts - investmentStep.totalTaxes,
                yEnd: -investmentStep.totalCosts - investmentStep.totalTaxes - investmentStep.inflation,
                date: investmentStep.date,
                color: this.colors.inflation,
            });
            let heightOffset = 0;
            for (const etfIdentifier of this.etfIdentifiers) {
                const totalShareValue = getTotalShareValue(etfIdentifier, investmentStep);
                const totalDividendShareValue = getTotalDividenShareValue(etfIdentifier, investmentStep);
                this.dataArray[this.dataToIndex[etfIdentifier + this.capitalIdentifier]].push({
                    yStart: totalShareValue + heightOffset,
                    yEnd: totalShareValue - totalDividendShareValue + heightOffset,
                    date: investmentStep.date,
                    color: this.etfLineColors[etfIdentifier].total,
                });
                this.dataArray[this.dataToIndex[etfIdentifier + this.investedIdentifier]].push({
                    yStart: totalShareValue - totalDividendShareValue + heightOffset,
                    yEnd: heightOffset,
                    date: investmentStep.date,
                    color: this.etfLineColors[etfIdentifier].invested,
                });
                heightOffset += totalShareValue;
            }
        }
    }

    _drawLines() {
        // Draw line chart.
        for (let i = 0; i < this.dataArray.length; i++) {
            this.svg
                .append('path')
                .datum(this.dataArray[i])
                .style('stroke', d => d[0].color)
                .style('stroke-width', this.lineStrokeWidth)
                .style('opacity', this.lineOpacity)
                .style('fill', 'none')
                .attr(
                    'd',
                    d3
                        .line<DataArrayEntry>()
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
                .style('fill', d => d[0].color)
                .attr(
                    'd',
                    d3
                        .area<DataArrayEntry>()
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

        for (let i = 0; i < this.negativeLabels.length; i++) {
            this.textProperties[this.negativeLabels[i]] = {
                text: generateLabelWithValueText(this.negativeLabels[i]),
                x: this.xScale(this.dateExtent[1]) + paddingW,
                y: this.yScale(0) + (this.standardFontSize + paddingH) * i + this.standardFontSize,
                fontSize: this.standardFontSize,
                textAnchor: 'start',
                fontWeight: 'normal',
                color: this.colors[this.negativeLabels[i]],
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

    _updateTooltip(investmentStepIndex: number) {
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
        for (const negativeLabel of this.negativeLabels) {
            const value = this.investmentSteps[investmentStepIndex][negativeLabel];
            const updatedValueText = generateLabelWithValueText(negativeLabel, this.valueToDisplayText(value, true));
            this.textProperties[negativeLabel].text = updatedValueText;
        }
    }
}
