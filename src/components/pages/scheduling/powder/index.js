import styles from './index.module.css';
import { useEffect, useMemo, useState, useCallback, useRef, useContext, forwardRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { AiOutlineDown, AiOutlineRight } from 'react-icons/ai';
import PageTitle from '../../../common/page-title';
import { MdGridView } from 'react-icons/md';
import { FaList, FaFilter } from 'react-icons/fa';
import JobCardList from '../../../common/job-card';
import { 
        ALLOW_MODIFY_CARD_SCOPE, 
        SIDE_MENU_CONTRACTED_WIDTH, 
        SIDE_MENU_EXPANDED_WIDTH
    } from '../../../../constants';
import SelectJobStatus from '../../../common/select/index';
import { DragDropContext } from 'react-beautiful-dnd';
import {
    onDragEnd,
    handleGetBayDates,
    handleGetBayJobStatus,
    showAlert,
    numberWithCommas,
    generateDataBasedOnSelectedDate,
    handleGetBayValues,
} from '../../../../utils/utils';
import { getAllColours, getJobsBay, jobLabel, updateBayJobStatus, updatePowderBayForJob, getLocation, getUsers } from '../../../../server';
import useUserScope from '../../../../hooks/useUserScope';
import { UserContext } from '../../../../context/user-context';
import DatePicker from 'react-datepicker';
import { DateTime } from 'luxon';
import InvoiceModal from '../../../common/modal/Index';
import { Button, Form, Modal } from 'react-bootstrap';
import LineItemTable from '../../../common/lineitem-table';
import { Oval } from 'react-loader-spinner';
import SelectLocation from '../../../common/location';
import EditJobModal from '../../../common/job-card/EditJobModal';
import DragDropTable from '../../../common/drag-drop-table';
import { webContext } from '../../../../context/websocket-context';
import BaySearchFilterModalModule from '../../bay-search-filter-modal-module';
import PageSearchBar from '../../../common/page-search-bar';
import TableViewComment from '../../table-view-comment';

const PowderBay = ({ isMenuExpanded }) => {
    const param = useParams();
    const powder = param.powder;

    const bay = 'powder';
    const { user } = useContext(UserContext);
    const { jobItem } = useContext(webContext);

    const userScope = useUserScope();
    const allowModify = ALLOW_MODIFY_CARD_SCOPE.includes(userScope);
    const [viewType, setViewType] = useState('kanban');
    const [kanbanError] = useState(null);
    const [data, setData] = useState([]);
    const [currentPowder, setCurrentPowder] = useState();
    const [kanbanData, setKanbanData] = useState([]);
    const [kanbanColumns, setKanbanColumns] = useState([]);
    const [pageTitle, setPageTitle] = useState();
    const [isGettingData, setIsGettingData] = useState(true);
    const handleRefreshData = useCallback(() => setIsGettingData(!isGettingData), [isGettingData]);
    const jobCardRef = useRef();
    const [selectedJobData, setSelectedJobData] = useState([]);
    const [isSchedule, setIsSchedule] = useState(false);
    const [show, setShow] = useState(false);
    const handleClose = () => {
        if (viewType === 'table') handleRefreshData();
        setShow(false)
    };
    const [filterStartDate, setFilterStartDate] = useState(new Date());
    const [filterEndDate, setFilterEndDate] = useState(DateTime.now().plus({ days: 7 }).toJSDate());
    const [isEditJob, setIsEditJob] = useState(false);
    const [currentJobEditing, setCurrentJobEditing] = useState(null);
    const [colours, setColours] = useState([]);
    const handleCloseStatusModal = () => setShowStatusModal(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');
    const handleUpdateStatus = () => setShowStatusModal((prev) => !prev);
    const [selectedItems, setSelectedItems] = useState([]);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [showLocation, setShowLocation] = useState(false)
    const [selectedJobId, setSelectedJobId] = useState('')
    const handleCloseLocation = () => setShowLocation((prev) => !prev)
    const [selectedJobCard, setSelectedJobCard] = useState('')
    const [commentData, setCommentData] = useState([]);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [commentObjectId, setCommentObjectId] = useState('');
    const [commentObjectType, setCommentObjectType] = useState('');
    const [locationData, setLocationData] = useState([])
    const [users, setUsers] = useState([]);

    const [kanbanDataToFilter, setKanbanDataToFilter] = useState([]);
    const [modalVal, setModalVal] = useState(false);
    const [dataKanban, setDataKanban] = useState([])
    const handleChangeData = (newData) =>  {setKanbanData(newData)}

    const ExampleCustomInput = forwardRef(({ value, onClick }, ref) => (
        <button className={styles.customCalendar} onClick={onClick} ref={ref}>
            {value}
        </button>
    ));

    const location = useLocation();
    const paramSelected = new URLSearchParams(location.search);

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

    const handleEditJob = (job) => {
        setIsEditJob(true);
        setCurrentJobEditing(job);
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

    const handlePowderChange = useCallback(
        (data) => (e) => {
            const value = e.target.value;
            updatePowderBayForJob({ powder_bay: value }, data.jobId)
                .then((res) => {
                    handleRefreshData();
                    return showAlert('success', res.data.msg);
                })
                .catch((err) => {
                    return showAlert('error', err.response.data.errors);
                });
        },
        [handleRefreshData]
    );

    const columns = useMemo(() => {
        let tableColumns = [
            {
                id: 'select',
                style: { width: 80 },
                Cell: ({ row }) => {
                    const index = row.original.jobId;
                    const bayStatus = row.original.status;
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
                                hidden={bayStatus.toLowerCase() !== 'waiting' ? false : true}
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
                Header: 'Invoice Number',
                accessor: 'invoiceNumber',
            },
            {
                Header: 'Bays',
                accessor: 'powderBays',
                Cell: ({ data, row }) => {
                    const index = row.id;
                    return (
                        <div>
                            <select onChange={handlePowderChange(data[index])} className={styles.select}>
                                <option
                                    value='big batch'
                                    hidden={powder === 'powder-big-batch' ? true : false}
                                    selected={powder === 'powder-big-batch' ? true : false}
                                >
                                    Big Batch
                                </option>
                                <option
                                    value='small batch'
                                    hidden={powder === 'powder-small-batch' ? true : false}
                                    selected={powder === 'powder-small-batch' ? true : false}
                                >
                                    Small bay
                                </option>
                                <option
                                    value='main line'
                                    hidden={powder === 'powder-main-line' ? true : false}
                                    selected={powder === 'powder-main-line' ? true : false}
                                >
                                    Main Line
                                </option>
                            </select>
                        </div>
                    );
                },
            },
            {
                isSortable: true,
                Header: 'Status',
                accessor: 'status',
                Cell: ({ data, row }) => {
                    const status = data[row.id].status;
                    function handleLocation() {
                        setShowLocation(true)
                        setSelectedJobId(data[row.id].jobId)
                    }
                    return <SelectJobStatus status={status} id={data[row.id].jobId} type={data[row.id].type} handleRefreshData={handleRefreshData} handleLocation={handleLocation}/>;
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
                Header: 'Colour',
                accessor: 'colour',
                Cell: (cell) => {
                    return <span style={{ textTransform: 'capitalize' }}>{cell.value}</span>;
                },
            },
            {
                isSortable: true,
                Header: 'Material',
                accessor: 'material',
                Cell: (cell) => {
                    return <span style={{ textTransform: 'capitalize' }}>{cell.value}</span>;
                },
            },
            {
                isSortable: true,
                Header: 'Amount',
                accessor: 'amount',
            },
            {
                isSortable: true,
                Header: 'Scheduled',
                accessor: 'bayScheduled',
            },
            {
                isSortable: true,
                Header: 'Due Date',
                accessor: 'dueDate',
            },

            {
                id: 'schedule',
                isSortable: true,
                Header: '',
                accessor: 'scheduled',
                Cell: (i) =>
                    allowModify ? (
                        <Button  style={{borderRadius: 'unset'}} variant='danger' onClick={handleSelectDate(i.cell.row.original)}>
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
                    <Button style={{borderRadius: 'unset'}} variant='primary' onClick={() => handleEditJob(row.original)}>
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
                        <Button style={{borderRadius: 'unset'}} variant='primary' onClick={() => handleComment(i.cell.row.original, 'job')}>
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
                        <Button style={{borderRadius: 'unset'}}  variant='warning' onClick={() => downloadJobLabel(cell.cell.row.original)}>
                            Download Label
                        </Button>
                    );
                },
            },
        ];
        if (!allowModify) tableColumns = tableColumns.filter((item) => item.id !== 'edit');
        return tableColumns;
    }, [handleRefreshData, handlePowderChange, powder, selectedItems]);

    const getKanbanBayData = useCallback(
        (kanbanJobLists) => {
            const selected = paramSelected.get('selected');
            let kanbanJobs = {};
            for (let bayIndex of Object.keys(kanbanJobLists)) {
                let tempArrayJobs = [];

                const jobs = kanbanJobLists[bayIndex];
                for (const job of jobs) {
                    let kanbanJobComments = [];

                    if (job.job_comments.length > 0) {
                        for (let commentIndex = 0; commentIndex < job.job_comments.length; commentIndex++) {
                            kanbanJobComments.push({
                                comment: job.job_comments[commentIndex].comment,
                                commentId: job.job_comments[commentIndex].comment_id,
                                parentId: job.job_comments[commentIndex].parent_id,
                            });
                        }
                    }

                    let location = (job.location !== null) ? job.location.location : job.other_location

                    tempArrayJobs.push({
                        status: job.job_status,
                        invoiceNumber: job.job_title,
                        jobId: job.job_id,
                        priority: job.priority,
                        chem_priority: job.chem_priority,
                        burn_priority: job.burn_priority,
                        blast_priority: job.blast_priority,
                        treatment_priority: job.treatment_priority,
                        powder_priority: job.powder_priority,
                        details: {
                            customer: job.deal.client_name,
                            colour: job.colour,
                            material: job.material,
                            date: job.deal.promised_date,
                            poNumber: job.deal.po_number,
                            amount: Math.round((job.amount + Number.EPSILON) * 100) / 100,
                            file_link: job.deal.file_link,
                            poLink: job.deal.file_link,
                            process: job.treatment,
                            location: location
                        },
                        bayDates: handleGetBayDates(job),
                        bays: handleGetBayValues(job),
                        bayStatus: handleGetBayJobStatus(job),
                        baysValue: handleGetBayValues(job),
                        lineitems: job.lines,
                        data: job.lines,

                        comments: kanbanJobComments,
                    });
                }

                if (bayIndex === 'ready') {
                    bayIndex = 'Ready to Schedule';
                    kanbanJobs[bayIndex] = {
                        data: tempArrayJobs,
                    };
                } else {
                    kanbanJobs[bayIndex] = {
                        Unranked: tempArrayJobs.filter((item) => item[`${bay}_priority`] === -1),
                        Ranked: tempArrayJobs
                            .filter((item) => item[`${bay}_priority`] !== -1)
                            .sort((a, b) => (a[`${bay}_priority`] > b[`${bay}_priority`] ? 1 : -1))
                            .map((item, index) => ({ ...item, [`${bay}_priority`]: index })),
                    };
                }
            }

            if (selected) kanbanJobs = getSelectedViewData(kanbanJobs);

            const { days: numberOfDays } = DateTime.fromJSDate(filterEndDate).diff(DateTime.fromJSDate(filterStartDate), 'days').toObject();
            if (!isNaN(numberOfDays)) {
                kanbanJobs = generateDataBasedOnSelectedDate(kanbanJobs, numberOfDays, filterStartDate, 'kanban');
            } else {
                kanbanJobs = generateDataBasedOnSelectedDate(kanbanJobs, 7, filterStartDate, 'kanban');
            }

            setKanbanColumns(Object.keys(kanbanJobs));
            setDataKanban(kanbanJobs);
            setKanbanData(kanbanJobs);
        },
        [filterEndDate, filterStartDate]
    );

    const getTableBayData = useCallback(
        (tableJobLists) => {
            let tableJobs = {};
            for (let bayIndex of Object.keys(tableJobLists)) {
                let items = [];
                const jobs = tableJobLists[bayIndex];
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

                    const scheduled_date = job[bay + '_date']
                    items.push({
                        type: `${bay}_job_status`,
                        invoiceNumber: job.job_title,
                        jobId: job.job_id,
                        status: job[bay + '_status'],
                        amount: job.amount ? `$${numberWithCommas(job.amount.toFixed(2))}` : '$0.00',
                        dueDate: job.deal.promised_date,
                        bayScheduled: scheduled_date? DateTime.fromFormat(scheduled_date, 'yyyy-MM-dd').toFormat('dd-MM-yyyy'):scheduled_date,
                        clientName: job.deal.client_name,
                        poNumber: job.deal.po_number,
                        data: job.lines,
                        lineitems: job.lines,
                        colour: job.colour,
                        material: job.material,
                        process: job.treatment,
                        poLink: job.deal.file_link,
                        bays: handleGetBayValues(job),
                        chem_priority: job.chem_priority,
                        burn_priority: job.burn_priority,
                        blast_priority: job.blast_priority,
                        treatment_priority: job.treatment_priority,
                        powder_priority: job.powder_priority,
                        comments: jobComments
                    });
                }
                if (bayIndex === 'ready') {
                    bayIndex = 'Ready to Schedule';
                }
                const unranked = items
                    .filter((item) => item[`${bay}_priority`] === -1)
                    .sort((a, b) => (parseInt(a.jobId) - parseInt(b.jobId)));
                const ranked = items
                    .filter((item) => item[`${bay}_priority`] !== -1)
                    .sort((a, b) => (a[`${bay}_priority`] - b[`${bay}_priority`]))
                    .map((item, index) => ({ ...item, [`${bay}_priority`]: index }));
                tableJobs[bayIndex] = [...ranked, ...unranked];
            }
            let numberOfDays = DateTime.fromJSDate(filterEndDate).diff(DateTime.fromJSDate(filterStartDate)).day;
            if (!isNaN(numberOfDays)) {
                tableJobs = generateDataBasedOnSelectedDate(tableJobs, numberOfDays, filterStartDate, 'table');
            } else {
                tableJobs = generateDataBasedOnSelectedDate(tableJobs, 7, filterStartDate, 'table');
            }
            setData(tableJobs);
        },
        [bay]
    );

    const getJobsBayData = useCallback(async () => {
        setIsLoadingData(true);
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

        let bay = powder;
        getJobsBay({ start_date, end_date, bay })
            .then((res) => {
                let bayLists = res.data.jobs;
                getKanbanBayData(bayLists);
                getTableBayData(bayLists);
                setIsLoadingData(false);
                // formatDataForFilter(bayLists)
                setKanbanDataToFilter(bayLists)
            })
            .catch(() => {
                setIsLoadingData(false);
            });
    }, [filterEndDate, filterStartDate, powder, getKanbanBayData, getTableBayData]);

    useEffect(() => {
        if (currentPowder !== powder) {
            setCurrentPowder(powder);
            if (powder === 'powder-big-batch') {
                setPageTitle('Powder Coating - Big Batch');
            } else if (powder === 'powder-small-batch') {
                setPageTitle('Powder Coating - Small Batch');
            } else {
                setPageTitle('Powder Coating - Main Line');
            }

            getJobsBayData();
        } else {
            getJobsBayData();
        }

        getColours();
        getColours();
    }, [isGettingData, powder, currentPowder, getJobsBayData]);

    useEffect(() => {
        if (jobItem !== null && jobItem.message === 'job event call') {
            if (currentPowder !== powder) {
                setCurrentPowder(powder);
                if (powder === 'powder-big-batch') {
                    setPageTitle('Powder Coating - Big Batch');
                } else if (powder === 'powder-small-batch') {
                    setPageTitle('Powder Coating - Small Batch');
                } else {
                    setPageTitle('Powder Coating - Main Line');
                }
    
                getJobsBayData();
            } else {
                getJobsBayData();
            }
    
            getColours();
            getColours();
        }
    }, [jobItem]);

    // To set a loading when navigate to other bays
    useEffect(() => {
        setKanbanColumns([]);
        setKanbanData({});
        setData([]);
    }, [powder]);

    useEffect(() => {
        getLocation().then(res => {
            if (res.data.data !== undefined) {
                setLocationData(res.data.data)
            }
        })
    }, []);

    // //check for holidays and weekends
    // const convertWeekend = (value) => {
    //     /** Check if holiday */
    //     let date = moment(value);
    //     let day = date.date();
    //     let month = date.month() + 1;
    //     let year = date.year();
    //     let daysInMonth = moment(`${year}-${month}`).daysInMonth();
    //     // while (checkHolidays(`${month}/${day}`)) {
    //     //     day++;
    //     //     if (day === daysInMonth) {
    //     //         day = 1;
    //     //         month++;
    //     //     }

    //     //     if (month === 12) {
    //     //         month = 1;
    //     //         year++;
    //     //     }
    //     // }
    //     /** Check if the day is weekend */
    //     day ++
    //     if (day === daysInMonth) {
    //         day = 1;
    //         month++;
    //     }
    //     if (month === 12) {
    //         month = 1;
    //         year++;
    //     }
    //     let numericDayValue = moment(`${year}-${month}-${day}`).day();
    //     while ( numericDayValue === 0) {
    //         day++;
    //         numericDayValue++;
    //         if (numericDayValue === 7) numericDayValue = 0;
    //     }

    //     return moment(`${year}-${month}-${day}`).format('YYYY-MM-DD');
    // };

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

    const handleComment = (value, object_type) => {
        setShowCommentModal(true);
        setCommentObjectType(object_type);
        setCommentObjectId(value.jobId);
        setCommentData(value.comments)
    };

    const handleCloseCommentModal = () => {
        setShowCommentModal(false);
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

    const onChange = (dates) => {
        const [start, end] = dates;
        setFilterStartDate(start);
        setFilterEndDate(end);
        handleRefreshData();
    };

    const handleUpdateStatusModal = async () => {
        if (selectedItems.length <= 0) {
            showAlert('error', 'Nothing to update');
            return;
        }

        if (selectedStatus === '') {
            showAlert('error', 'Please select a status');
            return;
        }

        setIsLoading(true);

        let hasError = false;
        for (let index = 0; index < selectedItems.length; index++) {
            await updateBayJobStatus({ powder_status: selectedStatus }, selectedItems[index]).catch(() => {
                hasError = true;
            });
        }

        if (hasError) showAlert('error', 'Failed to update status');
        else {
            showAlert('success', 'Successfully updated').then(res => {
                if (res.isConfirmed) {
                    if (selectedStatus.toLowerCase() == 'complete') {
                        setSelectedJobId(selectedItems)
                        setShowLocation(true)
                    }
                }
            })
        }

        handleRefreshData();
        handleCloseStatusModal();
        setSelectedItems([]);
        setSelectedStatus('');
        setIsLoading(false);
        return;
    };

    const getSelectedViewData = (kanbanJobs) => {
        const selectedId = paramSelected.get('id');
        let foundJob = '';
        for (let bayIndex of Object.keys(kanbanJobs)) {
            const jobs = kanbanJobs[bayIndex].data;
            foundJob = jobs.find((elem) => elem.jobId == selectedId);
            if (foundJob !== undefined) {
                foundJob.selected = true;
                break;
            }
        }

        return kanbanJobs;
    };

    /* Bay Search Filter Modal */
    const searchFunctionOnChange = (dataToformat) => {
        getKanbanBayData(dataToformat)
        getTableBayData(dataToformat) 
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
            <div
                className={styles.headerContainer}
                style={{ width: `calc(100vw - ${isMenuExpanded ? SIDE_MENU_EXPANDED_WIDTH : SIDE_MENU_CONTRACTED_WIDTH})` }}
            >
                <div style={{ marginLeft: 40 }}>
                    <PageTitle title={pageTitle} />
                </div>
                <div className={styles.headerActions}>
                    <PageSearchBar dataKanban={dataKanban} handleSearchPageData={handleChangeData}/>
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

            <div className={styles.newContentContainer}>
                <div className='mb-2'>
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
                <div className='' style={{ float: 'right' , marginBottom: '5px'}}>
                    {selectedItems.length > 0 ? (
                        <Button style={{borderRadius: 'unset' ,margin:'5px'}} variant='success' onClick={handleUpdateStatus}>
                        Change Status
                    </Button>
                    ) : (
                        ''
                    )}
                </div>
                {/* Need to check for kanbanColumns too to avoid loading show up after edit job*/}
                {isLoadingData && !kanbanColumns.length ? (
                    <div className='loading-container'>
                        <Oval color='#fff' height={80} width={80} />
                    </div>
                ) : viewType === 'table' ? (
                    <DragDropTable
                        columns={columns}
                        expandedRowStyle={{ padding: '0px', paddingLeft: '50px' }}
                        ExpandedComponent={({ data }) => <LineItemTable data={data} handleRefreshData={() => {}} bay={bay} title={bay}/>}
                        tableData={data}
                        setTableData={setData}
                        bay={bay}
                        setSelectedJobData={setSelectedJobData}
                        setIsSchedule={setIsSchedule}
                        setShow={setShow}
                        handleRefreshData={handleRefreshData}
                    />
                ) : kanbanError === null ? (
                    <div className={styles.kanbanComponentWrapper}>
                        <DragDropContext
                            onDragEnd={(result) => onDragEnd(result, kanbanData, setKanbanData, (value) => jobCardRef.current.calculateBaysDate(value), bay)}
                        >
                            {kanbanColumns.map((title, idx) => {
                                return (
                                    <div key={idx}>
                                        <JobCardList
                                            title={title}
                                            itemData={kanbanData[title]}
                                            style={{ marginBottom: '15px', alignItems: 'flex-start' }}
                                            handleRefreshData={handleRefreshData}
                                            ref={jobCardRef}
                                            dragDisabled={!allowModify}
                                            bay={bay}
                                            handleSelectDate={handleSelectDate}
                                            handleKanbanDownloadJobLabel={handleKanbanDownloadJobLabel}
                                            kanbanData={kanbanData}
                                            user={user}
                                            setEditJobModal={setIsEditJob}
                                            handleEditJob={handleEditJob}
                                            selectedJobCard={selectedJobCard}
                                            setSelectedJobCard={setSelectedJobCard}
                                            locationData={locationData}
                                        />
                                    </div>
                                );
                            })}
                        </DragDropContext>
                    </div>
                ) : (
                    // <div>{kanbanError}</div>
                    <></>
                )}
            </div>

            <BaySearchFilterModalModule
                showModal={modalVal}
                handleClose={() => setModalVal(false)}
                kanbanJobLists={kanbanDataToFilter}
                onChange={searchFunctionOnChange}
                parentFunctionName="powder"
            />

            <Modal show={showStatusModal} size='sm' backdrop='static' centered>
                <Modal.Body>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <select
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                            }}
                            className={styles.select}
                        >
                            <option selected>--Select Job Status--</option>
                            <option value='In Progress'>In Progress</option>
                            <option value='Complete'>Complete</option>
                        </select>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button  style={{borderRadius: 'unset'}} variant='primary' onClick={handleUpdateStatusModal} disabled={isLoading ? true : false}>
                        Submit
                    </Button>
                    <Button  style={{borderRadius: 'unset'}} variant='dark' onClick={handleCloseStatusModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
            
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

export default PowderBay;
