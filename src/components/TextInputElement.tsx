import { ErrorMessage } from './ErrorMessageComponent';

export interface INumberInputState {
    value: number;
    label: string;
    errorMessage: string;
    textAppending: string;
    isValid: boolean;
    disabled: boolean;
    identifier: TextInputStateIdentifier;
    noLabel?: boolean;
    onValueChange: (
        changedValue: string,
        changedStateIdentifier: TextInputStateIdentifier,
        stateIsNumber: boolean
    ) => void;
}

export interface ITextInputState {
    value: string;
    label: string;
    errorMessage: string;
    textAppending: string;
    isValid: boolean;
    disabled: boolean;
    noLabel?: boolean;
    identifier: TextInputStateIdentifier;
    onValueChange: (changedValue: string, changedStateIdentifier: TextInputStateIdentifier) => void;
}

export interface IETFTextInputState {
    value: number;
    label: string;
    errorMessage: string;
    textAppending: string;
    isValid: boolean;
    disabled: boolean;
    noLabel?: boolean;
    identifier: string;
    onValueChange: (changedValue: string, changedStateIdentifier: string) => void;
}

export type NumberInputStateIdentifier =
    | 'startingCapital'
    | 'monthlyInvestment'
    | 'monthlyPayout'
    | 'transactionPercentageCosts'
    | 'transactionFixedCosts'
    | 'savingPhase'
    | 'age'
    | 'lifeExpectation'
    | 'taxFreeAmount'
    | 'yearlyInvestmentIncrease'
    | 'yearlyPayoutIncrease'
    | 'minConfidence'
    | 'maxConfidence'
    | 'middleConfidence';

export type TextInputStateIdentifier = NumberInputStateIdentifier | 'apiKey';

/**
 * Renders the label for a input element based on the props of the calling element.
 *
 * @param props Props by the calling text element.
 * @returns Rendered label.
 */
export function InputLabel(props: INumberInputState | IETFTextInputState | ITextInputState) {
    if (props.noLabel) {
        return null;
    } else if (props.textAppending.length > 0) {
        return (
            <label className="form-label" htmlFor={props.identifier}>
                {props.label} in <span className="inputUnit">{props.textAppending}</span>
            </label>
        );
    } else {
        return (
            <label className="form-label" htmlFor={props.identifier}>
                {props.label}
            </label>
        );
    }
}

/**
 * Renders a text or number input element.
 *
 * @param props The text or number input properties.
 * @returns The rendered text or number input.
 */
export function TextOrNumberInputElement(props: INumberInputState | ITextInputState) {
    const isNumericInput = typeof props.value === 'number';
    return (
        <div className="position-relative">
            <InputLabel {...props} />
            <input
                className={'form-control ' + (props.isValid ? '' : 'is-invalid')}
                id={props.identifier}
                type={isNumericInput ? 'number' : 'text'}
                value={props.value}
                onChange={e => props.onValueChange(e.target.value, props.identifier, isNumericInput)}
                disabled={props.disabled}
            />
            <ErrorMessage {...props} />
        </div>
    );
}

/**
 * Renders a text input element without strict identifier. Intended for the etf drop down.
 *
 * @param props The etf text input properties.
 * @returns The rendered text input.
 */
export function ETFTextInputElement(props: IETFTextInputState) {
    return (
        <div className="position-relative">
            <InputLabel {...props} />
            <input
                className={'form-control ' + (props.isValid ? '' : 'is-invalid')}
                id={props.identifier}
                type="number"
                value={props.value}
                onChange={e => props.onValueChange(e.target.value, props.identifier)}
                disabled={props.disabled}
            />
            <ErrorMessage {...props} />
        </div>
    );
}
