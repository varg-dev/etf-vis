import { NumberInputElement, InputLabel, INumberInputState } from './TextInputElement';

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
    const tickmarksArray = [];
    for (let i = Math.ceil(props.minConfidence.value / 10) * 10; i <= props.maxConfidence.value; i += 10) {
        tickmarksArray.push(i);
    }
    return (
        <div className="confidence">
            <InputLabel {...props.minConfidence} />
            <div className="row">
                <div className="col">
                    <NumberInputElement {...props.minConfidence} noLabel={true} />
                </div>
                <div className="col-1">-</div>
                <div className="col">
                    <NumberInputElement {...props.maxConfidence} noLabel={true} />
                </div>
            </div>
            <input
                type="range"
                className="form-range"
                min={props.minConfidence.value}
                max={props.maxConfidence.value}
                step={0.1}
                id={props.middleConfidence.identifier}
                value={props.middleConfidence.value}
                onChange={e =>
                    props.middleConfidence.onValueChange(e.target.value, props.middleConfidence.identifier, true)
                }
            />
        </div>
    );
}
