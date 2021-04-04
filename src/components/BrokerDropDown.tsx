import { ICostConfiguration } from './Visualization';

export interface BrokerProperties {
    identifier: string;
    label: string;
    fixedCosts: number;
    percentageCosts: number;
}

export interface IBrokerDropDown {
    label: string;
    isValid: boolean;
    handleChange: (brokerProperties: BrokerProperties) => void;
    elements: BrokerProperties[];
}

type BrokerDropDownProps = ICostConfiguration & IBrokerDropDown;

function costsOfElementMatchUIValues(props: BrokerDropDownProps, element: BrokerProperties) {
    return element.fixedCosts === props.fixedCosts && element.percentageCosts === props.percentageCosts;
}

export function BrokerDropDown(props: BrokerDropDownProps) {
    return (
        <div className="dropdown">
            <button
                className="btn btn-secondary dropdown-toggle"
                type="button"
                id="BrokerDropDown"
                data-bs-toggle="dropdown"
                aria-expanded="false">
                {props.label}
            </button>
            <ul className="dropdown-menu" aria-labelledby="BrokerDropDown">
                {props.elements.map(element => (
                    <li key={element.identifier}>
                        <button
                            className={
                                costsOfElementMatchUIValues(props, element) ? 'dropdown-item active' : 'dropdown-item'
                            }
                            type="button"
                            onClick={e => props.handleChange(element)}>
                            {element.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
