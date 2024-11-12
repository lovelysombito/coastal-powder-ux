import { Button, Form, Alert, Image, InputGroup } from 'react-bootstrap'
import { useNavigate } from "react-router-dom";
import styles from './index.module.css';
import { AiOutlineKey } from 'react-icons/ai'
import { useState } from 'react';
import { submitQRCode } from '../../../../server';
import { DASHBOARD_LINK } from '../../../../constants';

function VerifyTwoFactorAuthPage() {
    const [code, setCode] = useState("");
    const [errorMessage, setErrorMessage] = useState('')
	
	let navigate = useNavigate()

    const submitFn = () => {
        setErrorMessage("")
        if(code === "" || code === null){
            return  setErrorMessage("Enter you code")
        }
        let data = { code: code}
        submitQRCode(data).then(res => {
            if(res.status === 200){
                navigate(DASHBOARD_LINK)
            }
        }).catch(err => {
            console.log("err", err)
            setErrorMessage(err?.response?.data?.message || "Incorrect code entered. Please check your authenticator for the correct code")
        })
    }

	return (
		<div className={styles.container}>
            <div>
                <Image src='/logo.svg' className={styles.logo}/>
			</div>
            <div className={styles.formContainer}>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Please enter the authenticator code</Form.Label>
                        <InputGroup className="mb-3">
                            <span className={styles.formTextIcon}><AiOutlineKey /></span>
                            <Form.Control autoComplete="off" className={styles.formText} type="number" placeholder="Enter Code" value = { code } onChange = { (event) => { setCode(event.target.value) } }/>
                        </InputGroup>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <div className={styles.submitButtonContainer}>
                            {errorMessage !== "" ? 
                                <Alert className={styles.errorAlert} variant="danger">
                                    <span>{errorMessage}</span>
                                </Alert>
                            : ""}
                            <Button className={styles.submitButton}  onClick={ (event) => submitFn(event) } variant="primary" type="button">Submit</Button>
                        </div>
                    </Form.Group>
                </Form>
            </div>
		</div>
	);
}

export default VerifyTwoFactorAuthPage;
