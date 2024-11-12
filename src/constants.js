export const BASE_URL = "https://api.production.coastalpowder.upstreamtech.dev";
// export const BASE_URL = "https://api.coastalpowder.upstreamtech.dev";
// export const BASE_URL= 'http://localhost:8000';
export const API_BASE_URL = BASE_URL+"/api";

export const LOGIN_LINK = "/login"
export const VERIFY_LINK = "/verify"
export const RESET_PASSWORD_LINK = "/reset-password"
export const CHANGE_PASSWORD_LINK = "/profile/change-password"
export const DASHBOARD_LINK = "/dashboard"
export const OVERDUE_LINK = "/overdue"
export const COMMENTS_LINK = "/comments"
export const QUALITY_CONTROL_LINK = "/qc"
export const PASSED_QC_LINK = "/qc/passed"
export const NCR_LINK = '/qc/ncr'
export const DISPATCH_LINK = "/dispatch"
export const POWDER_INVENTORY_LINK= '/powder/inventory'
export const ARCHIVE_LINK = "/archive"
export const REPORTS_LINK = "/reports"
export const REPORTS_FAILED_LINK = "/reports/failed/jobs"
export const REPORTS_AMOUNT_LINK = "/reports/failed/amount-count"
export const PROFILE_LINK = "/profile"
export const NOTIFICATIONS_LINK = "/profile/notifications"
export const AUTHENTICATIONS_LINK = "/profile/authentications"
export const SETTINGS_USERS_LINK = "/settings/users"
export const SETTINGS_COLOURS_LINK = "/settings/colours"
export const SETTINGS_COLOURS_UPDATE_LINK = "/settings/colours/:id"
export const SETTINGS_LOCATIONS_LINK = "/settings/locations"
export const SETTINGS_NCR_OPTION_LINK = "/settings/ncr-option"
export const SETTINGS_TREATMENTS = "/settings/treatments"
export const SETTINGS_PRODUCTS_LINK = "/settings/products"
export const HUBSPOT_INTEGRATION_LINK = "/settings/integrations/hubspot"
export const XERO_INTEGRATION_LINK = "/settings/integrations/xero"
export const SCHEDULING_OVERVIEW_LINK = "/schedule"
export const SCHEDULING_BAY_LINK = "/schedule/:bay"
export const SCHEDULING_POWDER_MAIN_LINK = "/powder"
export const SCHEDULING_POWDER_LINK = "/powder/:powder"
export const VERIFY_TWO_FACTOR_AUTH_PAGE = "/verify-two-factor-auth-page"
export const JOB_STATUS_URL = "/jobs/:jobId"
export const SIDE_MENU_EXPANDED_WIDTH = "200px"
export const SIDE_MENU_CONTRACTED_WIDTH = "60px"
export const COMMENT_NOTIFICATION_LINK = "comment-notification/:id"
export const SCOPE = {
    ADMINISTRATOR: 'administrator',
    SUPERVISOR: 'supervisor',
    USER: 'user',
}
export const ALLOW_MODIFY_CARD_SCOPE = [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR];
export const BAY_OBJECT = {
    'Chem Bay': 'chemDate',
    'Burn Bay': 'burnDate',
    'Treatment Bay': 'treatmentDate',
    'Blast Bay': 'blastDate',
    'Powder Bay': 'powderDate',
};
export const BAY_ARRANGE_OBJECT = {
    'Chem Bay': 0,
    'Burn Bay': 1,
    'Treatment Bay': 2,
    'Blast Bay': 3,
    'Powder Bay': 4,
};
export const BAY_ARRAY_DETAIL = [
    {
        id: 'chem',
        key: 'chemDate',
        databaseKey: 'chem_date',
        dateName: 'Chem Date',
        bayName: 'Chem Bay',
        defaultContractor: {value: 'Alloy Strip', label: 'Alloy Strip'},
        contractorOption: [
            {value: 'Alloy Strip', label: 'Alloy Strip'}
        ]
    },
    {
        id: 'burn',
        key: 'burnDate',
        databaseKey: 'burn_date',
        dateName: 'Burn Date',
        bayName: 'Burn Bay',
        defaultContractor: {value: 'CPC', label: 'CPC'},
        contractorOption: [
            {value: 'QHDC', label: 'QHDC'},
            {value: 'CPC', label: 'CPC'}
        ]
    },
    {
        id: 'treatment',
        key: 'treatmentDate',
        databaseKey: 'treatment_date',
        dateName: 'Treatment Date',
        bayName: 'Treatment Bay',
    },
    {
        id: 'blast',
        key: 'blastDate',
        databaseKey: 'blast_date',
        dateName: 'Blast Date',
        bayName: 'Blast Bay',
        defaultContractor: {value: 'CPC', label: 'CPC'},
        contractorOption: [
            {value: 'Neumanns', label: 'Neumanns'},
            {value: 'CPC', label: 'CPC'},
        ]
    },
    {
        id: 'powder',
        key: 'powderDate',
        databaseKey: 'powder_date',
        dateName: 'Powder Date',
        bayName: 'Powder Bay',
    },
];

export const DEFAULT_BAYS = [
    {
        label: 'Chem Bay',
        checked: false,
        id: 'chem_bay'
    },
    {
        label: 'Treatment Bay',
        checked: false,
        id: 'treatment_bay'
    },
    {
        label: 'Burn Bay',
        checked: false,
        id: 'burn_bay'
    },
    {
        label: 'Blast Bay',
        checked: false,
        id: 'blast_bay'
    },
    {
        label: 'Powder Bay',
        checked: false,
        id: 'powder_bay',
        powder_bays: [
            {
                id: 'main line',
                label: 'Main Line',
            },
            {
                id: 'big batch',
                label: 'Big Batch',
            },
            {
                id: 'small batch',
                label: 'Small Batch',
            }
        ]
    }  
];

export const POWDER_BAYS = [
    {
        id: 'main line',
        label: 'Main Line',
    },
    {
        id: 'big batch',
        label: 'Big Batch',
    },
    {
        id: 'small batch',
        label: 'Small Batch',
    }
]

export const STATUS_OPTIONS = [
    {
        label: 'In Progress',
        color: 'gold',
        id: 'in progress'
    },
    {
        label: 'Complete',
        color: 'green',
        id: 'complete'
    },
];

export const COLUMN_TYPE_OPTIONS = [
    {
        value: "colour",
        name: "Colour" 
    },
    {
        value: "client_name",
        name: "Client Name"
    },
    {
        value: "status",
        name: "Status"
    }, 
    {
        value: "material",
        name: "Material"
    },
    {
        value: "treatment",
        name: "Treatment"
    },
    {
        value: "po_number",
        name: "PO Number"
    },
    {
        value: "invoice_number",
        name: "Invoice Number"
    }
]

export const COMPARISON_OPERATOR_OPTIONS = [
    {
        value: "is",
        name: "is"
    },
    {
        value: "is_not",
        name: "is not"
    }
]

export const JOB_STATUS_OPTIONS = [
    {
        label: 'Ready',
        value: 'Ready'
    },
    {
        label: 'In Progress',
        value: 'In Progress'
    },
    {
        label: 'Awaiting QC',
        value: 'Awaiting QC'

    },
    {
        label: 'Awaiting QC Passed',
        value: 'Awaiting QC Passed'

    },
    {
        label: 'QC Passed',
        value: 'QC Passed'

    },
    {
        label: 'Dispatched',
        value: 'Dispatched'

    },
    {
        label: 'Complete',
        value: 'Complete'

    },
    {
        label: 'Partially Shipped',
        value: 'Partially Shipped'

    },
    {
        label: 'Error | Redo',
        value: 'Error | Redo'

    }
]

export const MATERIAL_OPTIONS = [
    {
        label: 'steel',
        value: 'steel'
    },
    {
        label: 'aluminium',
        value: 'aluminium'
    },
    {
        label: 'other',
        value: 'other'
    },
    {
        label: 'gal',
        value: 'gal'
    }
]
