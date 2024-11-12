import axios from 'axios';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Form, Modal, Table } from 'react-bootstrap';
import { Oval } from 'react-loader-spinner';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../../constants';
import { useBoolean } from '../../../../hooks';
import { addNCRFailedOption, deleteNCRFailedOption, updateNCRFailedOption } from '../../../../server';
import { showAlert } from '../../../../utils/utils';
import Button from '../../../common/button';
import DataTable from '../../../common/data-table';
import PageTitle from '../../../common/page-title';
import TablePagination from '../../../common/pagination';
import styles from './index.module.css';
import { webContext } from '../../../../context/websocket-context';


const SettingsNCROption = () => {
    const { jobItem } = useContext(webContext);
    let navigate = useNavigate();
    const [data, setData] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [lastPageUrl, setLastPageUrl] = useState('');
    const [prevPageUrl, setPrevPageUrl] = useState('');
    const [nextPageUrl, setNextPageUrl] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [firstPageUrl, setFirstPageUrl] = useState('');
    const [pages, setPages] = useState([]);
    const [showModal, toggleModal] = useBoolean(false);
    const [editingOption, setEditingOption] = useState({});

    useEffect(() => {
        if (isFetching) {
            getNCROption(`${API_BASE_URL}/failed-options`);
        }
    }, [isFetching]);

    const getNCROption = (url) => {
        axios
            .get(url)
            .then((res) => {
                if (res.data.data.data !== undefined) {
                    const options = res.data.data.data.map(item => ({
                        id: item.ncr_failed_id,
                        name: item.ncr_failed,
                    }));
                    setData(options);
                    let pageItems = [];
                    for (let index = 0; index < res.data.data.last_page; index++) {
                        pageItems.push(index + 1);
                    }
                    setPages(pageItems);
                    setCurrentPage(res.data.data.current_page);
                    setFirstPageUrl(res.data.data.first_page_url);
                    setNextPageUrl(res.data.data.next_page_url);
                    setPrevPageUrl(res.data.data.prev_page_url);
                    setLastPageUrl(res.data.data.last_page_url);
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

    useEffect(() => {
        if (jobItem !== null && jobItem.message === 'ncr') {
            getNCROption(`${API_BASE_URL}/failed-options`);
        }
    }, [jobItem])

    const onEditOption = (item) => {
        setEditingOption(item);
        toggleModal();
    }

    const onAddOption = () => {
        setEditingOption({});
        toggleModal();
    }

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
                Header: 'NCR Failed',
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
            deleteNCRFailedOption(data[val].id)
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

    function handlePageChange(page) {
        return getNCROption(`${API_BASE_URL}/failed-options?page=${page}`);
    }

    function handleFirst() {
        if (firstPageUrl !== null) return getNCROption(firstPageUrl);
    }

    function handlePrev() {
        if (prevPageUrl !== null) return getNCROption(prevPageUrl);
    }

    function handleNext() {
        if (nextPageUrl !== null) return getNCROption(nextPageUrl);
    }

    function handleLast() {
        if (lastPageUrl !== null) return getNCROption(lastPageUrl);
    }

    const onSave = () => {
        if (!editingOption.name) {
            return showAlert('error', "Name cannot be empty/null");
        }

        const { id, name } = editingOption;

        let option = {
            ncr_failed: name,
        };

        if (id) {
            updateNCRFailedOption(option, id).then(res => {
                if (res.status === 200) {
                    showAlert('success', res.data.msg);
                    setIsFetching(true);
                    toggleModal();
                }
            })

            return 0
        } else {
            addNCRFailedOption(option).then(res =>{
                if (res.status === 200) {
                    showAlert('success', res.data.msg);
                    setIsFetching(true);
                    toggleModal();
                }
            })

            return 0
        }
    }

    return (
        <>
            <div className={styles.headerContainer}>
                <PageTitle title='NCR Failed Options' />
                <div className={styles.headerActions} hidden={!data}>
                    <Button onClick={handleRemoveSelected} colorVariant='red'>
                        REMOVE
                    </Button>
                    <Button onClick={onAddOption} colorVariant='dark'>
                        ADD OPTION
                    </Button>
                </div>
            </div>
            {isFetching && !data ? (
                <div className='loading-container'>
                    <Oval color='#fff' height={80} width={80} />
                </div>
            ) : data.length > 0 ? (
                <>
                    <div className={styles.contentContainer} hidden={data.length > 0 ? false : true}>
                        <DataTable columns={columns} data={data} />
                        <TablePagination
                            handlePageChange={handlePageChange}
                            handleFirst={handleFirst}
                            handlePrev={handlePrev}
                            handleNext={handleNext}
                            handleLast={handleLast}
                            pages={pages}
                            currentPage={currentPage}
                        />
                    </div>
                </>
            ) : (
                <div>
                    <div className={styles.contentContainer}>
                        <div className={styles.tableContainer}>
                            <Table className={`no-border ${styles.dataTable}`}>
                                <thead>
                                    <tr>
                                        <th>NCR Failed</th>

                                    </tr>

                                </thead>
                                <tbody></tbody>

                            </Table>

                        </div>
                    </div>
                </div>
            )}
                <Modal show={showModal} onHide={toggleModal} size='md'>
                    <Modal.Header>{Object.keys(editingOption).length === 0 ? 'Add Option' : 'Edit Option'}</Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group>
                                <Form.Label>NCR Failed</Form.Label>
                                <Form.Control className={styles.textField} type="text" value = { editingOption.name || '' } onChange = { (e) => setEditingOption({...editingOption, name: e.target.value}) }/>
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>                        
                        <Button variant='primary' onClick={onSave}>
                            Save
                        </Button>
                        <Button className='btn-dark' onClick={toggleModal}>
                            Cancel
                        </Button>
                    </Modal.Footer>
                </Modal>
        </>
    );
};

export default SettingsNCROption;
