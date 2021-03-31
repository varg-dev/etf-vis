import React from 'react';

import { TextInputElement } from './TextInputElement';

function percentageTransformFunction(e) {
    const floatVal = parseFloat(e.target.value) / 100;
    return isNaN(floatVal) ? 0 : floatVal;
}

export function ETFSelectionDropDown(props) {
    console.log(props);
    return (
        <div className="dropdown">
            <button
                className="btn btn-secondary dropdown-toggle"
                type="button"
                id="ETFSelectionDropDown"
                data-bs-toggle="dropdown"
                aria-expanded="false">
                {props.label}
            </button>
            <ul className="dropdown-menu" aria-labelledby="ETFSelectionDropDown">
                {Object.keys(props.elements).map(elementIdentifier => (
                    <li key={elementIdentifier}>
                        <button
                            className={
                                props.elements[elementIdentifier].selected ? 'dropdown-item active' : 'dropdown-item'
                            }
                            type="button"
                            onClick={e => props.handleSelectionChange(props.elements[elementIdentifier])}>
                            <TextInputElement
                                {...props.elements[elementIdentifier]}
                                value={(props.elements[elementIdentifier].percentage * 100).toFixed(2)}
                                textAppending="%"
                                onValueChange={props.handleShareChange}
                                transformFunction={percentageTransformFunction}
                                disabled={props.autoPercentage}
                            />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
