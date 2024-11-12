import axios from 'axios';
import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import ReactDatePicker from 'react-datepicker';
import Select from 'react-select';
import { API_BASE_URL, POWDER_BAYS } from '../../../constants';
import { editJob } from '../../../server';
import { showAlert } from '../../../utils/utils';

const EditJobModal = ({ colours, job, handleRefreshData, isEditJob, setIsEditJob }) => {
    const [selectedMaterial, setSelectedMaterial] = useState('');
    const [selectedTreatment, setSelectedTreatment] = useState(null);
    const [selectedPowderBay, setSelectedPowderBay] = useState('');
    const [selectedColour, setSelectedColour] = useState(null);
    const [selectedDueDate, setSelectedDueDate] = useState(new Date());
    const [treatments, setTreatments] = useState([]);

    useEffect(() => {
        getTreatments();
        if (isEditJob) {
            if (job.bays) {
                for (const key in job.bays) {
                    if (Object.hasOwnProperty.call(job.bays, key)) {
                        const bay = job.bays[key];

                        //the value for powder bat is like ex: ready (big batch)
                        if (bay && bay !== '' && bay !== 'NA' && bay !== 'na') {
                            if (key === 'powderBay' && job.process !=null) {
                                if (job.process.treatment?.includes('C')) {
                                    const powderBays = POWDER_BAYS;
                                    powderBays.forEach((powderBay) => {
                                        if (bay.includes(powderBay.id)) {
                                            setSelectedPowderBay(powderBay.id);
                                        }
                                    });
                                }else {
                                    const powderBays = POWDER_BAYS;
                                    powderBays.forEach((powderBay) => {
                                        if (bay.includes(powderBay.id)) {
                                            setSelectedPowderBay(powderBay.id);
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            }

            setSelectedColour({ value: job.colour, label: job.colour });
            setSelectedMaterial(job.material);
            setSelectedTreatment({ value: job.process?job.process.treatment?job.process.treatment:job.process:'', label: job.process?job.process.treatment?job.process.treatment:job.process:'' });

            //we need to parse manually the dueDate because of the current format
            if (job.dueDate.includes('-')) {
                const parts = job.dueDate.split('-');
                const dueDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                setSelectedDueDate(dueDate);
            } else {
                setSelectedDueDate(new Date(job.dueDate));
            }
        }
    }, [job, isEditJob]);

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
                } else {
                    setTreatments([]);
                }
            })
            .catch((err) => {
                setTreatments([]);
                showAlert('error', err);
            });
    };

    const handleEditJobSave = async () => {
        try {
            if (!selectedTreatment) {
                return showAlert('error', 'Please select treatment');
            }
            

            if (!selectedDueDate) {
                return showAlert('error', 'Please select Due date');
            }
            const data = {
                colour: selectedColour.value,
                material: selectedMaterial,
                treatment: selectedTreatment.label,
                due_date: DateTime.fromJSDate(selectedDueDate, 'yyyy-MM-dd').toISODate()
            };

            if (selectedTreatment.label.includes('C')) {
                if (selectedPowderBay === '' || !selectedPowderBay) {
                    return showAlert('error', 'Please select powder bay');
                }
                data['powder_bay'] = selectedPowderBay;
            }


            const res = await editJob(data, job.jobId);
            setIsEditJob(false);
            handleRefreshData();
            showAlert('success', res.data.msg);
            onClose();
        } catch (error) {
            console.error(error);
            showAlert('error', error.response.data.message);
            onClose();
        }
    };

    const onClose = () => {
        setSelectedMaterial('');
        setIsEditJob(false)
    }

    return (
        <Modal show={isEditJob} size='md' backdrop='static' closebutton={true}>
            <Modal.Header>Edit Job</Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className='mb-3'>
                        <Form.Label>Material</Form.Label>
                        <Form.Select
                            aria-label='Default select example'
                            value={selectedMaterial}
                            onChange={(e) => {
                                setSelectedMaterial(e.target.value);
                                setSelectedTreatment(null);
                            }}
                        >
                            <option hidden={true}>Select Material</option>
                            <option value='aluminium'>Aluminium</option>
                            <option value='steel'>Steel</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className='mb-3' controlId='formBasicEmail'>
                        <Form.Label>Treatment</Form.Label>
                        <Select
                            onChange={(value) => setSelectedTreatment(value)}
                            value={selectedTreatment}
                            options={treatments?.filter(item => item.materials.some(el => el.material === selectedMaterial)) || []}
                        />
                    </Form.Group>

                    {selectedTreatment && (selectedTreatment.label.treatment?selectedTreatment.label.treatment.includes('C'):selectedTreatment.label.includes('C')) && (
                        <Form.Group className='mb-3' controlId='formBasicEmail'>
                            <Form.Label>Powder Bay Coating Line</Form.Label>
                            {POWDER_BAYS.map((powderBay, index) => (
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
                        </Form.Group>
                    )}

                    <Form.Group className='mb-3'>
                        <Form.Label>Colour</Form.Label>
                        <Select onChange={(value) => setSelectedColour(value)} value={selectedColour} options={colours} />
                    </Form.Group>

                    <Form.Group className='mb-3'>
                        <Form.Label>Due Date</Form.Label>
                        <ReactDatePicker
                            dateFormat='dd/MM/yyyy'
                            className='form-control'
                            selected={selectedDueDate}
                            onChange={(date) => setSelectedDueDate(date)}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button style={{borderRadius: 'unset' }} variant='primary' onClick={handleEditJobSave}>
                    Save
                </Button>
                <Button style={{borderRadius: 'unset' }} variant='dark' onClick={onClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditJobModal;
