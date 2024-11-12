import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useNavigate} from "react-router-dom"
import { getJobRedirect } from '../../../../server';
import { PulseLoader } from 'react-spinners';
import { DASHBOARD_LINK } from "../../../../constants";
import Swal from "sweetalert2";

const JobStatus = () => {
    let navigate = useNavigate()
    const param = useParams();
    const jobId = param.jobId
    
    useEffect(() => {
        getJobRedirect(jobId).then(res => {
            navigate(`/${res.data.redirect}?id=${jobId}&selected=true`);
        }).catch(() => {
            Swal.fire({
                icon: 'error',
                text: 'An error has occuring while fetching the job status, redirecting back to the dashboard',
            }).then(() => {
                navigate(DASHBOARD_LINK);
            });
        });
    }, [jobId, navigate]);

    return (
        <PulseLoader />
    )
}

export default JobStatus