import styles from './index.module.css';
import axios from 'axios';
import { useMemo, useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../constants';
import { AiOutlineDown, AiOutlineRight } from 'react-icons/ai';
import { numberWithCommas, showAlert } from '../../../utils/utils';
import PageTitle from '../../common/page-title';
import DataTable from '../../common/data-table';
import TablePagination from '../../common/pagination';
import LineItemtableNCR from '../../common/lineitem-table-ncr';
import { Form, Modal, Table } from 'react-bootstrap';
import Button from '../../common/button';
import { downloadImage, getJobRedirect } from '../../../server';
import { Oval } from 'react-loader-spinner';

const NCR = () => {
    const [data, setData] = useState([]);
    const [selectedData, setSelectedData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isGettingData, setIsGettingData] = useState(true);
    const handleRefreshData = () => setIsGettingData((prev) => !prev);
    const [lastPageUrl, setLastPageUrl] = useState('');
    const [prevPageUrl, setPrevPageUrl] = useState('');
    const [nextPageUrl, setNextPageUrl] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [firstPageUrl, setFirstPageUrl] = useState('');
    const [pages, setPages] = useState([]);
    const [modalData, setModalData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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
                Header: 'Amount',
                accessor: 'amount',
                Cell: ({ cell }) => {
                    return `$${numberWithCommas(cell.value)}`;
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
                isSortable: true,
                Header: 'Redone Job',
                accessor: '',
                id: 'click',
                Cell: ({ cell }) => {
                    const handleRedirect = (event, id) => {
                        event.stopPropagation();
                        getJobRedirect(id)
                            .then((res) => {
                                window.open(`/${res.data.redirect}?id=${id}&selected=true`);
                            })
                            .catch(() => {
                                showAlert('error', 'Invalid id/redirect path');
                            });
                    };
                    return (
                        <span
                            className={styles.redirect}
                            onClick={(event) => {
                                handleRedirect(event, cell.row.original.ncr.initial_job_id);
                            }}
                        >
                            {`ERROR | REDO ${cell.row.original.ncr.job_prefix}`}
                        </span>
                    );
                },
            },
            {
                isSortable: true,
                Header: 'Failed reason',
                accessor: '',
                Cell: ({cell}) => {
                    return cell.row.original.ncr.comments;
                },
            },
            {
                isSortable: true,
                Header: 'QC Tester',
                accessor: '',
                Cell: ({cell}) => {
                    return `${cell.row.original.ncr.firstname} ${cell.row.original.ncr.lastname}`;
                },
            },
        ],
        []
    );

    useEffect(() => {
        getData(`${API_BASE_URL}/ncr?page=${currentPage}`);
    }, [isGettingData]);

    const getData = (url) => {
        setIsLoading(true);
        axios
            .get(url)
            .then((res) => {
                if (res.data.data !== undefined) {
                    if (res.data.data.data !== undefined) {
                        let ncrDatas = res.data.data.data;
                        let arrayNCR = [];
                        ncrDatas.forEach((data) => {
                            arrayNCR.push({
                                jobId: data.job_id,
                                invoiceNumber: data.invoice_number,
                                deliveryAddress: data.delivery_address,
                                dropOffZone: data.dropoff_zone,
                                amount: data.amount,
                                dueDate: data.promised_date,
                                clientName: data.client_name,
                                poNumber: data.po_number,
                                signature: data?.signature,
                                data: data.lines,
                                ncr: data.ncr,
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

                        setData(arrayNCR);
                        setIsLoading(false);
                    } else {
                        setIsLoading(false);
                        setData(res.data.data);
                    }
                }
            })
            .catch((err) => {
                console.log('err', err);
            });
    };

    function handlePageChange(e) {
        return getData(`${API_BASE_URL}/qc?page=${e}`);
    }

    function handleFirst() {
        if (firstPageUrl !== null) return getData(firstPageUrl);
    }

    function handlePrev() {
        if (prevPageUrl !== null) return getData(prevPageUrl);
    }

    function handleNext() {
        handleRefreshData();
        if (nextPageUrl !== null) return getData(nextPageUrl);
    }

    function handleLast() {
        if (lastPageUrl !== null) return getData(lastPageUrl);
    }

    function showDataInModal(data) {
        setSelectedData(data);
        setModalData(data.data);
        setShowModal(true);
        return;
    }

    const ModalData = () => {
        return (
            <>
                <Table className={`${styles.modalTable} no-border`}>
                    <thead>
                        <tr>
                            <th>
                                <span>LINE ITEM</span>
                            </th>
                            <th>
                                <span>QUANTITY</span>
                            </th>
                            <th>
                                <span>REMAINING</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {modalData.map((el, idx) => {
                            return (
                                <tr key={idx}>
                                    <td>
                                        <span>{el.product_name}</span>
                                    </td>
                                    <td>
                                        <span>{el.quantity}</span>
                                    </td>
                                    <td>
                                        <span>{el.number_remaining}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </>
        );
    };

    const handleDownload = async () => {
        downloadImage(null, selectedData.ncr.ncr_id, null)
            .then((res) => {
                let url = window.URL.createObjectURL(new Blob([res.data], { type: 'image/jpeg' }));
                let a = document.createElement('a');
                a.href = url;
                a.download = `${selectedData.invoiceNumber}.jpeg`;
                a.click();
            })
            .catch((err) => {
                console.log('err', err);
            });
    };

    return (
        <>
            <PageTitle title='NCR' />
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
                            onRowClick={(data) => showDataInModal(data.original)}
                            ExpandedComponent={({ data }) => {
                                return <LineItemtableNCR data={data} handleRefreshData={() => {}} />;
                            }}
                        />
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
                <span>No quality control jobs found.</span>
            )}

            <Modal show={showModal} onHide={() => setShowModal(false)} size='lg'>
                {selectedData ? (
                    <Modal.Body className={styles.modalContentContainer}>
                        <div className={styles.headerModal}>
                            <div className={styles.headerModalData}>
                                <span className={styles.headerModalInvoice}>{selectedData.invoiceNumber}</span>
                                <div className={styles.headerModalDetails}>
                                    <div className={styles.headerModalDetailsItem}>
                                        <span className={styles.headerModalDetailsLabel}>Delivery Address</span>
                                        <span>{selectedData.deliveryAddress}</span>
                                    </div>
                                    <div className={styles.headerModalDetailsItem}>
                                        <span className={styles.headerModalDetailsLabel}>Drop Off Zone</span>
                                        <span>{selectedData.dropOffZone}</span>
                                    </div>
                                    <div className={styles.headerModalDetailsItem}>
                                        <span className={styles.headerModalDetailsLabel}>Promised date</span>
                                        <span>{selectedData.dueDate}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.headerModalStatus}>
                                <span>{selectedData.clientName}</span>
                            </div>
                        </div>
                        <div className={styles.jobListModal}>
                            <ModalData data={selectedData.data} />
                        </div>

                        <div className={styles.labelModal}>
                            <span>Comments :</span>
                        </div>

                        <Form.Group>
                            <Form.Control
                                className={styles.textAreaField}
                                as='textarea'
                                placeholder='Provide the details'
                                value={selectedData.ncr.comments}
                                contentEditable={false}
                            />
                        </Form.Group>

                        <div className={styles.labelModal}>
                            <img
                                src={selectedData.ncr.photo}
                                alt='Photo'
                                style={{
                                    display: 'block',
                                    margin: '10px auto',
                                    border: '1px solid black',
                                    width: '300px',
                                    height: '200px',
                                }}
                            />
                        </div>
                    </Modal.Body>
                ) : (
                    ''
                )}
                <Modal.Footer>
                    <Button onClick={handleDownload} colorVariant='cyan'>
                        Download
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default NCR;
