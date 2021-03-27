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
    LIFE_EXPECTATION,
} from './InputForm';
import ForecastModelSingleton from '../model/ForecastModel';
import { InvestmentModel } from '../model/InvestmentModel';
import LineChart3D from '../renderer/LineChartd3';
import CashflowBarChart from '../renderer/CashflowBarChartd3';

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
            this.props[LIFE_EXPECTATION]
        );
    }

    drawVisualization() {
        const investmentModel = this.getInvestmentModel();
        new LineChart3D().render(investmentModel.investmentSteps, this.firstSVGRef.current);
        new CashflowBarChart().render(investmentModel.investmentSteps, this.secondSVGRef.current);
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
                <div ref={this.firstSVGRef}></div>
                <div ref={this.secondSVGRef}></div>
            </React.Fragment>
        );
    }
}

export default Visualization;