import React, { ChangeEvent } from 'react';
import { Visualization, ICostConfiguration } from './Visualization';
import {
    TextInputElement,
    ITextInputState,
    TextInputStateIdentifier,
    NumberInputStateIdentifier,
} from './TextInputElement';
import { CheckboxInputElement, ICheckboxState, ICheckBoxStateIdentifier } from './CheckboxInputElement';
import { Overlay, IAPIKey } from './APIKeyOverlay';
import { SidebarSectionHeading } from './SidebarSectionHeadingComponent';
import { BrokerDropDown, BrokerProperties, IBrokerDropDown } from './BrokerDropDown';
import { GraphDetailDropDown, IGraphDetailDropDown, IGraphDetailLevel } from './GraphDetailDropDown';
import { ETFSelectionDropDown, IETFProperties, IETFSelection } from './ETFSelectionDropDown';
import { ForecastModelSingleton } from '../model/ForecastModel';
import { ETFIdentifier } from '../model/InvestmentModel';
import { percentageToFloatValue } from '../helpers/utils';

export const STARTING_CAPITAL_IDENTIFIER = 'startingCapital';
export const MONTHLY_INVESTMENT_IDENTIFIER = 'monthlyInvestment';
export const YEARLY_INVESTMENT_INCREASE_IDENTIFIER = 'yearlyInvestmentIncrease';
export const TRANSACTION_COSTS_IDENTIFIER = 'transactionCosts';
export const TRANSACTION_COSTS_TYPE_IDENTIFIER = 'transactionCostsType';
export const SAVING_PHASE_IDENTIFIER = 'savingPhase';
export const AGE_IDENTIFIER = 'age';
export const TAX_FREE_AMOUNT_IDENTIFIER = 'taxFreeAmount';
export const MONTHLY_PAYOUT_IDENTIFIER = 'monthlyPayout';
export const YEARLY_PAYOUT_INCREASE_IDENTIFIER = 'yearlyPayoutIncrease';
export const LIFE_EXPECTATION_IDENTIFIER = 'lifeExpectation';
export const DETAILED_GRAPH_DROPDOWN_IDENTIFIER = 'detailedGraph';
export const ETF_DROPDOWN_SELECTION_IDENTIFIER = 'etfDropdownSelection';
export const API_KEY_IDENTIFIER = 'apiKey';
export const Y_AXIS_LOCK_IDENTIFIER = 'yAxisLock';

const BROKER_DROPDOWN_IDENTIFIER = 'brokerDropdown';
const ETF_AUTOMATIC_PERCENTAGE_IDENTIFIER = 'etfAutomaticPercentage';

export interface IAppState {
    isValid: boolean;
    startingCapital: ITextInputState;
    monthlyInvestment: ITextInputState;
    yearlyInvestmentIncrease: ITextInputState;
    monthlyPayout: ITextInputState;
    yearlyPayoutIncrease: ITextInputState;
    transactionCosts: ITextInputState;
    savingPhase: ITextInputState;
    age: ITextInputState;
    lifeExpectation: ITextInputState;
    taxFreeAmount: ITextInputState;

    apiKey: IAPIKey;

    transactionCostsType: ICheckboxState;
    etfAutomaticPercentage: ICheckboxState;
    yAxisLock: ICheckboxState;

    detailedGraph: IGraphDetailDropDown;
    brokerDropdown: IBrokerDropDown;
    etfDropdownSelection: IETFSelection;
}

type ETFIdentifierToString = { [key in ETFIdentifier]: string };

export const ETF_SYMBOL_TO_NAME: ETFIdentifierToString = {
    'SP5C.PAR': 'S & P 500',
    ESGE: 'iShare',
    SUSA: 'MSCI USA ESG',
};

/**
 * Extracts the changed value of the event and parses it to an integer.
 * That integer is returned. If the parsing failed 0 is returned as a fallback.
 *
 * @param e The input change event.
 * @returns The changed value as an integer.
 */
function transformInputToInt(e: ChangeEvent<HTMLInputElement>): number {
    const valueWithoutTextAppending = e.target.value.split(' ')[0];
    const intVal = parseInt(valueWithoutTextAppending);
    return isNaN(intVal) ? 0 : intVal;
}

/**
 * Extracts the changed value of the event and parses it to a float.
 * That float is returned. If the parsing failed 0 is returned as a fallback.
 *
 * @param e The input change event.
 * @returns The changed value as a float.
 */
function transformInputToFloat(e: ChangeEvent<HTMLInputElement>): number {
    const floatVal = parseFloat(e.target.value);
    return isNaN(floatVal) ? 0 : floatVal;
}

/**
 * Returns if the given value is a valid percentage.
 * Meaning that the value is between 0 and 100 and is not NaN.
 *
 * @param val The concerning value.
 * @returns If the value is a valid percentage.
 */
function isPercentage(val: number): boolean {
    return !Number.isNaN(val) && val >= 0 && val <= 100;
}

/**
 * Returns if the given value is a valid integer.
 * Meaning that the value is an integer and is not NaN.
 *
 * @param val The concerning value.
 * @returns If the value is a valid integer.
 */
function isPositiveInt(val: number): boolean {
    return !Number.isNaN(val) && Number.isInteger(val) && val >= 0;
}

/**
 * Returns if the given value is a valid integer.
 * Meaning that the value is an integer and is not NaN.
 *
 * @param val The concerning value.
 * @returns If the value is a valid integer.
 */
export function generateCostConfig(state: IAppState): ICostConfiguration {
    if (state[TRANSACTION_COSTS_TYPE_IDENTIFIER].value) {
        return { percentageCosts: 0.0, fixedCosts: state[TRANSACTION_COSTS_IDENTIFIER].value };
    } else {
        return { percentageCosts: percentageToFloatValue(state[TRANSACTION_COSTS_IDENTIFIER].value), fixedCosts: 0.0 };
    }
}

/**
 * Recalculates the ETF percentages based on how many are selected.
 * This secures that the sum of all active percentages always equal 100%.
 *
 * @param state The state of the app.
 * @returns The manipulated state of the app.
 */
function recalculateETFPercentages(state: IAppState): IAppState {
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

/**
 * The class which renders the whole UI and holds the whole UI state with its interaction changes.
 * Also draws the visualizations.
 */
export class App extends React.Component<{}, IAppState> {
    constructor(props: {}) {
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

    /**
     * Handles the change of a text and applies its value to the state and validates it.
     *
     * @param changedValue The changed Value.
     * @param changedStateIdentifier  The changed state identifier.
     */
    handleTextChange(changedValue: number | string, changedStateIdentifier: TextInputStateIdentifier): void {
        const state = { ...this.state };
        state[changedStateIdentifier].value = changedValue;
        this._validateAndSetState(state);
    }

    /**
     * Handles the change of a checkbox and applies the change to the state and validates it.
     * 
     * Does further adjustments if the specific checkbox needs further state changes. 
     * e.g. the  automatic percentage checkbox.
     *
     * @param changedStateIdentifier  The changed state identifier.
     */
    handleCheckBoxChange(changedStateIdentifier: ICheckBoxStateIdentifier): void {
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
        this._validateAndSetState(state);
    }

    /**
     * Handles the selection of a specific broker.
     * 
     * @param brokerProperties The broker properties.
     */
    handleBrokerChange(brokerProperties: BrokerProperties): void {
        const state = { ...this.state };
        state[TRANSACTION_COSTS_IDENTIFIER].value =
            brokerProperties.percentageCosts > 0 ? brokerProperties.percentageCosts : brokerProperties.fixedCosts;
        state[TRANSACTION_COSTS_TYPE_IDENTIFIER].value = brokerProperties.percentageCosts > 0 ? false : true;
        this._validateAndSetState(state);
    }

    /**
     * Handles the selection of a specific graph detail.
     * 
     * @param brokerProperties The graph detail properties.
     */
    handleGraphDetailChange(detailProperties: IGraphDetailLevel): void {
        const state = { ...this.state };
        state[DETAILED_GRAPH_DROPDOWN_IDENTIFIER].value = detailProperties.value;
        this._validateAndSetState(state);
    }

    /**
     * Handles the selection of a specific ETF.
     * 
     * @param brokerProperties The ETF properties of the selected ETF.
     */
    handleETFSelectionChange(etfProperties: IETFProperties): void {
        const state = { ...this.state };
        state[ETF_DROPDOWN_SELECTION_IDENTIFIER].elements[etfProperties.identifier].selected = !state[
            ETF_DROPDOWN_SELECTION_IDENTIFIER
        ].elements[etfProperties.identifier].selected;
        if (state[ETF_AUTOMATIC_PERCENTAGE_IDENTIFIER].value) {
            recalculateETFPercentages(state);
        }
        this._validateAndSetState(state);
    }

    /**
     * Handles the percentage value change of the etf selection.
     * 
     * @param changedValue The changed  percentage value of the ETF.
     * @param changedETFIdentifier The identifier of the ETF.
     */
    handleETFShareChange(changedValue: number, changedETFIdentifier: string): void {
        const state = { ...this.state };
        state[ETF_DROPDOWN_SELECTION_IDENTIFIER].elements[changedETFIdentifier].percentage = changedValue;
        this._validateAndSetState(state);
    }

    /**
     * Handles the confirmation event of the API key.
     */
    async handleAPIKeyConfirm(): Promise<void> {
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

    /**
     * Checks if the updated state contains an invalid configuration.
     * 
     * @param state The updated state of the App.
     */
    private _validateAndSetState(state: IAppState) {
        const positiveIntIdentifiers: NumberInputStateIdentifier[] = [
            MONTHLY_INVESTMENT_IDENTIFIER,
            MONTHLY_PAYOUT_IDENTIFIER,
            STARTING_CAPITAL_IDENTIFIER,
            AGE_IDENTIFIER,
            LIFE_EXPECTATION_IDENTIFIER,
            SAVING_PHASE_IDENTIFIER,
            TAX_FREE_AMOUNT_IDENTIFIER,
        ];

        const percentageIdentifiers: NumberInputStateIdentifier[] = [
            YEARLY_INVESTMENT_INCREASE_IDENTIFIER,
            YEARLY_PAYOUT_INCREASE_IDENTIFIER,
        ];

        state.isValid = true;

        for (const identifier of positiveIntIdentifiers) {
            state[identifier].isValid = isPositiveInt(state[identifier].value);
            state[identifier].errorMessage = 'Please enter a positive number.';
            state.isValid = state[identifier].isValid && state.isValid;
        }

        for (const identifier of percentageIdentifiers) {
            state[identifier].isValid = isPercentage(state[identifier].value);
            state[identifier].errorMessage = 'Please enter a valid percentage between 0 and 100 %.';
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

    /**
     * Renders the whole page based on the state of the app.
     * 
     * @returns The Page content.
     */
    render() {
        const costConfig = generateCostConfig(this.state);
        return (
            <div className="container-fluid">
                <Overlay {...this.state[API_KEY_IDENTIFIER]} />
                <div className="row">
                    <nav id="sidebarMenu" className="col-md-3 col-lg-2 bg-light sidebar">
                        <form className="position-sticky needs-validation" noValidate>
                            {/* Money Options */}
                            <SidebarSectionHeading title="Money Options" initiallyCollapsed={false}>
                                <TextInputElement {...this.state[STARTING_CAPITAL_IDENTIFIER]} />
                                <TextInputElement {...this.state[MONTHLY_INVESTMENT_IDENTIFIER]} />
                                <TextInputElement {...this.state[YEARLY_INVESTMENT_INCREASE_IDENTIFIER]} />
                                <TextInputElement {...this.state[MONTHLY_PAYOUT_IDENTIFIER]} />
                                <TextInputElement {...this.state[YEARLY_PAYOUT_INCREASE_IDENTIFIER]} />
                                <TextInputElement {...this.state[TAX_FREE_AMOUNT_IDENTIFIER]} />
                            </SidebarSectionHeading>
                            {/* Time Options */}
                            <SidebarSectionHeading title="Time Options" initiallyCollapsed={false}>
                                <TextInputElement {...this.state[AGE_IDENTIFIER]} />
                                <TextInputElement {...this.state[LIFE_EXPECTATION_IDENTIFIER]} />
                                <TextInputElement {...this.state[SAVING_PHASE_IDENTIFIER]} />
                            </SidebarSectionHeading>
                            {/* Cost Options */}
                            <SidebarSectionHeading title="Cost Options" initiallyCollapsed={true}>
                                <BrokerDropDown {...costConfig} {...this.state[BROKER_DROPDOWN_IDENTIFIER]} />
                                <TextInputElement
                                    key={TRANSACTION_COSTS_IDENTIFIER}
                                    {...this.state[TRANSACTION_COSTS_IDENTIFIER]}
                                />
                                <CheckboxInputElement {...this.state[TRANSACTION_COSTS_TYPE_IDENTIFIER]} />
                            </SidebarSectionHeading>
                            {/* Visualization Options */}
                            <SidebarSectionHeading title="Visualization Options" initiallyCollapsed={true}>
                                <GraphDetailDropDown {...this.state[DETAILED_GRAPH_DROPDOWN_IDENTIFIER]} />
                                <CheckboxInputElement {...this.state[Y_AXIS_LOCK_IDENTIFIER]} />
                                <CheckboxInputElement {...this.state[ETF_AUTOMATIC_PERCENTAGE_IDENTIFIER]} />
                                <ETFSelectionDropDown
                                    autoPercentage={this.state[ETF_AUTOMATIC_PERCENTAGE_IDENTIFIER].value}
                                    {...this.state[ETF_DROPDOWN_SELECTION_IDENTIFIER]}
                                />
                            </SidebarSectionHeading>
                        </form>
                    </nav>
                    <main className="col-md-9 col-lg-10 ms-sm-auto">
                        <h1>Etf Pension Plan Visualization</h1>
                        <Visualization {...this.state} />
                    </main>
                </div>
            </div>
        );
    }
}

/**
 * Generates the initial app state.
 * 
 * @param caller The calling instance of the App class.
 * @returns The initial app state.
 */
function getInitialInputFormState(caller: App): IAppState {
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
            disabled: false,
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
            disabled: false,
        },
        [YEARLY_INVESTMENT_INCREASE_IDENTIFIER]: {
            value: 0.0,
            label: 'Monthly Investment Increase',
            errorMessage: '',
            textAppending: '%',
            isValid: true,
            identifier: YEARLY_INVESTMENT_INCREASE_IDENTIFIER,
            transformFunction: transformInputToFloat,
            onValueChange: caller.handleTextChange,
            disabled: false,
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
            disabled: false,
        },
        [YEARLY_PAYOUT_INCREASE_IDENTIFIER]: {
            value: 0.0,
            label: 'Monthly Payout Increase',
            errorMessage: '',
            textAppending: '%',
            isValid: true,
            identifier: YEARLY_PAYOUT_INCREASE_IDENTIFIER,
            transformFunction: transformInputToFloat,
            onValueChange: caller.handleTextChange,
            disabled: false,
        },
        [TRANSACTION_COSTS_IDENTIFIER]: {
            value: 1.5,
            label: 'Transaction Costs',
            errorMessage: '',
            textAppending: '%',
            isValid: true,
            identifier: TRANSACTION_COSTS_IDENTIFIER,
            transformFunction: transformInputToFloat,
            onValueChange: caller.handleTextChange,
            disabled: false,
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
            disabled: false,
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
            disabled: false,
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
            disabled: false,
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
            disabled: false,
        },
        [TRANSACTION_COSTS_TYPE_IDENTIFIER]: {
            value: false,
            label: 'Fixed Amount',
            identifier: TRANSACTION_COSTS_TYPE_IDENTIFIER,
            onValueChange: caller.handleCheckBoxChange,
        },
        [ETF_AUTOMATIC_PERCENTAGE_IDENTIFIER]: {
            value: false,
            label: 'Automatic ETF Ratio',
            identifier: ETF_AUTOMATIC_PERCENTAGE_IDENTIFIER,
            onValueChange: caller.handleCheckBoxChange,
        },
        [Y_AXIS_LOCK_IDENTIFIER]: {
            value: false,
            label: 'Lock Y Axis Extent',
            identifier: Y_AXIS_LOCK_IDENTIFIER,
            onValueChange: caller.handleCheckBoxChange,
        },
        [API_KEY_IDENTIFIER]: {
            displayOverlay: true,
            error: false,
            value: '',
            label: '',
            errorMessage: '',
            isValid: true,
            textAppending: '',
            identifier: API_KEY_IDENTIFIER,
            transformFunction: (e: ChangeEvent<HTMLInputElement>) => (e.target as HTMLInputElement).value,
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
                    percentageCosts: 1.5,
                },
                {
                    identifier: 'tradeRepublic',
                    label: 'Trade Republic',
                    fixedCosts: 0,
                    percentageCosts: 1.0,
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
                    percentage: 100.0,
                    selected: true,
                },
                iShare: {
                    identifier: 'iShare',
                    symbol: 'ESGE',
                    label: ETF_SYMBOL_TO_NAME['ESGE'],
                    percentage: 'todo bug fix it',
                    selected: false,
                },
                msciUSA: {
                    identifier: 'msciUSA',
                    symbol: 'SUSA',
                    label: ETF_SYMBOL_TO_NAME['SUSA'],
                    percentage: 100.0,
                    selected: false,
                },
            },
        },
    };
}
