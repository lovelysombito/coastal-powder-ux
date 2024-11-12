import styles from './index.module.css';
import { Form } from 'react-bootstrap'
import { useState, useEffect} from 'react'
import ToggleButton from '../../../common/toggle-button';
import Button from '../../../common/button';
import { getUserNotificationOptions, updateUserNotificationOptions } from '../../../../server';
import Swal from 'sweetalert2';
import { Oval } from  'react-loader-spinner'

const ProfileNotifications = () => {

    const [newComments, setNewComments] = useState(false)
    const [repliedToComments, setRepliedToComments] = useState(true)
    const [taggedInComments, setTaggedInComments] = useState(true)
    const [isFetching, setIsFetching] = useState(true)
    const [userId, setUserId] = useState("")
    const [isLoading, setLoading] = useState(true);

    useEffect(() => {
        if (isFetching) {
            getUserNotificationOptions().then(res => {
                if (res.data.code === 200) { 
                    setIsFetching(false)
                    setUserId(res.data.data.user_id)
                    setUserNotificationFn(res.data.data)
                }
            }).catch((err) => {
                handleMessage('error', err)
            })
        }
    })

    const turnOnAllNotifications = () => {
        let data = {
            notifications_new_comments: "enabled",
            notifications_comment_replies: "enabled",
            notifications_tagged_comments: "enabled"
        }
        updateNotificationOptionsFn(data);
    }

    const turnOffAllNotifications = () => {
        let data = {
            notifications_new_comments: "disabled",
            notifications_comment_replies: "disabled",
            notifications_tagged_comments: "disabled"
        }

        updateNotificationOptionsFn(data);
    }

    const setSingleNotication = (type, value) => {
        
        let notif_value = value ? "disabled" : "enabled";
        let data = {};

        if(type === "new_comments"){
            data = {
                notifications_new_comments: notif_value
            }
        }

        if(type === "replied_to_comments"){
            data = {
                notifications_comment_replies: notif_value
            }
        }

        if(type === "tagged_in_comments"){
            data = {
                notifications_tagged_comments: notif_value
            }
        }

        updateNotificationOptionsFn(data);

    }

    const updateNotificationOptionsFn = (data) => {
        updateUserNotificationOptions(data, userId).then(res => {
            if(res.data.code === 200){
                setUserNotificationFn(res.data.data)
                setIsFetching(true)
            }
        }).catch(err => {
            handleMessage('error', err)
        })
    }

    const setUserNotificationFn = (data) => {
        data.notifications_new_comments === "enabled" ? setNewComments(true) : setNewComments(false) 
        data.notifications_comment_replies === "enabled" ? setRepliedToComments(true) : setRepliedToComments(false) 
        data.notifications_tagged_comments === "enabled" ? setTaggedInComments(true) : setTaggedInComments(false) 
        setLoading(false)
    }

    const handleMessage = (icon, text) => {
        Swal.fire({
            icon: icon,
            text: text,
        })
    }

    return (
        <div className={styles.contentContainer}>
            {
                !isLoading ? <>
                    <Form>
                        <div className={styles.headerContainer}>
                            <h5>Manage Notifications</h5>
                        </div>
                        <Form.Group className={styles.fieldItem}>
                            <span className={styles.label}>New comments</span>
                            <ToggleButton checked = {newComments} onChange={ () => { setSingleNotication("new_comments", newComments) }}/>
                        </Form.Group>
                        <Form.Group className={styles.fieldItem}>
                            <span className={styles.label}>Replied to Comment</span>
                            <ToggleButton checked = {repliedToComments} onChange={ () => { setSingleNotication("replied_to_comments", repliedToComments) }}/>
                        </Form.Group>
                        <Form.Group className={styles.fieldItem}>
                            <span className={styles.label}>Tagged in Comment</span>
                            <ToggleButton checked = {taggedInComments} onChange={ () => { setSingleNotication("tagged_in_comments", taggedInComments) }}/>
                        </Form.Group>
                    </Form>
                </> : <div className={styles.spinner}><Oval color="#fff" height={80} width={80} /></div>
            }
            
            <div className={styles.buttonContainer}>
                <Button colorVariant="green" onClick={turnOnAllNotifications}>Turn on all notifications</Button>
                <Button colorVariant="red" onClick={turnOffAllNotifications}>Turn off all notifications</Button>
            </div>
        </div>
    )
}

export default ProfileNotifications