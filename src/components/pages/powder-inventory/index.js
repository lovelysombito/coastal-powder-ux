import styles from './index.module.css';
import { Form } from 'react-bootstrap';
import DataTable from '../../common/data-table';
import { useMemo, useState, useEffect, useCallback } from 'react';
import PageTitle from '../../common/page-title';
import Button from '../../common/button';
import { API_BASE_URL } from '../../../constants';
import axios from 'axios';
import {updatePowderColourInventory } from '../../../server';
import Swal from 'sweetalert2';
import { Oval } from 'react-loader-spinner';

const PowderInventory = () => {
    const [data, setData] = useState(null);
    // const [selectedItems, setSelectedItems] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false)
    const [updateType, setUpdateType] = useState("")
    const [colour, setColour] = useState("")
    const [ weight, setWeight] = useState(0)
    const [colourId, setColourId] = useState()
    const handleRefreshData = () => setIsFetching((prev) => !prev);

    const updateTypes = useMemo(() => {
        return {
            ADD : "Add",
            EDIT: "Edit"
        }
    }, [])

    useEffect(() => {
        axios
            .get(`${API_BASE_URL}/colours`)
            .then((res) => {
                let colours = [];
                if (res.data.code === 200) {
                    res.data.message.forEach(colour => {
                        colours.push({
                            id: colour.colour_id,
                            name: colour.name,
                            weight:colour.weight,
                            low_weight:colour.low_weight,
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
    }, [isFetching]);

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
                Cell: () => {
                    
                    return (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                flex: '1 1 auto',
                            }}
                        >
                            
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
                                Update
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [ renderUpdateForm]
    );


    const handleMessage = (icon, text) => {
        Swal.fire({
            icon: icon,
            text: text,
        });
    };

    const handleSubmitForm = () => {
        if (colour === '' || weight ==='') {
            handleMessage('error', 'Some of the required  values are missing')
            return false;
        }
        if(weight < 0) {
            handleMessage('error', 'Weight value can not be less than 0')
            return false;
        }

        let item = {
            change_weight: weight,
        }
        if(updateType === updateTypes.EDIT) {
            updatePowderColourInventory(item, colourId).then(res => {
                handleRefreshData()
                setIsUpdating(false)
                handleMessage('success', res.data.message)
            }).catch((err) => {
                handleMessage('error', err.response.data.message|| err.response.data.errors)
            })
        }
    }

    return (
        <>
            <div className={styles.headerContainer}>
                <PageTitle title='Powder Inventory' />
            </div>
            {isUpdating ? <div className={styles.updateFormContainer}>
                <Form>
                    <Form.Group className={styles.fieldItem}>
                        <Form.Label>Colour</Form.Label>
                        <Form.Control className={styles.fieldItemField} type="text" value = { colour } readOnly disabled onChange = { (event) => { setColour(event.target.value) } }
                            placeholder = "Colour"/>
                    </Form.Group>
                    <Form.Group className={styles.fieldItem}>
                        <Form.Label>Update Powder Used</Form.Label>
                        <Form.Control className={styles.fieldItemField} type="number" value = { weight } autoFocus onChange = { (event) => { setWeight(event.target.value) } }
                            placeholder = "Enter Powder Used in Kg.."/>
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
                    <span>No colours found.</span>
                </>
            )}
        </>
    );
};

export default PowderInventory;
