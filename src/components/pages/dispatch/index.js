import styles from './index.module.css';
import DataTable from '../../common/data-table';
import { useEffect, useMemo, useRef, useState, useCallback, useContext } from 'react';
import { AiOutlineDown, AiOutlineRight } from 'react-icons/ai';
import { Modal, Form, Table } from 'react-bootstrap';
import SignatureCanvas from 'react-signature-canvas';
import PageTitle from '../../common/page-title';
import Button from '../../common/button';
import axios from 'axios';
import { API_BASE_URL } from '../../../constants';
import { printDealPackingSlip, senEmailDealPackingSlip, updateBulkLineDispatch, updateJobDispatch } from '../../../server';
import Swal from 'sweetalert2';
// import Pagination from 'react-bootstrap/Pagination';
import LineItemTableDispatch from '../../common/lineitem-table-dispatch';
import { DateTime } from 'luxon';
import { Oval } from  'react-loader-spinner';
import MultipleFailedQCModal from '../quality-control/MultipleFailedQCModal';
import { useBoolean } from '../../../hooks';
import { webContext } from '../../../../src/context/websocket-context';
import TablePagination from '../../common/pagination';

const Dispatch = () => {
    const { jobItem } = useContext(webContext);
    const [showModal, setShowModal] = useState(false);
    const [selectedData, setSelectedData] = useState({});
    const [isGettingData, setIsGettingData] = useState(false);
    const [data, setData] = useState([]);
    const [modalData, setModalData] = useState([]);
    const sigCanvas = useRef({});
    const [error, setError] = useState([]);
    const [showMessage, setShowMessage] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [modalListHeaderIsCheck, setModalListHeaderIsCheck] = useState(false);
    const [currentPage, setCurrentPage] = useState();
    const [lastPageUrl, setLastPageUrl] = useState();
    const [prevPageUrl, setPrevPageUrl] = useState();
    const [nextPageUrl, setNextPageUrl] = useState();
    const [firstPageUrl, setFirstPageUrl] = useState();
    const [pages, setPages] = useState([]);
    const [showPackingSlipModal, setShowPackingSlipModal] = useState(false);
    const [printPackingSlip, setPrintPackingSlip] = useState(false);
    const [sendEmailPackingSlip, setSendEmailPackingSlip] = useState(false);
    const [currentFocus, setCurrentFocus] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [pdfPath, setPdfPath] = useState('')
    const [pdfSignature, setPdfSignature] = useState('')
    const [showFailedQCModal, setShowFailedQCModal] = useState(false);
    const [refreshData, toggleRefreshData] = useBoolean(false);

    const handlePackingSlip = async () => {
        let lineItemsArray = []
        if (modalData.length > 0) {
            for (let index = 0; index < modalData.length; index++) {
                if (modalData[index].isSelected) {
                    if (modalData[index].number > 0) {
                        lineItemsArray.push(modalData[index])
                    }
            }
        }
        }

        if (printPackingSlip) {
            printDealPackingSlip({ lineItems: JSON.stringify(lineItemsArray), signature: pdfSignature, customer_name: customerName, customer_email: customerEmail }, selectedData.dealId, null)
                .then((res) => {
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    const fileName = `${DateTime.fromJSDate(new Date()).toFormat('HH:mm-dd-LL-yyyy')}-${selectedData.dealName}.pdf`;
                    link.setAttribute('download', fileName);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                })
                .catch((err) => {
                    console.error(err);
                    handleMessage('error', err.response.data.message);
                });
        }

        if (sendEmailPackingSlip) {
            try {
                const res = await senEmailDealPackingSlip({ pdf_path: pdfPath, customer_email: customerEmail }, selectedData.dealId, null)
                handleMessage('success', res.data.msg);
            } catch (error) {
                console.error(error);
                handleMessage('success', error.response.data.message);
            }
        }

        setShowPackingSlipModal(false);
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
                isSortable: true,
                Header: 'Account Hold',
                accessor: 'accHold',
                Cell: (cell) => {
                    let backgroundColor = 'white'
                    if (cell.value !== null) {
                        if (cell.value.toLowerCase() === 'overdue') {backgroundColor = 'red'}
                        if (cell.value.toLowerCase() === 'awaiting payment') {backgroundColor = 'yellow'}
                        if (cell.value.toLowerCase() === 'paid') {backgroundColor = 'green'}
                        if (cell.value.toLowerCase() === 'draft') {backgroundColor = 'grey'}
                    }
                    
                    return <span style={{backgroundColor: backgroundColor, width: '100%', textAlign: 'center'}}>{cell.value}</span>
                }
            },
            {
                id:'dispatch',
                Cell: (cell) => {
                    return <Button onClick={() => {showDataInModal(cell.row.original)}} colorVariant='cyan'>Dispatch</Button>
                }
            },
            {
                id:'Failed QC',
                Cell: (cell) => {
                    return <Button onClick={() => {onFailedJob(cell.row.original)}} colorVariant='red'>Failed QC</Button>
                }
            }
        ],
        []
    );

    useEffect(() => {
        if (showMessage) {
            if (error.length <= 0) {
                handleMessage('success', 'Job successfully dispatch');
                setShowMessage(false);
                return;
            }

            let errorString = '';
            for (let index = 0; index < error.length; index++) {
                errorString = errorString + '<br>' + error[index];
            }
            handleMessage('error', errorString);
            setShowMessage(false);
            return;
        }
    }, [error, showMessage]);

    const getDispatchData = useCallback((url) => {
        axios
            .get(url)
            .then((res) => {
                if (res.data.data !== undefined) {
                    if (res.data.data.data !== undefined) {
                        let dispatchLists = res.data.data.data;
                        let arrayDispatch = [];
                        dispatchLists.forEach((list) => {
                            let arrayLines = [];
                            list.lines?.forEach((line) => {
                                arrayLines.push({
                                    lineItem: line.line_item_id,
                                    product: line.line_product,
                                    colour: line.colour,
                                    material: line?.material,
                                    signature: line?.signature,
                                    customer_name: line?.customer_name,
                                    numberItemsCollected: line?.number_remaining,
                                    quantity: line.quantity,
                                    number: line?.number_remaining,
                                    line_item_status: line.line_item_status,
                                    name: line.name,
                                    description: line.description,
                                    uom: line.measurement
                                })
                            });

                            arrayDispatch.push({
                                jobId: list.job_ids,
                                dealId: list.deal_id,
                                invoiceNumber: list.invoice_number,
                                dealName: list.deal_name ?? 'N/A',
                                status: list.job_status,
                                dueDate: list.promised_date,
                                clientName: list.client_name,
                                poNumber: list.po_number,
                                signature: list?.signature,
                                customer_name: list?.customer_name,
                                deliveryAddress: list.delivery_address,
                                dropOffZone: list.dropoff_zone,
                                name: list.name,
                                email: list.email,
                                accHold: list.account_hold,
                                data: arrayLines,
                                jobs: list.jobs
                            });
                        });

                        let pageItems = [];
                        for (let index = 0; index < res.data.data.last_page; index++) {
                            pageItems.push(index + 1);
                        }

                        setPages(pageItems);
                        setData(arrayDispatch);
                        setCurrentPage(res.data.data.current_page);
                        setFirstPageUrl(res.data.data.first_page_url);
                        setNextPageUrl(res.data.data.next_page_url);
                        setPrevPageUrl(res.data.data.prev_page_url);
                        setLastPageUrl(res.data.data.last_page_url);
                    } else {
                        setData(res.data.data);
                    }
                    setIsLoading(false);
                }
            })
            .catch((err) => {
                setIsLoading(false);
                handleMessage('error', err);
            });
    }, []);

    useEffect(() => {
        setShowModal(false)
        getDispatchData(`${API_BASE_URL}/jobs/dispatch?page=${currentPage}`);
    }, [isGettingData, getDispatchData, refreshData]);

    useEffect(() => {
        if (jobItem !== null && jobItem.message == 'dispatch') {
            getDispatchData(`${API_BASE_URL}/jobs/dispatch?page=${currentPage}`);
        }
    }, [jobItem]);

    const showDataInModal = (data) => {
        console.log('data', data);
        setCustomerName(data.name)
        setCustomerEmail(data.email)
        setSelectedData(data);
        setModalData(data.data);
        setModalListHeaderIsCheck(false);
        setShowModal(true);
    };

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

        const NumberInput = ({ idx }) => {
            const handleInputChange = (e) => {
                let count = modalData[idx].number;
                if (e.target.value > modalData[idx].numberItemsCollected) {
                    count = modalData[idx].numberItemsCollected;
                    handleMessage('error', `Cannot exceed ${modalData[idx].numberItemsCollected}`);
                } else {
                    count = e.target.value;
                }

                let tempData = [...modalData];
                let tempElement = { ...tempData[idx] };
                tempElement.number = count;
                tempData[idx] = tempElement;
                setModalData(tempData);
            };

            function handleNumberIncrement(number, number_collected) {
                let count = parseInt(number) + 1;
                if (count > number_collected) return handleMessage(`error`, `Cannot exceed to ${number_collected}`);

                let tempData = [...modalData];
                let tempElement = { ...tempData[idx] };
                tempElement.number = count;
                tempData[idx] = tempElement;
                setModalData(tempData);
            }

            function handleNumberDecrement(number) {
                let count = parseInt(number) - 1;
                if (count <= 0) return handleMessage(`error`, `Invalid number`);

                let tempData = [...modalData];
                let tempElement = { ...tempData[idx] };
                tempElement.number = count;
                tempData[idx] = tempElement;
                setModalData(tempData);
            }
            return (
                <>
                    <span
                        className={styles.inputNumberDecrement}
                        onClick={() => {
                            handleNumberDecrement(modalData[idx].number);
                        }}
                    >
                        –
                    </span>
                    <input
                        onFocus={() => setCurrentFocus(idx)}
                        autoFocus={currentFocus == idx}
                        id={idx}
                        className={styles.inputNumber}
                        type='number'
                        value={modalData[idx].number}
                        onChange={(e) => {
                            handleInputChange(e);
                        }}
                    ></input>
                    <span
                        className={styles.inputNumberDecrement}
                        onClick={() => {
                            handleNumberIncrement(modalData[idx].number, modalData[idx].numberItemsCollected);
                        }}
                    >
                        +
                    </span>
                </>
            );
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
                                <span>Product</span>
                            </th>
                            <th>
                                <span>Description</span>
                            </th>
                            <th>
                                <span>UOM</span>
                            </th>
                            <th>
                                <span>Quantity</span>
                            </th>
                            <th>
                                <span>Remaining</span>
                            </th>
                            <th className={styles.numberHeaderModal}>
                                <span>Amount</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {modalData.map((el, idx) => {
                            if (el.numberItemsCollected > 0) {
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
                                            <span>{(el.name !== undefined && el.name !== null) ? el.name : 'N/A'}</span>

                                        </td>
                                        <td>
                                            <span>{el.description}</span>
                                        </td>
                                        
                                        <td>
                                            <span>{el.uom}</span>
                                        </td>
                                        <td>
                                            <span>{el.quantity}</span>
                                        </td>
                                        <td>
                                            <span>{el.numberItemsCollected}</span>
                                        </td>
                                        <td style={{ width: 160 }}>
                                            <NumberInput idx={idx} />
                                        </td>
                                    </tr>
                                );
                            }
                            
                        })}
                    </tbody>
                </Table>
            </>
        );
    };

    const handleDispatch = async () => {
        let img = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        let imgFile = dataUrlToFile(img, selectedData.invoiceNumber);

        if (sigCanvas.current.isEmpty()) {
            return handleMessage('error', 'Signature is empty');
        }

        if (customerName.length === 0) {
            return handleMessage('error', 'Customer name is required');
        }

        if (customerEmail.length === 0) {
            return handleMessage('error', 'Customer email is required');
        }

        for (let index = 0; index < modalData.length; index++) {
            if (modalData[index].isSelected === true) {
                if (modalData[index].numberItemsCollected > 0) {
                    if (modalData[index].number <= 0) {
                        return handleMessage('error', 'The number items collected must be at least 1');
                    }
                }

            }
        }

        if (modalData.find(element => element.isSelected == true) == undefined)
            return handleMessage('error', 'Select at least one line item to proceed');

        const status = checkDispatchStatus()

        await handleDispatchJob(imgFile, status);
        await handleDispatchLine(imgFile, status);
        setShowMessage(true);
        setShowModal(false);
        setIsGettingData(!isGettingData);

        //show packing slip modal
        setShowPackingSlipModal(true);
    };

    const checkDispatchStatus = () => {
        let status = 'fully_dispatched'
        for (let index = 0; index < modalData.length; index++) {
            if(modalData[index].isSelected) {
                if (modalData[index].numberItemsCollected == modalData[index].number) {
                    continue
                } else {
                    status = 'partially_dispatched'
                    break
                }       
            } else {
                if (modalData[index].numberItemsCollected <= 0) {
                    continue
                } else {
                    status = 'partially_dispatched'
                    break
                }
            }
        }

        return status

    }

    const dataUrlToFile = (data_url, file_name) => {
        var arr = data_url.split(','),
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]),
            n = bstr.length,
            u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], file_name, { type: mime });
    };

    const handleDispatchJob = async (img, status) => {
        try {
            selectedData.jobId.forEach(async (jobId) => {
                const formData = new FormData();
                formData.append('signature', img, `${selectedData.invoiceNumber}.png`);
                formData.append('dispatch_status', 1);
                formData.append('customer_name', customerName);
                formData.append('customer_email', customerEmail);
                formData.append('status', status);
                await updateJobDispatch(formData, jobId, { header: { 'Content-Type': 'multipart/form-data' } });
            });
        } catch (error) {
            setError((prevState) => [
                ...prevState,
                `${error.response.data.errors}-Job-${selectedData.invoiceNumber}`,
            ]);
            return;
        }
    };

    const handleDispatchLine = async (img, status) => {
        let dispatchBulk = []
        if (modalData.length > 0) {
            if (status === 'fully_dispatched') {
                for (let index = 0; index < modalData.length; index++) {
                    if (modalData[index].number > 0) {
                        dispatchBulk.push({
                            number_items_collected: modalData[index].number,
                            id: modalData[index].lineItem,
                            name: modalData[index].name,
                            number: modalData[index].number,
                        })
                    }
                }
            } else {
                for (let index = 0; index < modalData.length; index++) {
                    if (modalData[index].isSelected) {
                        if (modalData[index].number > 0) {
                            dispatchBulk.push({
                                number_items_collected: modalData[index].number,
                                id: modalData[index].lineItem,
                                name: modalData[index].name,
                                number: modalData[index].number,
                            })
                        }
                    }
                }
            }

            try {
                const formData = new FormData();
                formData.append('signature', img, `${selectedData.invoiceNumber}-${selectedData.dealName}.png`);
                formData.append('dispatch_status', 1);
                formData.append('customer_name', customerName);
                formData.append('customer_email', customerEmail);
                formData.append('status', status);
                formData.append('line_items', JSON.stringify(dispatchBulk))
                formData.append('deal_id', selectedData.dealId)
                await updateBulkLineDispatch(formData, { header: { 'Content-Type': 'multipart/form-data' } }).then(res => {
                    setPdfPath(res.data.fileName)
                    setPdfSignature(res.data.signature)
                });
            } catch (error) {
                setError((prevState) => [
                    ...prevState,
                    `${error.response.data.errors}`,
                ]);
                return;
            }
        }
    };

    const handleMessage = (icon, text) => {
        Swal.fire({
            icon: icon,
            html: text,
        }).then(() => {
            setError([]);
            return;
        });
    };

    function handlePageChange(page) {
        return getDispatchData(`${API_BASE_URL}/jobs/dispatch?page=${page}`);
    }

    function handleFirst() {
        if (firstPageUrl !== null) return getDispatchData(firstPageUrl);
    }

    function handlePrev() {
        if (prevPageUrl !== null) return getDispatchData(prevPageUrl);
    }

    function handleNext() {
        if (nextPageUrl !== null) return getDispatchData(nextPageUrl);
    }

    function handleLast() {
        if (lastPageUrl !== null) return getDispatchData(lastPageUrl);
    }

    const onFailedJob = async (data) => {
        setCustomerName(data.name)
        setCustomerEmail(data.email)
        setSelectedData(data);
        setModalData(data.data);
        setShowFailedQCModal(true);
    }


    return (
        <>
            <Modal show={showPackingSlipModal} onHide={() => setShowPackingSlipModal(false)}>
                <Modal.Header closeButton>What do you want to do with the Packing Slip?</Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Check
                            type='checkbox'
                            checked={sendEmailPackingSlip}
                            onChange={(e) => {
                                setSendEmailPackingSlip(e.target.checked);
                            }}
                            label={'Send email'}
                        />
                        <Form.Check
                            className={styles.modalDataCheck}
                            type='checkbox'
                            checked={printPackingSlip}
                            onChange={(e) => {
                                setPrintPackingSlip(e.target.checked);
                            }}
                            label={'Print'}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button colorVariant='primary' onClick={handlePackingSlip}>
                        Ok
                    </Button>
                </Modal.Footer>
            </Modal>
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
                                        <span>{DateTime.fromJSDate(new Date(selectedData.dueDate)).toFormat('dd-LL-yyyy')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.headerClientDetails}>
                                <span>{selectedData.clientName}</span>
                                <span style={{textAlign: 'end'}}>PO Number: {selectedData.poNumber}</span>

                            </div>
                        </div>
                        <div className={styles.jobListModal}>
                            <ModalData data={selectedData.data} />
                        </div>
                        {selectedData.status !== 'Complete' ? (
                            <>
                                <div className={styles.signatureContainerModal}>
                                    <SignatureCanvas penColor='black' canvasProps={{ className: styles.signatureModal }} ref={sigCanvas} />
                                </div>
                                <div className='input-group mt-2'>
                                    <span className='input-group-text'>Customer Name:</span>
                                    <input className='form-control' defaultValue={customerName} onBlur={(e) => setCustomerName(e.target.value)}/>
                                </div>

                                <div className='input-group mt-2'>
                                    <span className='input-group-text'>Customer Email:</span>
                                    <input className='form-control' defaultValue={ customerEmail } onBlur={(e) => setCustomerEmail(e.target.value)} />
                                </div>
                            </>
                        ) : (
                            <>
                                <img
                                    src={+selectedData.signature}
                                    alt='Signature'
                                    style={{
                                        display: 'block',
                                        margin: '0 auto',
                                        border: '1px solid black',
                                        width: '150px',
                                    }}
                                />
                                <span
                                    style={{
                                        display: 'block',
                                        margin: '0 auto',
                                        width: '150px',
                                        textAlign: 'center',
                                    }}
                                >
                                    {selectedData.customer_name}
                                </span>
                            </>
                        )}
                    </Modal.Body>
                ) : (
                    ''
                )}

                <Modal.Footer>
                    <Button onClick={() => setShowModal(false)} colorVariant='dark'>
                        Cancel
                    </Button>
                    {/* <Button variant='danger' onClick={onFailedJob}>
                        Failed QC
                    </Button> */}
                    <Button onClick={handleDispatch} colorVariant='cyan'>
                        Dispatch
                    </Button>
                </Modal.Footer>
            </Modal>
            <PageTitle title='Dispatch' />
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
                            // onRowClick={(data) => showDataInModal(data.original)}
                            ExpandedComponent={({ data }) => {
                                return (
                                    <LineItemTableDispatch data={data} />
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
                <span>No dispatch found.</span>
            )}

            <MultipleFailedQCModal
                showModal={showFailedQCModal}
                setShowModal={setShowFailedQCModal}
                selectedData={selectedData}
                setSelectedData={setSelectedData}
                sigCanvas={sigCanvas}
                handleRefreshData={toggleRefreshData}
            />
        </>
    );
};

export default Dispatch;
