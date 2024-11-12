import { Button, Col, Container, Modal, Row } from "react-bootstrap";
import Select from 'react-select';
import { forwardRef, Fragment, useEffect, useState } from 'react';
import "react-datepicker/dist/react-datepicker.css";
// import holidays from '../../../Holidays'
import Swal from "sweetalert2";
import { updateBayJobPriority, updateJobs } from "../../../server";
import styles from './index.module.css';
import { DateTime } from 'luxon';
import { checkConflictBeforeSave, elementObserver, showAlert } from "../../../utils/utils";
import DatePicker from 'react-datepicker';
import { BAY_ARRAY_DETAIL } from "../../../constants";

const InvoiceModal = ({ data, show, handleClose, handleRefreshData, newPriorityList, bay }) => {
    const [baysData, setBaysData] = useState([]);

    const ExampleCustomInput = forwardRef(({ value, onClick }, ref) => (
        <button className={styles.customCalendar} onClick={onClick} ref={ref}>
            {value ? value : 'Select a date'}
        </button>
    ));
    
    useEffect(() => {
        const newBaysData = BAY_ARRAY_DETAIL.map((bay) => ({
            id: bay.id,
            name: bay.dateName,
            startDate: data.bays[`${bay.id}Date`] && data.bays[`${bay.id}Date`] !== 'NA' ? new Date(data.bays[`${bay.id}Date`]) : null,
            endDate: data.bays[`${bay.id}DateEnd`] && data.bays[`${bay.id}DateEnd`] !== 'NA' ? new Date(data.bays[`${bay.id}DateEnd`]) : null,
            required: data.bays[`${bay.id}Date`] !== 'NA',
            contractor: data.bays[`${bay.id}_bay_contractor`] || bay.defaultContractor,
            contractorOption: bay.contractorOption,
        })).filter(item => item.required);
        setBaysData(newBaysData);
    }, [data]);

    const setBayDate = async ([startDate, endDate], bayId) => {
        const startDateAfterDueDate = DateTime.fromJSDate(startDate) > DateTime.fromFormat(data.dueDate, 'dd-MM-yyyy');
        const endDateAfterDueDate = DateTime.fromJSDate(endDate) > DateTime.fromFormat(data.dueDate, 'dd-MM-yyyy');

        if (startDateAfterDueDate || endDateAfterDueDate) {
            const confirm = await Swal.fire({
                showConfirmButton: true,
                showDenyButton: true,
                text: "You have set a bay's schedule date after the due date, are you sure do want to do this?",
                confirmButtonText: 'Yes',
                denyButtonText: 'No',
                icon: 'question',
            });

            if (confirm.isDenied) {
                return;
            }
        }

        const bayIndex = baysData.findIndex((item) => item.id === bayId);
        const newBay = { ...baysData[bayIndex], startDate, endDate };
        setBaysData(baysData.map((item) => (item.id === bayId ? newBay : item)));
    };

    const handleSave = () => {
        const details = baysData
            .filter((item) => item.required)
            .reduce(
                (acc, curr) => ({
                    ...acc,
                    [`${curr.id}_date`]: DateTime.fromJSDate(curr.startDate).toISODate(),
                    [`end_${curr.id}_date`]: DateTime.fromJSDate(curr.endDate).toISODate(),
                }),
                {}
            );
        // Check for conflict
        const isConflict = checkConflictBeforeSave(details);
        if (isConflict) return false;

        const dueDate = DateTime.fromFormat(data.dueDate, data.dueDate.includes('-') ? 'dd-LL-yyyy' : 'dd/LL/yyyy');

        let afterDueDate = false;

        for (const bay of baysData) {
            if (bay.required && bay.date > dueDate) {
                afterDueDate = true;
                break;
            }
        }

        const updateJob = () => {
            // Update the priority of list
            newPriorityList && Promise.all(newPriorityList.map((item) => updateBayJobPriority({[`${bay}_priority`]: item[`${bay}_priority`]}, item.jobId)));
            updateJobs(details, data.jobId)
                .then((res) => {
                    handleRefreshData();
                    handleClose();
                    return showAlert('success', res.data.msg);
                })
                .catch((err) => {
                    return showAlert('error', err);
                });
        };

        if (afterDueDate) {
            Swal.fire({
                title: 'This job has been scheduled after the client promised date. Would you like to continue?',
                showCancelButton: true,
                confirmButtonText: 'Yes',
            }).then((result) => {
            /* Read more about isConfirmed, isDenied below */
                if (result.isConfirmed) {
                    updateJob();
                } else if (result.isDenied) {
                    return;
                }
            })

        } else {
            updateJob();
        }
    }

    useEffect(() => {
        const observer = elementObserver(`.react-datepicker-wrapper button`);
        observer.then(datePickers => {
            for (let i = 0; i < datePickers.length; i++) {
                const text = datePickers[i].innerHTML;
                if (text.slice(-1) === ' ') {
                    datePickers[i].innerHTML = text.slice(0, text.length - 3);
                }
            }
        });
    }, [baysData]);

    return (
        <>
            <Modal show={show} onHide={handleClose} animation={false} backdrop="static" size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>{data.invoiceNumber}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Container className={styles.customContainer}>
                        <Row className="mb-4">
                            <Col className="col-2">
                                <div className="d-line">
                                    <span>Due Date</span>
                                </div>
                            </Col>
                            <Col className="col">
                                <div className="d-line">
                                    <strong>{DateTime.fromFormat(data.dueDate, 'dd-LL-yyyy').toFormat('ccc, dd LLL yyyy ')}</strong>
                                </div>
                            </Col>

                        </Row>
                        {baysData.map((bay) => (
                            <Row key={bay.id} className={`mb-1 ${styles.row}`}>
                                <Col className='col-2'>
                                    <div className={styles.bayHeader}>
                                        <span>{bay.name}</span>
                                    </div>
                                </Col>
                                <Col className='col-3'>
                                    <DatePicker
                                        dateFormat='dd/MM/yyyy'
                                        selected={bay.startDate}
                                        startDate={bay.startDate}
                                        endDate={bay.endDate}
                                        onChange={(dates) => setBayDate(dates, bay.id)}
                                        selectsRange
                                        customInput={<ExampleCustomInput />}
                                    />
                                </Col>
                                {bay.contractor && (
                                    <Fragment>
                                        <Col className="col-2">
                                            <div className="d-line">
                                                <span>Contractor</span> 
                                            </div>
                                        </Col>
                                        <Col className="col-2">
                                            <div className="d-line">
                                                <Select className="ml-2" value={bay.contractor} onChange={(e) => console.log(e)} options={bay.contractorOption} />
                                            </div>
                                        </Col>
                                    </Fragment>
                                )}
                            </Row>
                        ))}
                    </Container>
                </Modal.Body>
                <Modal.Footer>                    
                    <Button style={{borderRadius: 'unset' }} variant="primary" onClick={handleSave}>
                        Save Changes
                    </Button>
                    <Button style={{borderRadius: 'unset' }} variant="dark" onClick={handleClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default InvoiceModal;