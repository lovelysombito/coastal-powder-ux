import styles from './index.module.css';
import { Form } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import Button from '../../../common/button'
import { getUserPassword, updateUserPassword } from '../../../../server';
import Swal from 'sweetalert2';

const ProfileChangePassword = () => {

    const [oldPassword, setOldPassword] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isFetching, setIsFetching] = useState(true)
    const [message, setMessage] = useState("")

    useEffect(() => {
        if (isFetching) {
            getUserPassword().then(res => {
                if (res.data.code === 200) { 
                    setIsFetching(false)
                }
            }).catch((err) => {
                handleMessage('error', err)
            })
        }
    })

    const checkForm = () => {
        if (oldPassword === "") {
            setMessage("Old password missing")
            return false
        }
        
        if (password === "") {
            setMessage("Add new password")
            return false
        }
        
        if (confirmPassword === "") {
            setMessage("Confirm password")
            return false
        }

        if (password !== confirmPassword) {
            setMessage("Password doesn't match")
            return false
        }

        return true
    }

    const handleSubmitForm = () => {

        if (!checkForm()) {
            handleMessage('error', message)
            return false;
        }

        let data = {
            oldPassword: oldPassword,
            password: password
        }

        updateUserPassword(data).then(res => {
            if(res.status === 200){
                handleMessage('success', res.data.message)
            }
        }).catch((err) => {
            console.log('error', err)
            handleMessage('error', err.response.data.message)
        })

    }

    const handleMessage = (icon, text) => {
        Swal.fire({
            icon: icon,
            text: text,
        })
    }

    return (
        <div className={styles.contentContainer}>
            <Form>
                <div className={styles.headerContainer}>
                    <h5>Change Password</h5>
                </div>
                <Form.Group className={styles.fieldItem}>
                    <Form.Label>Old password</Form.Label>
                    <Form.Control className={styles.textField} type="password" value = { oldPassword } onChange = { (event) => { setOldPassword(event.target.value) } }/>
                </Form.Group>

                <Form.Group className={styles.fieldItem}>
                    <Form.Label>New password</Form.Label>
                    <Form.Control className={styles.textField} type="password" value = { password } onChange = { (event) => { setPassword(event.target.value) } }/>
                </Form.Group>

                <Form.Group className={styles.fieldItem}>
                    <Form.Label>Confirm new password</Form.Label>
                    <Form.Control className={styles.textField} type="password" value = { confirmPassword } onChange = { (event) => { setConfirmPassword(event.target.value) } }/>
                </Form.Group>
            </Form>

            <div className={styles.buttonContainer}>
                <Button colorVariant="gray">Cancel</Button>
                <Button colorVariant="green" onClick={handleSubmitForm}>Save</Button>
            </div>
        </div>
    )
}

export default ProfileChangePassword