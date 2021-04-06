interface IErrorMessage {
    identifier: string;
    isValid: boolean;
    errorMessage: string;
}

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
