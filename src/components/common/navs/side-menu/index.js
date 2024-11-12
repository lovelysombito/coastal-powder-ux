import React from 'react';
import { AiOutlineSetting } from 'react-icons/ai';
import { BiComment, BiStore } from 'react-icons/bi';
import { BsFillCircleFill } from 'react-icons/bs';
import { FaArchive, FaVectorSquare } from 'react-icons/fa';
import { MdDashboard, MdTimerOff } from 'react-icons/md';
import { TbChartInfographic } from 'react-icons/tb';
import { VscCalendar } from 'react-icons/vsc';
import {
    ARCHIVE_LINK,
    COMMENTS_LINK, DASHBOARD_LINK, DISPATCH_LINK, HUBSPOT_INTEGRATION_LINK, NCR_LINK, OVERDUE_LINK, PASSED_QC_LINK, POWDER_INVENTORY_LINK, QUALITY_CONTROL_LINK, REPORTS_AMOUNT_LINK, REPORTS_FAILED_LINK, REPORTS_LINK, SCHEDULING_OVERVIEW_LINK, SCHEDULING_POWDER_MAIN_LINK, SCOPE, SETTINGS_COLOURS_LINK,
    SETTINGS_LOCATIONS_LINK,
    SETTINGS_NCR_OPTION_LINK,
    SETTINGS_PRODUCTS_LINK, SETTINGS_TREATMENTS, SETTINGS_USERS_LINK, SIDE_MENU_CONTRACTED_WIDTH, SIDE_MENU_EXPANDED_WIDTH, XERO_INTEGRATION_LINK
} from '../../../../constants';
import { useUserScope } from '../../../../hooks';
import SideMenuDropdown from '../side-menu-dropdown';
import SideMenuLink from '../side-menu-link';
import styles from './index.module.css';

const FadedCircleIcon = () => {
    return (
        <span className={styles.faded}>
            <BsFillCircleFill />
        </span>
    );
};

const SIDE_MENU = [
    {
        label: 'Dashboard',
        link: DASHBOARD_LINK,
        icon: 'dashboard',
        isDropdown: false,
        scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR, SCOPE.USER],
    },
    {
        label: 'Overdue',
        link: OVERDUE_LINK,
        icon: 'overdue',
        isDropdown: false,
        scope: [SCOPE.ADMINISTRATOR],
    },
    {
        label: 'Comments',
        link: COMMENTS_LINK,
        icon: 'comments',
        isDropdown: false,
        scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR, SCOPE.USER],
    },
    {
        label: 'Scheduling',
        icon: 'scheduling',
        isDropdown: true,
        scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR, SCOPE.USER],
        dropdown: [
            {
                label: 'Overview',
                link: SCHEDULING_OVERVIEW_LINK,
                icon: 'secondLevel',
                isDropdown: false,
                scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR, SCOPE.USER],
            },
            {
                label: 'Chem Bay',
                link: `${SCHEDULING_OVERVIEW_LINK}/chem`,
                icon: 'secondLevel',
                isDropdown: false,
                scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR, SCOPE.USER],
            },
            
            {
                label: 'Burn Bay',
                link: `${SCHEDULING_OVERVIEW_LINK}/burn`,
                icon: 'secondLevel',
                isDropdown: false,
                scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR, SCOPE.USER],
            },
            {
                label: 'Treatment Bay',
                link: `${SCHEDULING_OVERVIEW_LINK}/treatment`,
                icon: 'secondLevel',
                isDropdown: false,
                scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR, SCOPE.USER],
            },
            {
                label: 'Blast Bay',
                link: `${SCHEDULING_OVERVIEW_LINK}/blast`,
                icon: 'secondLevel',
                isDropdown: false,
                scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR, SCOPE.USER],
            },
            {
                label: 'Powder Coating',
                icon: 'secondLevel',
                isDropdown: true,
                scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR, SCOPE.USER],
                dropdown: [
                    {
                        label: 'Big Batch',
                        link: `${SCHEDULING_POWDER_MAIN_LINK}/powder-big-batch`,
                        icon: 'thirdLevel',
                        isDropdown: false,
                        scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR, SCOPE.USER],
                    },
                    {
                        label: 'Small Batch',
                        link: `${SCHEDULING_POWDER_MAIN_LINK}/powder-small-batch`,
                        icon: 'thirdLevel',
                        isDropdown: false,
                        scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR, SCOPE.USER],
                    },
                    {
                        label: 'Main Line',
                        link: `${SCHEDULING_POWDER_MAIN_LINK}/powder-main-line`,
                        icon: 'thirdLevel',
                        isDropdown: false,
                        scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR, SCOPE.USER],
                    },
                ],
            },
        ],
    },

    {
        label: 'Quality Control',
        icon: 'qualityControl',
        isDropdown: true,
        scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR],
        dropdown: [
            {
                label: 'Pending QC',
                link: QUALITY_CONTROL_LINK,
                icon: 'secondLevel',
                isDropdown: false,
                scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR],
            },
            {
                label: 'Passed QC',
                link: PASSED_QC_LINK,
                icon: 'secondLevel',
                isDropdown: false,
                scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR],
            },
            {
                label: 'NCR',
                link: NCR_LINK,
                icon: 'secondLevel',
                isDropdown: false,
                scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR],
            },
        ],
    },
    {
        label: 'Dispatch',
        link: DISPATCH_LINK,
        icon: 'dispatch',
        isDropdown: false,
        scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR],
    },
    {
        label: 'Powder Inventory',
        link: POWDER_INVENTORY_LINK,
        icon: 'inventory',
        isDropdown: false,
        scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR],
    },
    {
        label: 'Archive',
        link: ARCHIVE_LINK,
        icon: 'archive',
        isDropdown: false,
        scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR],
    },
    {
        label: 'Reports',
        icon: 'reports',
        isDropdown: true,
        scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR],
        dropdown: [
            {
                label: 'Bay Report',
                link: REPORTS_LINK,
                icon: 'secondLevel',
                isDropdown: false,
                scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR],
            },
            {
                label: 'Failed Jobs Report',
                link: REPORTS_FAILED_LINK,
                icon: 'secondLevel',
                isDropdown: false,
                scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR],
            },
            {
                label: 'Jobs Amount Report',
                link: REPORTS_AMOUNT_LINK,
                icon: 'secondLevel',
                isDropdown: false,
                scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR],
            },
        ],
    },
    {
        label: 'Settings',
        icon: 'setting',
        isDropdown: true,
        scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR],
        dropdown: [
            {
                label: 'Users',
                link: SETTINGS_USERS_LINK,
                icon: 'secondLevel',
                isDropdown: false,
                scope: [SCOPE.ADMINISTRATOR],
            },
            {
                label: 'Colours',
                link: SETTINGS_COLOURS_LINK,
                icon: 'secondLevel',
                isDropdown: false,
                scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR],
            },
            {
                label: 'Locations',
                link: SETTINGS_LOCATIONS_LINK,
                icon: 'secondLevel',
                isDropdown: false,
                scope: [SCOPE.ADMINISTRATOR],
            },
            {
                label: 'NCR Failed Options',
                link: SETTINGS_NCR_OPTION_LINK,
                icon: 'secondLevel',
                isDropdown: false,
                scope: [SCOPE.ADMINISTRATOR],
            },
            {
                label: 'Treatments',
                link: `${SETTINGS_TREATMENTS}`,
                icon: 'secondLevel',
                isDropdown: false,
                scope: [SCOPE.ADMINISTRATOR],
            },
            {
                label: 'Products',
                link: SETTINGS_PRODUCTS_LINK,
                icon: 'secondLevel',
                isDropdown: false,
                scope: [SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR],
            },
            {
                label: 'Integrations',
                icon: 'secondLevel',
                isDropdown: true,
                scope: [SCOPE.ADMINISTRATOR],
                dropdown: [
                    {
                        label: 'HubSpot',
                        link: HUBSPOT_INTEGRATION_LINK,
                        icon: 'thirdLevel',
                        isDropdown: false,
                        scope: [SCOPE.ADMINISTRATOR],
                    },
                    {
                        label: 'Xero',
                        link: XERO_INTEGRATION_LINK,
                        iconSize: '5px',
                        icon: 'thirdLevel',
                        isDropdown: false,
                        scope: [SCOPE.ADMINISTRATOR],
                    },
                ],
            },
        ],
    },
];

const icons = {
    dashboard: <MdDashboard />,
    overdue: <MdTimerOff />,
    comments:<BiComment />,
    scheduling: <VscCalendar />,
    qualityControl: <AiOutlineSetting />,
    inventory:<BiStore/>,
    dispatch: <FaVectorSquare />,
    archive: <FaArchive />,
    reports: <TbChartInfographic />,
    setting: <AiOutlineSetting />,
    secondLevel: <BsFillCircleFill />,
    thirdLevel: <FadedCircleIcon />,
};

const SideMenu = ({ isExpanded, setIsExpanded }) => {
    const userScope = useUserScope();
    const itemRootLevelPadding = '20px';
    const itemSecondLevelPadding = '40px';
    const itemThirdLevelPadding = '60px';

    const filterMenu = (data, scope) => data.filter(item => {
        if (item.isDropdown) item.dropdown = filterMenu(item.dropdown, scope);
        return item.scope.includes(scope);
    })

    // Deep clone the menu to avoid reference modified
    const menu = filterMenu(JSON.parse(JSON.stringify(SIDE_MENU)), userScope);
    console.log(menu)

    return (
        <div id='side-menu' className={styles.sideMenu} style={{ width: isExpanded ? SIDE_MENU_EXPANDED_WIDTH : SIDE_MENU_CONTRACTED_WIDTH }}>
            {menu.map((itemRootLevel) =>
                itemRootLevel.isDropdown ? (
                    <SideMenuDropdown
                        key={`root-level-dropdown-${itemRootLevel.label}`}
                        label={itemRootLevel.label}
                        paddingLeft={itemRootLevelPadding}
                        icon={icons[itemRootLevel.icon]}
                        isMenuExpanded={isExpanded}
                        setMenuExpanded={setIsExpanded}
                        scope={itemRootLevel.scope}
                    >
                        {itemRootLevel.dropdown.map((itemSecondLevel) =>
                            itemSecondLevel.isDropdown ? (
                                <SideMenuDropdown
                                    key={`second-level-dropdown-${itemSecondLevel.label}`}
                                    label={itemSecondLevel.label}
                                    paddingLeft={itemSecondLevelPadding}
                                    icon={icons[itemSecondLevel.icon]}
                                    isMenuExpanded={isExpanded}
                                    setMenuExpanded={setIsExpanded}
                                    scope={itemSecondLevel.scope}
                                    iconSize='5px'
                                >
                                    {itemSecondLevel.dropdown.map((itemThirdLevel) => (
                                        <SideMenuLink
                                            key={`third-level-link-${itemThirdLevel.label}`}
                                            label={itemThirdLevel.label}
                                            link={itemThirdLevel.link}
                                            paddingLeft={itemThirdLevelPadding}
                                            icon={icons[itemThirdLevel.icon]}
                                            isMenuExpanded={isExpanded}
                                            scope={itemThirdLevel.scope}
                                            iconSize='5px'
                                        />
                                    ))}
                                </SideMenuDropdown>
                            ) : (
                                <SideMenuLink
                                    key={`second-level-link-${itemSecondLevel.label}`}
                                    label={itemSecondLevel.label}
                                    link={itemSecondLevel.link}
                                    paddingLeft={itemSecondLevelPadding}
                                    icon={icons[itemSecondLevel.icon]}
                                    isMenuExpanded={isExpanded}
                                    scope={itemSecondLevel.scope}
                                    iconSize='5px'
                                />
                            )
                        )}
                    </SideMenuDropdown>
                ) : (
                    <SideMenuLink
                        key={`root-level-link-${itemRootLevel.label}`}
                        isRoot
                        label={itemRootLevel.label}
                        link={itemRootLevel.link}
                        paddingLeft={itemRootLevelPadding}
                        icon={icons[itemRootLevel.icon]}
                        isMenuExpanded={isExpanded}
                        scope={itemRootLevel.scope}
                    />
                )
            )}
        </div>
    );
};

export default SideMenu;
