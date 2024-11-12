import styles from './index.module.css';
import DataTable from '../../../common/data-table';
import { useEffect, useMemo, useState, useContext, forwardRef, useCallback } from 'react';
import { AiOutlineDown, AiOutlineRight } from 'react-icons/ai';
import PageTitle from '../../../common/page-title';
import { FaFilter, FaList } from 'react-icons/fa';
import { MdGridView } from 'react-icons/md';
import Button from 'react-bootstrap/Button';
import { 
        ALLOW_MODIFY_CARD_SCOPE, 
        SCHEDULING_BAY_LINK, 
        SCHEDULING_OVERVIEW_LINK, 
        SCHEDULING_POWDER_LINK
    } from '../../../../constants';
import { DateTime } from 'luxon';
import InvoiceModal from '../../../common/modal/Index';
import SelectJobStatus from '../../../common/select/index';
import useUserScope from '../../../../hooks/useUserScope';
import { UserContext } from '../../../../context/user-context';
import { getAllColours, jobLabel, getOverview, getLocation, getUsers } from '../../../../server';
import JobCardOverview from '../../../common/job-card-overview';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { numberWithCommas, handleGetBayJobStatus, showAlert, handleGetJobBay, capitalizeFirstLetter, lowerFirstLetter, handleGetBayValues } from '../../../../utils/utils';
import LineItemTable from '../../../common/lineitem-table';
import { Oval } from 'react-loader-spinner';
import EditJobModal from '../../../common/job-card/EditJobModal';
import { DragDropContext } from 'react-beautiful-dnd';
import SelectLocation from '../../../common/location';
import { webContext } from '../../../../context/websocket-context';
import BaySearchFilterModalModule from '../../bay-search-filter-modal-module';
import PageSearchBar from '../../../common/page-search-bar';
import TableViewComment from '../../table-view-comment';
import { Form } from 'react-bootstrap';

const SchedulingOverview = ({overdue = false}) => {
    const { user } = useContext(UserContext);
    const { jobItem } = useContext(webContext);
    const userScope = useUserScope();
    const allowModify = ALLOW_MODIFY_CARD_SCOPE.includes(userScope);
    const [viewType, setViewType] = useState('kanban');
    const [data, setData] = useState([]);
    const [isGettingData, setIsGettingData] = useState(true);
    const [kanbanData, setKanbanData] = useState([]);
    const [show, setShow] = useState(false);
    const [isSchedule, setIsSchedule] = useState(false);
    const handleClose = () => setShow(false);
    const [selectedJobData, setSelectedJobData] = useState([]);
    const handleRefreshData = () => setIsGettingData((prev) => !prev);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [filterStartDate, setFilterStartDate] = useState(new Date());
    const [filterEndDate, setFilterEndDate] = useState(DateTime.now().plus({ days: 14 }).toJSDate());
    const [isEditJob, setIsEditJob] = useState(false);
    const [currentJobEditing, setCurrentJobEditing] = useState({});
    const [colours, setColours] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showLocation, setShowLocation] = useState(false)
    const [selectedJobId, setSelectedJobId] = useState('')
    const handleCloseLocation = () => setShowLocation((prev) => !prev)
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectedJobCard, setSelectedJobCard] = useState('')
    const [locationData, setLocationData] = useState([])
    const [commentObjectId, setCommentObjectId] = useState('');
    const [commentObjectType, setCommentObjectType] = useState('');
    const [users, setUsers] = useState([]);

    const [kanbanDataToFilter, setKanbanDataToFilter] = useState([]);
    const [modalVal, setModalVal] = useState(false);
    const [dataKanban, setDataKanban] = useState([])
    const handleChangeData = (newData) =>  {setKanbanData(newData)}
    const [commentData, setCommentData] = useState([]);

    const ExampleCustomInput = forwardRef(({ value, onClick }, ref) => (
        <button className={styles.customCalendar} onClick={onClick} ref={ref}>
            {value}
        </button>
    ));

    useEffect(() => {
        getUsers().then(res => {
            let users_array = []
            if(res.status === 200){
                for (let index = 0; index < res.data.message.length; index++) {
                    const user = res.data.message[index];
                    if(users_array.findIndex(elem => elem.id === user.user_id) < 0){
                        users_array.push({
                            id: user.user_id,
                            display: `${user.firstname} ${user.lastname}`
                        })
                    }
                }
                setUsers(users_array)
            }
        }).catch((err) => {
            console.log("users-err", err);
        })
    }, []);

    useEffect(() => {
        getUsers().then(res => {
            let users_array = []
            if(res.status === 200){
                for (let index = 0; index < res.data.message.length; index++) {
                    const user = res.data.message[index];
                    if(users_array.findIndex(elem => elem.id === user.user_id) < 0){
                        users_array.push({
                            id: user.user_id,
                            display: `${user.firstname} ${user.lastname}`
                        })
                    }
                }
                setUsers(users_array)
            }
        }).catch((err) => {
            console.log("users-err", err);
        })
    }, []);

    const handleEditJob = useCallback((job) => {
        setIsEditJob(true);
        setCurrentJobEditing(job);
    }, []);

    const columns = useMemo(() => {
        let tableColumns = [
            {
            id: 'select',
                style: { width: 80 },
                Cell: ({ row }) => {
                    const index = row.original.jobId;
                    const invoiceNumber = row.original.invoiceNumber;
                    let item = {
                        id: index,
                        invoiceNumber: invoiceNumber
                    }
                    const handleSelectItem = (index, isChecked) => {
                        if (isChecked) {
                            if (!selectedItems.find(el => el.id == index)) {
                                setSelectedItems([...selectedItems, item]);
                            }
                        } else {
                            setSelectedItems([...selectedItems].filter((el) => el.id !== index));
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
                                checked={selectedItems.find(el => el.id == index)}
                                onChange={(event) => {
                                    handleSelectItem(index, event.target.checked);
                                }}
                            />
                        </div>
                    );
                },
            },
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
                Header: 'Invoice No.',
                Cell: ({ row }) => {
                    return <span>{`${row.original.invoiceNumber} ${row.original.is_error_redo === 'yes' ? '- Error | Redo' : ''}`}</span>;
                },
            },
            {
                isSortable: true,
                Header: 'Job Status',
                accessor: 'status',
                Cell: ({data, row}) => {
                    const status = data[row.id].status
                    return <span className={styles.tableStatus}>{status}</span>
                }

                
            },
            {
                isSortable: true,
                Header: 'Bay',
                accessor: 'jobBay',
            },
            {
                isSortable: true,
                Header: 'Bay Status',
                accessor: 'jobBayStatus',
                Cell: ({ data, row }) => {
                    let status = data[row.id].jobBayStatus;
                    let selectedBay = lowerFirstLetter(data[row.id].jobBay)
                    function handleLocation() {
                        setShowLocation(true)
                        setSelectedJobId(data[row.id].jobId)
                    }
                    
                    return <SelectJobStatus status={status} id={data[row.id].jobId} type={`${selectedBay}_job_status`} handleRefreshData={handleRefreshData} handleLocation={handleLocation}/>;
                },
            },
            {
                isSortable: true,
                Header: 'Colour',
                accessor: 'colour',
                Cell: ({ data, row }) => {
                    return <span style={{ textTransform: 'capitalize' }}>{data[row.id].colour}</span>;
                },
            },
            {
                isSortable: true,
                Header: 'Material',
                accessor: 'material',
                Cell: ({ data, row }) => {
                    return <span style={{ textTransform: 'capitalize' }}>{data[row.id].material}</span>;
                },
            },
            {
                isSortable: true,
                Header: 'Process',
                accessor: 'process',
            },
            {
                isSortable: true,
                Header: 'PO Number',
                accessor: 'poNumber',
                Cell: ({ row }) => {
                    return (
                        <span>
                            <a href={row.original.poLink} target='_blank' rel='noreferrer'>
                                {row.original.poNumber}
                            </a>
                        </span>
                    );
                },
            },
            {
                isSortable: true,
                Header: 'Job Amount',
                accessor: 'amount',
                Cell: ({ cell }) => {
                    return `$${numberWithCommas(cell.value)}`;
                },
            },
            {
                isSortable: true,
                Header: 'Due Date',
                Cell: ({ row }) => <span>{DateTime.fromFormat(row.original.dueDate, 'dd-LL-yyyy').toFormat('dd/LL/yyyy')}</span>,
            },
            {
                id: 'schedule',
                isSortable: true,
                Header: '',
                accessor: 'scheduled',
                Cell: (i) =>
                    allowModify ? (
                        <Button style={{borderRadius: 'unset' }} variant='danger' onClick={handleSelectDate(i.cell.row.original)}>
                            Schedule
                        </Button>
                    ) : null,
            },
            {
                id: 'edit',
                isSortable: true,
                Header: '',
                // accessor: 'scheduled',
                Cell: ({ row }) => (
                    <Button style={{borderRadius: 'unset' }} variant='primary' onClick={() => handleEditJob(row.original)}>
                        Edit
                    </Button>
                ),
            },
            {
                id: 'comment',
                isSortable: true,
                Header: '',
                accessor: 'comments',
                Cell: (i) => {
                    return (
                        <Button style={{borderRadius: 'unset' }} variant='primary' onClick={() => handleComment(i.cell.row.original, 'job')}>
                            Comment
                        </Button>
                    );
                },
            },
            {
                id: 'label',
                isSortable: false,
                accessor: 'label',
                Cell: (cell) => {
                    return (
                        <Button style={{borderRadius: 'unset' }} variant='warning' onClick={() => downloadJobLabel(cell.cell.row.original)}>
                            Download Label
                        </Button>
                    );
                },
            },
        ];
        if (!allowModify) tableColumns = tableColumns.filter((item) => item.id !== 'edit');
        return tableColumns;
    }, [allowModify, handleEditJob, selectedItems, handleRefreshData]);

    const handleSelectDate = (value) => () => {
        setSelectedJobData(value);
        setIsSchedule(true);
        setShow(true);
    };

    const downloadJobLabel = (job) => {
        jobLabel(job.jobId)
            .then((res) => {
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${job.invoiceNumber}.pdf`); //or any other extension
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const handleKanbanDownloadJobLabel = (value) => () => {
        jobLabel(value.jobId)
            .then((res) => {
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${value.invoiceNumber}.pdf`); //or any other extension
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const getColours = async () => {
        getAllColours()
            .then((res) => {
                setColours(
                    res.data.message
                        .sort(function (a, b) {
                            return a.name.localeCompare(b.name);
                        })
                        .map((colour) => ({ value: colour.name, label: colour.name }))
                );
            })
            .catch((error) => {
                console.error(error);
            });
    };

    const getJobData = useCallback(async () => {
        setIsLoading(true);
        let end_date = DateTime.fromJSDate(filterEndDate);
        if (end_date.isValid) {
            end_date = end_date.toFormat('yyyy-LL-dd');
        } else {
            end_date = null;
        }

        let start_date = DateTime.fromJSDate(filterStartDate);
        if (start_date.isValid) {
            start_date = start_date.toFormat('yyyy-LL-dd');
        } else {
            start_date = null;
        }

        getOverview({ start_date, end_date, overdue_only: overdue })
            .then((res) => {
                let datas = res.data.jobs;
                const tempDatas = [
                    { title: 'ready', invoices: [] },
                    { title: 'chem', invoices: [] },
                    { title: 'burn', invoices: [] },
                    { title: 'treatment', invoices: [] },
                    { title: 'blast', invoices: [] },
                    { title: 'big batch', invoices: [] },
                    { title: 'small batch', invoices: [] },
                    { title: 'main line', invoices: [] },
                ];
                // const tempDatas = []
                let tableJobs = [];
                for (const bayIndex of Object.keys(datas)) {
                    const jobs = datas[bayIndex];
                    for (const job of jobs) {
                        let jobComments = [];
                        if (job.job_comments.length > 0) {
                            for (const comment of job.job_comments) {
                                jobComments.push({
                                    comment: comment.comment,
                                    commentId: comment.comment_id,
                                    parentId: comment.parent_id,
                                });
                            }
                        }

                        let key = job.bay;
                        let tempDataIndex = tempDatas.findIndex((i) => i.title === key);
                        let location = (job.location !== null) ? job.location.location : job.other_location
                        let selectedJobBay = capitalizeFirstLetter(handleGetJobBay(job))
                        let selectedJobBayStatus = job[`${lowerFirstLetter(selectedJobBay)}_status`]

                        const jobObject = {
                            invoiceNumber: job.job_title,
                            status: job.job_status,
                            jobId: job.job_id,
                            details: {
                                colour: job.colour,
                                material: job.material,
                                date: job.deal.promised_date,
                                poNumber: job.deal.po_number,
                                amount: job.amount,
                                poLink: job.deal.file_link,
                                process: job.treatment,
                                clientName: job.deal.client_name,
                                bay: job.bay,
                                location: location,
                            },
                            bayDates: handleGetBayDates(job),
                            bays: handleGetBayValues(job),
                            bayStatus: handleGetBayJobStatus(job),
                            baysValue: handleGetBayValues(job),
                            comments: jobComments,
                            lineitems: job.lines,
                            colour: job.colour,
                            material: job.material,
                            date: job.deal.promised_date,
                            dueDate: job.deal.promised_date,
                            poNumber: job.deal.po_number,
                            amount: job.amount,
                            poLink: job.deal.file_link,
                            process: job.treatment,
                            clientName: job.deal.client_name,
                            bay: job.bay,
                            data: job.lines,
                            jobBay: selectedJobBay,
                            jobBayStatus: selectedJobBayStatus
                        };

                        if (tempDataIndex >= 0) {
                            tempDatas[tempDataIndex].invoices.push(jobObject);
                        } else {
                            tempDatas.push({
                                title: key,
                                invoices: [jobObject],
                            });
                        }
                        if (tableJobs.findIndex((element) => element.jobId === jobObject.jobId) === -1) {
                            tableJobs.push(jobObject);
                        }
                    }
                }

                setKanbanDataToFilter(tempDatas)
                setDataKanban(tempDatas)
                setKanbanData(tempDatas);
                setData(tableJobs);
                setIsGettingData(false);
                setIsLoading(false);
            })
            .catch((err) => {
                showAlert(err.response.data.errors);
                setIsLoading(false);
            });
    }, [filterEndDate, filterStartDate]);

    useEffect(() => {
        getColours();
    }, [isGettingData]);

    useEffect(() => {
        getJobData();
    }, [isGettingData, filterStartDate, filterEndDate]);

    useEffect(() => {
        if (jobItem !== null && jobItem.message === 'job event call') {
            getJobData();
        }
    }, [jobItem]);

    useEffect(() => {
        getLocation().then(res => {
            if (res.data.data !== undefined) {
                setLocationData(res.data.data)
            }
        })
    }, []);

    const handleGetBayDates = (bayDates) => {
        let tempBayDates = {};
        if (bayDates.chem_date !== null) {
            tempBayDates['chemDate'] = bayDates.chem_date;
        }

        if (bayDates.treatement_date !== null) {
            tempBayDates['treatmentDate'] = bayDates.treatment_date;
        }

        if (bayDates.burn_date !== null) {
            tempBayDates['burnDate'] = bayDates.burn_date;
        }

        if (bayDates.blast_date !== null) {
            tempBayDates['blastDate'] = bayDates.blast_date;
        }

        if (bayDates.powder_date !== null) {
            tempBayDates['powderDate'] = bayDates.powder_date;
        }

        return tempBayDates;
    };

    const handleComment = (value, object_type) => {

        setShowCommentModal(true);
        setCommentObjectType(object_type);
        setCommentObjectId(value.jobId);
        setCommentData(value.comments)
    };

    const handleCloseCommentModal = () => {
        setShowCommentModal(false);
    }
    
    const onChange = (dates) => {
        const [start, end] = dates;
        setFilterStartDate(start);
        setFilterEndDate(end);

    };

    const handleBulkDownloadLabel = async () => {
        if (selectedItems.length < 0) {
            showAlert('error', 'Need to select at least one to download')
            return
        }

        for (let index = 0; index < selectedItems.length; index++) {
            await jobLabel(selectedItems[index].id).then((res) => {
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${selectedItems[index].invoiceNumber}.pdf`); //or any other extension
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch((err) => {
                console.log(err);
            });
        }

        setSelectedItems([])
    }

    /* Bay Search Filter */
    const searchFunctionOnChange = (tempDatasForFilter, tableDataFilterResults) => {
        setKanbanData(tempDatasForFilter) 
        setData(tableDataFilterResults)

    }

    return (
        <>
            <EditJobModal
                isEditJob={isEditJob}
                setIsEditJob={setIsEditJob}
                colours={colours}
                job={currentJobEditing}
                handleRefreshData={handleRefreshData}
            />

            {isSchedule && show ? <InvoiceModal data={selectedJobData} show={show} handleClose={handleClose} handleRefreshData={handleRefreshData} /> : ''}
            <div className={styles.headerContainer}>
                {
                    overdue ? <PageTitle title='Overdue' /> : <PageTitle title='Scheduling' />
                }
                <div className={styles.headerActions}>
                <PageSearchBar dataKanban={dataKanban} handleSearchPageData={handleChangeData} title='overview'/>
                <span onClick={() => setModalVal(true)}><FaFilter /></span>
                    <span
                        onClick={() => {
                            setViewType('kanban');
                        }}
                    >
                        <MdGridView />
                    </span>
                    <span
                        onClick={() => {
                            setViewType('table');
                        }}
                    >
                        <FaList />
                    </span>
                </div>
            </div>

            {
                overdue ? '' : <div className={styles.headerContainer} hidden={viewType === 'table' ? true : false}>
                <DatePicker
                    dateFormat='dd/MM/yyyy'
                    selected={filterStartDate}
                    startDate={filterStartDate}
                    endDate={filterEndDate}
                    onChange={onChange}
                    selectsRange
                    customInput={<ExampleCustomInput />}
                />
            </div>
            }

            <div className='' style={{ float: 'right' , marginBottom: '5px'}}>
                    {selectedItems.length > 0 ? (
                        <Button style={{borderRadius: 'unset' ,margin:'5px'}} variant='success' onClick={handleBulkDownloadLabel}>
                            Download Selected Labels
                        </Button>
                    ) : (
                        ''
                    )}
                </div>

            <div className={styles.contentContainer}>
                {isLoading && !kanbanData.length ? (
                    <div className='loading-container'>
                        <Oval color='#fff' height={80} width={80} />
                    </div>
                ) : viewType === 'table' ? (
                    <DataTable
                        columns={columns}
                        data={data}
                        expandedRowStyle={{ padding: '0px', paddingLeft: '50px' }}
                        ExpandedComponent={({ data }) => {
                            return (
                                <LineItemTable data={data} handleRefreshData={() => {}} title='overview'/>
                            );
                        }}
                    />
                ) : (
                    <div className={styles.kanbanComponentWrapper}>
                        <DragDropContext>
                            {kanbanData.map(({ title, invoices }, idx) => {
                                if (title === 'ready') {
                                    title = 'Ready to Schedule';
                                    var linkedbay = SCHEDULING_OVERVIEW_LINK;
                                } else if (title === 'chem') {
                                    title = 'Chem Bay';
                                    linkedbay = SCHEDULING_BAY_LINK.replace(':bay', 'chem');
                                } else if (title === 'treatment') {
                                    title = 'Treatment Bay';
                                    linkedbay = SCHEDULING_BAY_LINK.replace(':bay', 'treatment');
                                } else if (title === 'burn') {
                                    title = 'Burn Bay';
                                    linkedbay = SCHEDULING_BAY_LINK.replace(':bay', 'burn');
                                } else if (title === 'blast') {
                                    title = 'Blast Bay';
                                    linkedbay = SCHEDULING_BAY_LINK.replace(':bay', 'blast');
                                } else if (title === 'powder') {
                                    title = 'Powder Bay';
                                    linkedbay = SCHEDULING_POWDER_LINK.replace(':powder', 'powder-big-batch');
                                } else if (title === 'small batch') {
                                    title = 'Small Batch';
                                    linkedbay = SCHEDULING_POWDER_LINK.replace(':powder', 'powder-small-batch');
                                } else if (title === 'big batch') {
                                    title = 'Big Batch';
                                    linkedbay = SCHEDULING_POWDER_LINK.replace(':powder', 'powder-big-batch');
                                } else {
                                    title = 'Main Line';
                                    linkedbay = SCHEDULING_POWDER_LINK.replace(':powder', 'powder-main-batch');
                                }

                                return (
                                    <div key={idx}>
                                        <JobCardOverview
                                            title={title}
                                            itemData={invoices}
                                            style={{ marginBottom: '15px', alignItems: 'flex-start' }}
                                            user={user}
                                            bay='Dashboard'
                                            linkedbay={linkedbay}
                                            handleSelectDate={handleSelectDate}
                                            handleKanbanDownloadJobLabel={handleKanbanDownloadJobLabel}
                                            setEditJobModal={setIsEditJob}
                                            handleEditJob={handleEditJob}
                                            handleRefreshData={handleRefreshData}
                                            kanbanData={kanbanData}
                                            selectedJobCard={selectedJobCard}
                                            setSelectedJobCard={setSelectedJobCard}
                                            locationData={locationData}
                                        />
                                    </div>
                                );
                            })}
                        </DragDropContext>
                    </div>
                )}
            </div>

            <BaySearchFilterModalModule
                showModal={modalVal}
                handleClose={() => setModalVal(false)}
                kanbanJobLists={kanbanDataToFilter}
                onChange={searchFunctionOnChange}
                parentFunctionName="overview"
            />
            
            <TableViewComment 
                data={commentData}
                showCommentModal={showCommentModal}
                users={users}
                commentObjectId={commentObjectId}
                commentObjectType={commentObjectType}
                handleCloseCommentModal={handleCloseCommentModal}
                user={user}
            />

            <SelectLocation 
                job={selectedJobId}
                handleRefreshData={handleRefreshData}
                show={showLocation}
                handleCloseLocation={handleCloseLocation}
                locationData={locationData}
            />
        </>
    );
};

export default SchedulingOverview;
