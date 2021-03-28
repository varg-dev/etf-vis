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
    DETAILED_GRAPH_IDENTIFIER,
} from './InputForm';
import ForecastModelSingleton from '../model/ForecastModel';
import { InvestmentModel } from '../model/InvestmentModel';
import LineChartD3 from '../renderer/LineChartD3';
import CashflowBarChart from '../renderer/CashflowBarChartD3';
import { D3ChartStrategy } from '../renderer/D3ChartStrategy';

function generateCostConfig(state) {
    if (state[TRANSACTION_COSTS_TYPE_IDENTIFIER]) {
        return { percentageCosts: 0.0, fixedCosts: state[TRANSACTION_COSTS_IDENTIFIER] };
    } else {
        return { percentageCosts: state[TRANSACTION_COSTS_IDENTIFIER], fixedCosts: 0.0 };
    }
}

async function loadHistoricData() {
    ForecastModelSingleton.configure('demo');
    const forecast = ForecastModelSingleton.getInstance();
    await forecast.loadAndCacheHistoricalETFData('IBM');
    console.log('Finished loading the historic data.');
}

export class Visualization extends React.Component {
    constructor(props) {
        super(props);

        this.firstSVGRef = React.createRef();
        this.secondSVGRef = React.createRef();
    }

    getInvestmentModel() {
        return new InvestmentModel(
            this.props[STARTING_CAPITAL_IDENTIFIER],
            this.props[MONTHLY_INVESTMENT_IDENTIFIER],
            this.props[MONTHLY_PAYOUT_IDENTIFIER],
            this.props[SAVING_PHASE_IDENTIFIER],
            { IBM: 1.0 },
            {
                taxFreeAmount: this.props[TAX_FREE_AMOUNT_IDENTIFIER],
                costConfig: generateCostConfig(this.props),
            },
            this.props[AGE_IDENTIFIER],
            this.props[LIFE_EXPECTATION_IDENTIFIER]
        );
    }

    adjustInvestmentStepsToLevelOfDetail(investmentSteps) {
        if (this.props[DETAILED_GRAPH_IDENTIFIER]) {
            return investmentSteps;
        }
        const onlyViableMonth = investmentSteps[0].date.getMonth();
        return investmentSteps.filter(e => e.date.getMonth() === onlyViableMonth);
    }

    drawVisualization() {
        D3ChartStrategy.reset();
        const investmentModel = this.getInvestmentModel();
        const firstPayoutPhaseDate = investmentModel.payoutDates[0];
        const correctLevelOfDetailInvestmentSteps = this.adjustInvestmentStepsToLevelOfDetail(
            investmentModel.investmentSteps
        );
        new LineChartD3(correctLevelOfDetailInvestmentSteps, this.firstSVGRef.current, firstPayoutPhaseDate).render();
        new CashflowBarChart(
            correctLevelOfDetailInvestmentSteps,
            this.secondSVGRef.current,
            firstPayoutPhaseDate
        ).render();
    }

    async componentDidMount() {
        await loadHistoricData();
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
