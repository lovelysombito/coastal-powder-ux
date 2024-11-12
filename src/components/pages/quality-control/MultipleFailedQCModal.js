import React, { useEffect } from 'react';
import { Button, Modal } from 'react-bootstrap';
import styles from './index.module.css';
import Select from 'react-select';
import { useState } from 'react';
import { API_BASE_URL } from '../../../constants';
import { dataUrlToFile, showAlert } from '../../../utils/utils';
import axios from 'axios';
import { Fragment } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { updateQCJob } from '../../../server';

const powderBays = [
    {
        id: 'main line',
        label: 'Main Line',
    },
    {
        id: 'big batch',
        label: 'Big Batch',
    },
    {
        id: 'small batch',
        label: 'Small Batch',
    },
];

const MultipleFailedQCModal = ({ showModal, setShowModal, selectedData, setSelectedData, sigCanvas, handleRefreshData}) => {
    const [ncrFailedOptions, setNcrFailedOptions] = useState([]);
    const [failedOption, setFailedOption] = useState({ value: '', label: '' });
    const [selectedTreatment, setSelectedTreatment] = useState({ value: '', label: '' });
    const [selectedPowderBay, setSelectedPowderBay] = useState('');
    const [image, setImage] = useState();
    const [showFailModal, setShowFailModal] = useState(false);
    const [selectedFormData, setSelectedFormData] = useState();
    const [treatments, setTreatments] = useState([]);
    const [jobOption, setJobOption] = useState([]);
    const [selectedJob, setSelectedJob] = useState([]);
    const [selectedLines, setSelectedLines] = useState([]);

    useEffect(() => {
        if (Object.keys(selectedData).length > 0) {
            getJobOptions(selectedData.jobs);
        }
        getNCROption(`${API_BASE_URL}/failed-options`);
        getTreatments();
    }, [selectedData]);

    useEffect(() => {
        if (treatments.length) {
            const matchedTreatment = treatments.find(item => item.label === selectedData.process && item.materials.some(el => el.material === selectedData.material));
            setSelectedTreatment(matchedTreatment || { value: '', label: '' });
        }
    }, [treatments, showModal, selectedData]);

    const getNCROption = (url) => {
        axios
            .get(url)
            .then((res) => {
                if (res.data.data.data !== undefined) {
                    const options = res.data.data.data.map((item) => ({
                        value: item.ncr_failed_id,
                        label: item.ncr_failed,
                    }));
                    setNcrFailedOptions(options);
                } else {
                    setNcrFailedOptions([]);
                }
            })
            .catch((err) => {
                setNcrFailedOptions([]);
                showAlert('error', err);
            });
    };

    const getJobOptions = (jobs) => {
        const jobsData = jobs.map((item) => ({
            value: item.job_id,
            label: item.job_prefix + ' ' + item.job_number,
            lines: item.lines
        }))
        
        setJobOption(jobsData);

    };

    const getTreatments = () => {
        axios
            .get(`${API_BASE_URL}/treatments`)
            .then((res) => {
                if (res.data.data !== undefined) {
                    const options = res.data.data.map((item) => ({
                        value: item.treatment_id,
                        label: item.treatment,
                        materials: item.materials,
                    }));
                    setTreatments(options);
                    let pageItems = [];
                    for (let index = 0; index < res.data.last_page; index++) {
                        pageItems.push(index + 1);
                    }
                } else {
                    setTreatments([]);
                }
            })
            .catch((err) => {
                setTreatments([]);
                showAlert('error', err);
            });
    };

    const handleLineItemCheckBoxChange = (index) => (e) => {
        const items = selectedJob.lines;
        const data = items[index];
        data.checked = e.target.checked;
        setSelectedData((prevState) => ({ ...prevState, items }));
    };

    const handleFailStatus = () => {
        if (!failedOption.value) return showAlert('error', 'Please select failed option');
        const formData = new FormData();

        //selected line items
        let selectedIdsInString = '';
        let selectedPassIdsInString = '';
        selectedJob.lines.forEach((item) => {
            if (item.checked) {
                selectedIdsInString += `${item.id ?? item.line_item_id},`;
            } else {
                selectedPassIdsInString += `${item.id ?? item.line_item_id},`;
            }
        });

        selectedIdsInString = selectedIdsInString.substring(0, selectedIdsInString.length - 1);
        selectedPassIdsInString = selectedPassIdsInString.substring(0, selectedPassIdsInString.length - 1);
        formData.append('selected_line_item_ids', selectedIdsInString);


        if (selectedIdsInString.length === 0) {
            return showAlert('error', 'Please select the line items that have failed');
        }

        if (!selectedTreatment.value) {
            return showAlert('error', 'Please select the processes that are required to be repeated');
        }

        formData.append('process', selectedTreatment.label);

        if (['p', 'c'].some((char) => selectedTreatment?.label?.toLowerCase().includes(char))) {
            if (!selectedPowderBay) return showAlert('error', 'Please select powder bay');
            else formData.append(`powder_bay`, selectedPowderBay);
        }

        if (!image) {
            return showAlert('error', 'Please upload an image');
        }

        formData.append('qc_status', 'failed');
        formData.append('ncr_failed_id', failedOption.value);
        formData.append('photo', image);

        if (selectedPassIdsInString.length > 0) {
            formData.append('selected_passed_line_item_ids', selectedPassIdsInString);
            setSelectedFormData(formData);
            setShowFailModal(true);
            setShowModal(false);
            return;
        }

        updateQCJobStatus(formData);
        return;
    };

    
    const updateQCJobStatus = async (form_data) => {
            await updateQCJob(form_data, selectedJob.value, { header: { 'Content-Type': 'multipart/form-data', 'Access-Control-Allow-Origin': '*' } })
            .then((res) => {
                setShowModal(false);
                showAlert('success', res.data.message)
            })
            .catch((err) => {
                let message = '';
                if (err.response.data.errors && typeof err.response.data.errors == 'object') {
                    for (const key in err.response.data.errors) {
                        if (Object.hasOwnProperty.call(err.response.data.errors, key)) {
                            message += err.response.data.errors[key] + '\n';
                        }
                    }
                } else {
                    message = err.response.msg || err.response.message || err.response?.data?.message;
                }
                showAlert('error', message);
            });


        setShowFailModal(false)
        handleRefreshData();
    };

    const handleProccessFailedData = () => {
        let img = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        let imgFile = dataUrlToFile(img, selectedData.invoiceNumber);

        if (sigCanvas.current.isEmpty()) {
            return showAlert('error', 'Signature is empty');
        }

        selectedFormData.append('signature', imgFile, `${selectedData.invoiceNumber}.png`);
        updateQCJobStatus(selectedFormData);
    };

    const handleJobAndLineItems = (option) => {
        if (option !== null) {
            setSelectedLines(option.lines)
            setSelectedJob(option)
        }
        
    }

    return (
        <Fragment>
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Body>
                    <div className={styles.headerLabelModal}>
                        <span>You selected "QC Failed" for a job.</span>
                    </div>
                    <div className={styles.jobIdModal}>
                        <div className={styles.labelModal}>
                            <span>Jobs:</span>
                        </div>
                        <div className='mb-4'>
                            <Select
                                isClearable={true}
                                isSearchable={true}
                                name='jobOption'
                                options={jobOption}
                                onChange={(option) => handleJobAndLineItems(option)}
                                value={selectedJob}
                            />
                        </div>
                    </div>
                    <div className={styles.labelModal}>
                        <span>Failed reason:</span>
                    </div>

                    <div className='mb-4'>
                        <Select
                            isClearable={true}
                            isSearchable={true}
                            name='ncrFailedOption'
                            options={ncrFailedOptions}
                            onChange={(option) => setFailedOption(option)}
                            value={failedOption}
                        />
                    </div>

                    <div className={styles.labelModal}>
                        <span>Line items:</span>
                    </div>

                    <div className='mb-4'>
                        {
                            selectedLines.length > 0 ? 
                            selectedLines.map((item, i) => {
                                return <div key={i} className='form-check'>
                                    <input
                                        className='form-check-input'
                                        onChange={handleLineItemCheckBoxChange(i)}
                                        checked={!!item.checked}
                                        type='checkbox'
                                        id={item.line_item_id}
                                        name={item.name}
                                    />
                                    <label htmlFor={item.line_item_id} className='form-check-label'>
                                        {item.name}
                                    </label>
                                </div>
                            }) : 'N/A'
                        }
                    </div>

                    <div className={styles.labelModal}>
                        <span>Required Treatment:</span>
                    </div>
                    <div className='mb-4'>
                        {
                            <Select
                                isClearable={true}
                                isSearchable={true}
                                name='treatment'
                                options={treatments?.filter(item => item.material === selectedData.material) || []}
                                onChange={(value) => setSelectedTreatment(value)}
                                value={selectedTreatment}
                            />
                        }
                    </div>
                    {['p', 'c'].some((char) => selectedTreatment?.label?.toLowerCase().includes(char)) && (
                        <Fragment>
                            <div className={styles.labelModal}>
                                <span>Powder Bays :</span>
                            </div>

                            <div className='mb-4'>
                                {powderBays.map((powderBay, index) => (
                                    <div key={index} className='form-check'>
                                        <input
                                            onChange={(e) => setSelectedPowderBay(e.target.value)}
                                            className='form-check-input'
                                            type='radio'
                                            checked={powderBay.id === selectedPowderBay}
                                            name='powder_bay'
                                            id={powderBay.id}
                                            value={powderBay.id}
                                        />
                                        <label className='form-check-label' htmlFor={powderBay.id}>
                                            {powderBay.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </Fragment>
                    )}

                    <input style={{cursor: 'pointer'}} type='file' accept='image/*' capture={true} onChange={(e) => setImage(e.target.files[0])} />
                    <div className={styles.buttonModal}>
                        <Button colorVariant='cyan' onClick={handleFailStatus}>
                            Save
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>

            <Modal show={showFailModal} onHide={() => setShowFailModal(false)} size='md' centered>
                <Modal.Body className={styles.modalContentContainer}>
                    <div className={styles.headerLabelModal}>
                        <span>You have failed some of the lines for this job. Please confirm that the other lines have passed.</span>
                    </div>
                    <div className={styles.signatureContainerModal}>
                        <SignatureCanvas penColor='black' canvasProps={{ className: styles.signatureModal }} ref={sigCanvas} />
                    </div>
                    <div className={styles.buttonModal}>
                        <Button colorVariant='cyan' onClick={handleProccessFailedData}>
                            Submit
                        </Button>
                    </div>
                    <div hidden={selectedData.status === 'Complete' ? true : false}></div>
                </Modal.Body>
            </Modal>
        </Fragment>
    );
};

export default MultipleFailedQCModal;
