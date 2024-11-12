import styles from './index.module.css';
import { Form } from 'react-bootstrap'
import React, { useState, useEffect } from 'react'
import Button from '../../../common/button';
import Swal from 'sweetalert2';
import { confirmPassword, disableTwoFactorAuth, enableTwoFactorAuth, get2faAuth, getRecoveryCodes, getTwoFactorQRCode, submitQRCode } from '../../../../server';
import { useContext } from 'react'
import { UserContext } from '../../../../context/user-context';

const ProfileAuthentications = () => {
    const [isFetching, setIsFetching] = useState(true)
    const [authenticatorStatus, setAuthenticatorStatus] = useState(false)
    const { user } = useContext(UserContext)
    const password = user.password
    
    useEffect(() => {
        if (isFetching) {
            get2faAuth().then(res => {
                if (res.data.code === 200) { 
                    setIsFetching(false)
                    setAuthenticatorStatus(res.data.data.two_factor)
                }
            }).catch((err) => {
                handleMessage('error', err)
            })
        }
    })

    const handle2faAuth = async () => {

        if(authenticatorStatus === "enabled"){

            let enableTwoFactorAuthRes = await enableTwoFactorAuthFn();

            if(!enableTwoFactorAuthRes){
                let passwordConfirmed = await confirmPasswordFn()
                if(passwordConfirmed === 201){
                    disableTwoFactorAuthFn()
                }
            } else {
                disableTwoFactorAuthFn()
            }
        } else {
            let enableTwoFactorAuthRes = await enableTwoFactorAuthFn();
            if(!enableTwoFactorAuthRes){
                let passwordConfirmed = await confirmPasswordFn()
                if(passwordConfirmed === 201){
                    enableTwoFactorAuthRes = await enableTwoFactorAuthFn();
                    if(enableTwoFactorAuthRes){
                        getTwoFactorQRCodeFn()
                    }
                }
            } else {
                getTwoFactorQRCodeFn()
            }
        }
    }

    const disableTwoFactorAuthFn = () => {
        disableTwoFactorAuth().then(res => {
            if(res.status === 200){
                setIsFetching(true)
                handleMessage('success', "Two Factor Authenticator successfully disabled")
            }
        }).catch( async (err) => {
            handleMessage('error', err)
        })
    }

    const confirmPasswordFn = async () => {
        let data = {
            password: password
        }

        let resCode = "";
        await confirmPassword(data).then( async (res) => {
            resCode = res.status 
        }).catch(error => {
            handleMessage('error', error)
            resCode = error.response.status;
        })
        return resCode;
    }
        
    const enableTwoFactorAuthFn = async () => {
        let val = "";
        await enableTwoFactorAuth().then(res => {
            if(res.status === 200){
                val = true;
            }
        }).catch(() => {
            val = false;
        })
        return val;
    }

    const getTwoFactorQRCodeFn = () => {
        let data = {
            password: password
        }
        getTwoFactorQRCode(data).then(res => {
            if(res.status === 200){
                handleShowQR(res.data.svg)
            }
        }).catch(err => {
            handleMessage('error', err)
        })
    }

    const getRecoveryCodesFn = () => {
        getRecoveryCodes().then(res => {
            if(res.status === 200){
                let recoveryCodes = res.data
                let recoveryCodesString = ''
                for (let index = 0; index < recoveryCodes.length; index++) {
                    recoveryCodesString = recoveryCodesString+'<br>'+recoveryCodes[index]
                }
                setIsFetching(true)
                return Swal.fire({
                    html: `<span><b>These are the recovery codes needed if you lose access to your authenticator, such as if you update or lose your phone. Please screenshot them and keep in a safe place.</b></span><br>${recoveryCodesString}`,
                    confirmButtonText: "Ok"                
                })
            }
        }).catch(err => {
            handleMessage('error', err)
        })
    }

    const submitQRCodeFn = (QRCode) => {
        let code = {
            code: QRCode
        }
        submitQRCode(code).then(res => {
            if(res.status === 200){
                getRecoveryCodesFn()
            }
        }).catch(err => {
            handleMessage("error", err.response.data.message)
        })

    }

    const handleAddCode = () => {
        Swal.fire({
            title: 'Input code',
            input: 'text',
            showCancelButton: true,
            confirmButtonText: 'Submit',
          }).then((res) => {
            if(res.isConfirmed){
                submitQRCodeFn(res.value)
            }
          })
    }

    const handleShowQR = (qrCodeSVGUrl) => {
        Swal.fire({
            html: `<p>Please use Google Authenticator app on your phone to scan this QR code.</p><br>${qrCodeSVGUrl}`,
            imageWidth: 400,
            imageHeight: 200,
            imageAlt: 'Custom image',
        }).then(res => {
            if(res.isConfirmed){
                handleAddCode()
            }
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
                    <h5>Manage 2-factor Authentication</h5>
                </div>
                <Form.Group className={styles.fieldItem}>
                    <span className={styles.label}>Status: &nbsp;</span><span className={`${styles.statusValue} ${authenticatorStatus === "enabled" ? styles.green : styles.red}`}>{authenticatorStatus === "enabled" ? "Enabled" : "Disabled"}</span>
                </Form.Group>
            </Form>
            <div className={styles.buttonActions}>
                <Button onClick={handle2faAuth} colorVariant="cyan">{authenticatorStatus === "enabled" ? "Disable" : "Enable"}</Button>
            </div>
        </div>
    )
}
export default ProfileAuthentications