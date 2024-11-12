import { Button, Form, Alert, Image, Spinner, InputGroup } from 'react-bootstrap'
import { useState, useContext } from 'react'
import { UserContext } from '../../../context/user-context'
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';

import { RESET_PASSWORD_LINK, DASHBOARD_LINK, API_BASE_URL,BASE_URL, VERIFY_TWO_FACTOR_AUTH_PAGE} from '../../../constants'
import styles from './index.module.css';
import { AiOutlineMail, AiOutlineKey } from 'react-icons/ai'
import { confirmPassword, get2faAuth, login } from '../../../server'
import axios from 'axios'
import Swal from 'sweetalert2';
axios.defaults.withCredentials = true;
axios.defaults.baseURL = API_BASE_URL;

function Login() {
	const { loginUserContext } = useContext(UserContext)

    const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')

	let navigate = useNavigate()

	const loginFn = async (event) => {
		event.preventDefault()
        setEmail(email.trim())
		setPassword(password.trim())
		setErrorMessage("")

        const loginData = {
			email: email,
			password: password,
            remember_me: rememberMe
		}

		try {
			setIsLoading(true)
			// const { data: { user, token } } = await login(loginData)

            if(password === "") {
                throw new Error ("Error")
            }
        
            const user = {...loginData}

            let authStatus = "";
            axios.get(BASE_URL+'/sanctum/csrf-cookie').then(() => {
                login(user).then(res => {
                    if(res.data.data !== undefined){
                        const userData = res.data.data;
                        loginUserContext(userData);
                        get2faAuth().then(async (res) => {
                            authStatus = res?.data?.data?.two_factor || "disabled"
                            if(authStatus === "enabled"){
                                await confirmPasswordFn()
                                navigate(VERIFY_TWO_FACTOR_AUTH_PAGE)
                            } else {
                                const returnUrl = localStorage.getItem('return_url') || DASHBOARD_LINK;
                                localStorage.removeItem('return_url');
                                navigate(returnUrl)
                            }
                        }).catch((err) => {
                            handleMessage('error', err)
                        })
                    } else {
                        setErrorMessage(res.data.message)
                        setIsLoading(false)
                    }
                }).catch((err) => {
                    let errorMsg = err?.response?.data?.message || "Failed to connect to server."
                    setErrorMessage(errorMsg)                    
                    setIsLoading(false)
                })   
            }).catch((err) => {
                console.log("sanctum", err);
            })   
			// axios.defaults.headers.common['Authorization'] = token
		} catch (err) {
			let errorMsg = err?.response?.data?.message || "Failed to connect to server."
			setErrorMessage(errorMsg)
			setIsLoading(false)
		}
	}

    const confirmPasswordFn = async () =>{
        let data = { password: password }
        await confirmPassword(data).then(() => {
        }).catch(error => {
            handleMessage("error", error)
        })
    }

    const handleMessage = (icon, text) => {
        Swal.fire({
            icon: icon,
            text: text,
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
                        <Form.Label>E-mail</Form.Label>
                        <InputGroup className="mb-3">
                            <span className={styles.formTextIcon}><AiOutlineMail /></span>
                            <Form.Control autoComplete="off" className={styles.formText} type="text" placeholder="Your Email" value = { email } onChange = { (event) => { setEmail(event.target.value) } }/>
                        </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <InputGroup className="mb-3">
                            <span className={styles.formTextIcon}><AiOutlineKey /></span>
                            <Form.Control autoComplete="off" className={styles.formText} type="password" placeholder="Your Password" value = { password } onChange = { (event) => { setPassword(event.target.value) } }/>
                        </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <div className={styles.submitButtonContainer}>
                            {errorMessage !== "" ? 
                                <Alert className={styles.errorAlert} variant="danger">
                                    <span>{errorMessage}</span>
                                </Alert>
                            : ""}

                            <Button className={styles.submitButton} disabled={isLoading} onClick={ (event) => loginFn(event) } variant="primary" type="submit">
                                { isLoading ? <>Loading <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/></>: "Login" }
                            </Button>
                        </div>
                    </Form.Group>

                    <Form.Group>
                        <div className={styles.otherActionsContainer}>
                            <Form.Check 
                                type="checkbox"
                                label="Remember me"
                                checked = {rememberMe}
                                onChange={ (event) => { setRememberMe(event.target.checked) }}
                            />
                            <Link to={RESET_PASSWORD_LINK} className={styles.forgotPasswordLink}>Forgot Password</Link>
                        </div>
                    </Form.Group>    
                </Form>
            </div>
		</div>
	);
}

export default Login;
