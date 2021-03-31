import React from 'react';

import { TextInputElement } from './TextInputElement';

export function SidebarSectionHeading(props) {
    return (
        <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
            <span>{props.title}</span>
        </h6>
    );
}

export function Overlay(props) {
    return (
        <div className="row">
            <div className="col-12 p-0">
                <div className="d-grid gap-0">
                    <div
                        className="overlay min-vh-100 text-center m-0 d-flex flex-column justify-content-center"
                        style={{ visibility: props.displayOverlay ? 'visible' : 'hidden' }}>
                        <h1 className="p-5">Enter your personal Alphavantage API Key</h1>
                        <TextInputElement {...props} disabled={!props.displayOverlay} />
                        <button type="button" className="btn btn-primary my-5" onClick={props.handleAPIKeyConfirm}>
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
