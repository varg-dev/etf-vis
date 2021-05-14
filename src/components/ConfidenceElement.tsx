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
            <InputLabel {...props.middleConfidence} />
            <div className="row">
                <div className="col align-self-center">
                    <input
                        type="range"
                        className="form-range position-relative"
                        min={props.minConfidence.value}
                        max={props.maxConfidence.value}
                        step={0.1}
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
                <div className="col-5 align-self-center">
                    <TextOrNumberInputElement {...props.middleConfidence} noLabel={true} />
                </div>
            </div>
        </div>
    );
}
