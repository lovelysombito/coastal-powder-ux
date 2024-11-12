import axios from 'axios';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Form, Modal, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../../constants';
import { useBoolean } from '../../../../hooks';
import { addTreatment, deleteTreatment, getAllMaterial, updateTreatment } from '../../../../server';
import { capitalizeFirstLetter, showAlert } from '../../../../utils/utils';
import Button from '../../../common/button';
import DataTable from '../../../common/data-table';
import PageTitle from '../../../common/page-title';
import styles from './index.module.css';
import { webContext } from '../../../../context/websocket-context';
import { Oval } from 'react-loader-spinner';

const SettingsTreatments = () => {
    const { jobItem } = useContext(webContext);
    let navigate = useNavigate();
    const [ selectedMaterial, setSelectedMaterial ] = useState('aluminium');
    const [data, setData] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [showModal, toggleModal] = useBoolean(false);
    const [editingOption, setEditingOption] = useState({});
    const [ materials, setMaterials] = useState([])
    const [ selectMaterial, setSelectMaterial] = useState('aluminium')

    useEffect(() => {
        if (isFetching) {
            if (selectedMaterial !== '') {
                getTreatments(`${API_BASE_URL}/treatments?material=${selectedMaterial}`);
            }
            getAllMaterial(`${API_BASE_URL}`).then(res => {setMaterials(res.data)})
        }
    }, [isFetching]);

    useEffect(() => {
        if (jobItem !== null && jobItem.message == 'treatment') {
            if (selectedMaterial !== '') {
                getTreatments(`${API_BASE_URL}/treatments?material=${selectedMaterial}`);
            }
            getAllMaterial(`${API_BASE_URL}`).then(res => {setMaterials(res.data)})
        }
    }, [jobItem])

    useEffect(() => {
        setData(null);
        setIsFetching(true);
    }, [selectedMaterial]);

    const getTreatments = (url) => {
        axios
            .get(url)
            .then((res) => {
                if (res.data.data !== undefined) {
                    const options = res.data.data.map((item) => ({
                        id: item.treatment_id,
                        name: item.treatment,
                    }));
                    setData(options);
                    let pageItems = [];
                    for (let index = 0; index < res.data.last_page; index++) {
                        pageItems.push(index + 1);
                    }
                    setIsFetching(false);
                } else {
                    setIsFetching(false);
                    setData([]);
                }
            })
            .catch((err) => {
                setData([]);
                setIsFetching(false);
                showAlert('error', err);
            });
    };

    const onEditOption = (item) => {
        setEditingOption(item);
        toggleModal();
    };

    const onAddOption = () => {
        setEditingOption({});
        toggleModal();
    };

    const columns = useMemo(
        () => [
            {
                id: 'select',
                style: { width: 80 },
                Cell: (props) => {
                    const index = props.row.id;

                    const handleSelectItem = (index, isChecked) => {
                        if (isChecked) {
                            if (!selectedItems.includes(index)) {
                                setSelectedItems([...selectedItems, index]);
                            }
                        } else {
                            setSelectedItems([...selectedItems].filter((el) => el !== index));
                        }
                    };
                    return (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                flex: '1 1 auto',
                            }}
                        >
                            <Form.Check
                                className={styles.tableCheckBox}
                                type='checkbox'
                                checked={selectedItems.includes(index)}
                                onChange={(event) => {
                                    handleSelectItem(index, event.target.checked);
                                }}
                            />
                        </div>
                    );
                },
            },
            {
                isSortable: true,
                Header: 'Treatments',
                accessor: 'name',
            },
            {
                id: 'action',
                style: { width: '120px' },
                Cell: (props) => {
                    const index = props.row.id;
                    const option = props.data[index];

                    return (
                        <Button onClick={() => onEditOption(option)} colorVariant='cyan'>
                            EDIT
                        </Button>
                    );
                },
            },
        ],
        [selectedItems, navigate]
    );

    const handleRemoveSelected = () => {
        if (selectedItems.length === 0) {
            showAlert('error', 'Select option to delete');
            return 0;
        }

        selectedItems.forEach(async (val) => {
            deleteTreatment(data[val].id)
                .then((res) => {
                    if (res.status === 200) {
                        setIsFetching(true);
                        setSelectedItems([]);
                        showAlert('success', res.data.msg);
                    }
                })
                .catch((err) => {
                    showAlert('error', err);
                });
        });
    };

    const handleKeyPress = (e) => {
        if(e.keyCode == 13){
            e.preventDefault()
            onSave()
        }
    }

    const onSave = () => {
        if (!editingOption.name) {
            return showAlert('error', 'Name cannot be empty/null');
        }
        const sameItem = data.find(item => item.name.toLowerCase().trim() === editingOption.name.toLowerCase().trim());
        if (sameItem) return showAlert('error', 'Treatment already exists!');

        const { id, name } = editingOption;

        let option = {
            treatment: name,
            material: selectMaterial,
        };

        if (id) {
            updateTreatment(option, id).then((res) => {
                if (res.status === 200) {
                    showAlert('success', res.data.msg);
                    setIsFetching(true);
                    toggleModal();
                }
            });
        } else {
            addTreatment(option).then((res) => {
                if (res.status === 200) {
                    showAlert('success', res.data.msg);
                    setIsFetching(true);
                    toggleModal();
                }
            });
        }
    };

    const handleMaterialChange = (e) => {
        getTreatments(`${API_BASE_URL}/treatments?material=${e.target.value}`);
        setSelectedMaterial(e.target.value)
    }

    const handleSelectMaterial = (e) => {
        setSelectMaterial(e.target.value)
    }

    return (
        <>
            <div className={styles.headerContainer}>
                <PageTitle title={`Treatments`} />
                
                <div className={styles.headerActions}>
                    
                    <Button onClick={handleRemoveSelected} colorVariant='red'>
                        REMOVE
                    </Button>
                    <Button onClick={onAddOption} colorVariant='dark' disabled={!selectedMaterial} type="submit">
                        ADD OPTION
                    </Button>
                    
                </div>
            </div>

            <div className='mb-2 w-25' style={{float:'right'}}>
                {
                    materials.length > 0 ?
                    <Form.Select aria-label="Default select example" onChange={handleMaterialChange}>
                            <option disabled selected value='null'>Select material</option>
                            {
                                materials.map((item, i) => {
                                    return <option key={i} value={item.material} selected='aluminum'>{capitalizeFirstLetter(item.material)}</option>
                                })
                            }
                    </Form.Select> : ''
                }
                        
            </div>
            {isFetching && !data ? (
                    <div className='loading-container'>
                        <Oval/>
                    </div>
            ) : data.length > 0 ? (
                <>
                    <div className={styles.contentContainer} hidden={data.length > 0 ? false : true}>
                        <DataTable columns={columns} data={data} />
                    </div>
                </>
            ) : (
                <div>
                    <div className={styles.contentContainer}>
                        <div className={styles.tableContainer}>
                        
                            <Table className={`no-border ${styles.dataTable}`}>
                                <thead>
                                    <tr>
                                    <div className='mb-4'>
                                        
                                    </div>
                                        <th>Treatments</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </Table>
                        </div>
                    </div>
                </div>
            )}
            <Modal show={showModal} onHide={toggleModal} size='md'>
                <Modal.Header>{Object.keys(editingOption).length === 0 ? `${capitalizeFirstLetter(selectedMaterial)} Treatment` : `${capitalizeFirstLetter(selectedMaterial)} Treatment`}</Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>Treatment</Form.Label>
                            <Form.Control
                                className={styles.textField}
                                type='text'
                                value={editingOption.name || ''}
                                onKeyDown={handleKeyPress}
                                onChange={(e) => setEditingOption({ ...editingOption, name: e.target.value })}
                            />
                            <Form.Label>Material</Form.Label>
                            {
                                <Form.Select aria-label="Default select example" onChange={handleSelectMaterial}>
                                    <option disabled selected value='null'>Select material</option>
                                    {
                                        materials.map((item, i) => {
                                            return <option key={i} value={item.material} selected='aluminum'>{capitalizeFirstLetter(item.material)}</option>
                                        })
                                    }
                                </Form.Select>
                            }
                        </Form.Group>

                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant='primary' onClick={onSave}>
                        Save
                    </Button>
                    <Button variant='dark' onClick={toggleModal}>
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default SettingsTreatments;
