import React from 'react';
// Needed to make the drop downs work.
import { Dropdown } from 'bootstrap'; // eslint-disable-line no-unused-vars
import Visualization from './Visualization';
import TextInputElement from './TextInputElement';
import CheckboxInputElement from './CheckboxInputElement';
import { SidebarSectionHeading } from './MinimalBootstrapComponents';
import { BrokerDropDown } from './BrokerDropDown';
import { GraphDetailDropDown } from './GraphDetailDropDown';
import { ETFSelectionDropDown } from './ETFSelectionDropDown';

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
const BROKER_DROPDOWN_IDENTIFIER = 'brokerDropdown';
const ETF_AUTOMATIC_PERCENTAGE_IDENTIFIER = 'etfAutomaticPercentage';

function transformInputToInt(e) {
    const intVal = parseInt(e.target.value.split(' ', 1));
    return isNaN(intVal) ? 0 : intVal;
}

function transformInputToFloat(e) {
    const floatVal = parseFloat(e.target.value);
    return isNaN(floatVal) ? 0 : floatVal;
}

function constructVisualizationProps(state) {
    const props = {};
    for (const identifier in state) {
        props[identifier] = state[identifier].value;
    }
    Object.assign(props, { etfProperties: state[ETF_DROPDOWN_SELECTION_IDENTIFIER].elements });
    return props;
}

function recalculateETFPercentages(state) {
    const etfValues = { ...state[ETF_DROPDOWN_SELECTION_IDENTIFIER] };
    let numberOfSelectedETFs = 0;
    for (const etfIdentifier in etfValues.elements) {
        if (etfValues.elements[etfIdentifier].selected) {
            numberOfSelectedETFs++;
        }
    }
    const newPercentage = 1.0 / Math.max(1, numberOfSelectedETFs);
    for (const etfIdentifier in etfValues.elements) {
        etfValues.elements[etfIdentifier].percentage = newPercentage;
    }
    return etfValues;
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
        } else if (changedStateIdentifier === ETF_AUTOMATIC_PERCENTAGE_IDENTIFIER && currentValues.value) {
            const etfValues = recalculateETFPercentages(this.state);
            this.setState({ [ETF_DROPDOWN_SELECTION_IDENTIFIER]: etfValues });
        }
    }

    handleBrokerChange(brokerProperties) {
        const costValues = { ...this.state[TRANSACTION_COSTS_IDENTIFIER] };
        costValues.value =
            brokerProperties.percentageCosts > 0 ? brokerProperties.percentageCosts : brokerProperties.fixedCosts;
        this.setState({ [TRANSACTION_COSTS_IDENTIFIER]: costValues });

        const costTypeValues = { ...this.state[TRANSACTION_COSTS_TYPE_IDENTIFIER] };
        costTypeValues.value = brokerProperties.percentageCosts > 0 ? false : true;
        this.setState({ [TRANSACTION_COSTS_TYPE_IDENTIFIER]: costTypeValues });
    }

    handleGraphDetailChange(detailProperties) {
        const detailValues = { ...this.state[DETAILED_GRAPH_DROPDOWN_IDENTIFIER] };
        detailValues.value = detailProperties.value;
        this.setState({ [DETAILED_GRAPH_DROPDOWN_IDENTIFIER]: detailValues });
    }

    handleETFSelectionChange(etfProperties) {
        const etfValues = this.state[ETF_AUTOMATIC_PERCENTAGE_IDENTIFIER].value
            ? recalculateETFPercentages(this.state)
            : { ...this.state[ETF_DROPDOWN_SELECTION_IDENTIFIER] };
        etfValues.elements[etfProperties.identifier].selected = !etfValues.elements[etfProperties.identifier].selected;
        this.setState({ [ETF_DROPDOWN_SELECTION_IDENTIFIER]: etfValues });
    }

    handleETFShareChange(changedValue, changedETFIdentifier) {
        const etfValues = { ...this.state[ETF_DROPDOWN_SELECTION_IDENTIFIER] };
        etfValues.elements[changedETFIdentifier].percentage = changedValue;
        this.setState({ [ETF_DROPDOWN_SELECTION_IDENTIFIER]: etfValues });
    }

    render() {
        const visualizationProps = constructVisualizationProps(this.state);
        return (
            <div className="container-fluid">
                <div className="row">
                    <nav id="sidebarMenu" className="col-md-3 col-lg-2 bg-light sidebar">
                        <form className="position-sticky">
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
        // simple ui elements.
        [STARTING_CAPITAL_IDENTIFIER]: {
            value: 1000,
            label: 'Starting Capital',
            textAppending: '€',
            identifier: STARTING_CAPITAL_IDENTIFIER,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
        [MONTHLY_INVESTMENT_IDENTIFIER]: {
            value: 100,
            label: 'Monthly Investment',
            textAppending: '€',
            identifier: MONTHLY_INVESTMENT_IDENTIFIER,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
        [MONTHLY_PAYOUT_IDENTIFIER]: {
            value: 1000,
            label: 'Monthly Payout',
            textAppending: '€',
            identifier: MONTHLY_PAYOUT_IDENTIFIER,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
        [TRANSACTION_COSTS_IDENTIFIER]: {
            value: 0.015,
            label: 'Transaction Costs',
            textAppending: '%',
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
            textAppending: 'Y',
            identifier: SAVING_PHASE_IDENTIFIER,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
        [AGE_IDENTIFIER]: {
            value: 30,
            label: 'Your Age',
            textAppending: 'Y',
            identifier: AGE_IDENTIFIER,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
        [TAX_FREE_AMOUNT_IDENTIFIER]: {
            value: 801,
            label: 'Tax Free Amount',
            textAppending: '€',
            identifier: TAX_FREE_AMOUNT_IDENTIFIER,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
        [LIFE_EXPECTATION_IDENTIFIER]: {
            value: 80,
            label: 'Life Expectation',
            textAppending: 'Y',
            identifier: LIFE_EXPECTATION_IDENTIFIER,
            transformFunction: transformInputToInt,
            onValueChange: caller.handleTextChange,
        },
        [ETF_AUTOMATIC_PERCENTAGE_IDENTIFIER]: {
            value: false,
            label: 'Automatic ETF Ratio',
            identifier: ETF_AUTOMATIC_PERCENTAGE_IDENTIFIER,
            onValueChange: caller.handleCheckBoxChange,
        },
        // Complex UI elements.
        [DETAILED_GRAPH_DROPDOWN_IDENTIFIER]: {
            value: 1,
            label: 'Graph Detail Level',
            handleChange: caller.handleGraphDetailChange,
            elements: [
                {
                    identifier: '12',
                    value: 12,
                    label: 'All Months a Year (high detail)',
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
            handleSelectionChange: caller.handleETFSelectionChange,
            handleShareChange: caller.handleETFShareChange,
            elements: {
                S_and_P_500: {
                    identifier: 'S_and_P_500',
                    symbol: 'SP5C.PAR',
                    percentage: 1.0,
                    label: 'S & P 500',
                    selected: true,
                },
                iShare: {
                    identifier: 'iShare',
                    symbol: 'ESGE',
                    percentage: 1.0,
                    label: 'iShare',
                    selected: false,
                },
                msciUSA: {
                    identifier: 'msciUSA',
                    symbol: 'SUSA',
                    percentage: 1.0,
                    label: 'MSCI USA ESG',
                    selected: false,
                },
            },
        },
    };
}

export default App;
