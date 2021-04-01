import React from 'react';

import { TextInputElement } from './TextInputElement';

import { ErrorMessage } from './MinimalBootstrapComponents';

function percentageTransformFunction(e) {
    const floatVal = parseFloat(e.target.value) / 100;
    return isNaN(floatVal) ? 0 : floatVal;
}

export function ETFSelectionDropDown(props) {
    return (
        <div className="dropdown position-relative">
            <button
                className="btn btn-secondary dropdown-toggle is-invalid"
                type="button"
                id="ETFSelectionDropDown"
                data-bs-toggle="dropdown"
                aria-expanded="false">
                {props.label}
            </button>
            <ErrorMessage {...props} />
            <ul className="dropdown-menu" aria-labelledby="ETFSelectionDropDown">
                {Object.keys(props.elements).map(elementIdentifier => (
                    <li key={elementIdentifier}>
                        <button
                            className={
                                props.elements[elementIdentifier].selected ? 'dropdown-item active' : 'dropdown-item'
                            }
                            type="button"
                            onClick={e => {
                                if (e.target.type !== 'text') {
                                    props.handleSelectionChange(props.elements[elementIdentifier]);
                                }
                            }}>
                            <TextInputElement
                                {...props.elements[elementIdentifier]}
                                value={Math.round(props.elements[elementIdentifier].percentage * 100)}
                                textAppending="%"
                                onValueChange={props.handleShareChange}
                                transformFunction={percentageTransformFunction}
                                disabled={props.autoPercentage}
                                isValid={true}
                            />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
