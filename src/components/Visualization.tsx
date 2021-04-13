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
    generateCostConfig,
} from './App';
import { InvestmentModel, ETFRatio } from '../model/InvestmentModel';
import { AreaChartD3 } from '../renderer/AreaChartD3';
import { CashflowBarChart } from '../renderer/CashflowBarChartD3';
import { D3ChartStrategy } from '../renderer/D3ChartStrategy';
import { IAppState } from './App';
import { percentageStringToFloat, stringToInt } from '../helpers/utils';

export interface IConfigOptions {
    costConfig: ICostConfiguration;
    taxFreeAmount: number;
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

    private areaChart: AreaChartD3 | undefined = undefined;
    private barChart: CashflowBarChart | undefined = undefined;

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
                etfIdentifierToRatio[etfProperties[etfIdentifier].symbol] = percentageStringToFloat(
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
     * @returns The investment model for the current state.
     */
    private _getInvestmentModel(etfIdentifierToRatio: ETFRatio): InvestmentModel {
        const configOptions: IConfigOptions = {
            taxFreeAmount: stringToInt(this.props[TAX_FREE_AMOUNT_IDENTIFIER].value),
            costConfig: generateCostConfig(this.props),
        };

        return new InvestmentModel(
            stringToInt(this.props[STARTING_CAPITAL_IDENTIFIER].value),
            stringToInt(this.props[MONTHLY_INVESTMENT_IDENTIFIER].value),
            percentageStringToFloat(this.props[YEARLY_INVESTMENT_INCREASE_IDENTIFIER].value),
            stringToInt(this.props[MONTHLY_PAYOUT_IDENTIFIER].value),
            percentageStringToFloat(this.props[YEARLY_PAYOUT_INCREASE_IDENTIFIER].value),
            stringToInt(this.props[SAVING_PHASE_IDENTIFIER].value),
            etfIdentifierToRatio,
            configOptions,
            stringToInt(this.props[AGE_IDENTIFIER].value),
            stringToInt(this.props[LIFE_EXPECTATION_IDENTIFIER].value)
        );
    }

    /**
     * Returns the tooltip date if it existed in the last visualization.
     *
     * @returns The tooltip date if defined.
     */
    private _getTooltipDate(): Date | undefined {
        if (this.areaChart != null) {
            return this.areaChart.tooltipDate;
        } else if (this.barChart != null) {
            return this.barChart.tooltipDate;
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
            if (
                this.props.isValid != null &&
                this.props.isValid &&
                this.firstSVGRef.current != null &&
                this.secondSVGRef.current != null
            ) {
                const etfIdentifierToRatio = this._getETFIdentifierToRatio();
                this.investmentModel = this._getInvestmentModel(etfIdentifierToRatio);
                const firstPayoutPhaseDate = this.investmentModel.getPayoutPhaseBeginDate();
                const correctLevelOfDetailInvestmentSteps = this.investmentModel.getInvestmentSteps(
                    this.props[DETAILED_GRAPH_DROPDOWN_IDENTIFIER].value
                );
                let tooltipDate = this._getTooltipDate();
                this.areaChart = new AreaChartD3(
                    correctLevelOfDetailInvestmentSteps,
                    this.firstSVGRef.current,
                    firstPayoutPhaseDate,
                    tooltipDate,
                    this._getYAxisExtent(this.areaChart),
                    etfIdentifierToRatio,
                    this.props[INFLATION_USED_FOR_TOTAL].value
                );
                this.areaChart.render();
                this.barChart = new CashflowBarChart(
                    correctLevelOfDetailInvestmentSteps,
                    this.secondSVGRef.current,
                    firstPayoutPhaseDate,
                    tooltipDate,
                    this._getYAxisExtent(this.barChart)
                );
                this.barChart.render();
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
