import styles from './index.module.css';
import { Form } from 'react-bootstrap'
import React, { useState, useEffect, useContext } from 'react'
import Button from '../../../common/button';
import Swal from 'sweetalert2';
import { getUser, logout, updateUser } from '../../../../server';
import { Oval } from  'react-loader-spinner'
import { LOGIN_LINK } from '../../../../constants';
import { UserContext } from '../../../../context/user-context';
import { useNavigate } from "react-router-dom";

const ProfileBasic = () => {
    const { user } = useContext(UserContext);
    const { logoutUserContext } = useContext(UserContext)
    const [firstName, setFirstName] = useState(user.firstname)
    const [lastName, setLastName] = useState(user.lastname)
    const [email, setEmail] = useState(user.email)
    const [oldEmail, setOldEmail] = useState(user.oldEmail);
    const [userId, setUserId] = useState(user.user_id)
    const [isFetching, setIsFetching] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const handleRefreshData = () => setIsFetching((prev) => !prev);
    let navigate = useNavigate()

    useEffect(() => {
        getUser().then(res => {
            if (res.data.code === 200) { 
                setIsFetching(false)
                setUserId(res.data.data.user_id)
                setFirstName(res.data.data.firstname)
                setLastName(res.data.data.lastname)
                setEmail(res.data.data.email)
                setOldEmail(res.data.data.email)
            }
        }).catch((err) => {
            handleMessage('error', err)
        })
    }, [isFetching])

    const updatingEmail = () => {
        if(email !== oldEmail){
            return true
        }
        return false
    }

    const handleSave = () => {

        let item = {
            firstname: firstName,
            lastname: lastName,
            email: email,
        }
        if(updatingEmail()){
            handleChangingEmailAlert(item)
        } else {
            setIsUpdating(true)
            updateUserFn(item)
        }

        handleRefreshData();

    }

    const updateUserFn = (item) => {
        updateUser(item, userId).then(res => {
            if (res.data.code === 200) {
                setIsFetching(true)
                setIsUpdating(false)
                handleMessage('success', "Successfully updated")
            }
        }).catch((err) => {
            handleMessage('error', err)

        })
    }

    const handleMessage = (icon, text) => {
        Swal.fire({
            icon: icon,
            text: text,
        })
    }

    const handleChangingEmailAlert = (item) => {
        Swal.fire({
            icon: "info",
            text: "If you change your email, you will be logged out. Do you want to continue?",
            showCancelButton: true,
            confirmButtonText: 'Yes',
          }).then((result) => {
            if (result.isConfirmed) {
                /* Updates the user info */
                setIsUpdating(true)
                updateUser(item, userId).then(res => {
                    if (res.data.code === 200) {
                        /* Log out the user */
                        logout().then(() => {
                            logoutUserContext()
                            navigate(LOGIN_LINK)
                        }).catch(err => {
                            console.log(err)
                        })
                    }
                }).catch((err) => {
                    handleMessage('error', err)
        
                })

               
            } 
          })
    }

    return (
        <div className={styles.contentContainer}>
            {!isUpdating ? <div>
                <Form>
                    <div className={styles.headerContainer}>
                        <h5>Basic Information</h5>
                    </div>
                    
                    <div className={styles.groupedFields}>
                        <Form.Group>
                            <Form.Label>First name</Form.Label>
                            <Form.Control className={styles.textField} type="text" value = { firstName } onChange = { (event) => { setFirstName(event.target.value) } }/>
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Last name</Form.Label>
                            <Form.Control className={styles.textField} type="text" value = { lastName } onChange = { (event) => { setLastName(event.target.value) } }/>
                        </Form.Group>
                    </div>

                    <Form.Group className={styles.fieldItem}>
                        <Form.Label>Email</Form.Label>
                        <Form.Control className={styles.textField} type="text" value = { email } onChange = { (event) => { setEmail(event.target.value) } }/>
                    </Form.Group>
                </Form>
                </div> : <div className={styles.spinner}><Oval color="#fff" height={80} width={80} /></div>}
                <div className={styles.buttonContainer}>
                    <Button colorVariant="green" onClick={handleSave}>Save</Button>
                    <Button colorVariant="gray">Cancel</Button>
                </div>
        </div>
    )
}

export default ProfileBasic