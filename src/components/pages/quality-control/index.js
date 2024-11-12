import { Modal, Dropdown } from 'react-bootstrap';
import styles from './index.module.css';
import DataTable from '../../common/data-table';
import { useMemo, useState, useEffect, useRef, useCallback, useContext } from 'react';
import { AiOutlineDown, AiOutlineRight } from 'react-icons/ai';
import PageTitle from '../../common/page-title';
import Button from '../../common/button';
import axios from 'axios';
import { API_BASE_URL } from '../../../constants';
import TablePagination from '../../common/pagination';
import { updateQCJob } from '../../../server';
import SignatureCanvas from 'react-signature-canvas';
import { handleGetBayValues, handleGetBayJobStatus, handleGetBayDates, numberWithCommas, showAlert, dataUrlToFile } from '../../../utils/utils';
import LineItemTableQC from '../../common/lineitem-table-qc';
import { DateTime } from 'luxon';
import { Oval } from 'react-loader-spinner';
import FailedQCModal from './FailedQCModal';
import { webContext } from '../../../../src/context/websocket-context';

const QualityControl = () => {
    const { jobItem } = useContext(webContext);
    const [showModal, setShowModal] = useState(false);
    const [showPassedModal, setShowPassedModal] = useState(false);
    const [jobPassedDetails, setJobPassedDetails] = useState('');
    const [data, setData] = useState([]);
    const [selectedData, setSelectedData] = useState([]);
    const [isGettingData, setIsGettingData] = useState(true);
    const [lastPageUrl, setLastPageUrl] = useState('');
    const [prevPageUrl, setPrevPageUrl] = useState('');
    const [nextPageUrl, setNextPageUrl] = useState('');
    const [currentPage, setCurrentPage] = useState('');
    const [firstPageUrl, setFirstPageUrl] = useState('');
    const [pages, setPages] = useState([]);
    const handleRefreshData = () => setIsGettingData((prev) => !prev);
    const sigCanvas = useRef({});
    const [isLoading, setIsLoading] = useState(true);

    const getTableData = useCallback((url) => {
        axios
            .get(url)
            .then((res) => {
                if (res.data.data !== undefined) {
                    if (res.data.data.data !== undefined) {
                        let qcDatas = res.data.data.data;
                        let arrayQC = [];
                        qcDatas.forEach((data) => {
                            let arrayLines = [];
                            data.lines?.forEach((line) => {
                                arrayLines.push({
                                    id: line.line_item_id,
                                    lineItem: line.product_name,
                                    sku: line.SKU,
                                    colour: line.colour_name,
                                    material: line.material,
                                    signature: line?.signature,
                                    numberItemsCollected: line.quantity - line.number_dispatched,
                                    line_item_status: line.line_item_status,
                                    quantity: line.quantity,
                                });
                            });

                            let qcStatus = undefined;

                            arrayQC.push({
                                jobId: data.job_id,
                                invoiceNumber: data.invoice_number,
                                status: data.job_status,
                                amount: data.amount,
                                dueDate: data.promised_date,
                                clientName: data.client_name,
                                poNumber: data.po_number,
                                signature: data?.signature,
                                qcStatus: qcStatus,
                                data: arrayLines,
                                bayDates: handleGetBayDates(data),
                                bays: handleGetBayValues(data),
                                bayStatus: handleGetBayJobStatus(data),
                                material: data.material,
                                process: data.process,
                            });
                        });

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

                        setData(arrayQC);
                    } else {
                        setData(res.data.data);
                    }
                    setIsLoading(false);
                }
            })
            .catch((err) => {
                setIsLoading(false);
                showAlert('error', err);
            });
    }, []);
    
    
    useEffect(() => {
        getTableData(`${API_BASE_URL}/qc/pending`);
    }, [isGettingData, getTableData]);

    useEffect(() => {
        if (jobItem !== null && jobItem.message == 'qc') {
            getTableData(`${API_BASE_URL}/qc`);
        }
    }, [jobItem]);

    const columns = useMemo(
        () => [
            {
                id: 'expander',
                style: { width: 50 },
                Header: () => <span></span>,
                Cell: ({ row }) => (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flex: '1 1 auto',
                        }}
                    >
                        <span {...row.getToggleRowExpandedProps()}>{row.isExpanded ? <AiOutlineDown /> : <AiOutlineRight />}</span>
                    </div>
                ),
            },
            {
                isSortable: true,
                Header: 'Invoice Number',
                accessor: 'invoiceNumber',
            },
            {
                isSortable: true,
                Header: 'Status',
                accessor: 'status',
                Cell: ({ data, row }) => {
                    const statusColors = {
                        blue: '#ccf1ff',
                        green: '#a6ebda',
                        orange: '#fadbcc',
                    };

                    const status = data[row.id].status;
                    let bgColor = statusColors.green;

                    if (status === 'Ready for scheduling') {
                        bgColor = statusColors.blue;
                    } else if (status === 'Scheduled') {
                        bgColor = statusColors.green;
                    } else if (status === 'Waiting') {
                        bgColor = statusColors.orange;
                    } else {
                        bgColor = statusColors.orange;
                    }

                    return (
                        <div style={{ backgroundColor: bgColor }} className={styles.statusWrapper}>
                            <span>{status}</span>
                        </div>
                    );
                },
            },
            {
                isSortable: true,
                Header: 'Amount',
                accessor: 'amount',
                Cell: ({ cell }) => {
                    return `$${numberWithCommas(cell.value)}`;
                },
            },
            {
                isSortable: true,
                Header: 'Due Date',
                accessor: 'dueDate',
                Cell: (cell) => {
                    return DateTime.fromJSDate(new Date(cell.value)).toFormat('dd-LL-yyyy');
                },
            },
            {
                isSortable: true,
                Header: 'Client Name',
                accessor: 'clientName',
            },
            {
                isSortable: true,
                Header: 'PO Number',
                accessor: 'poNumber',
            },
            {
                Header: 'Quality check status',
                accessor: 'qcStatus',
                Cell: ({ data, row }) => {
                    const statusColors = {
                        green: '#03c895',
                        red: '#fc4f4d',
                    };

                    const index = row.id;
                    let qcStatus = data[row.id].qcStatus;

                    if (qcStatus !== undefined) qcStatus = qcStatus[0].toUpperCase() + qcStatus.slice(1).toLowerCase();

                    let color = statusColors.green;

                    if (qcStatus === 'Passed') {
                        color = statusColors.green;
                    } else {
                        color = statusColors.red;
                    }

                    const onSelectQcStatus = (index, selected) => {
                        const newData = [...data];
                        if (selected === 'Passed') {
                            setShowPassedModal(true);
                        } else {
                            setShowModal(true);
                        }
                        setSelectedData(newData[index]);
                        setData(newData);
                    };

                    return (
                        <div className={styles.qcStatusCell}>
                            <div className={styles.qcStatusDropdownContainer}>
                                <span style={{ color: color }}>{qcStatus}</span>
                                <Dropdown className={styles.qcStatusDropdown} align='end'>
                                    <Dropdown.Toggle variant='success'>
                                        {' '}
                                        <AiOutlineDown />
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className={styles.qcStatusDropdownMenu}>
                                        <Dropdown.Item onClick={() => onSelectQcStatus(index, 'Passed')}>Passed</Dropdown.Item>
                                        <Dropdown.Item onClick={() => onSelectQcStatus(index, 'Failed')}>Failed</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                        </div>
                    );
                },
            },
        ],
        []
    );

    function handlePageChange(e) {
        return getTableData(`${API_BASE_URL}/qc?page=${e}`);
    }

    function handleFirst() {
        if (firstPageUrl !== null) return getTableData(firstPageUrl);
    }

    function handlePrev() {
        if (prevPageUrl !== null) return getTableData(prevPageUrl);
    }

    function handleNext() {
        if (nextPageUrl !== null) return getTableData(nextPageUrl);
    }

    function handleLast() {
        if (lastPageUrl !== null) return getTableData(lastPageUrl);
    }

    const handlePassedStatus = () => {
        let img = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        let imgFile = dataUrlToFile(img, selectedData.invoiceNumber);

        if (sigCanvas.current.isEmpty()) {
            return showAlert('error', 'Signature is empty');
        }

        const formData = new FormData();
        formData.append('signature', imgFile, `${selectedData.invoiceNumber}.png`);
        formData.append('qc_comment', jobPassedDetails);
        formData.append('qc_status', 'passed');
        updateQCJob(formData, selectedData.jobId, { header: { 'Content-Type': 'multipart/form-data' } })
            .then((res) => {
                showAlert('success', res.data.message);
                setJobPassedDetails('');
                setShowPassedModal(false);
            })
            .catch((err) => {
                showAlert('error', err.response.data.errors);
            });

        handleRefreshData();
    };

    return (
        <>
            <Modal show={showPassedModal} onHide={() => setShowPassedModal(false)} size='md'>
                <Modal.Body className={styles.modalContentContainer}>
                    <div className={styles.headerLabelModal}>
                        <span>You selected "QC Passed" for a job.</span>
                    </div>
                    <div className={styles.jobIdModal}>
                        <span>Job: {selectedData.invoiceNumber}</span>
                    </div>

                    <div className={styles.signatureContainerModal}>
                        <SignatureCanvas penColor='black' canvasProps={{ className: styles.signatureModal }} ref={sigCanvas} />
                    </div>
                    <div className={styles.buttonModal}>
                        <Button colorVariant='cyan' onClick={handlePassedStatus}>
                            Submit
                        </Button>
                    </div>
                    <div hidden={selectedData.status === 'Complete' ? true : false}></div>
                </Modal.Body>
            </Modal>

            <PageTitle title='Quality Control' />
            {isLoading ? (
                <div className='loading-container'>
                    <Oval color='#fff' height={80} width={80} />
                </div>
            ) : data.length > 0 ? (
                <>
                    <div className={styles.contentContainer}>
                        <DataTable
                            columns={columns}
                            data={data}
                            expandedRowStyle={{ padding: '0px', paddingLeft: '50px' }}
                            ExpandedComponent={({ data }) => {
                                return (
                                    <LineItemTableQC data={data} handleRefreshData={() => {}} />
                                );
                            }}
                        />
                    </div>
                    <TablePagination
                        handlePageChange={handlePageChange}
                        handleFirst={handleFirst}
                        handlePrev={handlePrev}
                        handleNext={handleNext}
                        handleLast={handleLast}
                        pages={pages}
                        currentPage={currentPage}
                    />
                </>
            ) : (
                <span>No quality control jobs found.</span>
            )}

            <FailedQCModal
                showModal={showModal}
                setShowModal={setShowModal}
                selectedData={selectedData}
                setSelectedData={setSelectedData}
                sigCanvas={sigCanvas}
                handleRefreshData={handleRefreshData}
            />
        </>
    );
};

export default QualityControl;
