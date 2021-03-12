import React from 'react';
import ForecastModel from '../model/ForecastModel';
import VisualizationModel from '../model/VisualizationModel';
import LineChart3D from '../renderer/LineChartd3';

const STARTING_CAPITAL_IDENTIFIER = 'startingCapital';
const MONTHLY_INVESTMENT_IDENTIFIER = 'monthlyInvestment';
const TRANSACTION_COSTS_IDENTIFIER = 'transactionCosts';
const TRANSACTION_COSTS_TYPE_IDENTIFIER = 'transactionCostsType';
const SAVING_PHASE_IDENTIFIER = 'savingPhase';
const PAYOUT_PHASE_IDENTIFIER = 'payoutPhase';
const AGE_IDENTIFIER = 'age';
const TAX_FREE_AMOUNT_IDENTIFIER = 'taxFreeAmount';

const identifierToLabel = {
    [STARTING_CAPITAL_IDENTIFIER]: 'Starting Capital',
    [MONTHLY_INVESTMENT_IDENTIFIER]: 'Monthly Investment',
    [TRANSACTION_COSTS_IDENTIFIER]: 'Transaction Costs',
    [TRANSACTION_COSTS_TYPE_IDENTIFIER]: 'Fixes Amount ?',
    [SAVING_PHASE_IDENTIFIER]: 'Saving Phase',
    [PAYOUT_PHASE_IDENTIFIER]: 'Payout Phase',
    [AGE_IDENTIFIER]: 'Your Age',
    [TAX_FREE_AMOUNT_IDENTIFIER]: 'Tax Free Amount',
};

class InputForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            [STARTING_CAPITAL_IDENTIFIER]: { value: 10000, type: 'text' },
            [MONTHLY_INVESTMENT_IDENTIFIER]: { value: 100, type: 'text' },
            [TRANSACTION_COSTS_IDENTIFIER]: { value: 0.005, type: 'text' },
            [TRANSACTION_COSTS_TYPE_IDENTIFIER]: { value: false, type: 'checkbox' },
            [SAVING_PHASE_IDENTIFIER]: { value: 40, type: 'text' },
            [PAYOUT_PHASE_IDENTIFIER]: { value: 20, type: 'text' },
            [AGE_IDENTIFIER]: { value: 30, type: 'text' },
            [TAX_FREE_AMOUNT_IDENTIFIER]: { value: 801, type: 'text' },
        };
        this.forecastModel = new ForecastModel('demo');
        this.handleChange = this.handleChange.bind(this);

        this.vis = new VisualizationModel(
            10000,
            100,
            40,
            { IBM: 1.0 },
            { percentageCosts: 0.0, fixedCosts: 5.0 },
            30,
            801
        );
        this.ref = React.createRef();
    }

    handleChange(changedValue, changedStateIdentifier) {
        this.setState({
            [changedStateIdentifier]: { value: changedValue, type: this.state[changedStateIdentifier].type },
        });
        console.log(`State ${changedStateIdentifier} changed value to ${changedValue}.`);
    }

    componentDidMount() {
        new LineChart3D().render(this.vis, this.ref.current);
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
