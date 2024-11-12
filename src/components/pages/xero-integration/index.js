import styles from './index.module.css';
import Button from '../../common/button'
import { useEffect, useState } from 'react'
import PageTitle from '../../common/page-title'
import { getAllIntegration, xeroCallback } from '../../../server';
import { Oval } from 'react-loader-spinner';
import Swal from 'sweetalert2';
import { useLocation } from "react-router-dom";

const XeroIntegration = () => {

    const search = useLocation().search;
    const code = new URLSearchParams(search).get('code');
    const [codeVal, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [xeroIntegrationDetails, setXeroIntegrationDetails] = useState({});

    useEffect(() => {
        setIsLoading(true)
        getAllIntegration().then(res => {
            if(res.status === 200){
                if(res.data[0].length > 0){   
                    res.data[0].forEach(element => {
                        if(element.platform === "XERO"){
                            setXeroIntegrationDetails(element)
                        }
                    });
                }
                setIsLoading(false)
            }
        }).catch(err => {
            console.log("err", err);
        })
    }, []);

    useEffect(() => {
        setCode(code)
        if(codeVal){
            setIsLoading(true)
            let data = { code: code }
            xeroCallback(data).then(res => {
                if(res.status === 200){
                    handleXeroCallBackMessage("success", res.data.message)
                    setIsLoading(false)
                }
            }).catch(err => {
                handleMessage("error", err?.response?.data?.message || "Bad Request")
                setIsLoading(false)
            })
        }
    }, [codeVal, code])

    const handleAuthorizeIntegration = () => {
        if(xeroIntegrationDetails.platform_install_url){
            window.location.href = xeroIntegrationDetails.platform_install_url
        }
    }

    const handleXeroCallBackMessage = (icon, text) => {
        Swal.fire({
            icon: icon,
            text: text,
        }).then(res => {
            if(res.isConfirmed){
                window.location.href = "/settings/integrations/xero"
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
        <>
            <PageTitle title="Integration Xero"/>
            {
                isLoading ? <Oval color="#fff" height={80} width={80} /> : <>
                    <div className={styles.contentContainer}>
                        <div className={styles.status}>
                            <span className={styles.statusLabel}>Status :&nbsp;</span>
                            <span className={`${styles.statusValue} ${xeroIntegrationDetails.integration_status === "Connected" ? styles.green : styles.red}`}>{xeroIntegrationDetails.integration_status === "Connected" ? "Connected" : "Not connected"}</span>
                        </div>
                        <div className={styles.button}>
                            <Button onClick={handleAuthorizeIntegration} colorVariant="cyan">{xeroIntegrationDetails.integration_status === "Connected" ? "Re-authorise Xero" : "Authorise Xero"}</Button>
                        </div>
                    </div>

                </>
            }
            
        </>
    )
}

export default XeroIntegration