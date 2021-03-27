import React from 'react';

export function SidebarSectionHeading(props) {
    return (
        <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
            <span>{props.title}</span>
        </h6>
    );
}
