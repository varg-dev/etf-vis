import React from 'react';
import ForecastModelSingleton from '../model/ForecastModel';
import VisualizationModel from '../model/VisualizationModel';
import { InvestmentModel } from '../model/InvestmentModel';
import LineChart3D from '../renderer/LineChartd3';

const STARTING_CAPITAL_IDENTIFIER = 'startingCapital';
const MONTHLY_INVESTMENT_IDENTIFIER = 'monthlyInvestment';
const TRANSACTION_COSTS_IDENTIFIER = 'transactionCosts';
const TRANSACTION_COSTS_TYPE_IDENTIFIER = 'transactionCostsType';
const SAVING_PHASE_IDENTIFIER = 'savingPhase';
const PAYOUT_PHASE_IDENTIFIER = 'payoutPhase';
const AGE_IDENTIFIER = 'age';
const TAX_FREE_AMOUNT_IDENTIFIER = 'taxFreeAmount';
const MONTHLY_PAYOUT_IDENTIFIER = 'monthlyPayout';
const LIFE_EXPECTATION = 'lifeExpectation';

const identifierToLabel = {
    [STARTING_CAPITAL_IDENTIFIER]: 'Starting Capital',
    [MONTHLY_INVESTMENT_IDENTIFIER]: 'Monthly Investment',
    [TRANSACTION_COSTS_IDENTIFIER]: 'Transaction Costs',
    [TRANSACTION_COSTS_TYPE_IDENTIFIER]: 'Fixes Amount ?',
    [SAVING_PHASE_IDENTIFIER]: 'Saving Phase',
    [PAYOUT_PHASE_IDENTIFIER]: 'Payout Phase',
    [AGE_IDENTIFIER]: 'Your Age',
    [TAX_FREE_AMOUNT_IDENTIFIER]: 'Tax Free Amount',
    [MONTHLY_INVESTMENT_IDENTIFIER]: 'Monthly Payout',
    [LIFE_EXPECTATION]: 'Life Expectation',
};

class InputForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            [STARTING_CAPITAL_IDENTIFIER]: { value: 10000, type: 'text' },
            [MONTHLY_INVESTMENT_IDENTIFIER]: { value: 100, type: 'text' },
            [MONTHLY_PAYOUT_IDENTIFIER]: { value: 1000, type: 'text' },
            [TRANSACTION_COSTS_IDENTIFIER]: { value: 0.005, type: 'text' },
            [TRANSACTION_COSTS_TYPE_IDENTIFIER]: { value: false, type: 'checkbox' },
            [SAVING_PHASE_IDENTIFIER]: { value: 40, type: 'text' },
            [PAYOUT_PHASE_IDENTIFIER]: { value: 20, type: 'text' },
            [AGE_IDENTIFIER]: { value: 30, type: 'text' },
            [TAX_FREE_AMOUNT_IDENTIFIER]: { value: 801, type: 'text' },
            [LIFE_EXPECTATION]: {value: 80, type: 'text'}
        };

        this.ref = React.createRef();
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(changedValue, changedStateIdentifier) {
        this.setState({
            [changedStateIdentifier]: { value: changedValue, type: this.state[changedStateIdentifier].type },
        });
        console.log(`State ${changedStateIdentifier} changed value to ${changedValue}.`);
    }

    getVisualizationModel() {
        return new InvestmentModel(
            this.state[STARTING_CAPITAL_IDENTIFIER].value,
            this.state[MONTHLY_INVESTMENT_IDENTIFIER].value,
            this.state[MONTHLY_PAYOUT_IDENTIFIER].value,
            this.state[SAVING_PHASE_IDENTIFIER].value,
            { IBM: 1.0 },
            {
                taxFreAmount: this.state[TAX_FREE_AMOUNT_IDENTIFIER].value,
                costConfig: { percentageCosts: 0.0, fixedCosts: 5.0 },
            },
            this.state[AGE_IDENTIFIER].value,
            this.state[LIFE_EXPECTATION].value,
        );
    }

    async componentDidMount() {
        ForecastModelSingleton.configure('demo');
        this.forecastModel = ForecastModelSingleton.getInstance();
        await this.forecastModel.loadAndCacheHistoricalETFData('IBM');

        new LineChart3D().render(this.getVisualizationModel(), this.ref.current);
    }

    componentDidUpdate() {
        new LineChart3D().render(this.getVisualizationModel(), this.ref.current);
    }

    render() {
        return (
            <React.Fragment>
                <form>
                    {Object.keys(this.state).map(stateIdentifier => (
                        <InputFormElement
                            key={stateIdentifier}
                            label={identifierToLabel[stateIdentifier]}
                            value={this.state[stateIdentifier].value}
                            type={this.state[stateIdentifier].type}
                            onValueChange={this.handleChange}
                            stateIdentifier={stateIdentifier}
                        />
                    ))}
                </form>
                <div ref={this.ref}></div>
            </React.Fragment>
        );
    }
}

class InputFormElement extends React.Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(e) {
        let newValue = e.target.value;
        if (this.props.type === 'checkbox') {
            newValue = !this.props.value;
        }
        this.props.onValueChange(newValue, this.props.stateIdentifier);
    }

    render() {
        return (
            <label>
                {this.props.label}
                <input type={this.props.type} value={this.props.value} onChange={this.handleChange} />
            </label>
        );
    }
}

export default InputForm;
