import { Nav, Navbar, Image, NavDropdown } from 'react-bootstrap'
import { DASHBOARD_LINK, PROFILE_LINK, NOTIFICATIONS_LINK, AUTHENTICATIONS_LINK, CHANGE_PASSWORD_LINK, LOGIN_LINK } from '../../../../constants'
import { Link } from 'react-router-dom'
import styles from './index.module.css';
import { AiOutlineSearch } from 'react-icons/ai'
import { BsFullscreen } from 'react-icons/bs'
import { HiMenuAlt1 } from 'react-icons/hi'
import { MdNotifications, MdLogout } from 'react-icons/md'
import { FaUserCircle } from 'react-icons/fa'
import { useState, useContext, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getCommentNotifications, logout } from '../../../../server';
import { useNavigate } from "react-router-dom";
import { UserContext } from '../../../../context/user-context';
import Notification from '../../notification/index';
import SearchBar from '../../search-bar';
import { webContext } from '../../../../context/websocket-context';

const Header = ({ isMenuExapanded, toggleMenu }) => {
    const brandExpandedWidth = "200px"
    const brandContractedWidth = "60px"
    const brandImageExpandedWidth = "140px"
    const brandImageContractedWidth = "60px"

    const { logoutUserContext } = useContext(UserContext)
    const { jobItem } = useContext(webContext)
    let navigate = useNavigate()
    const [isFetching, setIsFetching] = useState(true)
    const [notificationData, setnotificationData] = useState([])
    const [isShown, setIsShown] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    useEffect(() => {
        getCommentNotifications().then(res => {
            setIsFetching(false)
            if (res.data.data !== undefined) {
                if (res.data.data.data !== undefined) {
                    setnotificationData(res.data.data.data)
                    filterViewedComments(res.data.data.data)
                } else {
                    filterViewedComments(res.data.data)
                }
            }
        }).catch((err) => {
            handleMessage('error', err)
        })
        
    }, [isFetching])

    useEffect(() => {
        if (jobItem !== null) {
            if (jobItem.message === 'job event call') {
                getCommentNotifications().then(res => {
                    // console.log("getCommentNotifications", res);
                    setIsFetching(false)
                    if (res.data.data !== undefined) {
                        if (res.data.data.data !== undefined) {
                            setnotificationData(res.data.data.data)
                            filterViewedComments(res.data.data.data)
                        } else {
                            filterViewedComments(res.data.data)
                        }
                    }
                }).catch((err) => {
                    handleMessage('error', err)
                })
            }
        }
    }, [jobItem])

    
    function filterViewedComments(comments) {
        var newArray = comments.filter(function(item){ return item.viewed === "false"; })
        setUnreadNotifications(newArray.length)        
    }

    const handleMessage = (icon, text) => {
        Swal.fire({
            icon: icon,
            text: text,
        })
    }

    const ProfileMenuItem = () => {
        return (
            <span className={styles.profileMenuIcon}><FaUserCircle /></span>
            // <div className={styles.profileMenuItem}>
            //     <Image src='/images/user-profile.jpg' className={styles.profileMenuImage}/>
            // </div>
        )
    }

    const confirmLogout = () => { handleConfirmation() }

    const handleConfirmation = () => {
        Swal.fire({
            title: 'Are you sure you want to log out?',
            showDenyButton: true,
            confirmButtonText: 'Ok',
            denyButtonText: `Cancel`,
        }).then((result) => {
            if (result.isConfirmed) {
                logoutFn()
            }
        })
    }

    const logoutFn = () => {
        logout().then(() => {
            logoutUserContext()
            navigate(LOGIN_LINK)
        }).catch(err => {
            console.log(err)
        })
    }
    const handleSearchClick = () => {
        setIsShown(current => !current);

    }

    return (
        <Navbar collapseOnSelect expand="sm" className={styles.header}>
            <Navbar.Brand as={Link} to={DASHBOARD_LINK} className={styles.navLogoWrapper} style={{ width: isMenuExapanded ? brandExpandedWidth : brandContractedWidth }}>
                <div >
                    <Image src='/logo.svg' className={styles.logo} style={{ width: isMenuExapanded ? brandImageExpandedWidth : brandImageContractedWidth }} />
                </div>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse className={styles.navbarCollapse}>
                <Nav className={styles.navItemsWrapper}>
                    <div className={styles.sideMenuToggler}>
                        <div className={styles.sideMenuTogglerWrapper} onClick={() => { toggleMenu(!isMenuExapanded) }}>
                            <span className={`${styles.navbarCustomTitleIcon} ${styles.navbarSideMenuTogglerIcon}`} ><HiMenuAlt1 /></span>
                            <span className={styles.navbarCustomTitleLabel}>Menu</span>
                        </div>
                    </div>
                    {!isShown &&

                        <>

                            <div className={styles.navItem}>
                                <span className={styles.navbarCustomTitleIcon} onClick={() => { handleSearchClick() }}><AiOutlineSearch /></span>
                                <span className={styles.navbarCustomTitleLabel} onClick={() => { handleSearchClick() }} >Search</span>
                            </div>
                        </>
                    }

                    {isShown &&

                        <>
                            <div className={styles.navItem}>

                                <SearchBar />

                            </div>
                            <div className={styles.navItem}>
                                <span className={styles.navbarCustomTitleIcon} onClick={() => { handleSearchClick() }}><AiOutlineSearch /></span>
                            </div>
                        </>
                    }

                    <div className={styles.navItem}>
                        <span className={styles.navbarCustomTitleIcon}><BsFullscreen /></span>
                        <span className={styles.navbarCustomTitleLabel}>Full Screen</span>
                    </div>
                    <NavDropdown className={"dropdown-toggle-no-caret"} title={
                        <div className={styles.notifications}>
                            {unreadNotifications > 0 ? <span className={styles.notificationDot}>
                                                            <div className={styles.commentListItemPreviewUnread}>
                                                                <span>{unreadNotifications}</span>
                                                            </div>
                                                        </span>: ""}
                            <span className={styles.navbarCustomTitleIcon}><MdNotifications /></span>
                            <span className={styles.navbarCustomTitleLabel}>Notifications</span>
                        </div>
                    } align="end">
                        <div style={{ height: "300px", overflowY: notificationData.length > 5 ? 'scroll' : "none"}}>
                            <Notification data={notificationData} filterViewedComments={filterViewedComments}/>
                        </div>
                    </NavDropdown>
                    <NavDropdown className={"dropdown-toggle-no-caret"} title={
                        <>
                            <span className={styles.navbarCustomTitleIcon}><ProfileMenuItem /></span>
                            <span className={styles.navbarCustomTitleLabel}>Profile</span>
                        </>
                    } align="end">
                        <NavDropdown.Item as={Link} to={PROFILE_LINK}>
                            <span>Basic Information</span>
                        </NavDropdown.Item>
                        <NavDropdown.Item as={Link} to={NOTIFICATIONS_LINK}>
                            <span>Manage Notifications</span>
                        </NavDropdown.Item>
                        <NavDropdown.Item as={Link} to={AUTHENTICATIONS_LINK}>
                            <span>Manage 2-factor Auth</span>
                        </NavDropdown.Item>
                        <NavDropdown.Item as={Link} to={CHANGE_PASSWORD_LINK}>
                            <span>Change Password</span>
                        </NavDropdown.Item>
                    </NavDropdown>
                    <div className={styles.navItem}>
                        <span className={styles.navbarCustomTitleIcon} onClick={confirmLogout} ><MdLogout /></span>
                        <span className={styles.navbarCustomTitleLabel}>Sign Out</span>
                    </div>
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    )
}

export default Header