import React from 'react';

export class TextInputElement extends React.Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(e) {
        this.props.onValueChange(this.props.transformFunction(e, this), this.props.identifier);
    }

    render() {
        return (
            <React.Fragment>
                <label className="form-label" htmlFor={this.props.identifier}>
                    {this.props.label}
                </label>
                <input
                    className="form-control"
                    id={this.props.identifier}
                    type={this.props.type}
                    value={this.props.value.toString() + ' ' + this.props.textAppending}
                    onChange={this.handleChange}
                />
            </React.Fragment>
        );
    }
}

export default TextInputElement;
