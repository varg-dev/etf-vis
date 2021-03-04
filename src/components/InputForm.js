import React from 'react';
import ForecastModel from '../helpers/modelCalculations';

const STARTING_CAPITAL_IDENTIFIER = 'startingCapital';
const MONTHLY_INVESTMENT_IDENTIFIER = 'monthlyInvestment';
const TRANSAKTION_COSTS_IDENTIFIER = 'transactionCosts';
const SAVING_PHASE_IDENTIFIER = 'savingPhase';
const PAYOUT_PHASE_IDENTIFIER = 'payoutPhase';
const AGE_IDENTIFIER = 'age';
const PREDICT_IDENTIFIER = 'predict';
const PREDICT_OUT_IDENTIFIER = 'predictOut';

const identifierToLabel = {
    [STARTING_CAPITAL_IDENTIFIER]: 'Starting Capital',
    [MONTHLY_INVESTMENT_IDENTIFIER]: 'Monthly Investment',
    [TRANSAKTION_COSTS_IDENTIFIER]: 'Transaction Costs',
    [SAVING_PHASE_IDENTIFIER]: 'Saving Phase',
    [PAYOUT_PHASE_IDENTIFIER]: 'Payout Phase',
    [AGE_IDENTIFIER]: 'Your Age',
};

class InputForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            [STARTING_CAPITAL_IDENTIFIER]: 10000,
            [MONTHLY_INVESTMENT_IDENTIFIER]: 100,
            [TRANSAKTION_COSTS_IDENTIFIER]: 5,
            [SAVING_PHASE_IDENTIFIER]: 40,
            [PAYOUT_PHASE_IDENTIFIER]: 20,
            [AGE_IDENTIFIER]: 30,
            [PREDICT_IDENTIFIER]: new Date('2021-06-01').toISOString().slice(0, 10),
            [PREDICT_OUT_IDENTIFIER]: 0,
        };
        this.forecastModel = new ForecastModel('demo');
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(changedValue, changedStateIdentifier) {
        this.setState({ [changedStateIdentifier]: changedValue });
        console.log(`State ${changedStateIdentifier} changed value to ${changedValue}.`);
    }

    render() {
        return (
            <React.Fragment>
                <form>
                    {Object.keys(this.state).map(stateIdentifier => (
                        <InputFormElement
                            key={stateIdentifier}
                            label={identifierToLabel[stateIdentifier]}
                            value={this.state[stateIdentifier]}
                            onValueChange={this.handleChange}
                            stateIdentifier={stateIdentifier}
                        />
                    ))}
                </form>
                <label>
                    Predict Date:
                    <input
                        key={PREDICT_IDENTIFIER}
                        type="text"
                        value={this.state[PREDICT_IDENTIFIER]}
                        onChange={e => {
                            const newDate = new Date(e.target.value);
                            this.handleChange(e.target.value, PREDICT_IDENTIFIER);
                            console.log(newDate);
                            console.log(newDate.getTime());
                            if (newDate != null && !isNaN(newDate.getTime())) {
                                this.forecastModel
                                    .predict('IBM', newDate)
                                    .then(e => this.handleChange(e, PREDICT_OUT_IDENTIFIER));
                            }
                        }}
                    />
                </label>
                <label>
                    Prediction:
                    <p key={PREDICT_OUT_IDENTIFIER}>{this.state[PREDICT_OUT_IDENTIFIER]}</p>
                </label>
            </React.Fragment>
        );
    }
}

class InputFormElement extends React.Component {
    constructor(props) {
        super(props);
        this.state = { value: '' };
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(e) {
        this.props.onValueChange(e.target.value, this.props.stateIdentifier);
    }

    render() {
        return (
            <label>
                {this.props.label}
                <input type="text" value={this.props.value} onChange={this.handleChange} />
            </label>
        );
    }
}

export default InputForm;
