import React from 'react';
import { Visualization } from './Visualization';

export const STARTING_CAPITAL_IDENTIFIER = 'startingCapital';
export const MONTHLY_INVESTMENT_IDENTIFIER = 'monthlyInvestment';
export const TRANSACTION_COSTS_IDENTIFIER = 'transactionCosts';
export const TRANSACTION_COSTS_TYPE_IDENTIFIER = 'transactionCostsType';
export const SAVING_PHASE_IDENTIFIER = 'savingPhase';
export const AGE_IDENTIFIER = 'age';
export const TAX_FREE_AMOUNT_IDENTIFIER = 'taxFreeAmount';
export const MONTHLY_PAYOUT_IDENTIFIER = 'monthlyPayout';
export const LIFE_EXPECTATION = 'lifeExpectation';

const identifierToLabel = {
    [STARTING_CAPITAL_IDENTIFIER]: 'Starting Capital',
    [MONTHLY_INVESTMENT_IDENTIFIER]: 'Monthly Investment',
    [TRANSACTION_COSTS_IDENTIFIER]: 'Transaction Costs',
    [TRANSACTION_COSTS_TYPE_IDENTIFIER]: 'Fixes Amount',
    [SAVING_PHASE_IDENTIFIER]: 'Saving Phase',
    [AGE_IDENTIFIER]: 'Your Age',
    [TAX_FREE_AMOUNT_IDENTIFIER]: 'Tax Free Amount',
    [MONTHLY_PAYOUT_IDENTIFIER]: 'Monthly Payout',
    [LIFE_EXPECTATION]: 'Life Expectation',
};

function transformInputToInt(e, caller) {
    const intVal = parseInt(e.target.value);
    return isNaN(intVal) ? 0 : intVal;
}

function transformInputToFloat(e, caller) {
    const intVal = parseFloat(e.target.value);
    return isNaN(intVal) ? 0 : intVal;
}

function transformCheckboxInput(e, caller) {
    return !caller.props.value;
}

function constructVisualizationProps(state) {
    const props = {};
    for (const identifier in state) {
        props[identifier] = state[identifier].value;
    }
    return props;
}

class InputForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            [STARTING_CAPITAL_IDENTIFIER]: { value: 1000, type: 'text', transformFunction: transformInputToInt },
            [MONTHLY_INVESTMENT_IDENTIFIER]: { value: 100, type: 'text', transformFunction: transformInputToInt },
            [MONTHLY_PAYOUT_IDENTIFIER]: { value: 1000, type: 'text', transformFunction: transformInputToInt },
            [TRANSACTION_COSTS_IDENTIFIER]: { value: 0.005, type: 'text', transformFunction: transformInputToFloat },
            [TRANSACTION_COSTS_TYPE_IDENTIFIER]: {
                value: false,
                type: 'checkbox',
                transformFunction: transformCheckboxInput,
            },
            [SAVING_PHASE_IDENTIFIER]: { value: 40, type: 'text', transformFunction: transformInputToInt },
            [AGE_IDENTIFIER]: { value: 30, type: 'text', transformFunction: transformInputToInt },
            [TAX_FREE_AMOUNT_IDENTIFIER]: { value: 801, type: 'text', transformFunction: transformInputToInt },
            [LIFE_EXPECTATION]: { value: 80, type: 'text', transformFunction: transformInputToInt },
        };

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(changedValue, changedStateIdentifier) {
        const currentValues = { ...this.state[changedStateIdentifier] };
        currentValues.value = changedValue;
        this.setState({ [changedStateIdentifier]: currentValues });
        console.log(`State ${changedStateIdentifier} changed value to ${changedValue}.`);
    }

    render() {
        const visualizationProps = constructVisualizationProps(this.state);
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
                            transformFunction={this.state[stateIdentifier].transformFunction}
                        />
                    ))}
                </form>
                <Visualization {...visualizationProps} />
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
        this.props.onValueChange(this.props.transformFunction(e, this), this.props.stateIdentifier);
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
