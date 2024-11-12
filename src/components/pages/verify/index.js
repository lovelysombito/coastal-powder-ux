import { Button, Form, Alert, Image, Spinner, InputGroup } from 'react-bootstrap'
import { useState } from 'react'
import { useNavigate } from "react-router-dom";
import { LOGIN_LINK, API_BASE_URL, BASE_URL} from '../../../constants'
import styles from './index.module.css';
import { AiOutlineKey } from 'react-icons/ai'
import { verify } from '../../../server'
import axios from 'axios'
import Swal from 'sweetalert2';
axios.defaults.withCredentials = true;
axios.defaults.baseURL = API_BASE_URL;

function Verify() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    const [password, setPassword] = useState('')
    const [password_confirmation, setPasswordConfirmation] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')

    let navigate = useNavigate()

	const verifyFn = async (event) => {
		event.preventDefault()
		setErrorMessage("")

        const verifyData = { password_confirmation, password, token }

		try {
			setIsLoading(true)
            if(password === "" || password_confirmation === "" || password !== password_confirmation) {
                setErrorMessage("Your passwords do not match");
                setIsLoading(false);
                return;
            }
        
            axios.get(`${BASE_URL}/sanctum/csrf-cookie`).then(() =>{
                verify(verifyData).then(res => {
                    if(res.status === 200) {
                        Swal.fire({
                            icon: 'success',
                            text: 'Your password has successfully been set',

                        }).then(() => {
                            navigate(LOGIN_LINK)
                        })
                    }
                }).catch((err) => {
                    let errorMsg = err?.response?.data?.message || "Failed to connect to server."
                    setErrorMessage(errorMsg)                    
                    setIsLoading(false)
                })   
        })
		} catch (err) {
			let errorMsg = err?.response?.data?.message || "Failed to connect to server."
			setErrorMessage(errorMsg)
			setIsLoading(false)
		}
	}

	return (
		<div className={styles.container}>
			<div>
                <Image src='/logo.svg' className={styles.logo}/>
			</div>

            <div className={styles.formContainer}>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <InputGroup className="mb-3">
                            <span className={styles.formTextIcon}><AiOutlineKey /></span>
                            <Form.Control autoComplete="off" className={styles.formText} type="password" placeholder="Your Password" value = { password } onChange = { (event) => { setPassword(event.target.value) } }/>
                        </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Confirm your Password</Form.Label>
                        <InputGroup className="mb-3">
                            <span className={styles.formTextIcon}><AiOutlineKey /></span>
                            <Form.Control autoComplete="off" className={styles.formText} type="password" placeholder="Confirm Your Password" value = { password_confirmation } onChange = { (event) => { setPasswordConfirmation(event.target.value) } }/>
                        </InputGroup>
                    </Form.Group>


                    <Form.Group className="mb-3">
                        <div className={styles.submitButtonContainer}>
                            {errorMessage !== "" ? 
                                <Alert className={styles.errorAlert} variant="danger">
                                    <span>{errorMessage}</span>
                                </Alert>
                            : ""}

                            <Button className={styles.submitButton} disabled={isLoading} onClick={ (event) => verifyFn(event) } variant="primary" type="button">
                                { isLoading ? <>Loading <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/></>: "Register" }
                            </Button>
                        </div>
                    </Form.Group>
                </Form>
            </div>
		</div>
	);
}

export default Verify;
