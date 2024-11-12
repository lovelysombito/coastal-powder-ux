import { forwardRef, useCallback, useContext, useEffect, useState } from 'react';
import styles from './index.module.css';
import { DateTime } from 'luxon';
import { DragDropContext } from 'react-beautiful-dnd';
import DatePicker from "react-datepicker";
import 'react-datepicker/dist/react-datepicker.css';
import { Oval } from 'react-loader-spinner';
import { getAllColours, getDashboard, jobLabel, getLocation } from '../../../server';
import { generateDataBasedOnSelectedDate, handleCheckDateIfWeekendOrHoliday, handleGetBayJobStatus, handleGetBayValues } from '../../../utils/utils';
import JobCardDashboard from '../../common/job-card-dashboard/index';
import EditJobModal from '../../common/job-card/EditJobModal';
import InvoiceModal from '../../common/modal/Index';
import PageTitle from '../../common/page-title';
import { UserContext } from '../../../context/user-context';
import { FaFilter } from 'react-icons/fa';
import BaySearchFilterModalModule from '../bay-search-filter-modal-module';
import PageSearchBar from '../../common/page-search-bar';
import { webContext } from '../../../context/websocket-context';

const Dashboard = () => {
    const { user } = useContext(UserContext);
    const [isGettingData, setIsGettingData] = useState(true);
    const [kanbanData, setKanbanData] = useState([]);
    const [kanbanColumns, setKanbanColumns] = useState([]);
    const [kanbanError] = useState(null);
    const handleRefreshData = useCallback(() => setIsGettingData(!isGettingData), [isGettingData]);
    const [selectedJobData, setSelectedJobData] = useState([])
    const [isSchedule, setIsSchedule] = useState(false);
    const [show, setShow] = useState(false);
    const [filterStartDate, setFilterStartDate] = useState(new Date());
    const [filterEndDate, setFilterEndDate] = useState(DateTime.now().plus({days:7}).toJSDate());
    const [isEditJob, setIsEditJob] = useState(false);
    const [currentJobEditing, setCurrentJobEditing] = useState({});
    const [colours, setColours] = useState([])
    const [isLoading, setIsLoading] = useState(true);
    const [selectedJobCard, setSelectedJobCard]= useState('')
    const [locationData, setLocationData] = useState([])
   
    const [modalVal, setModalVal] = useState(false);
    const [kanbanDataToFilter, setKanbanDataToFilter] = useState([]);
    const [dataKanban, setDataKanban] = useState([])
    const handleChangeData = (newData) =>  {setKanbanData(newData)}


    const CustomDatePicker = forwardRef(({ value, onClick }, ref) => (
        <button className={styles.customCalendar} onClick={onClick} ref={ref}>
            {value}
        </button>
    ));

    const handleEditJob = useCallback((job) => {
        setIsEditJob(true);
        setCurrentJobEditing(job)
    }, []);

    const handleClose = () => setShow(false);
    const { jobItem } = useContext(webContext);

    const loadDashboardData = useCallback(async () => {
        setIsLoading(true);
        let end_date = DateTime.fromJSDate(filterEndDate);
        if (end_date.isValid) {
            end_date = end_date.toFormat('yyyy-LL-dd')}
        else {
            end_date = null;
        }

        let start_date = DateTime.fromJSDate(filterStartDate);
        if (start_date.isValid) {
            start_date = start_date.toFormat('yyyy-LL-dd')
        }
        else {
            start_date = null;
        }

        getDashboard({ start_date, end_date }).then(res => {
            console.log('res', res);
            let kanbanJobLists = res.data.jobs;
            // setKanbanJobListsData(kanbanJobLists)
            setKanbanDataToFilter(kanbanJobLists)
            getKanbanBayData(kanbanJobLists)
        })
            .catch(() => {
                // setKanbanError(err.response.data.errors);
                let lastKey = DateTime.now().minus({ days: 1 }).toFormat('yyyy-LL-dd');
                let kanbanJobs = [];
                for (let index = 0; index < 14; index++) {
                    let newKey = handleCheckDateIfWeekendOrHoliday(lastKey)
                    kanbanJobs[newKey] = {
                        data: [],
                    }

                    lastKey = newKey
                }
                setKanbanColumns(Object.keys(kanbanJobs));
                setKanbanData(kanbanJobs);
                setIsLoading(false);
            });
    }, [filterEndDate, filterStartDate]);

    const getColours = async () => {
        getAllColours().then(res => {
            setColours(res.data.message.sort(function (a, b) { return a.name.localeCompare(b.name) }).map(colour => ({ value: colour.name, label: colour.name })));
        }).catch(error => {
            console.error(error)
        });
    }

    const getKanbanBayData = useCallback(
        (kanbanJobLists) => {
            let kanbanJobs = [];
            for (let index = 0; index < Object.keys(kanbanJobLists).length; index++) {
                let key = Object.keys(kanbanJobLists)[index];
                let currentJobs = kanbanJobLists[key];
                let tempArrayJobs = [];

                for (let i = 0; i < currentJobs.length; i++) {
                    let kanbanJobComments = [];
                    if (currentJobs[i].job_comments.length > 0) {
                        for (let c = 0; c < currentJobs[i].job_comments.length; c++) {
                            kanbanJobComments.push({
                                comment: currentJobs[i].job_comments[c].comment,
                                commentId: currentJobs[i].job_comments[c].comment_id,
                                parentId: currentJobs[i].job_comments[c].parent_id,
                            });
                        }
                    }

                    let location = (currentJobs[i].location !== null) ? currentJobs[i].location.location : currentJobs[i].other_location

                    tempArrayJobs.push({
                        status: currentJobs[i].job_status,
                        invoiceNumber: currentJobs[i].job_title,
                        jobId: currentJobs[i].job_id,
                        priority: 0,//kanbanJobLists[index][key][i].priority,
                        details: {
                            customer: currentJobs[i].deal.client_name,
                            colour: currentJobs[i].colour,
                            material: currentJobs[i].material,
                            date: currentJobs[i].deal.promised_date,
                            poNumber: currentJobs[i].deal.po_number,
                            amount: currentJobs[i].amount,
                            poLink: currentJobs[i].deal.file_link,
                            process: currentJobs[i].treatment,
                            bay: currentJobs[i].bay,
                            location: location
                        },
                        bayDates: handleGetBayDates(currentJobs[i]),
                        bays: handleGetBayValues(currentJobs[i]),
                        bayStatus: handleGetBayJobStatus(currentJobs[i]),
                        baysValue: handleGetBayValues(currentJobs[i]),
                        comments: kanbanJobComments,
                        lineitems: currentJobs[i].lines,
                    });
                }

                if (key.toLowerCase().includes('ready')) {
                    key = 'Ready to Schedule';
                    kanbanJobs[key] = {
                        data: tempArrayJobs,
                    };
                } else {
                    kanbanJobs[key] = {
                        data: tempArrayJobs,
                        // Unranked: tempArrayJobs.filter((item) => item.priority === -1),
                        // Ranked: tempArrayJobs.filter((item) => item.priority !== -1),
                    };
                }
            }

            const { days: numberOfDays } = DateTime.fromJSDate(filterEndDate).diff(DateTime.fromJSDate(filterStartDate), 'days').toObject();
            
            if (!isNaN(numberOfDays)) {
                kanbanJobs = generateDataBasedOnSelectedDate(kanbanJobs, numberOfDays, filterStartDate, 'dashboardkanban');
            } else {
                kanbanJobs = generateDataBasedOnSelectedDate(kanbanJobs, 7, filterStartDate, 'dashboardkanban');
            }

            setKanbanColumns(Object.keys(kanbanJobs));
            setDataKanban(kanbanJobs)
            setKanbanData(kanbanJobs);
            setIsLoading(false);
            
        },
        [filterEndDate, filterStartDate]
    );

    useEffect(() => {
        loadDashboardData();
        getColours()
    }, [isGettingData, loadDashboardData]);

    useEffect(() => {
        if (jobItem !== null && jobItem.message === 'job event call') {
            loadDashboardData();
            getColours()
        }
    }, jobItem)

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

    const handleSelectDate = (value) => () => {
        setSelectedJobData(value);
        setIsSchedule(true)
        setShow(true)
    }

    const handleKanbanDownloadJobLabel = (value) => () => {
        jobLabel(value.jobId).then(res => {
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${value.invoiceNumber}.pdf`); //or any other extension
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }).catch(err => {
            console.log(err);
        })
    }


    const onDateFilterChange = (dates) => {
        const [start, end] = dates;
        setFilterStartDate(start);
        setFilterEndDate(end);
        if (start !== null && end !== null) {
            handleRefreshData();
        }

    };

    const onChange = (dataToformat) => { getKanbanBayData(dataToformat) }

    return (
        <>
            <EditJobModal
                isEditJob={isEditJob}
                setIsEditJob={setIsEditJob}
                colours={colours}
                job={currentJobEditing}
                handleRefreshData={handleRefreshData}
            />

            {(isSchedule && show) ? <InvoiceModal data={selectedJobData} show={show} handleClose={handleClose} handleRefreshData={handleRefreshData} /> : ''}
            <div className={styles.headerContainer}>
                <PageTitle title='Dashboard' />
                <div className={styles.headerActions}>
                    <PageSearchBar dataKanban={dataKanban} handleSearchPageData={handleChangeData}/>
                    <span onClick={() => setModalVal(true)}><FaFilter /></span>
                </div>
                
            </div>

            <div className={styles.headerContainer} style={{ "margin-bottom": "30px"}}>
                <div>
                    <DatePicker dateFormat='dd/MM/yyyy' selected={filterStartDate} startDate={filterStartDate} endDate={filterEndDate} onChange={onDateFilterChange} selectsRange customInput={<CustomDatePicker />} />
                </div>
            </div>

            <div className={styles.contentContainer}>
            {isLoading && !kanbanColumns.length ? (
                <div className='loading-container'>
                    <Oval color='#fff' height={80} width={80} />
                </div>
            ) : (
                kanbanError == null ? (
                    <>
                        <div className={styles.kanbanComponentWrapper}>
                            <DragDropContext>
                                {kanbanColumns.sort((a, b) => a === 'Ready to Schedule' ? -1 : (b === 'Ready to Schedule' ? 1 : (a < b ? -1 : 1))).map((title, idx) => {
                                    return (
                                        <div key={idx}>
                                            <JobCardDashboard
                                                title={title}
                                                itemData={kanbanData[title]}
                                                style={{ marginBottom: '15px', alignItems: 'flex-start' }}
                                                handleRefreshData={handleRefreshData}
                                                dragDisabled
                                                handleSelectDate={handleSelectDate}
                                                handleKanbanDownloadJobLabel={handleKanbanDownloadJobLabel}
                                                kanbanData={kanbanData}
                                                setEditJobModal={setIsEditJob}
                                                handleEditJob={handleEditJob}
                                                selectedJobCard={selectedJobCard}
                                                setSelectedJobCard={setSelectedJobCard}
                                                user={user}
                                                locationData={locationData}
                                            />
                                        </div>
                                    );
                                })}
                            </DragDropContext>
                        </div>
                    </>
                ) : (
                    // <div>{kanbanError}</div>
                    <>

                    </>
                )
            )}
            </div>

            <BaySearchFilterModalModule
                showModal={modalVal}
                handleClose={() => setModalVal(false)}
                kanbanJobLists={kanbanDataToFilter}
                onChange={onChange}
                parentFunctionName="dashboard"
            />
            
        </>
    );
};

export default Dashboard;
