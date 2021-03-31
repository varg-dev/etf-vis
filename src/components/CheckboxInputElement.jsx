import React from 'react';

export function CheckboxInputElement(props) {
    return (
        <div className="checkbox-element">
            <input
                className="form-check-input"
                id={props.identifier}
                type="checkbox"
                value={props.value}
                onChange={() => props.onValueChange(props.identifier)}
            />
            <label className="form-check-label" htmlFor={props.identifier}>
                {props.label}
            </label>
        </div>
    );
}

export default CheckboxInputElement;
