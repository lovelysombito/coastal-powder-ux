import Swal from 'sweetalert2';
import { updateBayJobStatus, updateBayLineStatus, updateLineStatus } from '../../../server';
import { showAlert } from '../../../utils/utils';
import styles from './index.module.css';


const SelectJobStatus = ({status, id, type, handleRefreshData, handleLocation}) => {

    const handleUpdateStatus = (e) => {
        if (type === 'job_status') {
            handleUpdateJobStatus(e.target.value)
        } else if (type === 'line_status') {
            handleUpdateLineStatus(e.target.value)
        } else if (type === 'chem_job_status' || type === 'treatment_job_status' || type === 'burn_job_status' || type === 'blast_job_status') {
            handleUpdateBayJobStatus(type, e.target.value)
        } else if (type === 'chem_line_status' || type === 'treatment_line_status' || type === 'burn_line_status' || type === 'blast_line_status') {
            handleUpdateBayLineStatus(type, e.target.value)
        } else {
            handleUpdateFinalBayJobStatus(e.target.value)
        }
        handleRefreshData()
    }

    const handleUpdateJobStatus = (jobStatus) => {
        updateBayJobStatus({job_status: jobStatus}, id).then(res => {
            showAlert('success', res.data.msg).then(res => {
                if (res.isConfirmed) {
                    if (jobStatus.toLowerCase() == 'complete') {
                        handleLocation()
                    }
                }
            })
        }).catch(err => {
            handleMessage('error', err.response.data.errors)
        })
    }

    const handleUpdateLineStatus = (lineStatus) => {
        updateLineStatus({line_item_status: lineStatus}, id).then(res => {
            handleMessage('success', res.data.msg)
        }).catch(err => {
            handleMessage('error', err.response.data.errors)
        })
    }

    const handleUpdateBayJobStatus = (bayJobStatus, value) => {
        let propertyName = null
        switch (bayJobStatus) {
            case 'chem_job_status':
                propertyName = 'chem_status'
                break;
            case 'treatment_job_status':
                propertyName = 'treatment_status'
                break;
        
            case 'burn_job_status':
                propertyName = 'burn_status'
                break;
            case 'blast_job_status':
                propertyName = 'blast_status'
                break;
            default:
                break;
        }

    updateBayJobStatus({[propertyName]: value}, id).then(res => {
            showAlert('success', res.data.msg).then(res => {
                if (res.isConfirmed) {
                    if (value.toLowerCase() == 'complete') {
                        handleLocation()
                    }
                }
            })
        }).catch(err => {
            handleMessage('error', err.response.data.errors)
        })
    }

    const handleUpdateFinalBayJobStatus = (powder) => {
        updateBayJobStatus({powder_status: powder}, id).then(res => {
            showAlert('success', res.data.msg).then(res => {
                if (res.isConfirmed) {
                    if (powder.toLowerCase() == 'complete') {
                        handleLocation()
                    }
                }
            })
        }).catch(err => {
            handleMessage('error', err.response.data.errors)
        })
    }

    const handleUpdateBayLineStatus = (bayJobStatus, value) => {
        let propertyName = null
        switch (bayJobStatus) {
            case 'chem_line_status':
                propertyName = 'chem_status'
                break;
            case 'treatment_line_status':
                propertyName = 'treatment_status'
                break;
        
            case 'burn_line_status':
                propertyName = 'burn_status'
                break;
            case 'blast_line_status':
                propertyName = 'blast_status'
                break;
            default:
                break;
        }

        updateBayLineStatus({[propertyName]: value}, id).then(res => {
            handleMessage('success', res.data.msg)
        }).catch(err => {
            handleMessage('error', err.response.data.errors)
        })
    }

    const handleMessage = (icon, text) => {
        Swal.fire({
            icon: icon,
            text: text,
        })
    }

    let colour = 'blue';
    if (status !== null) {
        switch (status.toLowerCase()) {
            case 'ready':
                colour = 'orange';
                break;
            case 'awaiting schedule':
                colour = 'blue';
                break;
            case 'in progress':
                colour = 'yellow';
                break;
            case 'waiting on pre treatment':
                colour = 'red';
                break;
            case 'awaiting qc':
                colour = 'pink';
                break;
            case 'error | redo':
                colour = 'black';
                break;
            case 'passed qc':
            case 'ready for dispatch':
            case 'completed':
                colour = 'green';
                break;
            default:
                colour = 'blue';
                break;
        }
    }

    function capitalizeFirstLetter(str) {

        // converting first letter to uppercase
        const capitalized = str.charAt(0).toUpperCase() + str.slice(1);
    
        return capitalized;
    }

    return (
        <>
            <div style={{display: 'flex', justifyContent: 'center'}}> 
                {
                    status.toLowerCase() !== 'waiting' ?
                        <select onChange={handleUpdateStatus} className={styles.select} style={{backgroundColor: colour}}>
                            {
                                (type === 'job_status') ? 
                                <>
                                    <option disabled>Waiting</option>
                                    <option value="Ready" selected={status.toLowerCase() === 'Ready'.toLowerCase() ? true : false}>Ready</option>
                                    <option value="In Progress" selected={status.toLowerCase() === 'In Progress'.toLowerCase() ? true : false}>In Progress</option>
                                    <option value="Complete" selected={status.toLowerCase() === 'Complete'.toLowerCase() ? true : false}>Complete</option>
                                </> :
                                <>
                                    <option disabled>Waiting</option>
                                    <option value="ready" selected={status.toLowerCase() === 'ready'.toLowerCase() ? true : false}>Ready</option>
                                    <option value="in progress" selected={status.toLowerCase() === 'in progress'.toLowerCase() ? true : false}>In Progress</option>
                                    <option value="complete" selected={status.toLowerCase() === 'complete'.toLowerCase() ? true : false}>Complete</option>
                                </>
                            }
                        </select> :
                    <span className={styles.singleStatus} style={{backgroundColor: colour}}>{capitalizeFirstLetter(status)}</span>
                }
                
            </div>
        </>
    )
}

export default SelectJobStatus;