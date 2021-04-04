export type CheckBoxStateIdentifier = 'transactionCostsType' | 'etfAutomaticPercentage' | 'yAxisLock';

export interface CheckboxState {
    value: boolean;
    label: string;
    identifier: CheckBoxStateIdentifier;
    onValueChange: (changedStateIdentifier: CheckBoxStateIdentifier) => void;
}


export function CheckboxInputElement(props: CheckboxState) {
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

export default CheckboxInputElement;
