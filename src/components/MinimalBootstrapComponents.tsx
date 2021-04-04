interface ISidebarSectionHeading {
    title: string;
}

interface IErrorMessage {
    identifier: string;
    isValid: boolean;
    errorMessage: string;
}

export function SidebarSectionHeading(props: ISidebarSectionHeading) {
    return (
        <div className="position-relative">
            <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1">
                <span>{props.title}</span>
            </h6>
        </div>
    );
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
