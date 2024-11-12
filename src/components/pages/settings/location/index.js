import styles from './index.module.css';
import { Form, Table } from 'react-bootstrap';
import DataTable from '../../../common/data-table';
import { useMemo, useState, useEffect, useCallback, useContext } from 'react';
import PageTitle from '../../../common/page-title';
import Button from '../../../common/button';
import { API_BASE_URL } from '../../../../constants';
import axios from 'axios';
import { addLocation, deleteLocation, updateLocation } from '../../../../server';
import Swal from 'sweetalert2';
import { Oval } from 'react-loader-spinner';
import { webContext } from '../../../../context/websocket-context';

const SettingsLocations = () => {
    const { jobItem } = useContext(webContext);
    const [data, setData] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false)
    const [updateType, setUpdateType] = useState("")
    const [location, setLocation] = useState("")
    const [locationId, setLocationId] = useState()
    const handleRefreshData = () => setIsFetching((prev) => !prev);

    const updateTypes = useMemo(() => {
        return {
            ADD : "Add",
            EDIT: "Edit"
        }
    }, [])

    const handleGetLocationData = (url) => {
        axios
            .get(url)
            .then((res) => {
                let locations = [];
                if (res.data.data !== undefined) {
                    if (res.data.data.length > 0) {
                        res.data.data.forEach((loc) => {
                            locations.push({
                                id: loc.location_id,
                                name: loc.location,
                            });
                        })

                        setData(locations);
                        setIsFetching(false);
                    } else {
                        setData([]);
                    }
                }
            })
            .catch((err) => {
                setData([]);
                setIsFetching(false);
                handleMessage('error', err);
            });
    }

    useEffect(() => {
        handleGetLocationData(`${API_BASE_URL}/location`)
    }, [isFetching]);

    useEffect(() => {
        if (jobItem !== null && jobItem.message === 'location') {
            handleGetLocationData(`${API_BASE_URL}/location`)
        }
    }, [jobItem]);

    const renderUpdateForm = useCallback((type, item = null) => {
        setIsUpdating(true)
        setUpdateType(type)
        if(type === updateTypes.EDIT) {
            // setItemToUpdate(item)
            setLocation(item.name)
            setLocationId(item.id)
        } else {
            setLocation("")
            setLocationId("")
        }
    }, [updateTypes])

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
                Header: 'Location',
                accessor: 'name',
            },
            {
                id: 'action',
                style: { width: '120px' },
                Cell: (props) => {
                    const index = props.row.id;
                    const loc = props.data[index];

                    return (
                        <div>
                            <Button onClick={() => renderUpdateForm(updateTypes.EDIT, loc)} colorVariant='cyan'>
                                EDIT
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [selectedItems, renderUpdateForm]
    );

    

    const handleRemoveSelected = async () => {
        if (selectedItems.length === 0) {
            handleMessage('error', 'Select location to delete');
            return 0;
        }

        selectedItems.forEach(async (val) => {
            await deleteLocation(data[val].id)
                .then(() => {
                    handleRefreshData()
                    setSelectedItems([])
                })
                .catch((err) => {
                    handleMessage('error', err.response.data.errors);
                });
        });

        handleMessage('success', 'Location has been successfully deleted');
    };

    const handleMessage = (icon, text) => {
        Swal.fire({
            icon: icon,
            text: text,
        });
    };

    const handleSubmitForm = () => {
        if (location === '') {
            handleMessage('error', 'location missing')
            return false;
        }

        let item = {
            location: location,
        }
        if(updateType === updateTypes.EDIT) {
            updateLocation(item, locationId).then(res => {
                handleRefreshData()
                setIsUpdating(false)
                handleMessage('success', res.data.msg)
            }).catch((err) => {
                handleMessage('error', err.response.data.errors)
            })
        } else {
            addLocation(item).then(res => {
                handleRefreshData()
                setIsUpdating(false)
                handleMessage('success', res.data.msg)
            }).catch((err) => {
                handleMessage('error', err.response.data.errors)
            })
        }
    }

    return (
        <>
            <div className={styles.headerContainer}>
                <PageTitle title='Locations' />
                <div className={styles.headerActions} hidden={!data}>
                    <Button onClick={handleRemoveSelected} colorVariant='red'>
                        REMOVE
                    </Button>
                    <Button onClick={() => renderUpdateForm(updateTypes.ADD)} colorVariant='dark'>
                        ADD LOCATION
                    </Button>
                </div>
            </div>
            {isUpdating ? <div className={styles.updateFormContainer}>
                <Form>
                    <Form.Group className={styles.fieldItem}>
                        <Form.Label>Location</Form.Label>
                        <Form.Control className={styles.fieldItemField} type="text" value = { location } onChange = { (event) => { setLocation(event.target.value) } }
                            placeholder = "Location"/>
                    </Form.Group>
                    <Form.Group className={styles.formButton}>
                        <Button onClick={handleSubmitForm} colorVariant="cyan">{updateType === updateTypes.ADD ? "CREATE" : "SAVE"}</Button>
                    </Form.Group>
                </Form>
                </div> : ""}
            {isFetching && !data ? (
                <div className='loading-container'>
                    <Oval color='#fff' height={80} width={80} />
                </div>
            ) : data.length > 0 ? (
                <>
                    <div className={styles.contentContainer} hidden={data.length > 0 ? false : true}>
                        <DataTable columns={columns} data={data} />
                    </div>
                </>
            ) : (
                <>
                    <div>
                    <div className={styles.contentContainer}>
                        <div className={styles.tableContainer}>
                            <Table className={`no-border ${styles.dataTable}`}>
                                <thead>
                                    <tr>
                                        <th>Location</th>

                                    </tr>

                                </thead>
                                <tbody></tbody>

                            </Table>

                        </div>
                    </div>
                </div>
                </>
            )}
        </>
    );
};

export default SettingsLocations;
