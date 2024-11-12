import styles from './index.module.css';
import { useNavigate, useLocation } from "react-router-dom"

const SideMenuLink = ({link, icon, iconSize="17px", isRoot = false, label, isMenuExpanded, paddingLeft=30}) => {
    let navigate = useNavigate()
    const contracteMenuPadding = 21
    
    const location = useLocation();
    const isCurrentPage = link === location.pathname

    return (
        <div style={{paddingLeft: (isMenuExpanded ? paddingLeft : contracteMenuPadding)}} className={`${styles.sideMenuLink} ${(isCurrentPage && isRoot) ? styles.currentPageRoot : ""} ${(isCurrentPage && !isRoot) ? styles.currentPageNotRoot : ""}`} onClick={() => navigate(link)}>
            <div className={styles.sideMenuLabelContentWrapper}>
                <span className={styles.sideMenuLabelIcon} style={{fontSize: iconSize}}>{icon}</span>
                {isMenuExpanded  ? <span>{label}</span> : "" }
            </div>
        </div>
    )
}

export default SideMenuLink