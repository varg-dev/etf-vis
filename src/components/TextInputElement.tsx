import { ErrorMessage } from './ErrorMessageComponent';

export interface ITextInputState {
    value: string;
    label: string;
    errorMessage: string;
    textAppending: string;
    isValid: boolean;
    disabled: boolean;
    identifier: TextInputStateIdentifier;
    onValueChange: (changedValue: string, changedStateIdentifier: TextInputStateIdentifier) => void;
}

export interface IETFTextInputState {
    value: string;
    label: string;
    errorMessage: string;
    textAppending: string;
    isValid: boolean;
    disabled: boolean;
    identifier: string;
    onValueChange: (changedValue: string, changedStateIdentifier: string) => void;
}

export type NumberInputStateIdentifier =
    | 'startingCapital'
    | 'monthlyInvestment'
    | 'monthlyPayout'
    | 'transactionCosts'
    | 'savingPhase'
    | 'age'
    | 'lifeExpectation'
    | 'taxFreeAmount'
    | 'yearlyInvestmentIncrease'
    | 'yearlyPayoutIncrease';

export type TextInputStateIdentifier = NumberInputStateIdentifier | 'apiKey';

/**
 * Renders a text input element.
 * 
 * @param props The text input properties.
 * @returns The rendered text input.
 */
export function TextInputElement(props: ITextInputState) {
    return (
        <div className="position-relative">
            <label className="form-label" htmlFor={props.identifier}>
                {props.label}
            </label>
            <input
                className={'form-control ' + (props.isValid ? '' : 'is-invalid')}
                id={props.identifier}
                type="text"
                value={props.value + (props.textAppending !== '' ? ' ' + props.textAppending : '')}
                onChange={e => props.onValueChange(e.target.value, props.identifier)}
                disabled={props.disabled}
            />
            <ErrorMessage {...props} />
        </div>
    );
}

/**
 * Renders a text input element without hard identifier. Intended for the etf drop down.
 * 
 * @param props The text input properties.
 * @returns The rendered text input.
 */
 export function ETFTextInputElement(props: IETFTextInputState) {
    return (
        <div className="position-relative">
            <label className="form-label" htmlFor={props.identifier}>
                {props.label}
            </label>
            <input
                className={'form-control ' + (props.isValid ? '' : 'is-invalid')}
                id={props.identifier}
                type="text"
                value={props.value + (props.textAppending !== '' ? ' ' + props.textAppending : '')}
                onChange={e => props.onValueChange(e.target.value, props.identifier)}
                disabled={props.disabled}
            />
            <ErrorMessage {...props} />
        </div>
    );
}
