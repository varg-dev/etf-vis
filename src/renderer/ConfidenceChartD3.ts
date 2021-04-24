import * as d3 from 'd3';
import { ETFRatio, InvestmentStep, sumOfTotalValues } from '../model/InvestmentModel';
import { DataArrayEntry } from './D3ChartStrategy';
import { AreaChartD3 } from './AreaChartD3';

/**
 * A class that draws an area chart that contains the value of costs, taxes,
 * inflation and the total value and invested value of all used ETFs.
 */
export class ConfidenceChartD3 extends AreaChartD3 {
    private readonly confidenceColors = {
        minimumLine: '#e31a1c',
        maximumLine: '#00e396',
        middleLine: this.totalColor,
        area: '#a6d8fe',
    };
    private minInvestmentSteps: InvestmentStep[];
    private maxInvestmentSteps: InvestmentStep[];

    /**
     * Constructs the area chart by calling the base class constructor and determining all used ETFs.
     */
    constructor(
        investmentSteps: InvestmentStep[],
        minInvestmentSteps: InvestmentStep[],
        maxInvestmentSteps: InvestmentStep[],
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
            tooltipDate,
            yExtent,
            etfRatio,
            subtractInflationFromTotal,
            previousInvestmentSteps
        );
        this.minInvestmentSteps = minInvestmentSteps;
        this.maxInvestmentSteps = maxInvestmentSteps;
        this.subtractInflationFromTotal = subtractInflationFromTotal;
    }

    /**
     * Prepares all data from the investment model for rendering.
     */
    _prepareData() {
        this.dataToIndex = {
            areaConfidence: 0,
            middleConfidence: 1,
        };

        this.minIndex = this.dataToIndex.areaConfidence;
        this.maxIndex = this.dataToIndex.areaConfidence;

        this.dataArray = [];
        for (let i = 0; i < Object.keys(this.dataToIndex).length; i++) {
            this.dataArray.push([]);
        }
        for (let i = 0; i < this.investmentSteps.length; i++) {
            this.dataArray[this.dataToIndex.areaConfidence].push({
                yStart:
                    sumOfTotalValues(this.minInvestmentSteps[i]) -
                    (this.subtractInflationFromTotal ? this.minInvestmentSteps[i].inflation : 0),
                yEnd:
                    sumOfTotalValues(this.maxInvestmentSteps[i]) -
                    (this.subtractInflationFromTotal ? this.maxInvestmentSteps[i].inflation : 0),
                date: this.investmentSteps[i].date,
                color: this.confidenceColors.area,
            });
            console.log(
                this.dataArray[this.dataToIndex.areaConfidence][
                    this.dataArray[this.dataToIndex.areaConfidence].length - 1
                ]
            );
            const middleValue =
                sumOfTotalValues(this.investmentSteps[i]) -
                (this.subtractInflationFromTotal ? this.investmentSteps[i].inflation : 0);
            this.dataArray[this.dataToIndex.middleConfidence].push({
                yStart: middleValue,
                yEnd: middleValue,
                date: this.investmentSteps[i].date,
                color: this.confidenceColors.middleLine,
            });
        }
    }

    /**
     * Draws all lines of the chart. I.e. the middle line.
     */
    _drawLines() {
        const lineDataArray = [
            this.dataArray[this.dataToIndex.areaConfidence],
            this.dataArray[this.dataToIndex.areaConfidence],
            this.dataArray[this.dataToIndex.middleConfidence],
        ];
        const lookupIdentifier: ('yStart' | 'yEnd')[] = ['yStart', 'yEnd', 'yStart'];
        const confidenceColors = [
            this.confidenceColors.minimumLine,
            this.confidenceColors.maximumLine,
            this.confidenceColors.middleLine,
        ];
        for (let i = 0; i < lineDataArray.length; i++) {
            this.svg
                .append('path')
                .datum(lineDataArray[i])
                .style('stroke', confidenceColors[i])
                .style('stroke-width', this.lineStrokeWidth)
                .style('fill', 'none')
                .attr(
                    'd',
                    d3
                        .line<DataArrayEntry>()
                        .x(d => this.xScale(d.date))
                        .y((_, j) => {
                            return this.yScale(lineDataArray[i][j][lookupIdentifier[i]]);
                        })
                );
        }
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
        this.svg
            .append('g')
            .attr('class', 'area')
            .append('path')
            .datum(this.dataArray[this.dataToIndex.areaConfidence])
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
