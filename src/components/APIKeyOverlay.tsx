import { TextOrNumberInputElement, TextInputStateIdentifier } from './TextInputElement';

export interface IAPIKey {
    displayOverlay: boolean;
    value: string;
    label: string;
    errorMessage: string;
    isValid: boolean;
    textAppending: string;
    identifier: TextInputStateIdentifier;
    onValueChange: (changedValue: string, changedStateIdentifier: TextInputStateIdentifier) => void;
    handleAPIKeyConfirm: () => void;
    error: boolean;
}

/**
 * Renders the API Key entering UI.
 *
 * @param props The properties for the api key UI.
 * @returns
 */
export function Overlay(props: IAPIKey) {
    return (
        <div className="row">
            <div className="col-12 p-0">
                <div className="d-grid gap-0">
                    <div
                        className="overlay min-vh-100 text-center m-0 d-flex flex-column justify-content-center"
                        style={{ visibility: props.displayOverlay ? 'visible' : 'hidden' }}>
                        <h1 className="p-5">
                            Enter your personal{' '}
                            <a
                                href="https://www.alphavantage.co/support/#api-key"
                                target="_blank"
                                rel="noopener noreferrer">
                                {' '}
                                Alphavantage API Key
                            </a>{' '}
                        </h1>
                        <TextOrNumberInputElement {...props} disabled={!props.displayOverlay} />
                        <button type="button" className="btn btn-primary my-5" onClick={props.handleAPIKeyConfirm}>
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
