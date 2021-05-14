import * as d3 from 'd3';
import {
    getTotalShareValue,
    getTotalDividendShareValue,
    getSumNewPayout,
    InvestmentStep,
    NegativeInvestmentStepIdentifier,
    ETFRatio,
} from '../model/InvestmentModel';
import { ETFIdentifier } from '../model/ForecastModel';
import { D3ChartStrategy, generateLabel, DataArrayEntry } from './D3ChartStrategy';
import { cashflowChartColors, payoutIdentifier, investedIdentifier } from './CashflowBarChartD3';
import { ETF_SYMBOL_TO_NAME } from '../components/App';

export interface IDataToIndex {
    [identifier: string]: number;
}

type ETFIdentifierToColors = { [key in ETFIdentifier]: { total: string; invested: string } };

type NegativeInvestmentToColorMap = { [key in NegativeInvestmentStepIdentifier]: string };

export const captionSpaceForDeltaValues = 180;

/**
 * A class that draws an area chart that contains the value of costs, taxes,
 * inflation and the total value and invested value of all used ETFs.
 */
export class AreaChartD3 extends D3ChartStrategy {
    // Color schema taken from: https://colorbrewer2.org/#type=qualitative&scheme=Paired&n=11 and slightly adjusted.
    private readonly etfLineColors: ETFIdentifierToColors = {
        'SP5C.PAR': { total: '#1f78b4', invested: '#a6cee3' },
        ESGE: { total: '#33a02c', invested: '#b2df8a' },
        SUSA: { total: '#ff7f00', invested: '#fdbf6f' },
    };
    private totalValueIndex = -1;

    private readonly negativeColors: NegativeInvestmentToColorMap = {
        inflation: '#f7528e',
        totalCosts: '#6a3d9a',
        totalTaxes: '#e31a1c',
    };
    private readonly negativeLabels: NegativeInvestmentStepIdentifier[] = ['totalCosts', 'totalTaxes', 'inflation'];
    private readonly investedIdentifier = 'invested';
    private readonly capitalIdentifier = 'capital';

    private etfIdentifiers: ETFIdentifier[];
    private previousInvestmentSteps: InvestmentStep[] | undefined;
    protected dataToIndex: IDataToIndex = {};
    protected subtractInflationFromTotal: boolean;

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
    protected _prepareData() {
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
        this.totalValueIndex = this.maxIndex;

        this.dataArray = [];
        for (let i = 0; i < currentIdx; i++) {
            this.dataArray.push([]);
        }
        for (const investmentStep of this.investmentSteps) {
            this.dataArray[this.dataToIndex.totalCosts].push({
                yStart: 0,
                yEnd: -investmentStep.totalCosts,
                date: investmentStep.date,
                color: this.negativeColors.totalCosts,
            });
            this.dataArray[this.dataToIndex.totalTaxes].push({
                yStart: -investmentStep.totalCosts,
                yEnd: -investmentStep.totalCosts - investmentStep.totalTaxes,
                date: investmentStep.date,
                color: this.negativeColors.totalTaxes,
            });
            this.dataArray[this.dataToIndex.inflation].push({
                yStart: -investmentStep.totalCosts - investmentStep.totalTaxes,
                yEnd: -investmentStep.totalCosts - investmentStep.totalTaxes - investmentStep.inflation,
                date: investmentStep.date,
                color: this.negativeColors.inflation,
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
     * Draws all the lines of the chart. I.e. the total value line.
     */
    protected _drawLines() {
        // Draw total line.
        this.svg
            .append('path')
            .datum(this.dataArray[this.totalValueIndex])
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
    protected _drawContent() {
        this._drawArea();
        this._drawLines();
    }

    /**
     * Draws the stacked areas of the diagram.
     */
    protected _drawArea() {
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
    protected _prepareText() {
        super._prepareText();
        const paddingH = this.standardFontSize * 0.4;

        this.addNegativeLabels(paddingH);
        this.addETFLabels(paddingH);
        this.addTotalLabel();

        const yOffset = this.height * 1.1;
        const xPadding = this.width / this.negativeLabels.length;
        // Add delta labels.
        this.addDeltaLabels(yOffset, paddingH, xPadding);
    }

    /**
     * Adds the delta labels including the heading.
     *
     * @param yOffset The y offset of the delta text area.
     * @param paddingH The height padding.
     * @param xRowOffset The row offset.
     */
    private addDeltaLabels(yOffset: number, paddingH: number, xRowOffset: number) {
        this.addDeltaHeadingText(yOffset);
        this.addNegativeDeltaLabels(yOffset, paddingH, xRowOffset);

        const numberOfEntriesPerRow = 3;
        this.addETFDeltaLabels(yOffset, paddingH, numberOfEntriesPerRow);

        const totalRowYPos = yOffset + this.standardFontSize * 2 + paddingH;
        this.addTotalDeltaLabel(numberOfEntriesPerRow, totalRowYPos);
        this.addPayoutAndInvestedDeltaLabels(numberOfEntriesPerRow, totalRowYPos);
    }

    /**
     * Adds the total delta label.
     *
     * @param numberOfEntriesPerRow The number of entries per row.
     * @param totalRowYPos The y position of the row that contains the total label.
     */
    private addTotalDeltaLabel(numberOfEntriesPerRow: number, totalRowYPos: number) {
        this.addTextProperty(this.totalIdentifier + this.deltaIdentifier, {
            text: generateLabel(this.totalIdentifier),
            x: (this.width / numberOfEntriesPerRow) * 0,
            y: totalRowYPos,
            color: this.totalColor,
        });
        this.addTextProperty(this.totalIdentifier + this.deltaIdentifier + this.labelValueIdentifier, {
            text: this.valueToDisplayText(undefined),
            x: (this.width / numberOfEntriesPerRow) * 0 + this.valueTextOffset,
            y: totalRowYPos,
            color: this.totalColor,
            fontFamily: this.monospaceFont,
            textAnchor: this.endTextAnchor,
        });
    }

    /**
     * Adds the etf delta labels.
     *
     * @param yOffset The y offset of the delta text area.
     * @param paddingH The height padding.
     * @param numberOfEntriesPerRow The number of entries per row.
     */
    private addETFDeltaLabels(yOffset: number, paddingH: number, numberOfEntriesPerRow: number) {
        for (let i = 0; i < this.etfIdentifiers.length; i++) {
            // ETF Label.
            const yPos = yOffset + (this.standardFontSize + paddingH) * (i + 3);
            this.addTextProperty(this.etfIdentifiers[i] + this.deltaIdentifier, {
                text: ETF_SYMBOL_TO_NAME[this.etfIdentifiers[i]],
                x: (this.width / numberOfEntriesPerRow) * 0,
                y: yPos,
                color: this.etfLineColors[this.etfIdentifiers[i]].total,
            });
            // Total.
            this.addTextProperty(this.etfIdentifiers[i] + this.deltaIdentifier + this.totalIdentifier, {
                text: generateLabel(this.totalIdentifier),
                x: (this.width / numberOfEntriesPerRow) * 1,
                y: yPos,
                color: this.etfLineColors[this.etfIdentifiers[i]].total,
            });
            this.addTextProperty(
                this.etfIdentifiers[i] + this.deltaIdentifier + this.labelValueIdentifier + this.totalIdentifier,
                {
                    text: this.valueToDisplayText(undefined),
                    x: (this.width / numberOfEntriesPerRow) * 1 + this.valueTextOffset,
                    y: yPos,
                    color: this.etfLineColors[this.etfIdentifiers[i]].total,
                    fontFamily: this.monospaceFont,
                    textAnchor: this.endTextAnchor,
                }
            );
            // Invested
            this.addTextProperty(this.etfIdentifiers[i] + this.deltaIdentifier + this.investedIdentifier, {
                text: generateLabel(this.investedIdentifier),
                x: (this.width / numberOfEntriesPerRow) * 2,
                y: yPos,
                color: this.etfLineColors[this.etfIdentifiers[i]].invested,
            });
            this.addTextProperty(
                this.etfIdentifiers[i] + this.deltaIdentifier + this.labelValueIdentifier + this.investedIdentifier,
                {
                    text: this.valueToDisplayText(undefined),
                    x: (this.width / numberOfEntriesPerRow) * 2 + this.valueTextOffset,
                    y: yPos,
                    color: this.etfLineColors[this.etfIdentifiers[i]].invested,
                    fontFamily: this.monospaceFont,
                    textAnchor: this.endTextAnchor,
                }
            );
        }
    }

    /**
     * Adds the delta payout and invested label.
     * @param numberOfEntriesPerRow The number of entries per row.
     * @param totalRowYPos The y position of the row that contains the payout and invested label.
     */
    private addPayoutAndInvestedDeltaLabels(numberOfEntriesPerRow: number, totalRowYPos: number) {
        this.textProperties[payoutIdentifier + this.deltaIdentifier] = {
            text: generateLabel(payoutIdentifier),
            x: (this.width / numberOfEntriesPerRow) * 1,
            y: totalRowYPos,
            fontSize: this.standardFontSize,
            fontFamily: this.standardFont,
            textAnchor: this.startTextAnchor,
            fontWeight: this.boldText,
            color: cashflowChartColors[payoutIdentifier].second,
        };

        this.textProperties[payoutIdentifier + this.deltaIdentifier + this.labelValueIdentifier] = {
            text: this.valueToDisplayText(undefined),
            x: (this.width / numberOfEntriesPerRow) * 1 + this.valueTextOffset,
            y: totalRowYPos,
            fontSize: this.standardFontSize,
            fontFamily: this.monospaceFont,
            textAnchor: this.endTextAnchor,
            fontWeight: this.boldText,
            color: cashflowChartColors[payoutIdentifier].second,
        };

        this.textProperties[investedIdentifier + this.deltaIdentifier] = {
            text: generateLabel(investedIdentifier),
            x: (this.width / numberOfEntriesPerRow) * 2,
            y: totalRowYPos,
            fontSize: this.standardFontSize,
            fontFamily: this.standardFont,
            textAnchor: this.startTextAnchor,
            fontWeight: this.boldText,
            color: cashflowChartColors[investedIdentifier].second,
        };

        this.textProperties[investedIdentifier + this.deltaIdentifier + this.labelValueIdentifier] = {
            text: this.valueToDisplayText(undefined),
            x: (this.width / numberOfEntriesPerRow) * 2 + this.valueTextOffset,
            y: totalRowYPos,
            fontSize: this.standardFontSize,
            fontFamily: this.monospaceFont,
            textAnchor: this.endTextAnchor,
            fontWeight: this.boldText,
            color: cashflowChartColors[investedIdentifier].second,
        };
    }

    /**
     * Adds the negative delta labels (costs, taxes, inflation).
     *
     * @param yOffset The y offset of the delta text area.
     * @param paddingH The height padding.
     * @param xRowOffset The row offset.
     */
    private addNegativeDeltaLabels(yOffset: number, paddingH: number, xRowOffset: number) {
        for (let i = 0; i < this.negativeLabels.length; i++) {
            const yPos = yOffset + (this.standardFontSize + paddingH) * (3.5 + this.etfIdentifiers.length);
            const color = this.negativeColors[this.negativeLabels[i]];
            this.addTextProperty(this.negativeLabels[i] + this.deltaIdentifier, {
                text: generateLabel(this.negativeLabels[i]),
                x: xRowOffset * i,
                y: yPos,
                color: color,
            });
            this.addTextProperty(this.negativeLabels[i] + this.deltaIdentifier + this.labelValueIdentifier, {
                text: this.valueToDisplayText(undefined),
                x: xRowOffset * i + this.valueTextOffset,
                y: yPos,
                color: color,
                fontFamily: this.monospaceFont,
                textAnchor: this.endTextAnchor,
            });
        }
    }

    /**
     * Adds the delta area heading.
     *
     * @param yOffset The y offset of the delta text area.
     */
    private addDeltaHeadingText(yOffset: number) {
        this.addTextProperty(this.deltaIdentifier, {
            text: 'Differences to Previous Configuration:',
            x: this.xScale(
                this.dateExtent[0].valueOf() + (this.dateExtent[1].valueOf() - this.dateExtent[0].valueOf()) / 2
            ),
            y: yOffset + this.standardFontSize,
            color: 'black',
            textAnchor: 'middle',
        });
    }

    /**
     * Adds the total label.
     */
    private addTotalLabel() {
        this.addTextProperty(this.totalIdentifier, {
            text: generateLabel(this.totalIdentifier),
            x: this.xTextOffset,
            y: this.yScale(this.yExtent[1]),
            color: this.totalColor,
        });
        this.addTextProperty(this.totalIdentifier + this.labelValueIdentifier, {
            text: this.valueToDisplayText(undefined),
            x: this.xTextOffset + this.valueTextOffset,
            y: this.yScale(this.yExtent[1]),
            color: this.totalColor,
            fontFamily: this.monospaceFont,
            textAnchor: this.endTextAnchor,
        });
    }

    /**
     * Adds all active ETF labels. Per ETF the invested and total amount are added.
     */
    private addETFLabels(paddingH: number) {
        for (let i = 0; i < this.etfIdentifiers.length; i++) {
            // ETF Label.
            this.addTextProperty(this.etfIdentifiers[i], {
                text: ETF_SYMBOL_TO_NAME[this.etfIdentifiers[i]],
                x: this.xTextOffset,
                y: this.yScale(0) - (this.standardFontSize + paddingH) * i * 3 - 2 * this.standardFontSize,
                color: this.etfLineColors[this.etfIdentifiers[i]].total,
            });
            // Total
            this.addTextProperty(this.etfIdentifiers[i] + this.totalIdentifier, {
                text: generateLabel(this.totalIdentifier),
                x: this.xTextOffset,
                y: this.yScale(0) - (this.standardFontSize + paddingH) * i * 3 - 1 * this.standardFontSize,
                color: this.etfLineColors[this.etfIdentifiers[i]].total,
            });
            this.addTextProperty(this.etfIdentifiers[i] + this.labelValueIdentifier + this.totalIdentifier, {
                text: this.valueToDisplayText(undefined),
                x: this.xTextOffset + this.valueTextOffset,
                y: this.yScale(0) - (this.standardFontSize + paddingH) * i * 3 - 1 * this.standardFontSize,
                color: this.etfLineColors[this.etfIdentifiers[i]].total,
                fontFamily: this.monospaceFont,
                textAnchor: this.endTextAnchor,
            });
            // Invested
            this.addTextProperty(this.etfIdentifiers[i] + this.investedIdentifier, {
                text: generateLabel(this.investedIdentifier),
                x: this.xTextOffset,
                y: this.yScale(0) - (this.standardFontSize + paddingH) * i * 3 - 0 * this.standardFontSize,
                color: this.etfLineColors[this.etfIdentifiers[i]].invested,
            });
            this.addTextProperty(this.etfIdentifiers[i] + this.labelValueIdentifier + this.investedIdentifier, {
                text: this.valueToDisplayText(undefined),
                x: this.xTextOffset + this.valueTextOffset,
                y: this.yScale(0) - (this.standardFontSize + paddingH) * i * 3 - 0 * this.standardFontSize,
                color: this.etfLineColors[this.etfIdentifiers[i]].invested,
                fontFamily: this.monospaceFont,
                textAnchor: this.endTextAnchor,
            });
        }
    }

    /**
     * Adds all negative labels (taxes, costs, inflation).
     */
    private addNegativeLabels(paddingH: number) {
        for (let i = 0; i < this.negativeLabels.length; i++) {
            const yPos = this.yScale(0) + (this.standardFontSize + paddingH) * (i + 1);
            const color = this.negativeColors[this.negativeLabels[i]];
            this.addTextProperty(this.negativeLabels[i], {
                text: generateLabel(this.negativeLabels[i]),
                x: this.xTextOffset,
                y: yPos,
                color: color,
            });
            this.addTextProperty(this.negativeLabels[i] + this.labelValueIdentifier, {
                text: this.valueToDisplayText(undefined),
                x: this.xTextOffset + this.valueTextOffset,
                y: yPos,
                color: color,
                fontFamily: this.monospaceFont,
                textAnchor: this.endTextAnchor,
            });
        }
    }

    /**
     * Updates the textProperties according to the investment step the tooltip is currently on.
     *
     * @param investmentStepIndex The index of the investment step of at the current mouse position.
     */
    protected _updateTooltip(investmentStepIndex: number) {
        // Update ETF Values.
        for (const etfIdentifier of this.etfIdentifiers) {
            const totalValue = getTotalShareValue(etfIdentifier, this.investmentSteps[investmentStepIndex]);
            const totalDividendValue = getTotalDividendShareValue(
                etfIdentifier,
                this.investmentSteps[investmentStepIndex]
            );
            const investedValue = totalValue - totalDividendValue;
            this.textProperties[etfIdentifier + this.labelValueIdentifier + this.investedIdentifier].text =
                this.valueToDisplayText(investedValue, true);
            this.textProperties[etfIdentifier + this.labelValueIdentifier + this.totalIdentifier].text =
                this.valueToDisplayText(totalValue, true);
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
        this.textProperties[this.totalIdentifier + this.labelValueIdentifier].text =
            this.valueToDisplayText(totalValue);

        // Set the delta Values if the previous model exists.
        if (this.previousInvestmentSteps != null && this.previousInvestmentSteps.length > investmentStepIndex) {
            // Negative labels.
            for (const negativeLabel of this.negativeLabels) {
                const currentValue = this.investmentSteps[investmentStepIndex][negativeLabel];
                const previousValue = this.previousInvestmentSteps[investmentStepIndex][negativeLabel];
                const value = currentValue - previousValue;
                this.textProperties[negativeLabel + this.deltaIdentifier + this.labelValueIdentifier].text =
                    this.valueToDisplayText(value, true);
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
            this.textProperties[this.totalIdentifier + this.deltaIdentifier + this.labelValueIdentifier].text =
                this.valueToDisplayText(totalValue - previousTotalValue);

            // Payout.
            const previousPayout = getSumNewPayout(this.previousInvestmentSteps[investmentStepIndex]);
            const currentPayout = getSumNewPayout(this.investmentSteps[investmentStepIndex]);
            this.textProperties[payoutIdentifier + this.deltaIdentifier + this.labelValueIdentifier].text =
                this.valueToDisplayText(currentPayout - previousPayout);

            // Invested.
            const previousInvested = this.previousInvestmentSteps[investmentStepIndex].newInvestment;
            const currentInvested = this.investmentSteps[investmentStepIndex].newInvestment;
            this.textProperties[investedIdentifier + this.deltaIdentifier + this.labelValueIdentifier].text =
                this.valueToDisplayText(currentInvested - previousInvested);
            // Set all delta value to undefined if the investmentStep is not included in the previous investment steps.
        } else if (this.previousInvestmentSteps != null && this.previousInvestmentSteps.length <= investmentStepIndex) {
            for (const textPropertyIdentifier in this.textProperties) {
                if (
                    textPropertyIdentifier.includes(this.deltaIdentifier) &&
                    textPropertyIdentifier.includes(this.labelValueIdentifier)
                ) {
                    this.textProperties[textPropertyIdentifier].text = this.valueToDisplayText(undefined);
                }
            }
        }
    }
}
