import SideMenu from '../navs/side-menu';
import Header from '../navs/header';
import Dashboard from '../../pages/dashboard';
import Comments from '../../pages/comments';
import QualityControl from '../../pages/quality-control';
import Profile from '../../pages/profile';
import {
    DASHBOARD_LINK,
    COMMENTS_LINK,
    QUALITY_CONTROL_LINK,
    PROFILE_LINK,
    DISPATCH_LINK,
    POWDER_INVENTORY_LINK,
    REPORTS_LINK,
    SETTINGS_USERS_LINK,
    SETTINGS_COLOURS_LINK,
    SETTINGS_PRODUCTS_LINK,
    HUBSPOT_INTEGRATION_LINK,
    XERO_INTEGRATION_LINK,
    SCHEDULING_OVERVIEW_LINK,
    SCHEDULING_BAY_LINK,
    SCHEDULING_POWDER_LINK,
    SCOPE,
    SIDE_MENU_EXPANDED_WIDTH,
    SIDE_MENU_CONTRACTED_WIDTH,
    JOB_STATUS_URL,
    ARCHIVE_LINK,
    PASSED_QC_LINK,
    NCR_LINK,
    OVERDUE_LINK,
    SETTINGS_LOCATIONS_LINK,
    SETTINGS_NCR_OPTION_LINK,
    SETTINGS_TREATMENTS,
    COMMENT_NOTIFICATION_LINK,
    REPORTS_FAILED_LINK,
    REPORTS_AMOUNT_LINK,
} from '../../../constants';
import { Routes, Route } from 'react-router-dom';
import styles from './index.module.css';
import Dispatch from '../../pages/dispatch';
// import Reports from '../../pages/reports';
import JobStatus from '../../pages/jobs/status';
import SettingsUsers from '../../pages/settings/users';
import SettingsColours from '../../pages/settings/colours';
import SettingsProducts from '../../pages/settings/products';
import HubspotIntegration from '../../pages/hubspot-integration';
import XeroIntegration from '../../pages/xero-integration';
import SchedulingOverview from '../../pages/scheduling/overview';
import SchedulingBay from '../../pages/scheduling/bay';
import { useState } from 'react';
import Footer from '../footer';
import PowderBay from '../../pages/scheduling/powder';
import ScopeAuthRoute from '../scope-auth-route';
import Archive from '../../pages/archive';
import PassedQualityControl from '../../pages/passed-qc';
import NCR from '../../pages/ncr';
import SettingsLocations from '../../pages/settings/location';
import SettingsNCROption from '../../pages/settings/ncr-failed-option';
import PowderInventory from '../../pages/powder-inventory';
import SettingsTreatments from '../../pages/settings/treatments';
import CommentNotification from '../../pages/comment-notification';
import BayReport from '../../pages/reports/bay-report';
import FailedReports from '../../pages/reports/failed-job-report';
import AmountCountJobReport from '../../pages/reports/amount-count-job-report';

const ContentWrapper = () => {
    const [isMenuExpanded, setIsMenuExpanded] = useState(true);

    return (
        <div className={styles.mainWrapper}>
            <Header isMenuExapanded={isMenuExpanded} toggleMenu={setIsMenuExpanded} />
            <div className={styles.sideMenuAndContentContainer}>
                <SideMenu isExpanded={isMenuExpanded} setIsExpanded={setIsMenuExpanded} />
                <div className={styles.mainContentWrapper} style={{width: `calc(100% - ${isMenuExpanded ? SIDE_MENU_EXPANDED_WIDTH : SIDE_MENU_CONTRACTED_WIDTH})`}}>
                    <div id='main-content' className={styles.mainContent}>
                        <Routes>
                            <Route path='/' element={<Dashboard />} exact />
                            <Route path={DASHBOARD_LINK} element={<Dashboard />} />
                            <Route path={COMMENTS_LINK} element={<Comments />} />
                            <Route path={`${PROFILE_LINK}/*`} element={<Profile />} />
                            <Route path={SCHEDULING_OVERVIEW_LINK} element={<SchedulingOverview />} />
                            <Route path={SCHEDULING_BAY_LINK} element={<SchedulingBay isMenuExpanded={isMenuExpanded}/>} />
                            <Route path={SCHEDULING_POWDER_LINK} element={<PowderBay isMenuExpanded={isMenuExpanded} />} />
                            <Route path={JOB_STATUS_URL} element={<JobStatus />} />
                            <Route element={<ScopeAuthRoute scope={[SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR]} />}>
                                <Route path={PASSED_QC_LINK} element={<PassedQualityControl />} />
                            </Route>
                            <Route element={<ScopeAuthRoute scope={[SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR]} />}>
                                <Route path={QUALITY_CONTROL_LINK} element={<QualityControl />} />
                            </Route>
                            <Route element={<ScopeAuthRoute scope={[SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR]} />}>
                                <Route path={DISPATCH_LINK} element={<Dispatch />} />
                            </Route>
                            <Route element={<ScopeAuthRoute scope={[SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR]} />}>
                                <Route path={POWDER_INVENTORY_LINK} element={<PowderInventory />} />
                            </Route>
                            <Route element={<ScopeAuthRoute scope={[SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR]} />}>
                                <Route path={ARCHIVE_LINK} element={<Archive />} />
                            </Route>
                            <Route element={<ScopeAuthRoute scope={[SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR]} />}>
                                <Route path={REPORTS_LINK} element={<BayReport />} />
                            </Route>
                            <Route element={<ScopeAuthRoute scope={[SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR]} />}>
                                <Route path={REPORTS_FAILED_LINK} element={<FailedReports />} />
                            </Route>
                            <Route element={<ScopeAuthRoute scope={[SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR]} />}>
                                <Route path={REPORTS_AMOUNT_LINK} element={<AmountCountJobReport />} />
                            </Route>
                            <Route element={<ScopeAuthRoute scope={[SCOPE.ADMINISTRATOR]} />}>
                                <Route path={SETTINGS_USERS_LINK} element={<SettingsUsers />} />
                            </Route>
                            <Route element={<ScopeAuthRoute scope={[SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR]} />}>
                                <Route path={SETTINGS_COLOURS_LINK} element={<SettingsColours />} />
                            </Route>
                            <Route element={<ScopeAuthRoute scope={[SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR]} />}>
                                <Route path={SETTINGS_PRODUCTS_LINK} element={<SettingsProducts />} />
                            </Route>
                            <Route element={<ScopeAuthRoute scope={[SCOPE.ADMINISTRATOR]} />}>
                                <Route path={SETTINGS_LOCATIONS_LINK} element={<SettingsLocations />} />
                            </Route>
                            <Route element={<ScopeAuthRoute scope={[SCOPE.ADMINISTRATOR]} />}>
                                <Route path={SETTINGS_NCR_OPTION_LINK} element={<SettingsNCROption />} />
                            </Route>
                            <Route element={<ScopeAuthRoute scope={[SCOPE.ADMINISTRATOR]} />}>
                                <Route path={`${SETTINGS_TREATMENTS}`} element={<SettingsTreatments />} />
                            </Route>
                            <Route element={<ScopeAuthRoute scope={[SCOPE.ADMINISTRATOR]} />}>
                                <Route path={OVERDUE_LINK} element={<SchedulingOverview overdue />} />
                            </Route>
                            <Route element={<ScopeAuthRoute scope={[SCOPE.ADMINISTRATOR]} />}>
                                <Route path={HUBSPOT_INTEGRATION_LINK} element={<HubspotIntegration />} />
                            </Route>
                            <Route element={<ScopeAuthRoute scope={[SCOPE.ADMINISTRATOR]} />}>
                                <Route path={XERO_INTEGRATION_LINK} element={<XeroIntegration />} />
                            </Route>
                            <Route element={<ScopeAuthRoute scope={[SCOPE.ADMINISTRATOR, SCOPE.SUPERVISOR]} />}>
                                <Route path={NCR_LINK} element={<NCR />} />
                            </Route>
                            <Route path={COMMENT_NOTIFICATION_LINK} element={<CommentNotification/>} />
                        </Routes>
                    </div>
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default ContentWrapper;
