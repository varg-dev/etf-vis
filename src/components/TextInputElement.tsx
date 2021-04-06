import { ChangeEvent } from 'react';
import { ErrorMessage } from './MinimalBootstrapComponents';

export interface ITextInputState {
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

export interface IStringTextInputState {
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

export interface IETFPercentageInputState {
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
                value={props.value.toString() + (props.textAppending !== '' ? ' ' + props.textAppending : '')}
                onChange={e => props.onValueChange(props.transformFunction(e), props.identifier)}
                disabled={props.disabled}
            />
            <ErrorMessage {...props} />
        </div>
    );
}

export function StringTextInputElement(props: IStringTextInputState) {
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

export function ETFPercentageInputElement(props: IETFPercentageInputState) {
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
