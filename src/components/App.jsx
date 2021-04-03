import React from 'react';
// Needed to make the drop downs work.
import { Dropdown, Tooltip } from 'bootstrap'; // eslint-disable-line no-unused-vars
import Visualization from './Visualization';
import TextInputElement from './TextInputElement';
import CheckboxInputElement from './CheckboxInputElement';
import { SidebarSectionHeading, Overlay } from './MinimalBootstrapComponents';
import { BrokerDropDown } from './BrokerDropDown';
import { GraphDetailDropDown } from './GraphDetailDropDown';
import { ETFSelectionDropDown } from './ETFSelectionDropDown';
import ForecastModelSingleton from '../model/ForecastModel';

export const STARTING_CAPITAL_IDENTIFIER = 'startingCapital';
export const MONTHLY_INVESTMENT_IDENTIFIER = 'monthlyInvestment';
export const TRANSACTION_COSTS_IDENTIFIER = 'transactionCosts';
export const TRANSACTION_COSTS_TYPE_IDENTIFIER = 'transactionCostsType';
export const SAVING_PHASE_IDENTIFIER = 'savingPhase';
export const AGE_IDENTIFIER = 'age';
export const TAX_FREE_AMOUNT_IDENTIFIER = 'taxFreeAmount';
export const MONTHLY_PAYOUT_IDENTIFIER = 'monthlyPayout';
export const LIFE_EXPECTATION_IDENTIFIER = 'lifeExpectation';
export const DETAILED_GRAPH_DROPDOWN_IDENTIFIER = 'detailedGraph';
export const ETF_DROPDOWN_SELECTION_IDENTIFIER = 'etfDropdownSelection';
export const API_KEY_IDENTIFIER = 'apiKey';
const BROKER_DROPDOWN_IDENTIFIER = 'brokerDropdown';
const ETF_AUTOMATIC_PERCENTAGE_IDENTIFIER = 'etfAutomaticPercentage';

export const ETF_SYMBOL_TO_NAME = {
    'SP5C.PAR': 'S & P 500',
    'ESGE': 'iShare',
    'SUSA': 'MSCI USA ESG',
};

function transformInputToInt(e) {
    const intVal = parseInt(e.target.value.split(' ', 1));
    return isNaN(intVal) ? 0 : intVal;
}

function transformInputToFloat(e) {
    const floatVal = parseFloat(e.target.value);
    return isNaN(floatVal) ? 0 : floatVal;
}

function isPercentage(val) {
    return !Number.isNaN(val) && val >= 0 && val <= 1;
}

function isPositiveInt(val) {
    return !Number.isNaN(val) && Number.isInteger(val) && val >= 0;
}

function constructVisualizationProps(state) {
    const props = {};
    for (const identifier in state) {
        props[identifier] = state[identifier].value;
    }
    Object.assign(props, { etfProperties: state[ETF_DROPDOWN_SELECTION_IDENTIFIER].elements });
    props.isValid = state.isValid;
    return props;
}

function recalculateETFPercentages(state) {
    let numberOfSelectedETFs = 0;
    for (const etfIdentifier in state[ETF_DROPDOWN_SELECTION_IDENTIFIER].elements) {
        if (state[ETF_DROPDOWN_SELECTION_IDENTIFIER].elements[etfIdentifier].selected) {
            numberOfSelectedETFs++;
        }
    }
    const newPercentage = 1.0 / Math.max(1, numberOfSelectedETFs);
    for (const etfIdentifier in state[ETF_DROPDOWN_SELECTION_IDENTIFIER].elements) {
        state[ETF_DROPDOWN_SELECTION_IDENTIFIER].elements[etfIdentifier].percentage = newPercentage;
    }
    return state;
}

export class App extends React.Component {
    constructor(props) {
        super(props);

        this.handleTextChange = this.handleTextChange.bind(this);
        this.handleCheckBoxChange = this.handleCheckBoxChange.bind(this);
        this.handleBrokerChange = this.handleBrokerChange.bind(this);
        this.handleGraphDetailChange = this.handleGraphDetailChange.bind(this);
        this.handleETFSelectionChange = this.handleETFSelectionChange.bind(this);
        this.handleETFShareChange = this.handleETFShareChange.bind(this);
        this.handleAPIKeyConfirm = this.handleAPIKeyConfirm.bind(this);

        this.state = getInitialInputFormState(this);
    }

    handleTextChange(changedValue, changedStateIdentifier) {
        const state = { ...this.state };
        state[changedStateIdentifier].value = changedValue;
        this.validateAndSetState(state);
    }

    handleCheckBoxChange(changedStateIdentifier) {
        const state = { ...this.state };
        state[changedStateIdentifier].value = !state[changedStateIdentifier].value;
        if (changedStateIdentifier === TRANSACTION_COSTS_TYPE_IDENTIFIER) {
            state[TRANSACTION_COSTS_IDENTIFIER].value = state[changedStateIdentifier].value ? 5 : 0.015;
            state[TRANSACTION_COSTS_IDENTIFIER].textAppending = state[changedStateIdentifier].value ? '€' : '%';
            state[TRANSACTION_COSTS_IDENTIFIER].transformFunction = state[changedStateIdentifier].value
                ? transformInputToInt
                : transformInputToFloat;
        } else if (
            changedStateIdentifier === ETF_AUTOMATIC_PERCENTAGE_IDENTIFIER &&
            state[changedStateIdentifier].value
        ) {
            recalculateETFPercentages(state);
        }
        this.validateAndSetState(state);
    }

    handleBrokerChange(brokerProperties) {
        const state = { ...this.state };
        state[TRANSACTION_COSTS_IDENTIFIER].value =
            brokerProperties.percentageCosts > 0 ? brokerProperties.percentageCosts : brokerProperties.fixedCosts;
        state[TRANSACTION_COSTS_TYPE_IDENTIFIER].value = brokerProperties.percentageCosts > 0 ? false : true;
        this.validateAndSetState(state);
    }

    handleGraphDetailChange(detailProperties) {
        const state = { ...this.state };
        state[DETAILED_GRAPH_DROPDOWN_IDENTIFIER].value = detailProperties.value;
        this.validateAndSetState(state);
    }

    handleETFSelectionChange(etfProperties) {
        const state = { ...this.state };
        state[ETF_DROPDOWN_SELECTION_IDENTIFIER].elements[etfProperties.identifier].selected = !state[
            ETF_DROPDOWN_SELECTION_IDENTIFIER
        ].elements[etfProperties.identifier].selected;
        if (state[ETF_AUTOMATIC_PERCENTAGE_IDENTIFIER].value) {
            recalculateETFPercentages(state);
        }
        this.validateAndSetState(state);
    }

    handleETFShareChange(changedValue, changedETFIdentifier) {
        const state = { ...this.state };
        state[ETF_DROPDOWN_SELECTION_IDENTIFIER].elements[changedETFIdentifier].percentage = changedValue;
        this.validateAndSetState(state);
    }

    async handleAPIKeyConfirm() {
        const apiKey = this.state[API_KEY_IDENTIFIER].value;
        const apiValues = { ...this.state[API_KEY_IDENTIFIER] };
        try {
            await ForecastModelSingleton.loadHistoricData(
                apiKey,
                this.state[ETF_DROPDOWN_SELECTION_IDENTIFIER].elements
            );
            apiValues.error = false;
            apiValues.displayOverlay = false;
        } catch (e) {
            apiValues.error = true;
        }
        this.setState({ [API_KEY_IDENTIFIER]: apiValues });
        this.forceUpdate();
    }

    validateAndSetState(state) {
        const positiveIntIdentifier = [
            MONTHLY_INVESTMENT_IDENTIFIER,
            MONTHLY_PAYOUT_IDENTIFIER,
            STARTING_CAPITAL_IDENTIFIER,
            AGE_IDENTIFIER,
            LIFE_EXPECTATION_IDENTIFIER,
            SAVING_PHASE_IDENTIFIER,
            TAX_FREE_AMOUNT_IDENTIFIER,
        ];
        state.isValid = true;

        for (const identifier of positiveIntIdentifier) {
            state[identifier].isValid = isPositiveInt(state[identifier].value);
            state[identifier].errorMessage = 'Please enter a positive number.';
            state.isValid = state[identifier].isValid && state.isValid;
        }

        // Check the year values.
        const leftoverYears = state[LIFE_EXPECTATION_IDENTIFIER].value - state[AGE_IDENTIFIER].value;
        if (state[AGE_IDENTIFIER].value >= state[LIFE_EXPECTATION_IDENTIFIER].value) {
            state[AGE_IDENTIFIER].errorMessage = 'You cannot be older than the life expectation';
            state[AGE_IDENTIFIER].isValid = false;
            state.isValid = false;
        } else if (leftoverYears <= state[SAVING_PHASE_IDENTIFIER].value) {
            state[SAVING_PHASE_IDENTIFIER].errorMessage =
                'You cannot have a saving phase that lasts longer than your life.';
            state[SAVING_PHASE_IDENTIFIER].isValid = false;
            state.isValid = false;
        }

        // Check Cost values.
        if (state[TRANSACTION_COSTS_TYPE_IDENTIFIER].value) {
            state[TRANSACTION_COSTS_IDENTIFIER].isValid = isPositiveInt(state[TRANSACTION_COSTS_IDENTIFIER].value);
            state[TRANSACTION_COSTS_IDENTIFIER].errorMessage = 'Please enter a positive number.';
        } else {
            state[TRANSACTION_COSTS_IDENTIFIER].isValid = isPercentage(state[TRANSACTION_COSTS_IDENTIFIER].value);
            state[TRANSACTION_COSTS_IDENTIFIER].errorMessage = 'Please enter a valid percentage.';
        }
        state.isValid = state[TRANSACTION_COSTS_IDENTIFIER].isValid && state.isValid;

        // Check the etf percentages.
        let sumOfPercentages = 0;
        let foundOneSelectedEtf = false;
        for (const etfIdentifier in state[ETF_DROPDOWN_SELECTION_IDENTIFIER].elements) {
            if (state[ETF_DROPDOWN_SELECTION_IDENTIFIER].elements[etfIdentifier].selected) {
                sumOfPercentages += state[ETF_DROPDOWN_SELECTION_IDENTIFIER].elements[etfIdentifier].percentage;
                foundOneSelectedEtf = true;
            }
        }
        if (!foundOneSelectedEtf) {
            state[ETF_DROPDOWN_SELECTION_IDENTIFIER].isValid = false;
            state[ETF_DROPDOWN_SELECTION_IDENTIFIER].errorMessage = 'Please select at least one ETF.';
            state.isValid = false;
        } else if (sumOfPercentages !== 1.0) {
            state[ETF_DROPDOWN_SELECTION_IDENTIFIER].isValid = false;
            state[ETF_DROPDOWN_SELECTION_IDENTIFIER].errorMessage = 'The sum of all selected ETF needs to be 100%';
            state.isValid = false;
        } else {
            state[ETF_DROPDOWN_SELECTION_IDENTIFIER].isValid = true;
        }

        this.setState(state);
    }

    render() {
        const visualizationProps = constructVisualizationProps(this.state);
        return (
            <div className="container-fluid">
                <Overlay {...this.state[API_KEY_IDENTIFIER]} />
                <div className="row">
                    <nav id="sidebarMenu" className="col-md-3 col-lg-2 bg-light sidebar">
                        <form className="position-sticky needs-validation" noValidate>
                            {/* Money Options */}
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
                            <TextInputElement
                                key={LIFE_EXPECTATION_IDENTIFIER}
                                {...this.state[LIFE_EXPECTATION_IDENTIFIER]}
                            />
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
                            <BrokerDropDown
                                key={BROKER_DROPDOWN_IDENTIFIER}
                                fixedCosts={
                                    this.state[TRANSACTION_COSTS_TYPE_IDENTIFIER].value
                                        ? this.state[TRANSACTION_COSTS_IDENTIFIER].value
                                        : 0
                                }
                                percentageCosts={
                                    this.state[TRANSACTION_COSTS_TYPE_IDENTIFIER].value
                                        ? 0
                                        : this.state[TRANSACTION_COSTS_IDENTIFIER].value
                                }
                                {...this.state[BROKER_DROPDOWN_IDENTIFIER]}
                            />
                            {/* Visualization Options */}
                            <SidebarSectionHeading title="Visualization Options" />
                            <div className="d-grid gap-0">
                                <div className="p-1">
                                    <GraphDetailDropDown
                                        key={DETAILED_GRAPH_DROPDOWN_IDENTIFIER}
                                        {...this.state[DETAILED_GRAPH_DROPDOWN_IDENTIFIER]}
                                    />
                                </div>
                                <CheckboxInputElement
                                    key={ETF_AUTOMATIC_PERCENTAGE_IDENTIFIER}
                                    {...this.state[ETF_AUTOMATIC_PERCENTAGE_IDENTIFIER]}
                                />
                                <div className="p-1">
                                    <ETFSelectionDropDown
                                        key={ETF_DROPDOWN_SELECTION_IDENTIFIER}
                                        autoPercentage={this.state[ETF_AUTOMATIC_PERCENTAGE_IDENTIFIER].value}
                                        {...this.state[ETF_DROPDOWN_SELECTION_IDENTIFIER]}
                                    />
                                </div>
                            </div>
                        </form>
                    </nav>
                    <main className="col-md-9 col-lg-10 ms-sm-auto">
                        <h1>Etf Pension Plan Visualization</h1>
                        <Visualization {...visualizationProps} />
                    </main>
                </div>
            </div>
        );
    }
}

function getInitialInputFormState(caller) {
    return {
        isValid: true,
        // simple ui elements.
        [STARTING_CAPITAL_IDENTIFIER]: {
            value: 1000,
            label: 'Starting Capital',
            errorMessage: '',
            textAppending: '€',
            isValid: true,
            identifier: STARTING_CAPITAL_IDENTIFIER,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
        [MONTHLY_INVESTMENT_IDENTIFIER]: {
            value: 100,
            label: 'Monthly Investment',
            errorMessage: 'Please enter a positive Money amount.',
            textAppending: '€',
            isValid: true,
            identifier: MONTHLY_INVESTMENT_IDENTIFIER,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
        [MONTHLY_PAYOUT_IDENTIFIER]: {
            value: 1000,
            label: 'Monthly Payout',
            errorMessage: '',
            textAppending: '€',
            isValid: true,
            identifier: MONTHLY_PAYOUT_IDENTIFIER,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
        [TRANSACTION_COSTS_IDENTIFIER]: {
            value: 0.015,
            label: 'Transaction Costs',
            errorMessage: '',
            textAppending: '%',
            isValid: true,
            identifier: TRANSACTION_COSTS_IDENTIFIER,
            transformFunction: transformInputToFloat,
            onValueChange: caller.handleTextChange,
        },
        [TRANSACTION_COSTS_TYPE_IDENTIFIER]: {
            value: false,
            label: 'Fixed Amount',
            identifier: TRANSACTION_COSTS_TYPE_IDENTIFIER,
            onValueChange: caller.handleCheckBoxChange,
        },
        [SAVING_PHASE_IDENTIFIER]: {
            value: 40,
            label: 'Saving Phase',
            errorMessage: '',
            textAppending: 'Y',
            isValid: true,
            identifier: SAVING_PHASE_IDENTIFIER,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
        [AGE_IDENTIFIER]: {
            value: 30,
            label: 'Your Age',
            textAppending: 'Y',
            errorMessage: '',
            isValid: true,
            identifier: AGE_IDENTIFIER,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
        [LIFE_EXPECTATION_IDENTIFIER]: {
            value: 80,
            label: 'Life Expectation',
            errorMessage: '',
            isValid: true,
            textAppending: 'Y',
            identifier: LIFE_EXPECTATION_IDENTIFIER,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
        [TAX_FREE_AMOUNT_IDENTIFIER]: {
            value: 801,
            label: 'Tax Free Amount',
            errorMessage: '',
            isValid: true,
            textAppending: '€',
            identifier: TAX_FREE_AMOUNT_IDENTIFIER,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
        [ETF_AUTOMATIC_PERCENTAGE_IDENTIFIER]: {
            value: false,
            label: 'Automatic ETF Ratio',
            identifier: ETF_AUTOMATIC_PERCENTAGE_IDENTIFIER,
            onValueChange: caller.handleCheckBoxChange,
        },
        [API_KEY_IDENTIFIER]: {
            displayOverlay: true,
            value: '',
            label: '',
            errorMessage: '',
            isValid: true,
            textAppending: '',
            identifier: API_KEY_IDENTIFIER,
            transformFunction: e => e.target.value,
            onValueChange: caller.handleTextChange,
            handleAPIKeyConfirm: caller.handleAPIKeyConfirm,
        },
        // Complex UI elements.
        [DETAILED_GRAPH_DROPDOWN_IDENTIFIER]: {
            value: 1,
            label: 'Graph Detail Level',
            isValid: true,
            handleChange: caller.handleGraphDetailChange,
            elements: [
                {
                    identifier: '12',
                    value: 12,
                    label: 'All Months a Year (highest detail)',
                },
                {
                    identifier: '6',
                    value: 6,
                    label: 'Every 2nd Month (higher detail)',
                },
                {
                    identifier: '3',
                    value: 3,
                    label: 'Every 4th Month (lower detail)',
                },
                {
                    identifier: '1',
                    value: 1,
                    label: 'One Month a Year (lowest detail) (default)',
                },
            ],
        },
        [BROKER_DROPDOWN_IDENTIFIER]: {
            label: 'Broker',
            isValid: true,
            handleChange: caller.handleBrokerChange,
            elements: [
                {
                    identifier: 'comdirect',
                    label: 'comdirect',
                    fixedCosts: 0,
                    percentageCosts: 0.015,
                },
                {
                    identifier: 'tradeRepublic',
                    label: 'Trade Republic',
                    fixedCosts: 0,
                    percentageCosts: 0.01,
                },
                {
                    identifier: 'eToro',
                    label: 'eToro',
                    fixedCosts: 0,
                    percentageCosts: 0.0,
                },
            ],
        },
        [ETF_DROPDOWN_SELECTION_IDENTIFIER]: {
            label: 'ETF Selection',
            isValid: true,
            identifier: ETF_DROPDOWN_SELECTION_IDENTIFIER,
            errorMessage: '',
            handleSelectionChange: caller.handleETFSelectionChange,
            handleShareChange: caller.handleETFShareChange,
            elements: {
                S_and_P_500: {
                    identifier: 'S_and_P_500',
                    symbol: 'SP5C.PAR',
                    label: ETF_SYMBOL_TO_NAME['SP5C.PAR'],
                    percentage: 1.0,
                    selected: true,
                },
                iShare: {
                    identifier: 'iShare',
                    symbol: 'ESGE',
                    label: ETF_SYMBOL_TO_NAME['ESGE'],
                    percentage: 1.0,
                    selected: false,
                },
                msciUSA: {
                    identifier: 'msciUSA',
                    symbol: 'SUSA',
                    label: ETF_SYMBOL_TO_NAME['SUSA'],
                    percentage: 1.0,
                    selected: false,
                },
            },
        },
    };
}

export default App;
