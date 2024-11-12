import styles from './index.module.css';
import React, { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom"
import { AiOutlineDown, AiOutlineRight } from 'react-icons/ai'

const SideMenuDropdown = ({label, paddingLeft=30, icon, iconSize="17px", bgColor = "white", isMenuExpanded, children, setMenuExpanded}) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const contracteMenuPadding = 21

    const location = useLocation();
    let isCurrentPageParent = false;

    const checkIfChildrenSelectedPage = (chs) => {
        chs.forEach(ch => {
            const { props, type } = ch
            const { link } = props
    
            if(type.name === "SideMenuLink") {
                if(link) {
                    if(link === location.pathname) {
                        isCurrentPageParent = true
                    }
                }
            } else if (type.name === "SideMenuDropdown") {
                checkIfChildrenSelectedPage(ch.props.children)
            }
        });
    }

    checkIfChildrenSelectedPage(children)

    const onClick = () => {
        if(isMenuExpanded) {
            setIsExpanded(!isExpanded)
        } else {
            setMenuExpanded(true)
            setIsExpanded(true)
        }
    }

    useEffect(() => {
        if(!isMenuExpanded) {
            setIsExpanded(false)
        }
    }, [isMenuExpanded])

    return (
        <div className={styles.sideMenuDropdown} style={{ maxHeight: (isExpanded && isMenuExpanded) ? "600px" : "50px"}}>
            <div style={{paddingLeft: (isMenuExpanded ? paddingLeft : contracteMenuPadding)}} className={`${styles.sideMenuLabel} ${isCurrentPageParent ? styles.currentPageParent : ""}`} onClick={onClick}>
                <div className={styles.caret}>
                    {isMenuExpanded ? <span>
                        {isExpanded ? <AiOutlineDown/> : <AiOutlineRight/>}
                    </span>:""}
                </div>
                <div className={styles.sideMenuLabelContentWrapper}>
                    <span className={styles.sideMenuLabelIcon} style={{fontSize: iconSize}}>{icon}</span>
                    {isMenuExpanded ? <span>{label}</span> : ""}
                </div>
            </div>
            <div style={{backgroundColor: bgColor}}>
                {children}
            </div>
        </div>
    )
}

export default SideMenuDropdown