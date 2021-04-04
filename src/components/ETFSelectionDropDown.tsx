import { ChangeEvent, MouseEvent } from 'react';

import { ETFPercentageInputElement } from './TextInputElement';
import { ErrorMessage } from './MinimalBootstrapComponents';

export interface ETFProperties {
    identifier: string;
    symbol: string;
    label: string;
    percentage: number;
    selected: boolean;
}

interface ETFIndex {
    [etfIdentifier: string]: ETFProperties;
}

export interface ETFSelection {
    label: string;
    isValid: boolean;
    identifier: string;
    errorMessage: string;
    handleSelectionChange: (etfProperties: ETFProperties) => void;
    handleShareChange: (changedValue: number, changedStateIdentifier: string) => void;
    elements: ETFIndex;
}

type ETFSelectionDropDownProps = ETFSelection & { autoPercentage: boolean };

function percentageTransformFunction(e: ChangeEvent<HTMLInputElement>) {
    const floatVal = parseFloat(e.target.value) / 100;
    return isNaN(floatVal) ? 0 : floatVal;
}

export function ETFSelectionDropDown(props: ETFSelectionDropDownProps) {
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
                            onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                //if (e.target.type !== 'text') {
                                    props.handleSelectionChange(props.elements[elementIdentifier]);
                                //}
                            }}>
                            <ETFPercentageInputElement
                                {...props.elements[elementIdentifier]}
                                value={Math.round(props.elements[elementIdentifier].percentage * 100)}
                                textAppending="%"
                                onValueChange={props.handleShareChange}
                                transformFunction={percentageTransformFunction}
                                disabled={props.autoPercentage}
                                isValid={true}
                                errorMessage=''
                            />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
