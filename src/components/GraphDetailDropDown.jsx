import React from 'react';

export function GraphDetailDropDown(props) {
    return (
        <div className="dropdown">
            <button
                className="btn btn-secondary dropdown-toggle"
                type="button"
                id="GraphDetailDropDown"
                data-bs-toggle="dropdown"
                aria-expanded="false">
                {props.label}
            </button>
            <ul className="dropdown-menu" aria-labelledby="GraphDetailDropDown">
                {props.elements.map(element => (
                    <li key={element.identifier}>
                        <button
                            className={
                                props.value === element.value ? 'dropdown-item active' : 'dropdown-item'
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
