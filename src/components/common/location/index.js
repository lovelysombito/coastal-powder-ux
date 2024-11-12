import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { updateJobLocation } from '../../../server';
import { showAlert } from '../../../utils/utils';
import styles from './index.module.css';

const SelectLocation = ({ job, handleRefreshData, show, handleCloseLocation, locationData }) => {
    const [selectedLocationId, setSelectedLocationId] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [otherLocation, setOtherLocation] = useState('');

    const handleLocation = (e) => {
        setSelectedLocationId(e.target.selectedOptions[0].id);
        setSelectedLocation(e.target.value);
    };

    const handleUpdateLocation = () => {
        let item = {};
        if (!selectedLocationId) {
            showAlert('error', 'Please select location!');
            return;
        }
        if (selectedLocationId !== 'other') {
            item = {
                location_id: selectedLocationId,
                location: selectedLocation,
            };
        } else {
            if (!otherLocation) {
                showAlert('error', 'Please input other location!');
                return;
            }
            item = {
                location_id: selectedLocationId,
                location: otherLocation,
            };
        }

        if (typeof job == 'object') {
            for (let index = 0; index < job.length; index++) {
                updateJobLocation(item, job[index]).catch((err) => {
                    showAlert('error', err.response.data.errors);
                });
            }
        } else {
            updateJobLocation(item, job).catch((err) => {
                showAlert('error', err.response.data.errors);
            });
        }

        setOtherLocation('');
        setSelectedLocation('');
        setSelectedLocationId('');
        handleRefreshData();
        handleCloseLocation();
    };

    return (
        <Modal show={show} onHide={handleCloseLocation} size='sm' backdrop='static' centered>
            <Modal.Header closeButton>Select location</Modal.Header>
            <Modal.Body>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <select onChange={handleLocation} className={styles.select}>
                        <option selected value='' disabled>--Select Location--</option>
                        {locationData?.map((res) => (
                            <option key={res.location_id} value={res.location} id={res.location_id}>
                                {res.location}
                            </option>
                        ))}
                        <option id='other' value='other'>
                            Other
                        </option>
                    </select>
                </div>
                <div className='mt-2'>
                    {selectedLocation == 'other' ? (
                        <input style={{ width: '266px' }} onChange={(e) => setOtherLocation(e.target.value)} value={otherLocation} />
                    ) : (
                        ''
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant='primary' onClick={handleUpdateLocation}>
                    Save Changes
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SelectLocation;
