import styles from './index.module.css';
import Button from '../../common/button'
import { useEffect, useState } from 'react'
import PageTitle from '../../common/page-title'
import { getAllIntegration, hubspotCallback } from '../../../server';
import { useLocation } from "react-router-dom";
import Swal from 'sweetalert2';
import { Oval } from  'react-loader-spinner'

const HubspotIntegration = () => {

    const search = useLocation().search;
    const code = new URLSearchParams(search).get('code');
    const [codeVal, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hubSpotIntegrationDetails, setHubSpotIntegrationDetails] = useState({});

    useEffect(() => {
        setIsLoading(true)
        getAllIntegration().then(res => {
            if(res.status === 200){
                if(res.data[0].length > 0){   
                    res.data[0].forEach(element => {
                        if(element.platform === "HUBSPOT"){
                            setHubSpotIntegrationDetails(element)
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
            hubspotCallback(data).then(res => {
                if(res.status === 200){
                    handleHubSpotCallBackMessage("success", res.data.message)
                    setIsLoading(false)
                }
            }).catch(err => {
                handleMessage("error", err?.response?.data?.message || "Bad Request")
                setIsLoading(false)
            })
        }
        // eslint-disable-next-line 
    }, [codeVal])

    const handleAuthorizeIntegration = () => {
        if(hubSpotIntegrationDetails.platform_install_url){
            window.location.href = hubSpotIntegrationDetails.platform_install_url
        }
    }

    const handleHubSpotCallBackMessage = (icon, text) => {
        Swal.fire({
            icon: icon,
            text: text,
        }).then(res => {
            if(res.isConfirmed){
                window.location.href = "/settings/integrations/hubspot"
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
            <PageTitle title="Integration HubSpot"/>
            {
                isLoading ? <Oval color="#fff" height={80} width={80} /> : <>
                    <div className={styles.contentContainer}>
                        <div className={styles.status}>
                            <span className={styles.statusLabel}>Status :&nbsp;</span>
                            <span className={`${styles.statusValue} ${hubSpotIntegrationDetails.integration_status === "Connected" ? styles.green : styles.red}`}>{hubSpotIntegrationDetails.integration_status === "Connected" ? "Connected" : "Not connected"}</span>
                        </div>
                        <div className={styles.button}>
                            <Button onClick={handleAuthorizeIntegration} colorVariant="cyan">{hubSpotIntegrationDetails.integration_status === "Connected" ? "Re-authorise HubSpot" : "Authorise HubSpot"}</Button>
                        </div>
                    </div>
                </>
            }
        </>
    )
}

export default HubspotIntegration