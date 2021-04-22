import * as d3 from 'd3';
import {
    getTotalShareValue,
    getTotalDividendShareValue,
    InvestmentStep,
    NegativeInvestmentStepIdentifier,
    ETFRatio,
} from '../model/InvestmentModel';
import { ETFIdentifier } from '../model/ForecastModel';
import { D3ChartStrategy, generateLabel, DataArrayEntry } from './D3ChartStrategy';
import { ETF_SYMBOL_TO_NAME } from '../components/App';

interface IDataToIndex {
    [identifier: string]: number;
}

type ETFIdentifierToColors = { [key in ETFIdentifier]: { total: string; invested: string } };

type NegativeInvestmentToColorMap = { [key in NegativeInvestmentStepIdentifier]: string };

const captionSpaceForDeltaValues = 200;

/**
 * A class that draws an area chart that contains the value of costs, taxes,
 * inflation and the total value and invested value of all used ETFs.
 */
export class AreaChartD3 extends D3ChartStrategy {

    // Color schema taken from: https://colorbrewer2.org/#type=qualitative&scheme=Paired&n=11
    private readonly etfLineColors: ETFIdentifierToColors = {
        'SP5C.PAR': { total: '#1f78b4', invested: '#a6cee3' },
        ESGE: { total: '#33a02c', invested: '#b2df8a' },
        SUSA: { total: '#ff7f00', invested: '#fdbf6f' },
    };

    private readonly colors: NegativeInvestmentToColorMap = {
        inflation: '#F7528E',
        totalCosts: '#6a3d9a',
        totalTaxes: '#b15928',
    };
    private readonly valueTextOffset = 200;
    private readonly negativeLabels: NegativeInvestmentStepIdentifier[] = ['totalCosts', 'totalTaxes', 'inflation'];
    private readonly investedIdentifier = 'invested';
    private readonly capitalIdentifier = 'capital';
    private readonly totalIdentifier = 'total';
    private readonly totalColor = '#e31a1c';

    private etfIdentifiers: ETFIdentifier[];
    private dataToIndex: IDataToIndex = {};
    private subtractInflationFromTotal: boolean;
    private previousInvestmentSteps: InvestmentStep[] | undefined;

    /**
     * Constructs the area chart by calling the base class constructor and determining all used ETFs.
     */
    constructor(
        investmentSteps: InvestmentStep[],
        renderDivRef: HTMLDivElement,
        payoutPhaseStartDate: Date,
        tooltipDate: Date | undefined,
        yExtent: [number, number] | undefined,
        etfRatio: ETFRatio,
        subtractInflationFromTotal: boolean,
        previousInvestmentSteps: InvestmentStep[] | undefined
    ) {
        super(
            investmentSteps,
            renderDivRef,
            payoutPhaseStartDate,
            'firstSVG',
            tooltipDate,
            yExtent,
            captionSpaceForDeltaValues
        );
        this.previousInvestmentSteps = previousInvestmentSteps;
        this.subtractInflationFromTotal = subtractInflationFromTotal;

        this.etfIdentifiers = [];
        for (const etfIdentifier of Object.keys(etfRatio) as ETFIdentifier[]) {
            const ratio = etfRatio[etfIdentifier];
            if (ratio != null && ratio > 0.0) {
                this.etfIdentifiers.push(etfIdentifier);
            }
        }
    }

    /**
     * Prepares all data from the investment model for rendering.
     */
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
                const totalDividendShareValue = getTotalDividendShareValue(etfIdentifier, investmentStep);
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

    /**
     * Draws the data as lines instead of a stacked area chart.
     */
    _drawLines() {
        // Draw total line.
        this.svg
            .append('path')
            .datum(this.dataArray[this.dataArray.length - 1])
            .style('stroke', this.totalColor)
            .style('stroke-width', this.lineStrokeWidth)
            .style('fill', 'none')
            .attr(
                'd',
                d3
                    .line<DataArrayEntry>()
                    .x(d => this.xScale(d.date))
                    .y((d, i) => {
                        return this.yScale(
                            d.yStart - (this.subtractInflationFromTotal ? this.investmentSteps[i].inflation : 0)
                        );
                    })
            );
    }

    /**
     * Draws the main content of the diagram. Currently a stacked area chart.
     */
    _drawContent() {
        this._drawArea();
        this._drawLines();
    }

    /**
     * Draws the stacked areas of the diagram.
     */
    _drawArea() {
        // Draw stacked area chart.
        for (let i = 0; i < this.dataArray.length; i++) {
            this.svg
                .append('g')
                .attr('class', 'area')
                .append('path')
                .datum(this.dataArray[i])
                .style('opacity', this.contentOpacity)
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

    /**
     * Prepares the additional text that is displayed by adding it to the textProperties.
     */
    _prepareText() {
        super._prepareText();
        const paddingW = this.width * 0.02;
        const paddingH = this.standardFontSize * 0.4;

        // Negative labels.
        for (let i = 0; i < this.negativeLabels.length; i++) {
            this.textProperties[this.negativeLabels[i]] = {
                text: generateLabel(this.negativeLabels[i]),
                x: this.xScale(this.dateExtent[1]) + paddingW,
                y: this.yScale(0) + (this.standardFontSize + paddingH) * (i + 1),
                fontSize: this.standardFontSize,
                fontFamily: null,
                textAnchor: 'start',
                fontWeight: 'bold',
                color: this.colors[this.negativeLabels[i]],
            };

            this.textProperties[this.negativeLabels[i] + this.labelValueIdentifier] = {
                text: this.valueToDisplayText(undefined),
                x: this.xScale(this.dateExtent[1]) + paddingW + this.valueTextOffset,
                y: this.yScale(0) + (this.standardFontSize + paddingH) * (i + 1),
                fontSize: this.standardFontSize,
                fontFamily: this.monospaceFont,
                textAnchor: 'end',
                fontWeight: 'bold',
                color: this.colors[this.negativeLabels[i]],
            };
        }

        // Add ETF values of Labels.
        for (let i = 0; i < this.etfIdentifiers.length; i++) {
            // ETF Label.
            this.textProperties[this.etfIdentifiers[i]] = {
                text: ETF_SYMBOL_TO_NAME[this.etfIdentifiers[i]],
                x: this.xScale(this.dateExtent[1]) + paddingW,
                y: this.yScale(0) - (this.standardFontSize + paddingH) * i * 3 - 2 * this.standardFontSize,
                fontSize: this.standardFontSize,
                fontFamily: null,
                textAnchor: 'start',
                fontWeight: 'bold',
                color: this.etfLineColors[this.etfIdentifiers[i]].total,
            };
            // Total
            this.textProperties[this.etfIdentifiers[i] + this.totalIdentifier] = {
                text: generateLabel(this.totalIdentifier),
                x: this.xScale(this.dateExtent[1]) + paddingW,
                y: this.yScale(0) - (this.standardFontSize + paddingH) * i * 3 - 1 * this.standardFontSize,
                fontSize: this.standardFontSize,
                fontFamily: null,
                textAnchor: 'start',
                fontWeight: 'bold',
                color: this.etfLineColors[this.etfIdentifiers[i]].total,
            };

            this.textProperties[this.etfIdentifiers[i] + this.labelValueIdentifier + this.totalIdentifier] = {
                text: this.valueToDisplayText(undefined),
                x: this.xScale(this.dateExtent[1]) + paddingW + this.valueTextOffset,
                y: this.yScale(0) - (this.standardFontSize + paddingH) * i * 3 - 1 * this.standardFontSize,
                fontSize: this.standardFontSize,
                fontFamily: this.monospaceFont,
                textAnchor: 'end',
                fontWeight: 'bold',
                color: this.etfLineColors[this.etfIdentifiers[i]].total,
            };
            // Invested
            this.textProperties[this.etfIdentifiers[i] + this.investedIdentifier] = {
                text: generateLabel(this.investedIdentifier),
                x: this.xScale(this.dateExtent[1]) + paddingW,
                y: this.yScale(0) - (this.standardFontSize + paddingH) * i * 3 - 0 * this.standardFontSize,
                fontSize: this.standardFontSize,
                fontFamily: null,
                textAnchor: 'start',
                fontWeight: 'bold',
                color: this.etfLineColors[this.etfIdentifiers[i]].invested,
            };

            this.textProperties[this.etfIdentifiers[i] + this.labelValueIdentifier + this.investedIdentifier] = {
                text: this.valueToDisplayText(undefined),
                x: this.xScale(this.dateExtent[1]) + paddingW + this.valueTextOffset,
                y: this.yScale(0) - (this.standardFontSize + paddingH) * i * 3 - 0 * this.standardFontSize,
                fontSize: this.standardFontSize,
                fontFamily: this.monospaceFont,
                textAnchor: 'end',
                fontWeight: 'bold',
                color: this.etfLineColors[this.etfIdentifiers[i]].invested,
            };
        }

        // Add total label.
        this.textProperties[this.totalIdentifier] = {
            text: generateLabel(this.totalIdentifier),
            x: this.xScale(this.dateExtent[1]) + paddingW,
            y: this.yScale(this.yExtent[1]),
            fontSize: this.standardFontSize,
            fontFamily: null,
            textAnchor: 'start',
            fontWeight: 'bold',
            color: this.totalColor,
        };

        this.textProperties[this.totalIdentifier + this.labelValueIdentifier] = {
            text: this.valueToDisplayText(undefined),
            x: this.xScale(this.dateExtent[1]) + paddingW + this.valueTextOffset,
            y: this.yScale(this.yExtent[1]),
            fontSize: this.standardFontSize,
            fontFamily: this.monospaceFont,
            textAnchor: 'end',
            fontWeight: 'bold',
            color: this.totalColor,
        };

        const yOffset = this.height * 1.15;
        const xPadding = this.width / this.negativeLabels.length;
        // Add delta labels.
        this.textProperties[this.deltaIdentifier] = {
            text: 'Differences to Previous Configuration:',
            x: this.xScale(
                this.dateExtent[0].valueOf() + (this.dateExtent[1].valueOf() - this.dateExtent[0].valueOf()) / 2
            ),
            y: yOffset + this.standardFontSize,
            fontSize: this.standardFontSize,
            fontFamily: null,
            textAnchor: 'middle',
            fontWeight: 'bold',
            color: 'black',
        };
        // Negative labels (delta).
        for (let i = 0; i < this.negativeLabels.length; i++) {
            this.textProperties[this.negativeLabels[i] + this.deltaIdentifier] = {
                text: generateLabel(this.negativeLabels[i]),
                x: xPadding * i,
                y: yOffset + (this.standardFontSize + paddingH) * (4 + this.etfIdentifiers.length),
                fontSize: this.standardFontSize,
                fontFamily: null,
                textAnchor: 'start',
                fontWeight: 'bold',
                color: this.colors[this.negativeLabels[i]],
            };

            this.textProperties[this.negativeLabels[i] + this.deltaIdentifier + this.labelValueIdentifier] = {
                text: this.valueToDisplayText(undefined),
                x: xPadding * i + this.valueTextOffset + paddingW,
                y: yOffset + (this.standardFontSize + paddingH) * (4 + this.etfIdentifiers.length),
                fontSize: this.standardFontSize,
                fontFamily: this.monospaceFont,
                textAnchor: 'end',
                fontWeight: 'bold',
                color: this.colors[this.negativeLabels[i]],
            };
        }
        const numberOfEntriesPerRow = 3;
        // Add ETF values of Labels (delta).
        for (let i = 0; i < this.etfIdentifiers.length; i++) {
            // ETF Label.
            this.textProperties[this.etfIdentifiers[i] + this.deltaIdentifier] = {
                text: ETF_SYMBOL_TO_NAME[this.etfIdentifiers[i]],
                x: (this.width / numberOfEntriesPerRow) * 0,
                y: yOffset + (this.standardFontSize + paddingH) * (i + 2),
                fontSize: this.standardFontSize,
                fontFamily: null,
                textAnchor: 'start',
                fontWeight: 'bold',
                color: this.etfLineColors[this.etfIdentifiers[i]].total,
            };
            // Total
            this.textProperties[this.etfIdentifiers[i] + this.deltaIdentifier + this.totalIdentifier] = {
                text: generateLabel(this.totalIdentifier),
                x: (this.width / numberOfEntriesPerRow) * 1,
                y: yOffset + (this.standardFontSize + paddingH) * (i + 2),
                fontSize: this.standardFontSize,
                fontFamily: null,
                textAnchor: 'start',
                fontWeight: 'bold',
                color: this.etfLineColors[this.etfIdentifiers[i]].total,
            };

            this.textProperties[
                this.etfIdentifiers[i] + this.deltaIdentifier + this.labelValueIdentifier + this.totalIdentifier
            ] = {
                text: this.valueToDisplayText(undefined),
                x: (this.width / numberOfEntriesPerRow) * 1 + this.valueTextOffset + paddingW,
                y: yOffset + (this.standardFontSize + paddingH) * (i + 2),
                fontSize: this.standardFontSize,
                fontFamily: this.monospaceFont,
                textAnchor: 'end',
                fontWeight: 'bold',
                color: this.etfLineColors[this.etfIdentifiers[i]].total,
            };
            // Invested
            this.textProperties[this.etfIdentifiers[i] + this.deltaIdentifier + this.investedIdentifier] = {
                text: generateLabel(this.investedIdentifier),
                x: (this.width / numberOfEntriesPerRow) * 2,
                y: yOffset + (this.standardFontSize + paddingH) * (i + 2),
                fontSize: this.standardFontSize,
                fontFamily: null,
                textAnchor: 'start',
                fontWeight: 'bold',
                color: this.etfLineColors[this.etfIdentifiers[i]].invested,
            };

            this.textProperties[
                this.etfIdentifiers[i] + this.deltaIdentifier + this.labelValueIdentifier + this.investedIdentifier
            ] = {
                text: this.valueToDisplayText(undefined),
                x: (this.width / numberOfEntriesPerRow) * 2 + this.valueTextOffset + paddingW,
                y: yOffset + (this.standardFontSize + paddingH) * (i + 2),
                fontSize: this.standardFontSize,
                fontFamily: this.monospaceFont,
                textAnchor: 'end',
                fontWeight: 'bold',
                color: this.etfLineColors[this.etfIdentifiers[i]].invested,
            };
        }
        // Add total label.
        this.textProperties[this.totalIdentifier + this.deltaIdentifier] = {
            text: generateLabel(this.totalIdentifier),
            x: (this.width / numberOfEntriesPerRow) * 0,
            y: yOffset + (this.standardFontSize + paddingH) * (this.etfIdentifiers.length + 2),
            fontSize: this.standardFontSize,
            fontFamily: null,
            textAnchor: 'start',
            fontWeight: 'bold',
            color: this.totalColor,
        };

        this.textProperties[this.totalIdentifier + this.deltaIdentifier + this.labelValueIdentifier] = {
            text: this.valueToDisplayText(undefined),
            x: (this.width / numberOfEntriesPerRow) * 0 + this.valueTextOffset + paddingW,
            y: yOffset + (this.standardFontSize + paddingH) * (this.etfIdentifiers.length + 2),
            fontSize: this.standardFontSize,
            fontFamily: this.monospaceFont,
            textAnchor: 'end',
            fontWeight: 'bold',
            color: this.totalColor,
        };
    }

    /**
     * Updates the textProperties according to the investment step the tooltip is currently on.
     *
     * @param investmentStepIndex The index of the investment step of at the current mouse position.
     */
    _updateTooltip(investmentStepIndex: number) {
        // Update ETF Values.
        for (const etfIdentifier of this.etfIdentifiers) {
            const totalValue = getTotalShareValue(etfIdentifier, this.investmentSteps[investmentStepIndex]);
            const totalDividendValue = getTotalDividendShareValue(
                etfIdentifier,
                this.investmentSteps[investmentStepIndex]
            );
            const investedValue = totalValue - totalDividendValue;
            this.textProperties[
                etfIdentifier + this.labelValueIdentifier + this.investedIdentifier
            ].text = this.valueToDisplayText(investedValue, true);
            this.textProperties[
                etfIdentifier + this.labelValueIdentifier + this.totalIdentifier
            ].text = this.valueToDisplayText(totalValue, true);
        }
        // Update negative values.
        for (const negativeLabel of this.negativeLabels) {
            const value = this.investmentSteps[investmentStepIndex][negativeLabel];
            this.textProperties[negativeLabel + this.labelValueIdentifier].text = this.valueToDisplayText(value, true);
        }
        // Update total values.
        let totalValue = 0;
        for (const etfIdentifier of this.etfIdentifiers) {
            totalValue += getTotalShareValue(etfIdentifier, this.investmentSteps[investmentStepIndex]);
        }
        totalValue -= this.subtractInflationFromTotal ? this.investmentSteps[investmentStepIndex].inflation : 0;
        this.textProperties[this.totalIdentifier + this.labelValueIdentifier].text = this.valueToDisplayText(
            totalValue
        );

        // Set the delta Values if the previous model exists.
        if (this.previousInvestmentSteps != null && this.previousInvestmentSteps.length > investmentStepIndex) {
            // Negative labels.
            for (const negativeLabel of this.negativeLabels) {
                const currentValue = this.investmentSteps[investmentStepIndex][negativeLabel];
                const previousValue = this.previousInvestmentSteps[investmentStepIndex][negativeLabel];
                const value = currentValue - previousValue;
                this.textProperties[
                    negativeLabel + this.deltaIdentifier + this.labelValueIdentifier
                ].text = this.valueToDisplayText(value, true);
            }
            // ETF labels.
            for (const etfIdentifier of this.etfIdentifiers) {
                const currentTotalValue = getTotalShareValue(etfIdentifier, this.investmentSteps[investmentStepIndex]);
                const currentTotalDividendValue = getTotalDividendShareValue(
                    etfIdentifier,
                    this.investmentSteps[investmentStepIndex]
                );
                const currentInvestedValue = currentTotalValue - currentTotalDividendValue;

                const previousTotalValue = getTotalShareValue(
                    etfIdentifier,
                    this.previousInvestmentSteps[investmentStepIndex]
                );
                const previousTotalDividendValue = getTotalDividendShareValue(
                    etfIdentifier,
                    this.previousInvestmentSteps[investmentStepIndex]
                );
                const previousInvestedValue = previousTotalValue - previousTotalDividendValue;

                const investedValue = currentInvestedValue - previousInvestedValue;
                const totalValue = currentTotalValue - previousTotalValue;
                this.textProperties[
                    etfIdentifier + this.deltaIdentifier + this.labelValueIdentifier + this.investedIdentifier
                ].text = this.valueToDisplayText(investedValue);
                this.textProperties[
                    etfIdentifier + this.deltaIdentifier + this.labelValueIdentifier + this.totalIdentifier
                ].text = this.valueToDisplayText(totalValue);
            }
            // Total Value.
            let previousTotalValue = 0;
            for (const etfIdentifier of this.etfIdentifiers) {
                previousTotalValue += getTotalShareValue(
                    etfIdentifier,
                    this.previousInvestmentSteps[investmentStepIndex]
                );
            }
            previousTotalValue -= this.subtractInflationFromTotal
                ? this.previousInvestmentSteps[investmentStepIndex].inflation
                : 0;
            this.textProperties[
                this.totalIdentifier + this.deltaIdentifier + this.labelValueIdentifier
            ].text = this.valueToDisplayText(totalValue - previousTotalValue);
            // Set all delta value to undefined if the investmentStep is not included in the previous investment steps.
        } else if (this.previousInvestmentSteps != null && this.previousInvestmentSteps.length <= investmentStepIndex) {
            for (const textPropertyIdentifier in this.textProperties) {
                if (textPropertyIdentifier.includes(this.deltaIdentifier) && textPropertyIdentifier.includes(this.labelValueIdentifier)) {
                    this.textProperties[textPropertyIdentifier].text = this.valueToDisplayText(undefined);
                }
            }
        }
    }
}
