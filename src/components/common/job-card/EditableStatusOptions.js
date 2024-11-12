import { useRef, useState } from "react";
import { STATUS_OPTIONS } from "../../../constants";
import { useClickOutside } from "../../../hooks";
import { updateBayJobStatus } from "../../../server";
import { showAlert, showConfirmation } from "../../../utils/utils";
import SelectLocation from "../location";
import styles from './index.module.css';

const EditableStatusOptions = ({status, color, bay, jobId, handleRefreshData, locationData}) => {
    const changeStatusRef = useRef();
    const [showStatusOptions, setShowStatusOptions] = useState(false);
    const [showLocation, setShowLocation] = useState(false)
    const handleCloseLocation = () => setShowLocation(false)
    const [locationJobId, setLocationJobId] = useState('')

    useClickOutside(changeStatusRef, () => setShowStatusOptions(false));
    const handleShowStatusOptions = () => {
        if (!status.toLowerCase().includes('waiting')) {
            setShowStatusOptions(!showStatusOptions);
            console.log(showLocation);
        }
    }

    const handleSelectStatus = value => () => {
        const updateStatus = () => {
            updateBayJobStatus({[`${bay}_status`]: value}, jobId).then(res => {
                showAlert('success', res.data.msg).then(res => {
                    if (res.isConfirmed) {
                        if (value.toLowerCase() === 'complete') {
                            setShowLocation(true)
                            setLocationJobId(jobId)
                        }
                    }
                })
                
                handleRefreshData();
            }).catch(err => {
                showAlert('error', err.response.data.errors)
            })
        }
        if (value === 'complete') {
            showConfirmation({
                icon: 'question',
                message: 'Has this job been completed in the bay?',
                confirmButtonText: 'Yes',
                showDenyButton: true,
                denyButtonText: 'No',
                confirm: updateStatus,
            })
        } else updateStatus();
    }

    return (
        <>
            <div className="position-relative d-block" ref={changeStatusRef}>
                <div onClick={handleShowStatusOptions} style={{ backgroundColor: color, zIndex: 0 }} className={styles.status}>
                <option style={{textDecoration:'none',textTransform: 'capitalize'}}><span style={{}}>{status}</span></option>
                </div>
                {
                    showStatusOptions && (
                        <div className={`satus-options position-absolute bg-white p-3 shadow ${styles.statusOptions}`}>
                            {
                                STATUS_OPTIONS.map((status, statusIndex) => (
                                    <div onClick={handleSelectStatus(status.id)} key={statusIndex} style={{ backgroundColor: status.color }} className={styles.status}>
                                      <option style={{textDecoration:'none',textTransform: 'capitalize'}}><span>{status.label}</span></option> 
                                    </div>
                                ))
                            }
                        </div>
                    )
                }
            </div>

            <SelectLocation 
                job={locationJobId}
                handleRefreshData={handleRefreshData}
                show={showLocation}
                handleCloseLocation={handleCloseLocation}
                locationData={locationData}
            />
        </>
    )
}

export default EditableStatusOptions;