import React from 'react';

import { ErrorMessage } from './MinimalBootstrapComponents';

export function TextInputElement(props) {
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
