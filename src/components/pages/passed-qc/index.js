import { useContext, useEffect, useMemo, useState } from 'react';
import { AiOutlineDown, AiOutlineRight } from 'react-icons/ai';
import Swal from 'sweetalert2';
import { API_BASE_URL, DEFAULT_BAYS } from '../../../constants';
import { getPassedQcJobs } from '../../../server';
import { handleGetBayDates, handleGetBayJobStatus, handleGetBayValues, numberWithCommas } from '../../../utils/utils';
import DataTable from '../../common/data-table';
import PageTitle from '../../common/page-title';
import styles from './index.module.css';
import { Oval } from 'react-loader-spinner';
import { Button } from 'react-bootstrap';
import FailedQCModal from '../quality-control/FailedQCModal';
import { useRef } from 'react';
import { useBoolean } from '../../../hooks/';
import { webContext } from '../../../../src/context/websocket-context';
import TablePagination from '../../common/pagination';
import axios from 'axios';
import LineItemTableQC from '../../common/lineitem-table-qc';

const PassedQualityControl = () => {
    const [state, setState] = useState({
        jobs: [],
        bays: DEFAULT_BAYS,
        selectedPowderBay: '',
        jobDetails: '',
        selectedJob: null,
        init: true,
    });
    const { jobItem } = useContext(webContext);
    const [isLoading, setIsLoading] = useState(true);
    const [showFailedQCModal, setShowFailedQCModal] = useState(false);
    const [selectedData, setSelectedData] = useState([]);
    const [refreshData, toggleRefreshData] = useBoolean(false);
    const [lastPageUrl, setLastPageUrl] = useState('');
    const [prevPageUrl, setPrevPageUrl] = useState('');
    const [nextPageUrl, setNextPageUrl] = useState('');
    const [currentPage, setCurrentPage] = useState('');
    const [firstPageUrl, setFirstPageUrl] = useState('');
    const [pages, setPages] = useState([]);
    const sigCanvas = useRef({});

    const init = async () => {
        try {
            const res = await getPassedQcJobs();
            if (res.data.data !== undefined) {
                const jobs = res.data.data.map((item) => ({
                    ...item,
                    jobId: item.job_id,
                    lineitems: item.lines,
                    bayDates: handleGetBayDates(item),
                    bays: handleGetBayValues(item),
                    bayStatus: handleGetBayJobStatus(item),
                    invoiceNumber: item.job_title,
                    process: item.treatment,
                    data: item.lines.map(line => ({
                        id: line.line_item_id,
                        lineItem: `${line.name} ${line.description}`,
                        sku: line.SKU,
                        colour: line.colour,
                        material: line.material,
                        signature: line?.signature,
                        numberItemsCollected: line.quantity - line.number_dispatched,
                        line_item_status: line.line_item_status,
                        quantity: line.quantity,
                    })),
                }));

                let pageItems = [];
                for (let index = 0; index < res.data.last_page; index++) {
                    pageItems.push(index + 1);
                }

                setPages(pageItems);
                setCurrentPage(res.data.current_page);
                setFirstPageUrl(res.data.first_page_url);
                setNextPageUrl(res.data.next_page_url);
                setPrevPageUrl(res.data.prev_page_url);
                setLastPageUrl(res.data.last_page_url);

                setState((prevState) => ({ ...prevState, jobs: jobs }));
                setIsLoading(false);
            }
        } catch (error) {
            handleMessage('Error', error.response.data.message);
            setIsLoading(false);
        }
    };

    const getTableData = async (url) => {
        axios.get(url).then(res => {
            if (res.data.data !== undefined) {
                const jobs = res.data.data.map((item) => ({
                    ...item,
                    jobId: item.job_id,
                    lineitems: item.lines,
                    bayDates: handleGetBayDates(item),
                    bays: handleGetBayValues(item),
                    bayStatus: handleGetBayJobStatus(item),
                    invoiceNumber: item.job_title,
                    process: item.treatment,
                    data: item.lines.map(line => ({
                        id: line.line_item_id,
                        lineItem: `${line.name} ${line.description}`,
                        sku: line.SKU,
                        colour: line.colour,
                        material: line.material,
                        signature: line?.signature,
                        numberItemsCollected: line.quantity - line.number_dispatched,
                        line_item_status: line.line_item_status,
                        quantity: line.quantity,
                    })),
                }));
    
                let pageItems = [];
                for (let index = 0; index < res.data.last_page; index++) {
                    pageItems.push(index + 1);
                }
    
                setPages(pageItems);
                setCurrentPage(res.data.current_page);
                setFirstPageUrl(res.data.first_page_url);
                setNextPageUrl(res.data.next_page_url);
                setPrevPageUrl(res.data.prev_page_url);
                setLastPageUrl(res.data.last_page_url);
                setState((prevState) => ({ ...prevState, jobs: jobs }));
                setIsLoading(false);
            }
        })
    }

    const handleMessage = (title, message, type) => {
        Swal.fire(title, message, type);
    };

    useEffect(() => {
        if (state.init) {
            init();
        }
    }, [state.init, refreshData]);

    useEffect(() => {
        if (jobItem !== null && jobItem.message == 'qc') {
            if (state.init) {
                init();
            }
        }
    }, [jobItem])

    const onFailedJob = (data) => {
        setShowFailedQCModal(true);
        setSelectedData(data);
    }

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
                Header: 'Job',
                Cell: ({ row }) => <span>{row.original.job_title}</span>,
            },
            {
                isSortable: true,
                Header: 'Status',
                accessor: 'status',
                Cell: ({ row }) => {
                    const statusColors = {
                        blue: '#ccf1ff',
                        green: '#a6ebda',
                        orange: '#fadbcc',
                    };

                    const status = row.original.job_status;
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
                Cell: ({ row }) => {
                    return <span>{row.original.deal?.promised_date}</span>;
                },
            },
            {
                isSortable: true,
                Header: 'Client Name',
                Cell: ({ row }) => <span>{row.original.deal && row.original.deal.client_name}</span>,
            },
            {
                isSortable: true,
                Header: 'PO Number',
                Cell: ({ row }) => <span>{row.original.deal && row.original.deal.po_number}</span>,
            },
            {
                id: 'failed-qc',
                isSortable: false,
                Header: '',
                Cell: ({ row }) => (
                    <Button variant='danger' onClick={() => onFailedJob(row.original)}>
                        Failed QC
                    </Button>
                )
            },
        ],
        [state.jobs]
    );

    function handlePageChange(e) {
        return getTableData(`${API_BASE_URL}/qc/passed?page=${e}`);
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

    return (
        <>
            <PageTitle title='Passed QC' />
            {isLoading ? (
                <div className='loading-container'>
                    <Oval color='#fff' height={80} width={80} />
                </div>
            ) : !state.jobs || state.jobs.length === 0 ? (
                <span>No jobs found.</span>
            ) : (
                <div className={styles.contentContainer}>
                    <DataTable
                        columns={columns}
                        data={state.jobs}
                        expandedRowStyle={{ padding: '0px', paddingLeft: '50px' }}
                        ExpandedComponent={({ data }) => {
                            return (
                                <LineItemTableQC data={data} handleRefreshData={() => {}} />
                            );
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

                    <FailedQCModal
                        showModal={showFailedQCModal}
                        setShowModal={setShowFailedQCModal}
                        selectedData={selectedData}
                        setSelectedData={setSelectedData}
                        sigCanvas={sigCanvas}
                        handleRefreshData={toggleRefreshData}
                    />
                </div>
            )}
        </>
    );
};

export default PassedQualityControl;
