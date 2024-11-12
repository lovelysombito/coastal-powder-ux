import axios from 'axios';
import { DateTime } from 'luxon';
import { useEffect, useMemo, useState, useCallback, useContext, useRef } from 'react';
import {Form, Modal, Table } from 'react-bootstrap';
import { AiOutlineDown, AiOutlineRight } from 'react-icons/ai';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../../../constants';
import { downloadArchivePdf, sendEmailPdf, senEmailDealPackingSlip } from '../../../server';
import DataTable from '../../common/data-table';
import PageTitle from '../../common/page-title';
import styles from './index.module.css';
import { Oval } from 'react-loader-spinner';
import LineItemTableArchive from '../../common/lineitem_table_archive';
import Button from '../../common/button';
import { showAlert } from '../../../utils/utils';
import TablePagination from '../../common/pagination';
import { useBoolean } from '../../../hooks';
import MultipleFailedQCModal from '../quality-control/MultipleFailedQCModal';
import { webContext } from '../../../../src/context/websocket-context';

const Archive = () => {
    const { jobItem } = useContext(webContext);
    const [data, setData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPageUrl, setLastPageUrl] = useState();
    const [prevPageUrl, setPrevPageUrl] = useState();
    const [nextPageUrl, setNextPageUrl] = useState();
    const [firstPageUrl, setFirstPageUrl] = useState();
    const [pages, setPages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedData, setSelectedData] = useState({});
    const [modalData, setModalData] = useState(null);
    const [modalListHeaderIsCheck, setModalListHeaderIsCheck] = useState(false);
    const [isPrintSelected, setIsPrintSelected] = useState(false)
    const [isEmailSelected, setIsEmailSelected] = useState(false)
    const [buttonDisable, setButtonDisable] = useState(false)
    const handleIsPrint = () => setIsPrintSelected((prev) => !prev)
    const handleIsEmail = () => setIsEmailSelected((prev) => !prev)
    const [showFailedQCModal, setShowFailedQCModal] = useState(false);
    const sigCanvas = useRef({});
    const [refreshData, toggleRefreshData] = useBoolean(false);

    async function handleShowModal(deal)  {
        await handleGetPackingSlipData(deal.dealId)
        setIsEmailSelected(false)
        setIsPrintSelected(false)
        setSelectedData(deal);
        setShowModal(true)
    }

    const handleGetPackingSlipData = async (dealId) => {
        await axios.get(`${API_BASE_URL}/packing-slip/${dealId}`).then(res => {
            setModalData(res.data.data)
        }).catch(() => {
            setModalData([])
        })
    }

    const handleEmailSlip = useCallback(
        (dealId) => async (e) => {
            //stop for triggering the onlclick to a row
            e.stopPropagation();
            try {
                const res = await senEmailDealPackingSlip(null, dealId, null);
                handleMessage('success', res.data.msg);
            } catch (error) {
                console.error(error);
                handleMessage('success', error.response.data.message);
            }
        },
        []
    );

    const handleMessage = (icon, text) => {
        Swal.fire({
            icon: icon,
            html: text,
        });
    };

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
                Header: 'Deal Name',
                accessor: 'dealName',
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
                Header: ' ',
                Cell: ({ row }) => (
                    <Button onClick={() => handleShowModal(row.original)}>Packing Slip</Button>
                ),
            },
            {
                id:'test',
                Header: '',
                Cell: ({ row }) => (
                     <Button variant='danger' onClick={() => onFailedJob(row.original)}>
                         Failed QC
                     </Button>
                )
            },
        ],
        [handleEmailSlip]
    );

    useEffect(() => {
        getArchiveData(`${API_BASE_URL}/jobs/archive?page=${currentPage}`);
    }, [refreshData]);

    useEffect(() => {
        if (jobItem !== null && jobItem.message == 'dispatch') {
            getArchiveData(`${API_BASE_URL}/jobs/archive?page=${currentPage}`);
        }
    }, [jobItem])

    const getArchiveData = (url) => {
        axios
            .get(url)
            .then((res) => {
                if (res.data.data !== undefined) {
                    if (res.data.data.data !== undefined) {
                        let dispatchLists = res.data.data.data;
                        let arrayArchive = [];
                        dispatchLists.forEach((list) => {
                            let arrayLines = [];
                            list.lines?.forEach((line) => {
                                arrayLines.push({
                                    lineItem: line.line_item_id,
                                    line_item_status: line.line_item_status,
                                    colour: line.colour,
                                    material: line?.material,
                                    signature: line?.signature,
                                    customer_name: line?.customer_name,
                                    numberItemsCollected: line?.number_remaining,
                                    quantity: line.quantity,
                                    number: 0,
                                    userName: `${line.last_name}, ${line.first_name}`,
                                });
                            });

                            arrayArchive.push({
                                jobId: list.job_ids,
                                dealId: list.deal_id,
                                invoiceNumber: list.invoice_number ?? 'N/A',
                                dealName: list.deal_name ?? 'N/A',
                                status: list.job_status,
                                dueDate: list.promised_date,
                                clientName: list.client_name,
                                poNumber: list.po_number,
                                signature: list?.signature,
                                customer_name: list?.customer_name,
                                deliveryAddress: list.delivery_address,
                                dropOffZone: list.dropoff_zone,
                                data: arrayLines,
                                jobs: list.jobs
                            });
                        });

                        let pageItems = [];
                        for (let index = 0; index < res.data.data.last_page; index++) {
                            pageItems.push(index + 1);
                        }

                        setPages(pageItems);
                        setData(arrayArchive);
                        setCurrentPage(res.data.data.current_page);
                        setFirstPageUrl(res.data.data.first_page_url);
                        setNextPageUrl(res.data.data.next_page_url);
                        setPrevPageUrl(res.data.data.prev_page_url);
                        setLastPageUrl(res.data.data.last_page_url);
                        setIsLoading(false);
                    }else {
                        setData(res.data.data);
                    }
                    setIsLoading(false);
                }
            })
            .catch(() => {
                setData([]);
                setIsLoading(false);
            });
    };

    function handlePageChange(page) {
        return getArchiveData(`${API_BASE_URL}/jobs/archive?page=${page}`);
    }

    function handleFirst() {
        if (firstPageUrl !== null) return getArchiveData(firstPageUrl);
    }

    function handlePrev() {
        if (prevPageUrl !== null) return getArchiveData(prevPageUrl);
    }

    function handleNext() {
        if (nextPageUrl !== null) return getArchiveData(nextPageUrl);
    }

    function handleLast() {
        if (lastPageUrl !== null) return getArchiveData(lastPageUrl);
    }

    const ModalData = () => {
        const onSelect = (index, isChecked) => {
            const newModalData = [...modalData];
            newModalData[index].isSelected = isChecked;
            setModalData(newModalData);
        };

        const updateAll = (isSelected) => {
            const newModalData = [...modalData].map((el) => {
                return {
                    ...el,
                    isSelected: isSelected,
                };
            });
            setModalListHeaderIsCheck(isSelected);
            setModalData(newModalData);
        };

        return (
            <>
                <Table className={`${styles.modalTable} no-border`}>
                    <thead>
                        <tr>
                            <th>
                                <div>
                                    <Form.Check
                                        className={styles.modalDataCheck}
                                        type='checkbox'
                                        checked={modalListHeaderIsCheck}
                                        onChange={(event) => {
                                            updateAll(event.target.checked);
                                        }}
                                    />
                                </div>
                            </th>
                            <th>
                                <span>Name</span>
                            </th>
                            <th>
                                <Form.Check 
                                    type='checkbox'
                                    id='email'
                                    label='Email'
                                    onChange={handleIsEmail}
                                    checked={isEmailSelected}
                                    
                                />
                            </th>
                            <th>
                                <Form.Check 
                                    type='checkbox'
                                    id='print'
                                    label='Print'
                                    onChange={handleIsPrint}
                                    checked={isPrintSelected}
                                />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {modalData.map((el, idx) => {
                            return (
                                <tr key={idx}>
                                    <td>
                                        <Form.Check
                                            className={styles.modalDataCheck}
                                            type='checkbox'
                                            checked={el.isSelected}
                                            onChange={(event) => {
                                                onSelect(idx, event.target.checked);
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <span>{el.name}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </>
        );
    };

    const handleDownload = async (value) => {

        if (!isPrintSelected && !isEmailSelected)
            return showAlert('error', 'Please select email/print')

        if (value.find(value => value.isSelected == true) == undefined) {
            return showAlert('error', 'Please select at least one to print/email')
        }

        setButtonDisable(true)
        if (isPrintSelected) {
            for (let index = 0; index < value.length; index++) {
                if (value[index].isSelected) {
                    await downloadArchivePdf(value[index]).then(res => {
                        const url = window.URL.createObjectURL(new Blob([res.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        const fileName = `${DateTime.fromJSDate(new Date()).toFormat('HH:mm-dd-LL-yyyy')}-${value[index].name}.pdf`;
                        link.setAttribute('download', fileName);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }).catch((err) => {
                        console.log('err', err);
                    })
                }
            }
        }

        let emailSuccess = true
        if (isEmailSelected) {
            for (let index = 0; index < value.length; index++) {
                if (value[index].isSelected) {
                    if (isEmailSelected) {
                        await sendEmailPdf(value[index]).catch(() => {
                            emailSuccess = false
                        });
                    }
                }
            }

            showAlert(emailSuccess ? 'success' : 'error', emailSuccess ? 'Packing slip email sent' : 'Packing slip email failed')
        }
        
        setButtonDisable(false)
        setShowModal(false);
    }

    const onFailedJob = (data) => {
        setSelectedData(data);
        setShowFailedQCModal(true);
    }

    return (
        <>
            <PageTitle title='Archive' />
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
                                    <LineItemTableArchive data={data} />
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
                <span>No jobs available</span>
            )}

            <MultipleFailedQCModal
                showModal={showFailedQCModal}
                setShowModal={setShowFailedQCModal}
                selectedData={selectedData}
                setSelectedData={setSelectedData}
                sigCanvas={sigCanvas}
                handleRefreshData={toggleRefreshData}
            />

            <Modal show={showModal} onHide={() => setShowModal(false)} size='lg'>
                {selectedData ? (
                    <Modal.Body className={styles.modalContentContainer}>
                        <div className={styles.headerModal}>
                            <div className={styles.headerModalData}>
                                <span className={styles.headerModalInvoice}>{selectedData.invoiceNumber}</span>
                                <div className={styles.headerModalDetails}>
                                    <div className={styles.headerModalDetailsItem}>
                                        <span className={styles.headerModalDetailsLabel}>Promised date</span>
                                        <span>{DateTime.fromJSDate(new Date(selectedData.dueDate)).toFormat('dd-LL-yyyy')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.headerClientDetails}>
                                <span>{selectedData.clientName}</span>
                            </div>
                        </div>
                        <div className={styles.jobListModal}>
                            <ModalData data={selectedData.data} />
                        </div>
                    </Modal.Body>
                ) : (
                    ''
                )}
                <Modal.Footer>
                    <Button onClick={() => setShowModal(false)} colorVariant='dark'>
                        Cancel
                    </Button>
                    <Button onClick={() => handleDownload(modalData)} colorVariant='cyan' disabled={buttonDisable}>
                        OK
                    </Button>
                </Modal.Footer>
            </Modal>

            
        </>
    );
};

export default Archive;
