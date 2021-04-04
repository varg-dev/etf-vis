import React from 'react';
import {
    STARTING_CAPITAL_IDENTIFIER,
    MONTHLY_INVESTMENT_IDENTIFIER,
    SAVING_PHASE_IDENTIFIER,
    AGE_IDENTIFIER,
    TAX_FREE_AMOUNT_IDENTIFIER,
    MONTHLY_PAYOUT_IDENTIFIER,
    LIFE_EXPECTATION_IDENTIFIER,
    DETAILED_GRAPH_DROPDOWN_IDENTIFIER,
    Y_AXIS_LOCK_IDENTIFIER,
    generateCostConfig,
} from './App';
import { InvestmentModel, ETFRatio } from '../model/InvestmentModel';
import AreaChartD3 from '../renderer/AreaChartD3';
import CashflowBarChart from '../renderer/CashflowBarChartD3';
import { D3ChartStrategy } from '../renderer/D3ChartStrategy';
import { AppState } from './App';

export interface ConfigOptions {
    costConfig: CostConfiguration;
    taxFreeAmount: number;
}

export interface CostConfiguration {
    percentageCosts: number;
    fixedCosts: number;
}

export class Visualization extends React.Component<AppState, {}> {
    private firstSVGRef = React.createRef<HTMLDivElement>();
    private secondSVGRef = React.createRef<HTMLDivElement>();

    private areaChart: AreaChartD3 | undefined = undefined;
    private barChart: CashflowBarChart | undefined = undefined;

    private investmentModel: InvestmentModel | undefined = undefined;

    getInvestmentModel() {
        const etfIdentifierToRatio: ETFRatio = {};
        const etfProperties = this.props.etfDropdownSelection.elements;
        for (const etfIdentifier in etfProperties) {
            if (etfProperties[etfIdentifier].selected) {
                etfIdentifierToRatio[etfProperties[etfIdentifier].symbol] = etfProperties[etfIdentifier].percentage;
            }
        }
        const configOptions: ConfigOptions = {
            taxFreeAmount: this.props[TAX_FREE_AMOUNT_IDENTIFIER].value,
            costConfig: generateCostConfig(this.props),
        };

        return new InvestmentModel(
            this.props[STARTING_CAPITAL_IDENTIFIER].value,
            this.props[MONTHLY_INVESTMENT_IDENTIFIER].value,
            this.props[MONTHLY_PAYOUT_IDENTIFIER].value,
            this.props[SAVING_PHASE_IDENTIFIER].value,
            etfIdentifierToRatio,
            configOptions,
            this.props[AGE_IDENTIFIER].value,
            this.props[LIFE_EXPECTATION_IDENTIFIER].value
        );
    }

    getTooltipDate() {
        if (this.areaChart != null) {
            return this.areaChart.tooltipDate;
        } else if (this.barChart != null) {
            return this.barChart.tooltipDate;
        } else {
            return undefined;
        }
    }

    getYAxisExtent(diagram: D3ChartStrategy | undefined) {
        return diagram != null && this.props[Y_AXIS_LOCK_IDENTIFIER].value ? diagram.yExtent : undefined;
    }

    drawVisualization() {
        D3ChartStrategy.reset();
        try {
            if (this.props.isValid != null && this.props.isValid) {
                this.investmentModel = this.getInvestmentModel();
                const firstPayoutPhaseDate = this.investmentModel.getPayoutPhaseBeginDate();
                const correctLevelOfDetailInvestmentSteps = this.investmentModel.getInvestmentSteps(
                    this.props[DETAILED_GRAPH_DROPDOWN_IDENTIFIER].value
                );
                let tooltipDate = this.getTooltipDate();
                this.areaChart = new AreaChartD3(
                    correctLevelOfDetailInvestmentSteps,
                    this.firstSVGRef.current,
                    firstPayoutPhaseDate,
                    tooltipDate,
                    this.getYAxisExtent(this.areaChart)
                );
                this.areaChart.render();
                this.barChart = new CashflowBarChart(
                    correctLevelOfDetailInvestmentSteps,
                    this.secondSVGRef.current,
                    firstPayoutPhaseDate,
                    tooltipDate,
                    this.getYAxisExtent(this.barChart)
                );
                this.barChart.render();
            }
        } catch (e) {
            console.error(e);
        }
    }

    async componentDidMount() {
        this.drawVisualization();
    }

    componentDidUpdate() {
        this.drawVisualization();
    }
    render() {
        return (
            <React.Fragment>
                <div ref={this.secondSVGRef}></div>
                <div ref={this.firstSVGRef}></div>
            </React.Fragment>
        );
    }
}

export default Visualization;
