import React from 'react';
import Visualization from './Visualization';
import TextInputElement from './TextInputElement';
import CheckboxInputElement from './CheckboxInputElement';
import { SidebarSectionHeading } from './MinimalBootstrapComponents';

export const STARTING_CAPITAL_IDENTIFIER = 'startingCapital';
export const MONTHLY_INVESTMENT_IDENTIFIER = 'monthlyInvestment';
export const TRANSACTION_COSTS_IDENTIFIER = 'transactionCosts';
export const TRANSACTION_COSTS_TYPE_IDENTIFIER = 'transactionCostsType';
export const SAVING_PHASE_IDENTIFIER = 'savingPhase';
export const AGE_IDENTIFIER = 'age';
export const TAX_FREE_AMOUNT_IDENTIFIER = 'taxFreeAmount';
export const MONTHLY_PAYOUT_IDENTIFIER = 'monthlyPayout';
export const LIFE_EXPECTATION = 'lifeExpectation';

function transformInputToInt(e, caller) {
    const intVal = parseInt(e.target.value.split(' ', 1));
    return isNaN(intVal) ? 0 : intVal;
}

function transformInputToFloat(e, caller) {
    const intVal = parseFloat(e.target.value);
    return isNaN(intVal) ? 0 : intVal;
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

        this.handleTextChange = this.handleTextChange.bind(this);
        this.handleCheckBoxChange = this.handleCheckBoxChange.bind(this);

        this.state = getInitialInputFormState(this);
    }

    handleTextChange(changedValue, changedStateIdentifier) {
        const currentValues = { ...this.state[changedStateIdentifier] };
        currentValues.value = changedValue;
        this.setState({ [changedStateIdentifier]: currentValues });
    }

    handleCheckBoxChange(changedStateIdentifier) {
        const currentValues = { ...this.state[changedStateIdentifier] };
        currentValues.value = !currentValues.value;
        this.setState({ [changedStateIdentifier]: currentValues });
        if (changedStateIdentifier === TRANSACTION_COSTS_TYPE_IDENTIFIER) {
            const transactionCostValues = { ...this.state[TRANSACTION_COSTS_IDENTIFIER] };
            transactionCostValues.value = currentValues.value ? 5 : 0.005;
            transactionCostValues.textAppending = currentValues.value ? '€' : '%';
            transactionCostValues.transformFunction = currentValues.value ? transformInputToInt : transformInputToFloat;
            this.setState({ [TRANSACTION_COSTS_IDENTIFIER]: transactionCostValues });
        }
    }

    render() {
        const visualizationProps = constructVisualizationProps(this.state);
        return (
            <div className="container-fluid">
                <div className="row">
                    <nav
                        id="sidebarMenu"
                        className="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse"
                        style={{ width: '280px' }}>
                        {/* Money Options */}
                        <form className="position-sticky pt-3">
                            <SidebarSectionHeading title="Money Options" />
                            <TextInputElement
                                key={STARTING_CAPITAL_IDENTIFIER}
                                {...this.state[STARTING_CAPITAL_IDENTIFIER]}
                            />
                            <TextInputElement
                                key={MONTHLY_INVESTMENT_IDENTIFIER}
                                {...this.state[MONTHLY_INVESTMENT_IDENTIFIER]}
                            />
                            <TextInputElement
                                key={MONTHLY_PAYOUT_IDENTIFIER}
                                {...this.state[MONTHLY_PAYOUT_IDENTIFIER]}
                            />
                            <TextInputElement
                                key={TAX_FREE_AMOUNT_IDENTIFIER}
                                {...this.state[TAX_FREE_AMOUNT_IDENTIFIER]}
                            />
                            {/* Time Options */}
                            <SidebarSectionHeading title="Time Options" />
                            <TextInputElement key={AGE_IDENTIFIER} {...this.state[AGE_IDENTIFIER]} />
                            <TextInputElement key={LIFE_EXPECTATION} {...this.state[LIFE_EXPECTATION]} />
                            <TextInputElement key={SAVING_PHASE_IDENTIFIER} {...this.state[SAVING_PHASE_IDENTIFIER]} />
                            {/* Cost Options */}
                            <SidebarSectionHeading title="Cost Options" />
                            <TextInputElement
                                key={TRANSACTION_COSTS_IDENTIFIER}
                                {...this.state[TRANSACTION_COSTS_IDENTIFIER]}
                            />
                            <CheckboxInputElement
                                key={TRANSACTION_COSTS_TYPE_IDENTIFIER}
                                {...this.state[TRANSACTION_COSTS_TYPE_IDENTIFIER]}
                            />
                        </form>
                    </nav>
                    <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                        <h1 style={{ textAlign: 'center' }}>Etf Pension Plan Visualization</h1>
                        <Visualization {...visualizationProps} />
                    </main>
                </div>
            </div>
        );
    }
}

function getInitialInputFormState(caller) {
    return {
        [STARTING_CAPITAL_IDENTIFIER]: {
            value: 1000,
            type: 'text',
            label: 'Starting Capital',
            textAppending: '€',
            identifier: STARTING_CAPITAL_IDENTIFIER,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
        [MONTHLY_INVESTMENT_IDENTIFIER]: {
            value: 100,
            type: 'text',
            label: 'Monthly Investment',
            textAppending: '€',
            identifier: MONTHLY_INVESTMENT_IDENTIFIER,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
        [MONTHLY_PAYOUT_IDENTIFIER]: {
            value: 1000,
            type: 'text',
            label: 'Monthly Payout',
            textAppending: '€',
            identifier: MONTHLY_PAYOUT_IDENTIFIER,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
        [TRANSACTION_COSTS_IDENTIFIER]: {
            value: 0.005,
            type: 'text',
            label: 'Transaction Costs',
            textAppending: '%',
            identifier: TRANSACTION_COSTS_IDENTIFIER,
            transformFunction: transformInputToFloat,
            onValueChange: caller.handleTextChange,
        },
        [TRANSACTION_COSTS_TYPE_IDENTIFIER]: {
            value: false,
            type: 'checkbox',
            label: 'Fixed Amount',
            textAppending: '',
            identifier: TRANSACTION_COSTS_TYPE_IDENTIFIER,
            onValueChange: caller.handleCheckBoxChange,
        },
        [SAVING_PHASE_IDENTIFIER]: {
            value: 40,
            type: 'text',
            label: 'Saving Phase',
            textAppending: 'Y',
            identifier: SAVING_PHASE_IDENTIFIER,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
        [AGE_IDENTIFIER]: {
            value: 30,
            type: 'text',
            label: 'Your Age',
            textAppending: 'Y',
            identifier: AGE_IDENTIFIER,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
        [TAX_FREE_AMOUNT_IDENTIFIER]: {
            value: 801,
            type: 'text',
            label: 'Tax Free Amount',
            textAppending: '€',
            identifier: TAX_FREE_AMOUNT_IDENTIFIER,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
        [LIFE_EXPECTATION]: {
            value: 80,
            type: 'text',
            label: 'Life Expectation',
            textAppending: 'Y',
            identifier: LIFE_EXPECTATION,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
    };
}

export default InputForm;
