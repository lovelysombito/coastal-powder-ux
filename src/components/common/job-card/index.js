import { forwardRef, Fragment, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import Card from 'react-bootstrap/Card';
import Modal from 'react-bootstrap/Modal';
import { ALLOW_MODIFY_CARD_SCOPE, BAY_ARRAY_DETAIL, SCOPE } from '../../../constants';
// import holidays from '../../../Holidays';
import { DateTime } from 'luxon';
import { Button } from 'react-bootstrap';
import { MdAddCircleOutline } from 'react-icons/md';
import { Oval } from 'react-loader-spinner';
import useUserScope from '../../../hooks/useUserScope';
import { addComment, updateBayJobPriority, updateJobs, getUsers } from '../../../server';
import { convertWeekend, getBayPeriod, numberWithCommas, showAlert, showConfirmation, statusColour } from '../../../utils/utils';
import LineItemTable from '../lineitem-table';
import InvoiceModal from '../modal/Index';
import styles from './index.module.css';
import JobCard from './JobCard';
import { useBoolean } from '../../../hooks';
import OverrideQCModal from '../modal/OverrideQCModal';
import { MentionsInput, Mention } from 'react-mentions'
import defaultStyle from '../react-mentions/defaultStyle';


const JobCardList = forwardRef(({ title, itemData = {}, style, bay = null, handleRefreshData, dragDisabled, handleSelectDate, handleKanbanDownloadJobLabel, kanbanData, user, setEditJobModal, handleEditJob,  selectedJobCard, setSelectedJobCard, locationData }, ref) => {

    const userScope = useUserScope();
    const allowModify = ALLOW_MODIFY_CARD_SCOPE.includes(userScope);
    const [show, setShow] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const handleCloseModal = () => setShowModal(false);
    const [isSchedule, setIsSchedule] = useState(false);
    const [selectedJobData, setSelectedJobData] = useState(null);
    const [selectedData, setSelectedData] = useState({});
    const [selectedDataDetails, setSelectedDataDetails] = useState([]);
    const [selectedDataComments, setSelectedDataComments] = useState([]);
    const [selectedDataBays, setSelectedDataBays] = useState([]);
    const [selectedColour, setSelectedColour] = useState();
    const [jobAmount, setJobAmount] = useState(0);
    const [newPriorityList, setNewPriorityList] = useState(null);
    const [lineItemsCount, setLineItemsCount] = useState(0)
    const [selectedScheduleData, setSelectedScheduleData] = useState(null);
    const [totalComments, setTotalComments] = useState(0);
    const [addingComment, setAddingComment] = useState(false);
    const [groupReplies, setGroupReplies] = useState([])
    const [displayEditor, setDisplayEditor] = useState("none");
    const [isReply, setIsReply] = useState(false);
    const [comment, setComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [commentParentId, setCommentParentId] = useState("");
    const [jobId, setJobId] = useState("");
    const [selectedDataByQR, setSelectedDataByQR] = useState([]);
    const [showOverrideQCModal, toggleOverrideQCModal] = useBoolean(false);
    const [users, setUsers] = useState([]);
    const [mentionedUsers, setMentionedUsers] = useState([]);   
    let originTargetItem = null;

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

    useImperativeHandle(ref, () => ({
        calculateBaysDate({ targetItem, dropZoneDate, listWithNewPriority }) {
            originTargetItem = JSON.parse(JSON.stringify(targetItem));
            setNewPriorityList(listWithNewPriority);
            calculateBaysDateDetails(targetItem, bay, dropZoneDate, listWithNewPriority);
        }
    }));

    useEffect(() => {
        let amount = 0;
        const allJobs = Object.keys(itemData).reduce((acc, curr) => ([...acc, ...itemData[curr]]), []);
        allJobs.forEach(item => {
            amount += parseFloat(item.details.amount) !== 'NaN' ? parseFloat(item.details.amount) : 0;
        });
        setJobAmount(amount);
    }, [itemData]);

    // Update modal data after save
    useEffect(() => {
        if (showModal) {
            const allJobs = Object.values(kanbanData).reduce((acc, curr) => ([...acc, ...Object.keys(curr).reduce((acc2, curr2) => ([...acc2, ...curr[curr2]]), [])]), []);
            const newData = allJobs.find(item => item.jobId === selectedData.jobId);
            if (newData) {
                setSelectedData(newData);
                scheduleData(newData);
            }
        }
    }, [itemData]);

    useEffect(() => {
        const allJobs = Object.keys(itemData).reduce((acc, curr) => ([...acc, ...itemData[curr]]), []);
        const item = allJobs.find(item => item.selected == true);
        if (item !== undefined) {
            setJobId(item.jobId)
            scheduleData(item)
            setSelectedData(item);
            setSelectedDataDetails(item.details);
            setSelectedColour(item.color);
            setLineItemsCount(item.lineitems.length)
            setSelectedDataByQR(item)
            setShowModal(true);
            window.location.hash = `#${item.jobId}`
        }
    }, [])

    const handleInvoiceData = (item) => {
        setJobId(item.jobId)
        scheduleData(item)
        setSelectedData(item);
        setSelectedDataDetails(item.details);
        formatComments(item.comments)
        setSelectedDataBays(item.bays);
        setSelectedColour(item.color);
        setLineItemsCount(item.lineitems.length)
        setShowModal(true);
        setSelectedJobCard(item.jobId)
    };

    const formatComments = (comments) => {

        let parentComments = []
        let replyContainer = []

        if (comments.length > 0) {
            for (let comment_index = 0; comment_index < comments.length; comment_index++) {
                const comment = comments[comment_index];

                let comment_exists_index = parentComments.findIndex(elem => elem.commentId === comment.commentId)
                let reply_exists_index = replyContainer.findIndex(elem => elem.commentId === comment.commentId)

                if ((comment_exists_index < 0) && (reply_exists_index < 0)) {
                    if (!comment.parentId) {
                        parentComments.push(comment)
                    } else {
                        replyContainer.push(comment)
                    }
                }
            }

            var groupBy = function (xs, key) {
                return xs.reduce(function (rv, x) {
                    (rv[x[key]] = rv[x[key]] || []).push(x);
                    return rv;
                }, {});
            };

            var grouped_replies = groupBy(replyContainer, "parentId");
            var total_comments = parentComments.length + replyContainer.length

            setTotalComments(total_comments)
            setGroupReplies(grouped_replies)
            setSelectedDataComments(parentComments)

        } else {
            setGroupReplies([])
            setSelectedDataComments([])
            setTotalComments(0)
        }

    }

    const calculateBaysDateDetails = async (targetItem, bay, dropZoneDate, listWithNewPriority) => {
        const bayKeys = BAY_ARRAY_DETAIL.map(item => item.key);
        const currentBayKey = `${bay}Date`;
        const currentBayEndKey = `${bay}DateEnd`;
        let continueRun = true;

        // Show confirmation if current bay is on multiple dates
        if (targetItem.bays[currentBayEndKey]) {
            await showConfirmation({
                icon: 'question',
                message: 'This job was previously scheduled on multiple dates for this bay. Do you want to schedule it on single day?',
                confirmButtonText: 'Yes',
                showDenyButton: true,
                denyButtonText: 'No',
                reject: () => continueRun = false,
            })
        }
        if (!continueRun) {
            handleRefreshData();
            return;
        }
        targetItem.bays[currentBayEndKey] = null;
        targetItem.bays[currentBayKey] = dropZoneDate;
        const jobCardBays = Object.keys(targetItem.bays).filter(key => bayKeys.includes(key) && !['NA', 'Awaiting schedule', null].includes(targetItem.bays[key]));
        const jobCardBaysInOrder = bayKeys.filter(key => jobCardBays.includes(key));
        const currentBayIndex = jobCardBaysInOrder.indexOf(currentBayKey);
        let dateToCompare = DateTime.fromISO(dropZoneDate);
        const modifyEndDate = (key, newStartDate) => {
            const {days: dateDiff} = DateTime.fromISO(newStartDate).diff(DateTime.fromISO(targetItem.bays[key]), 'days').toObject();
            if (targetItem.bays[`${key}End`] && DateTime.fromISO(newStartDate) > DateTime.fromISO(targetItem.bays[`${key}End`])) {
                targetItem.bays[`${key}End`] = convertWeekend(DateTime.fromISO(targetItem.bays[`${key}End`]).plus({ days: dateDiff }).toFormat('yyyy-MM-dd'));
            }
        }
        jobCardBaysInOrder.forEach((key, index) => {
            if (index !== currentBayIndex) {

                const isBefore = DateTime.fromISO(targetItem.bays[key]) < dateToCompare;
                const isAfter = DateTime.fromISO(targetItem.bays[key]) > dateToCompare;

                if (index < currentBayIndex && (isAfter || targetItem.bays[key] === null)) {
                    // Is today
                    if (DateTime.fromISO(DateTime.now().toFormat('yyyy-MM-dd')).hasSame(dateToCompare)) {
                        modifyEndDate(key, dropZoneDate);
                        targetItem.bays[key] = dropZoneDate;
                    } else {
                        const newStartDate = convertWeekend(dateToCompare.plus({ days: -1 }).toFormat('yyyy-MM-dd'), currentBayIndex > index);
                        modifyEndDate(key, newStartDate);
                        targetItem.bays[key] = newStartDate;
                        dateToCompare = DateTime.fromISO(targetItem.bays[key]);
                    }
                } else if (index > currentBayIndex && (isBefore || targetItem.bays[key] === null)) {
                    const newStartDate = convertWeekend(dateToCompare.plus({ days: 1 }).toFormat('yyyy-MM-dd'), currentBayIndex > index);
                    modifyEndDate(key, newStartDate);
                    targetItem.bays[key] = newStartDate;
                    dateToCompare = DateTime.fromISO(targetItem.bays[key]);
                }
            } else dateToCompare = DateTime.fromISO(dropZoneDate);

        })
        saveOrOpenModal(targetItem, listWithNewPriority)
    }

    const saveOrOpenModal = (targetItem, listWithNewPriority) => {
        const changedBays = [];
        for (const key in targetItem.bays) {
            if (targetItem.bays[key] !== originTargetItem.bays[key]) {
                changedBays.push({ [key]: targetItem.bays[key] });
            }
        }
        // If there is any bay that before today, reset all dates and show a popup
        for (const item of changedBays) {
            const value = Object.values(item)[0];
            const isBefore = DateTime.fromISO(value)< (DateTime.fromISO(DateTime.now().toFormat('YYYY-MM-DD')));
            if (isBefore) {
                setSelectedJobData({ ...originTargetItem, dueDate: targetItem.details.date });
                setIsSchedule(true);
                setShow(true);
                handleRefreshData();
                return;
            }
        }
        if (changedBays.length === 1) {
            const details = BAY_ARRAY_DETAIL.reduce((acc, curr) => {
                const bayDate = DateTime.fromISO(targetItem.bays[curr.key], 'YYYY-MM-DD');
                if (bayDate.isValid) return { ...acc, [curr.databaseKey]: DateTime.fromJSDate(new Date(targetItem.bays[curr.key])).toISODate() };
                else return { ...acc }
            }, {});

            updateJobs(details, targetItem.jobId).then(async res => {
                // Update the priority of list
                listWithNewPriority && await Promise.all(listWithNewPriority.map((item) => updateBayJobPriority({ [`${bay}_priority`]: item[`${bay}_priority`] }, item.jobId)));
                handleRefreshData();
                return showAlert('success', res.data.msg)
            }).catch(err => {
                return showAlert('error', err)
            })
        } else {
            setSelectedJobData({ ...targetItem, dueDate: targetItem.details.date });
            setIsSchedule(true);
            setShow(true);
        }
    }

    const handleClose = () => {
        handleRefreshData();
        setShow(false)
    }

    const listItems = useMemo(
        () =>
            Object.keys(itemData).reduce((acc, curr) => {
                return {
                    ...acc,
                    [curr]: itemData[curr]
                        .sort((a, b) => (parseInt(a.jobId) > parseInt(b.jobId) ? 1 : -1)) // sort for unrank and ready to schedule to avoid cards jump
                        .sort((a, b) => (a[`${bay}_priority`] > b[`${bay}_priority`] ? 1 : -1))
                        .map((item, index2) => {
                            let { invoiceNumber, status, bayDates, bayStatus, jobId } = item;
                            let selectedBay = '';
                            if (bayDates !== undefined) {
                                selectedBay = `${bay}Date`;
                            }

                            if (selectedBay === 'chemDate') {
                                selectedBay = 'Chem Bay';
                                // selectedBayForJobCard = 'chemBay'
                            }

                            if (selectedBay === 'treatmentDate') {
                                selectedBay = 'Treatment Bay';
                                // selectedBayForJobCard = 'treatmentBay'
                            }

                            if (selectedBay === 'burnDate') {
                                selectedBay = 'Burn Bay';
                                // selectedBayForJobCard = 'burnBay'
                            }

                            if (selectedBay === 'blastDate') {
                                selectedBay = 'Blast Bay';
                                // selectedBayForJobCard = 'blastBay'
                            }

                            if (selectedBay === 'powderDate') {
                                let bay = itemData[curr][index2].bays.powderBay;
                                let secondWord
                                if (bay === 'in progress (big batch)' || bay === 'in progress (small batch)' || bay === 'in progress (main line)') {
                                    secondWord = bay.split(" ")[2] + " " + bay.split(" ")[3].slice(0)
                                    selectedBay = `Powder - ${secondWord}`;
                                } else {
                                    // let firstWord = bay.split(" ")[0].charAt(0).toUpperCase() + bay.split(" ")[0].slice(1)
                                    selectedBay = `Powder - ${bay}`;
                                }
                            }

                            if (status !== undefined) {
                                if (bay === null) {
                                    if (
                                        status.toLowerCase() !== 'Complete'.toLowerCase() &&
                                        status.toLowerCase() !== 'Awaiting QC'.toLowerCase() &&
                                        status.toLowerCase() !== 'QC Passed'.toLowerCase()
                                    ) {
                                        // status = bayStatus[selectedBayForJobCard]
                                    }
                                } else if (bay === 'Dashboard') {
                                    if (
                                        status.toLowerCase() !== 'Complete'.toLowerCase() &&
                                        status.toLowerCase() !== 'Awaiting QC'.toLowerCase() &&
                                        status.toLowerCase() !== 'QC Passed'.toLowerCase()
                                    ) {
                                        status = bayStatus[title.split(' ')[0].toLowerCase() + title.split(' ')[1]];
                                    }
                                } else if (bay === 'powder-big-batch' || bay === 'powder-small-batch' || bay === 'powder-main-line') {
                                    if (
                                        status.toLowerCase() !== 'Complete'.toLowerCase() &&
                                        status.toLowerCase() !== 'Awaiting QC'.toLowerCase() &&
                                        status.toLowerCase() !== 'QC Passed'.toLowerCase()
                                    ) {
                                        status = bayStatus.powderBay;
                                    }
                                } else {
                                    if (
                                        status.toLowerCase() !== 'Complete'.toLowerCase() &&
                                        status.toLowerCase() !== 'Awaiting QC'.toLowerCase() &&
                                        status.toLowerCase() !== 'QC Passed'.toLowerCase()
                                    ) {
                                        status = bayStatus[bay + 'Bay'];
                                    }
                                }
                            }
                            const color = statusColour(status);
                            item.status = status;
                            item.color = color;
                            item.selectedBay = selectedBay;
                            const isSelectedDataByQR = selectedDataByQR.invoiceNumber == invoiceNumber;

                            return (
                                <JobCard
                                    key={`${jobId}--${selectedBay}`}
                                    index={index2}
                                    jobData={item}
                                    dragDisabled={dragDisabled}
                                    title={title}
                                    bay={bay}
                                    isSelectedDataByQR={isSelectedDataByQR}
                                    handleInvoiceData={handleInvoiceData}
                                    handleRefreshData={handleRefreshData}
                                    selectedJobCard={selectedJobCard}
                                    locationData={locationData}
                                />
                            );
                        }),
                };
            }, {}),
        [itemData, selectedDataByQR, isLoading, selectedJobCard,showModal]
    );


    const showEditJobModal = job => () => {
        setEditJobModal(false);
        setShowModal(false);
        handleEditJob(job)
    }

    const scheduleData = (value) => {
        const data = {
            amount: value.details.amount,
            bays: value.bays,
            clientName: value.details.clientName,
            colour: value.details.colour,
            comments: value.comments,
            data: value.lineitems,
            dueDate: value.details.date,
            invoiceNumber: value.invoiceNumber,
            jobId: value.jobId,
            material: value.details.material,
            poLink: value.details.poLink,
            poNumber: value.details.poNumber,
            process: value.details.process,
            status: value.status
        };
        setSelectedScheduleData(data)
    }

    const handleAddComment = () => {
        setAddingComment(true);
        setDisplayEditor("block")
        setIsReply(false)
        setComment("")
    }

    const handleReply = (commentParentId) => {
        setDisplayEditor("block")
        setComment("")
        setIsReply(true)
        setCommentParentId(commentParentId)
    }

    const handleSaveComment = () => {

        setIsLoading(true)

        let parent_id = null;
        if (isReply) {
            parent_id = commentParentId;
        } else {
            parent_id = null;
        }

        let commentData = finalizeComment(comment)

        const data = {
            user_id: user.user_id,
            parent_id: parent_id,
            object_id: jobId,
            object_type: 'JOB',
            comment: commentData.commentToSave,
            mentioned_users: commentData.newMentionedUsers,
            notification_object_type: "COMMENT"
        }

        addComment(data).then(res => {
            if (res.status === 200) {
                let new_comment = res.data.data

                const comment_data = {
                    comment: new_comment.comment,
                    commentId: new_comment.comment_id,
                    parentId: new_comment.parent_id
                }

                const allJobs = Object.keys(itemData).reduce((acc, curr) => ([...acc, ...itemData[curr]]), []);
                const item = allJobs.find(item => item.jobId === jobId);
                item.comments.push(comment_data)
                formatComments(item.comments)
                setDisplayEditor("none")
                setIsLoading(false)
                showAlert("success", "Successfully added")
                setMentionedUsers([])
            }
        }).catch((err) => {
            showAlert("error", err)
        })
    }

    const finalizeComment = (val) => {
        
        let commentToSave = "".concat(val)
        let newMentionedUsers = [].concat(mentionedUsers) 
        if(mentionedUsers.length > 0){
            for (let index = 0; index < mentionedUsers.length; index++) {
                const mentionedUser = mentionedUsers[index];

                if(commentToSave.indexOf(mentionedUser.display) < 0){
                    let userToRemoveIndex = newMentionedUsers.findIndex(elem => elem.id === mentionedUser.id)
                    newMentionedUsers.splice(userToRemoveIndex, 1);
                }
                commentToSave = commentToSave.replace(mentionedUser.display, `<b>${mentionedUser.display}</b>`);
            }
        }
        return {
            commentToSave: commentToSave,
            newMentionedUsers: newMentionedUsers
        }
    }

    const handleCancelComment = () => {
        setAddingComment(false)
        setDisplayEditor("none")
    }

    const handleComment = (e, newValue, newPlainTextValue, mentions) => {
        if(!newPlainTextValue){ setMentionedUsers([]) }
        if(mentions.length > 0){
            setMentionedUsers(elem => {
                return [
                    ...elem, 
                    mentions[0]
                ]
            })
        }

        setComment(newPlainTextValue)
    }

    return (
        <>
            {isSchedule ? <InvoiceModal data={selectedJobData} show={show} handleClose={handleClose} handleRefreshData={handleRefreshData} newPriorityList={newPriorityList} bay={bay} /> : ''}
            <div className={styles.card} style={style}>
                <div className={styles.header}>
                    <span className={styles.title}>{!DateTime.fromISO(title).invalid ? DateTime.fromISO(title).toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY) : title} {userScope === SCOPE.ADMINISTRATOR ? ` - $${numberWithCommas(jobAmount)}` : ''}</span>
                </div>

                <div style={{ width: '100%' }}>
                    {Object.keys(listItems).map((subTitle) => (
                        <Droppable key={`${title}--${subTitle}`} droppableId={`${title}--${subTitle}`}>
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef}>
                                    {(title !== 'Ready to Schedule' && bay) && <span className={styles.subTitle}>{subTitle}</span>}
                                    {listItems[subTitle].length ? (
                                        listItems[subTitle]
                                    ) : (
                                        <div className={styles.cardDataWrapper}>
                                            <div className={styles.cardDetailsItem}>Empty</div>
                                        </div>
                                    )}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>

                <Modal show={showModal} onHide={handleCloseModal} size='lg'>
                    <Modal.Body>
                        <Card>
                            <Card.Header>{selectedData.invoiceNumber} <span style={{ float: 'right', fontWeight: 'bold' }}>Due Date: {selectedDataDetails.date}</span>  </Card.Header>
                            <Card.Body>
                                <div style={{ float: 'right', display: 'flex' }}>
                                    <div className={styles.status} style={{ backgroundColor: '#808080', color: '#FFFFFF', textAlign: 'center', marginRight: 20 }}>
                                        <span>{selectedData.selectedBay}</span>
                                    </div>
                                    <span className={styles.status} style={{ textTransform: 'capitalize', backgroundColor: selectedColour }}>
                                        {(selectedDataBays[`${bay}Bay`] !== undefined) ? selectedData.status : selectedData.status}
                                    </span>
                                </div>
                            </Card.Body>
                            <Card.Body>
                                <div style={{ marginTop: "-3.1rem", display: 'inline-block' }}>

                                    <div className='mt-1'>
                                        <div className='job-details mt-1 d-inline-block p-2'>
                                            <div className={styles.cardDetailsItem}>
                                                <span className={styles.cardDetailsItemLabel}>PO Number</span>
                                                <span><a href={selectedDataDetails.poLink} target="_blank" rel="noreferrer">{selectedDataDetails.poNumber}</a></span>
                                            </div>
                                            <div className={styles.cardDetailsItem}>
                                                <span className={styles.cardDetailsItemLabel}>Colour</span>
                                                <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{selectedDataDetails.colour}</span>
                                            </div>
                                            <div className={styles.cardDetailsItem}>
                                                <span className={styles.cardDetailsItemLabel}>Material</span>
                                                <span style={{ textTransform: 'capitalize' }}>{selectedDataDetails.material}</span>
                                            </div>
                                            <div className={styles.cardDetailsItem}>
                                                {userScope === SCOPE.ADMINISTRATOR &&
                                                    <>
                                                        <span className={styles.cardDetailsItemLabel}>Amount</span>
                                                        <span>${selectedDataDetails.amount ? numberWithCommas(selectedDataDetails.amount) : ''}</span>
                                                    </>
                                                }
                                            </div>
                                            <div className={styles.cardDetailsItem}>
                                                <span className={styles.cardDetailsItemLabel}>Due Date</span>
                                                <span>{selectedDataDetails.date}</span>
                                            </div>
                                            <div className={styles.cardDetailsItem}>
                                                <span className={styles.cardDetailsItemLabel}>Process</span>
                                                <span>{selectedDataDetails.process}</span>
                                            </div>
                                            <div className={styles.cardDetailsItem}>
                                                <span className={styles.cardDetailsItemLabel}>Location</span>
                                                <span>{selectedDataDetails.location !== null ? selectedDataDetails.location : ""}</span>
                                            </div>
                                        </div>
                                        <div className='bay-dates mt-1 d-inline-block p-2'>
                                            {BAY_ARRAY_DETAIL.map(bay => (
                                                selectedData.bayStatus && selectedData.bayStatus[`${bay.id}Bay`] &&
                                                <div className={styles.cardDetailsItem} key={`bayDate-${bay.id}`} style={{justifyContent: 'flex-start'}}>
                                                    <span className={styles.cardBayDetails}>{bay.id === 'powder' ? `${bay.dateName} (${selectedData.bays.powderBay.split(" ")[0]})` : bay.dateName}</span>
                                                    <span>{getBayPeriod(selectedData.bays[`${bay.id}Date`], selectedData.bays[`${bay.id}DateEnd`])}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className='bays mt-1 d-inline-block p-2'>
                                            {BAY_ARRAY_DETAIL.map(bay => (
                                                selectedData.bayStatus && selectedData.bayStatus[`${bay.id}Bay`] &&
                                                <div className={styles.cardDetailsItem} key={`bayStatus-${bay.id}`}>
                                                    <span className={styles.cardBayDetails}>{bay.id === 'powder' ? `${bay.bayName} (${selectedData.bays.powderBay.split(" ")[0]})` : bay.bayName}</span>
                                                    <span style={{ textTransform: 'capitalize' }}>{selectedData.bayStatus[`${bay.id}Bay`]}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                        <Card className='mt-2'>
                            <Card.Header style={{ textAlign: 'left' }}>Comments ({totalComments} items)<MdAddCircleOutline onClick={handleAddComment} className={"mt-1 " + styles.floatRight} /></Card.Header>
                            <Card.Body style={{ height: ((totalComments > 3 || addingComment) ? '300px' : `${totalComments * 50}px`), overflowY: 'scroll' }}>
                                {
                                    isLoading ? <center><Oval color="#fff" height={80} width={80} /></center> :
                                        <>
                                            {
                                                selectedDataComments.map((comment, i) => {
                                                    let replies_to_render = groupReplies[comment.commentId];
                                                    return (
                                                        <>
                                                            <div key={`job-comment-${comment.commentId}`} style={{ textAlign: 'left' }}>
                                                                <div key={i} style={{ backgroundColor: '#f0f2f8', padding: '5px 15px', marginTop: '20px' }}>
                                                                    <div dangerouslySetInnerHTML={{__html: comment.comment}} />
                                                                </div>
                                                            </div>
                                                            {
                                                                replies_to_render && replies_to_render.length > 0 ? replies_to_render.map(reply => {
                                                                    return <>
                                                                        <div key={`job-comment-${reply.commentId}`} style={{ textAlign: 'left' }} className={styles.repliesDiv}>
                                                                            <div key={i} style={{ backgroundColor: '#f0f2f8', padding: '5px 15px', marginTop: '5px' }}>
                                                                                <div dangerouslySetInnerHTML={{__html: reply.comment}} />
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                }) : ""
                                                            }
                                                            <span className={styles.commentReplyIcon} onClick={() => handleReply(comment.commentId)}>Reply</span>
                                                        </>
                                                    );
                                                })
                                            }
                                            <div style={{ "display": displayEditor }}>
                                                <MentionsInput
                                                    className={'form-control mt-5 ' + styles.inputField}
                                                    style={defaultStyle}
                                                    placeholder="Type @ to mention user"
                                                    value={comment}
                                                    onChange={handleComment}
                                                >
                                                    <Mention
                                                        trigger="@"
                                                        data={users}
                                                        displayTransform={(_, display) => { return `@${display}`}}
                                                    />
                                                </MentionsInput>
                                                <button onClick={handleSaveComment} className={'btn btn-primary text-decoration-none my-3 ' + styles.inputField}>Save</button>
                                                <button onClick={handleCancelComment} className={'btn btn-danger text-decoration-none my-3 mx-2 ' + styles.inputField}>Cancel</button>
                                            </div>
                                        </>
                                }
                            </Card.Body>
                        </Card>
                        <Card className='mt-2'>
                            <Card.Header style={{ textAlign: 'left' }}>Items - {lineItemsCount}</Card.Header>
                            <Card.Body style={{ height: '300px', overflowY: 'scroll' }}>
                                {
                                    lineItemsCount > 0 ?
                                        <LineItemTable data={selectedData.lineitems} handleRefreshData={() => { }} bay={bay} title={bay}/> :
                                        'No available line items'
                                }
                            </Card.Body>
                        </Card>
                    </Modal.Body>
                    <Modal.Footer>
                        {
                            userScope === SCOPE.ADMINISTRATOR && (
                                <Button style={{borderRadius: 'unset' }} variant='success' onClick={toggleOverrideQCModal}>
                                    Move to QC
                                </Button>
                            )
                        }
                        {
                            allowModify && (
                                <Fragment>
                                    <Button style={{borderRadius: 'unset' }} variant='danger' onClick={handleSelectDate(selectedScheduleData)}>
                                        Schedule
                                    </Button>
                                    <Button style={{borderRadius: 'unset' }} variant='primary' onClick={showEditJobModal(selectedScheduleData)}>
                                        Edit
                                    </Button>
                                </Fragment>
                            )
                        }
                        <Button style={{borderRadius: 'unset' }} variant='warning' onClick={handleKanbanDownloadJobLabel(selectedScheduleData)}>Download Label</Button>
                    </Modal.Footer>
                </Modal>

                {selectedScheduleData && 
                    <OverrideQCModal
                        data={selectedScheduleData}
                        show={showOverrideQCModal}
                        handleClose={toggleOverrideQCModal}
                        handleRefreshData={handleRefreshData}
                    />
                }
            </div>
        </>
    );
});

export default JobCardList;
