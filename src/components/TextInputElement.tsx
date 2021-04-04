import { ChangeEvent } from 'react';
import { ErrorMessage } from './MinimalBootstrapComponents';

export type NumberInputStateIdentifier =
    | 'startingCapital'
    | 'monthlyInvestment'
    | 'monthlyPayout'
    | 'transactionCosts'
    | 'savingPhase'
    | 'age'
    | 'lifeExpectation'
    | 'taxFreeAmount';

export type TextInputStateIdentifier = NumberInputStateIdentifier | 'apiKey';

export interface TextInputState {
    value: number;
    label: string;
    errorMessage: string;
    textAppending: string;
    isValid: boolean;
    disabled: boolean;
    identifier: NumberInputStateIdentifier;
    transformFunction: (e: ChangeEvent<HTMLInputElement>) => number;
    onValueChange: (changedValue: number, changedStateIdentifier: NumberInputStateIdentifier) => void;
}

export interface StringTextInputState {
    value: string;
    label: string;
    errorMessage: string;
    textAppending: string;
    isValid: boolean;
    disabled: boolean;
    identifier: TextInputStateIdentifier;
    transformFunction: (e: ChangeEvent<HTMLInputElement>) => string;
    onValueChange: (changedValue: string, changedStateIdentifier: TextInputStateIdentifier) => void;
}

export interface ETFPercentageInputState {
    value: number;
    label: string;
    errorMessage: string;
    textAppending: string;
    isValid: boolean;
    disabled: boolean;
    identifier: string;
    transformFunction: (e: ChangeEvent<HTMLInputElement>) => number;
    onValueChange: (changedValue: number, changedStateIdentifier: string) => void;
}

export function TextInputElement(props: TextInputState) {
    return (
        <div className="position-relative">
            <label className="form-label" htmlFor={props.identifier}>
                {props.label}
            </label>
            <input
                className={'form-control ' + (props.isValid ? '' : 'is-invalid')}
                id={props.identifier}
                type="text"
                value={props.value.toString() + (props.textAppending !== '' ? ' ' + props.textAppending : '')}
                onChange={e => props.onValueChange(props.transformFunction(e), props.identifier)}
                disabled={props.disabled}
            />
            <ErrorMessage {...props} />
        </div>
    );
}

export function StringTextInputElement(props: StringTextInputState) {
    return (
        <div className="position-relative">
            <label className="form-label" htmlFor={props.identifier}>
                {props.label}
            </label>
            <input
                className={'form-control ' + (props.isValid ? '' : 'is-invalid')}
                id={props.identifier}
                type="text"
                value={props.value.toString() + (props.textAppending !== '' ? ' ' + props.textAppending : '')}
                onChange={e => props.onValueChange(props.transformFunction(e), props.identifier)}
                disabled={props.disabled}
            />
            <ErrorMessage {...props} />
        </div>
    );
}

export function ETFPercentageInputElement(props: ETFPercentageInputState) {
    return (
        <div className="position-relative">
            <label className="form-label" htmlFor={props.identifier}>
                {props.label}
            </label>
            <input
                className={'form-control ' + (props.isValid ? '' : 'is-invalid')}
                id={props.identifier}
                type="text"
                value={props.value.toString() + (props.textAppending !== '' ? ' ' + props.textAppending : '')}
                onChange={e => props.onValueChange(props.transformFunction(e), props.identifier)}
                disabled={props.disabled}
            />
            <ErrorMessage {...props} />
        </div>
    );
}

export default TextInputElement;
