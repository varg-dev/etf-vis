interface IErrorMessage {
    identifier: string;
    isValid: boolean;
    errorMessage: string;
}

/**
 * Renders an error message as a tooltip.
 * 
 * @param props The error message properties.
 * @returns The rendered error message.
 */
export function ErrorMessage(props: IErrorMessage) {
    return (
        <div
            id={props.identifier + 'Feedback'}
            className="invalid-tooltip"
            style={{ visibility: props.isValid ? 'hidden' : 'visible' }}>
            {props.errorMessage}
        </div>
    );
}
