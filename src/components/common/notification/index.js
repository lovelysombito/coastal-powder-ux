import styles from './index.module.css';
import { NavDropdown } from 'react-bootstrap'
import { COMMENT_NOTIFICATION_LINK } from '../../../constants';
// import { Link } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { patchViewedNotification } from '../../../server';

const Notification = ({ data, filterViewedComments }) => {

    const [notificationData, setNotificationData] = useState(data);

    console.log("data", data);
    let navigate = useNavigate()

    const handleClick = (notificationData) => {

        let notif_id = notificationData.notification_id;
        let comment_id = notificationData.comment.comment_id

        let notification_index = data.findIndex(elem => elem.notification_id == notificationData.notification_id)

        if(notificationData.viewed !== "true"){
            patchViewedNotification(notif_id).then(res => {
                if(res.data.code === 200){
                    console.log("Not viewed", res);
                    data[notification_index].viewed = "true"
                    filterViewedComments(data)
                    setNotificationData([...data])
                }
            }).catch(err => {
                console.log("err", err);
            })
        }
        let link = COMMENT_NOTIFICATION_LINK.replace('/:id', '');
        navigate(`${link}/${notif_id}#${comment_id}`)
    }


return (
    <>
        {(notificationData.length > 0) ?
            <>
                {data.map((elem, index) => {
                    let comment = elem.comment.comment
                    let comment_v2 = comment.replaceAll('<b>', '')
                    let comment_v3 = comment_v2.replaceAll('</b>', '')

                    return (
                        //<NavDropdown.Item style={{ background: elem.viewed === "true" ? "#fff" : "#e7e6e6"}}  key={index} as={Link} to={COMMENT_NOTIFICATION_LINK}>
                        <NavDropdown.Item style={{ background: elem.viewed === "true" ? "#fff" : "#e7e6e6"}}  key={index}>
                            <div key={index} className={styles.notification} onClick={() => { handleClick(elem) }}>
                                <span className={ styles.notificationText }>{`You are tagged in a comment - ${comment_v3.substring(0, 22)}`}</span>
                                <hr className={styles.divider}/>
                            </div>
                        </NavDropdown.Item>
                    )
                })}

            </> :
            <NavDropdown.Item>
                <div className={styles.notification}>
                    <span>No Notification!</span>
                </div>
            </NavDropdown.Item>
        }

    </>

)
}

export default Notification