import styles from './index.module.css';
import { Form, Table } from 'react-bootstrap';
import DataTable from '../../../common/data-table';
import { useMemo, useState, useEffect, useCallback, useContext } from 'react';
import PageTitle from '../../../common/page-title';
import Button from '../../../common/button';
import { API_BASE_URL } from '../../../../constants';
import axios from 'axios';
import { addColour, updateColour,deleteColour } from '../../../../server';
import Swal from 'sweetalert2';
import { Oval } from 'react-loader-spinner';
import { webContext } from '../../../../context/websocket-context';

const SettingsColours = () => {
    const { jobItem } = useContext(webContext);
    const [data, setData] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false)
    const [updateType, setUpdateType] = useState("")
    const [colour, setColour] = useState("")
    const [low_weight, setLowWeight] =useState(0)
    const [ weight, setWeight] = useState(0)
    const [colourId, setColourId] = useState()
    const handleRefreshData = () => setIsFetching((prev) => !prev);

    const updateTypes = useMemo(() => {
        return {
            ADD : "Add",
            EDIT: "Edit"
        }
    }, [])

    const handleGetColourData = (url) => {
        axios
        .get(url)
        .then((res) => {
            let colours = [];
            if (res.data.code === 200) {
                res.data.message.forEach(colour => {
                    colours.push({
                        id: colour.colour_id,
                        name: colour.name,
                        low_weight:colour.low_weight,
                        weight:colour.weight,
                    })
                })

                    setData(colours);
                    setIsFetching(false);
                } else {
                    setData([]);
                }
            })
        .catch((err) => {
            setData([]);
            setIsFetching(false);
            handleMessage('error', err);
        });
    }

    useEffect(() => {
        handleGetColourData(`${API_BASE_URL}/colours`)
    }, [isFetching]);

    useEffect(() => {
        if (jobItem !== null && jobItem.message === 'colour') {
            handleGetColourData(`${API_BASE_URL}/colours`)
        }
    }, [jobItem]);

    const renderUpdateForm = useCallback((type, item = null) => {
        setIsUpdating(true)
        setUpdateType(type)
        if(type === updateTypes.EDIT) {
            // setItemToUpdate(item)
            setColour(item.name)
            setColourId(item.id)
        } else {
            setColour("")
            setColourId("")
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
                Header: 'Colour',
                accessor: 'name',
            },
            {
                isSortable: true,
                Header: 'Weight (kg)',
                accessor: 'weight',
            },
            {
                isSortable: true,
                Header: 'Low Weight (kg)',
                accessor: 'low_weight',
            },
            {
                id: 'action',
                style: { width: '120px' },
                Cell: (props) => {
                    const index = props.row.id;
                    const color = props.data[index];

                    return (
                        <div>
                            <Button onClick={() => renderUpdateForm(updateTypes.EDIT, color)} colorVariant='cyan'>
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
            handleMessage('error', 'Select colour to delete');
            return 0;
        }

        selectedItems.forEach(async (val) => {
            await deleteColour(data[val].id)
                .then(() => {
                    handleRefreshData()
                    setSelectedItems([])
                })
                .catch((err) => {
                    handleMessage('error', err.response.data.errors);
                });
        });

        handleMessage('success', 'Colour has been successfully deleted');
    };

    const handleMessage = (icon, text) => {
        Swal.fire({
            icon: icon,
            text: text,
        });
    };

    const handleSubmitForm = () => {
        if (colour === '' || low_weight === '' || weight ==='') {
            handleMessage('error', 'Some of the required  values are missing')
            return false;
        }

        let item = {
            name: colour,
            low_weight:low_weight,
            weight:weight,
        }
        if(updateType === updateTypes.EDIT) {
            updateColour(item, colourId).then(res => {
                handleRefreshData()
                setIsUpdating(false)
                handleMessage('success', res.data.message)
            }).catch((err) => {
                handleMessage('error', err.response.data.message)
            })
        } else {
            addColour(item).then(res => {
                handleRefreshData()
                setIsUpdating(false)
                handleMessage('success', res.data.message)
            }).catch((err) => {
                handleMessage('error', err.response.data.errors ||err.response.data.message)
                return false
            })
        }
    }

    return (
        <>
            <div className={styles.headerContainer}>
                <PageTitle title='Colours' />
                <div className={styles.headerActions} hidden={!data}>
                    <Button onClick={handleRemoveSelected} colorVariant='red'>
                        REMOVE
                    </Button>
                    <Button onClick={() => renderUpdateForm(updateTypes.ADD)} colorVariant='dark'>
                        ADD COLOUR
                    </Button>
                </div>
            </div>
            {isUpdating ? <div className={styles.updateFormContainer}>
                <Form>
                    <Form.Group className={styles.fieldItem}>
                        <Form.Label>Colour Name</Form.Label>
                        <Form.Control className={styles.fieldItemField} type="text" value = { colour }  autoFocus onChange = { (event) => { setColour(event.target.value) } }
                            placeholder = "Colour"/>
                    </Form.Group>
                    <Form.Group className={styles.fieldItem}>
                        <Form.Label>Set Low Weight</Form.Label>
                        <Form.Control className={styles.fieldItemField} type="number" value = { low_weight } onChange = { (event) => { setLowWeight(event.target.value) } }
                            placeholder = "Low Weight"/>
                    </Form.Group>
                    <Form.Group className={styles.fieldItem}>
                        <Form.Label>Set Total Weight</Form.Label>
                        <Form.Control className={styles.fieldItemField} type="number" value = { weight } onChange = { (event) => { setWeight(event.target.value) } }
                            placeholder = "Weight"/>
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
                                        <th>Colour</th>
                                        <th>Weight (kg)</th>
                                        <th>Low Weight (kg)</th>

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

export default SettingsColours;
