import styles from './index.module.css';
import PageTitle from '../../common/page-title';
import { PROFILE_LINK, CHANGE_PASSWORD_LINK, NOTIFICATIONS_LINK, AUTHENTICATIONS_LINK } from "../../../constants"
import { Routes, Route  } from 'react-router-dom'
import ProfileBasic from './basic';
import ProfileChangePassword from './change-password';
import ProfileNotifications from './notifications';
import ProfileAuthentications from './authentications';
import { useNavigate, useLocation } from "react-router-dom"

const Profile = () => {
    let navigate = useNavigate()
    const location = useLocation()
    
    const sideNavLinks = [
        {
            label: "Basic Information",
            link: PROFILE_LINK
        },
        {
            label: "Manage Notifications",
            link: NOTIFICATIONS_LINK
        },
        {
            label: "Manage 2-factor Authentication",
            link: AUTHENTICATIONS_LINK
        },
        {
            label: "Change Password",
            link: CHANGE_PASSWORD_LINK
        }
    ]

    return (
        <>
            <PageTitle title="My Profile"/>
            <div className={styles.contentContainer}>
                <div className={styles.sideNav}>
                    {sideNavLinks.map(({label, link}, idx) => {
                        const isCurrentPage = link === location.pathname

                        return (
                            <div key={idx} className={`${styles.sideNavItem} ${isCurrentPage ? styles.navCurrentPage : ""}`} onClick={() => navigate(link)}>
                                <span>{label}</span>
                            </div>
                        )
                    })}
                </div>
                <div className={styles.content}>
                    <Routes>
                        <Route path="/" element={ <ProfileBasic/> } exact />
                        <Route path={CHANGE_PASSWORD_LINK.replace(PROFILE_LINK, '')} element={ <ProfileChangePassword/> } />
                        <Route path={NOTIFICATIONS_LINK.replace(PROFILE_LINK, '')} element={ <ProfileNotifications/> } />
                        <Route path={AUTHENTICATIONS_LINK.replace(PROFILE_LINK, '')} element={ <ProfileAuthentications/> } />
                    </Routes>
                </div>
            </div>
        </>
    )
}

export default Profile