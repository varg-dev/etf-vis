import React from 'react';

export class CheckboxInputElement extends React.Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(e) {
        this.props.onValueChange(this.props.identifier);
    }

    render() {
        return (
            <div className="checkbox-element">
                <input
                    className="form-check-input"
                    id={this.props.identifier}
                    type={this.props.type}
                    value={this.props.value}
                    onChange={this.handleChange}
                />
                <label className="form-check-label" htmlFor={this.props.identifier}>
                    {this.props.label}
                </label>
            </div>
        );
    }
}

export default CheckboxInputElement;
