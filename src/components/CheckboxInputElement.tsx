export interface ICheckboxState {
    value: boolean;
    label: string;
    identifier: ICheckBoxStateIdentifier;
    onValueChange: (changedStateIdentifier: ICheckBoxStateIdentifier) => void;
}

export type ICheckBoxStateIdentifier =
    | 'etfAutomaticPercentage'
    | 'yAxisLock'
    | 'inflationUsedForTotal'
    | 'useDistributionModel';

/**
 * Renders a checkbox from the given properties.
 *
 * @param props The checkbox properties.
 * @returns The rendered checkbox.
 */
export function CheckboxInputElement(props: ICheckboxState) {
    return (
        <div className="checkbox-element">
            <input
                className="form-check-input"
                id={props.identifier}
                type="checkbox"
                value={props.value.toString()}
                onChange={() => props.onValueChange(props.identifier)}
            />
            <label className="form-check-label" htmlFor={props.identifier}>
                {props.label}
            </label>
        </div>
    );
}
