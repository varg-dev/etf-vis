import React from 'react';
import {
    STARTING_CAPITAL_IDENTIFIER,
    MONTHLY_INVESTMENT_IDENTIFIER,
    TRANSACTION_COSTS_IDENTIFIER,
    TRANSACTION_COSTS_TYPE_IDENTIFIER,
    SAVING_PHASE_IDENTIFIER,
    AGE_IDENTIFIER,
    TAX_FREE_AMOUNT_IDENTIFIER,
    MONTHLY_PAYOUT_IDENTIFIER,
    LIFE_EXPECTATION_IDENTIFIER,
    DETAILED_GRAPH_DROPDOWN_IDENTIFIER,
    Y_AXIS_LOCK_IDENTIFIER
} from './App';
import { InvestmentModel } from '../model/InvestmentModel';
import AreaChartD3 from '../renderer/AreaChartD3';
import CashflowBarChart from '../renderer/CashflowBarChartD3';
import { D3ChartStrategy } from '../renderer/D3ChartStrategy';

function generateCostConfig(state) {
    if (state[TRANSACTION_COSTS_TYPE_IDENTIFIER]) {
        return { percentageCosts: 0.0, fixedCosts: state[TRANSACTION_COSTS_IDENTIFIER] };
    } else {
        return { percentageCosts: state[TRANSACTION_COSTS_IDENTIFIER], fixedCosts: 0.0 };
    }
}

export class Visualization extends React.Component {
    constructor(props) {
        super(props);

        this.firstSVGRef = React.createRef();
        this.secondSVGRef = React.createRef();
    }

    getInvestmentModel() {
        const etfIdentifierToRatio = {};
        for (const etfIdentifier in this.props.etfProperties) {
            if (this.props.etfProperties[etfIdentifier].selected) {
                etfIdentifierToRatio[this.props.etfProperties[etfIdentifier].symbol] = this.props.etfProperties[
                    etfIdentifier
                ].percentage;
            }
        }

        return new InvestmentModel(
            this.props[STARTING_CAPITAL_IDENTIFIER],
            this.props[MONTHLY_INVESTMENT_IDENTIFIER],
            this.props[MONTHLY_PAYOUT_IDENTIFIER],
            this.props[SAVING_PHASE_IDENTIFIER],
            etfIdentifierToRatio,
            {
                taxFreeAmount: this.props[TAX_FREE_AMOUNT_IDENTIFIER],
                costConfig: generateCostConfig(this.props),
            },
            this.props[AGE_IDENTIFIER],
            this.props[LIFE_EXPECTATION_IDENTIFIER]
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

    getYAxisExtent(diagram){
        return diagram != null && this.props[Y_AXIS_LOCK_IDENTIFIER] ? diagram.yExtent : undefined;
    }

    drawVisualization() {
        D3ChartStrategy.reset();
        try {
            if (this.props.isValid != null && this.props.isValid) {
                this.investmentModel = this.getInvestmentModel();
            }
            const firstPayoutPhaseDate = this.investmentModel.payoutDates[0];
            const correctLevelOfDetailInvestmentSteps = this.investmentModel.getInvestmentSteps(
                this.props[DETAILED_GRAPH_DROPDOWN_IDENTIFIER]
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
