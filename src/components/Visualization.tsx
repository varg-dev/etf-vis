import React from 'react';
import {
    STARTING_CAPITAL_IDENTIFIER,
    MONTHLY_INVESTMENT_IDENTIFIER,
    YEARLY_INVESTMENT_INCREASE_IDENTIFIER,
    SAVING_PHASE_IDENTIFIER,
    AGE_IDENTIFIER,
    TAX_FREE_AMOUNT_IDENTIFIER,
    MONTHLY_PAYOUT_IDENTIFIER,
    YEARLY_PAYOUT_INCREASE_IDENTIFIER,
    LIFE_EXPECTATION_IDENTIFIER,
    DETAILED_GRAPH_DROPDOWN_IDENTIFIER,
    Y_AXIS_LOCK_IDENTIFIER,
    INFLATION_USED_FOR_TOTAL,
    USE_DISTRIBUTION_MODEL,
    MIDDLE_CONFIDENCE,
    USE_CONFIDENCE_VISUALIZATION,
    generateCostConfig,
    MIN_CONFIDENCE,
    MAX_CONFIDENCE,
} from './App';
import { InvestmentModel, ETFRatio } from '../model/InvestmentModel';
import { AreaChartD3 } from '../renderer/AreaChartD3';
import { CashflowBarChart } from '../renderer/CashflowBarChartD3';
import { ConfidenceChartD3 } from '../renderer/ConfidenceChartD3';
import { D3ChartStrategy } from '../renderer/D3ChartStrategy';
import { IAppState } from './App';
import { percentageToFloat } from '../helpers/utils';
import { NumberInputStateIdentifier } from './TextInputElement';

export interface IConfigOptions {
    costConfig: ICostConfiguration;
    taxFreeAmount: number;
    confidence: number;
}

export interface ICostConfiguration {
    percentageCosts: number;
    fixedCosts: number;
}

/**
 * React component which handles the visualization.
 * It re renders the visualizations each time the state changes.
 */
export class Visualization extends React.Component<IAppState, {}> {
    private firstSVGRef = React.createRef<HTMLDivElement>();
    private secondSVGRef = React.createRef<HTMLDivElement>();

    private trendChart: AreaChartD3 | ConfidenceChartD3 | undefined = undefined;
    private cashflowChart: CashflowBarChart | undefined = undefined;

    private investmentModel: InvestmentModel | undefined = undefined;

    /**
     * Generates the etf to ratio mapping for all currently selected etfs.
     *
     * @returns The etf to ratio mapping.
     */
    private _getETFIdentifierToRatio(): ETFRatio {
        const etfIdentifierToRatio: ETFRatio = {};
        const etfProperties = this.props.etfDropdownSelection.elements;
        for (const etfIdentifier in etfProperties) {
            if (etfProperties[etfIdentifier].selected) {
                etfIdentifierToRatio[etfProperties[etfIdentifier].symbol] = percentageToFloat(
                    etfProperties[etfIdentifier].value
                );
            }
        }
        return etfIdentifierToRatio;
    }

    /**
     * Calculates the investment model for the current properties.
     *
     * @param etfIdentifierToRatio The etfIdentifier mapping to the ratio.
     * @param confidenceIdentifier The confidence identifier which should be used for the model.
     * @returns The investment model for the current state.
     */
    private _getInvestmentModel(
        etfIdentifierToRatio: ETFRatio,
        confidenceIdentifier: NumberInputStateIdentifier
    ): InvestmentModel {
        const configOptions: IConfigOptions = {
            taxFreeAmount: this.props[TAX_FREE_AMOUNT_IDENTIFIER].value,
            costConfig: generateCostConfig(this.props, true),
            confidence: percentageToFloat(this.props[confidenceIdentifier].value),
        };

        return new InvestmentModel(
            this.props[STARTING_CAPITAL_IDENTIFIER].value,
            this.props[MONTHLY_INVESTMENT_IDENTIFIER].value,
            percentageToFloat(this.props[YEARLY_INVESTMENT_INCREASE_IDENTIFIER].value),
            this.props[MONTHLY_PAYOUT_IDENTIFIER].value,
            percentageToFloat(this.props[YEARLY_PAYOUT_INCREASE_IDENTIFIER].value),
            this.props[SAVING_PHASE_IDENTIFIER].value,
            etfIdentifierToRatio,
            configOptions,
            this.props[AGE_IDENTIFIER].value,
            this.props[LIFE_EXPECTATION_IDENTIFIER].value,
            this.props[USE_DISTRIBUTION_MODEL].value
        );
    }

    /**
     * Returns the tooltip date if it existed in the last visualization.
     *
     * @returns The tooltip date if defined.
     */
    private _getTooltipDate(): Date | undefined {
        if (this.trendChart != null) {
            return this.trendChart.tooltipDate;
        } else if (this.cashflowChart != null) {
            return this.cashflowChart.tooltipDate;
        } else {
            return undefined;
        }
    }

    /**
     * Returns the y extent if it exists and the y axis should be locked.
     *
     * @returns The y extent if defined and axis should be locked.
     */
    private _getYAxisExtent(diagram: D3ChartStrategy | undefined) {
        return diagram != null && this.props[Y_AXIS_LOCK_IDENTIFIER].value ? diagram.yExtent : undefined;
    }

    /**
     * Draws both charts.
     */
    private _drawVisualization() {
        D3ChartStrategy.reset();
        try {
            if (this.props.isValid && this.firstSVGRef.current != null && this.secondSVGRef.current != null) {
                const etfIdentifierToRatio = this._getETFIdentifierToRatio();
                const previousInvestmentSteps =
                    this.investmentModel != null
                        ? this.investmentModel.getInvestmentSteps(this.props[DETAILED_GRAPH_DROPDOWN_IDENTIFIER].value)
                        : undefined;
                this.investmentModel = this._getInvestmentModel(etfIdentifierToRatio, MIDDLE_CONFIDENCE);
                const firstPayoutPhaseDate = this.investmentModel.getPayoutPhaseBeginDate();
                const correctLevelOfDetailInvestmentSteps = this.investmentModel.getInvestmentSteps(
                    this.props[DETAILED_GRAPH_DROPDOWN_IDENTIFIER].value
                );
                let tooltipDate = this._getTooltipDate();
                if (!this.props[USE_CONFIDENCE_VISUALIZATION].value) {
                    this.trendChart = new AreaChartD3(
                        correctLevelOfDetailInvestmentSteps,
                        this.firstSVGRef.current,
                        firstPayoutPhaseDate,
                        tooltipDate,
                        this._getYAxisExtent(this.trendChart),
                        etfIdentifierToRatio,
                        this.props[INFLATION_USED_FOR_TOTAL].value,
                        previousInvestmentSteps
                    );
                    this.trendChart.render();
                } else {
                    this.trendChart = new ConfidenceChartD3(
                        correctLevelOfDetailInvestmentSteps,
                        this._getInvestmentModel(etfIdentifierToRatio, MIN_CONFIDENCE).getInvestmentSteps(
                            this.props[DETAILED_GRAPH_DROPDOWN_IDENTIFIER].value
                        ),
                        this._getInvestmentModel(etfIdentifierToRatio, MAX_CONFIDENCE).getInvestmentSteps(
                            this.props[DETAILED_GRAPH_DROPDOWN_IDENTIFIER].value
                        ),
                        this.firstSVGRef.current,
                        firstPayoutPhaseDate,
                        tooltipDate,
                        this._getYAxisExtent(this.trendChart),
                        etfIdentifierToRatio,
                        this.props[INFLATION_USED_FOR_TOTAL].value,
                        previousInvestmentSteps
                    );
                    this.trendChart.render();
                }
                this.cashflowChart = new CashflowBarChart(
                    correctLevelOfDetailInvestmentSteps,
                    this.secondSVGRef.current,
                    firstPayoutPhaseDate,
                    tooltipDate,
                    this._getYAxisExtent(this.cashflowChart)
                );
                this.cashflowChart.render();
            }
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * Draws the visualization if the component has been drawn for the first time.
     */
    componentDidMount() {
        this._drawVisualization();
    }

    /**
     * Draws the visualization if the state changed.
     */
    componentDidUpdate() {
        this._drawVisualization();
    }

    /**
     * Renders the divs with the references for the charts.
     *
     * @returns The divs holding the references for the charts.
     */
    render() {
        return (
            <React.Fragment>
                <div ref={this.secondSVGRef}></div>
                <div ref={this.firstSVGRef}></div>
            </React.Fragment>
        );
    }
}
