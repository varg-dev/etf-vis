import { TextOrNumberInputElement, InputLabel, INumberInputState } from './TextInputElement';

export interface IConfidence {
    minConfidence: INumberInputState;
    maxConfidence: INumberInputState;
    middleConfidence: INumberInputState;
}

/**
 * Renders the confidence UI. Consists of a slider and two numeric inputs.
 *
 * @param props The confidence properties consisting of three INumberInputState.
 * @returns The rendering of the confidence UI.
 */
export function ConfidenceElement(props: IConfidence) {
    return (
        <div className="confidence">
            <InputLabel {...props.minConfidence} />
            <div className="row">
                <div className="col">
                    <TextOrNumberInputElement {...props.minConfidence} noLabel={true} />
                </div>
                <div className="col-1">-</div>
                <div className="col">
                    <TextOrNumberInputElement {...props.maxConfidence} noLabel={true} />
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <input
                        type="range"
                        className="form-range"
                        min={props.minConfidence.value}
                        max={props.maxConfidence.value}
                        step={0.1}
                        id={props.middleConfidence.identifier}
                        value={props.middleConfidence.value}
                        onChange={e =>
                            props.middleConfidence.onValueChange(
                                e.target.value,
                                props.middleConfidence.identifier,
                                true
                            )
                        }
                    />
                </div>
                <div className="col-2 text-nowrap">
                    <span>
                        {props.middleConfidence.value.toLocaleString(undefined, {
                            maximumFractionDigits: 1,
                            minimumFractionDigits: 1,
                        })}
                    </span>
                </div>
            </div>
        </div>
    );
}
