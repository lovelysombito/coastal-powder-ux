import { DateTime } from 'luxon';
import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { AiOutlineExclamationCircle } from 'react-icons/ai';
import { Link } from 'react-router-dom';
import EditableStatusOptions from './EditableStatusOptions';
import styles from './index.module.css';

const JobCard = ({
    index,
    dragDisabled,
    title,
    bay,
    jobData,
    isSelectedDataByQR,
    handleInvoiceData,
    handleRefreshData,
    currentPage,
    selectedJobCard,
    locationData
}) => {
    let dueDate = null
    const { invoiceNumber, status, details, jobId, comments, color, selectedBay } = jobData;
    if (currentPage == 'overview') {
            dueDate = jobData.dueDate
    } else {
        dueDate = details.date
    }
    const overdue = DateTime.fromFormat(dueDate, 'dd-LL-yyyy') <= DateTime.now();
    return (
        <Draggable draggableId={`${jobId}--${selectedBay}`} index={index} isDragDisabled={dragDisabled}>
            {(provided) => {
                return (
                    <div
                        ref={provided.innerRef}
                        // snapshot={snapshot}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={styles.cardDataWrapper}
                    >
                        <div
                            style={{
                                border: isSelectedDataByQR ? '3px solid darkgrey' : overdue ? '3px solid red' : 'unset',
                                backgroundColor: selectedJobCard === jobId || isSelectedDataByQR ? 'darkgrey' : 'unset',
                                
                                margin: -15,
                                padding: 7,
                            }}
                        >
                            <div className={styles.cardHeader} id={jobId}>
                                <Link style={{ textDecoration: 'unset' }} to={`/jobs/${jobId}`}>
                                    <span style={{ width: 'unset' }} className={styles.invoiceNumber}>{invoiceNumber}</span>
                                </Link>
                                <div className={styles.detailsAndIcon}>
                                    <option value={jobId + ',' + color} onClick={() => handleInvoiceData(jobData)}>
                                        Details
                                    </option>
                                    {comments?.length ? <AiOutlineExclamationCircle className={styles.exclamationIcon} /> : null}
                                </div>
                            </div>
                            <div
                                id='selected-bay'
                                hidden={title === 'Ready to Schedule' || (bay !== null && currentPage !== 'dashboard') ? true : false}
                                className={title.toLowerCase() !== 'ready to schedule' || title.toLowerCase() !== 'ready' ? styles.status : ''}
                                style={{ backgroundColor: '#808080', color: '#FFFFFF', textAlign: 'center' }}
                            >
                                <span>{selectedBay}</span>
                            </div>
                            {details ? (
                                <div className={styles.cardDetails} >
                                    <div className={styles.cardDetailsItem} style={{color: selectedJobCard === jobId || isSelectedDataByQR ? 'black' : 'unset'}}>
                                        <a href={details.poLink} target='_blank' rel='noreferrer'>
                                            {details.poNumber}
                                        </a>
                                        <span style={{ fontWeight: 'bold' }}>{details.colour}</span>
                                    </div>
                                    <div className={styles.cardDetailsItem} style={{textTransform: 'capitalize' ,color: selectedJobCard === jobId || isSelectedDataByQR ? 'black' : 'unset'}}>
                                        <span>Process: {details.process}</span>
                                        <span>{details.material}</span>
                                    </div>
                                    <div className={styles.cardDetailsItem} style={{color: selectedJobCard === jobId || isSelectedDataByQR ? 'black' : 'unset'}}>
                                        <span>Due Date: {details.date}</span>
                                    </div>
                                </div>
                            ) : (
                                ''
                            )}
                            {(currentPage === 'dashboard' || currentPage === 'overview') && (title === 'Ready to Schedule') ? (
                                <div className="position-relative d-block">
                                    <div style={{ backgroundColor: "blue", zIndex: 0 }} className={styles.status}>
                                        <span style={{ textTransform: 'capitalize' }}>Awaiting Schedule</span>
                                    </div>
                                </div>
                            ) : (
                                <EditableStatusOptions status={status} color={color} jobId={jobId} bay={bay} handleRefreshData={handleRefreshData} locationData={locationData}/>
                            )}
                        </div>
                    </div>
                );
            }}
        </Draggable>

    );
};

export default JobCard;
