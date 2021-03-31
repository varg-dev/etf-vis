import React from 'react';

export function TextInputElement(props) {
    return (
        <React.Fragment>
            <label className="form-label" htmlFor={props.identifier}>
                {props.label}
            </label>
            <input
                className="form-control"
                id={props.identifier}
                type="text"
                value={props.value.toString() + (props.textAppending !== '' ? ' ' + props.textAppending : '')}
                onChange={e => props.onValueChange(props.transformFunction(e), props.identifier)}
                disabled={props.disabled}
            />
        </React.Fragment>
    );
}

export default TextInputElement;
