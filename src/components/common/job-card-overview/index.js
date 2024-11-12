import { DateTime } from 'luxon';
import { Fragment } from 'react';
import { useEffect, useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Button } from 'react-bootstrap';
import Card from 'react-bootstrap/Card';
import Modal from 'react-bootstrap/Modal';
import { MdAddCircleOutline } from 'react-icons/md';
import { Oval } from 'react-loader-spinner';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { ALLOW_MODIFY_CARD_SCOPE, BAY_ARRAY_DETAIL, SCOPE } from '../../../constants';
import useUserScope from '../../../hooks/useUserScope';
import { addComment, getUsers } from '../../../server';
import { getBayPeriod, numberWithCommas, statusColour } from '../../../utils/utils';
import JobCard from '../job-card/JobCard';
import LineItemTable from '../lineitem-table';
import OverrideQCModal from '../modal/OverrideQCModal';
import styles from './index.module.css';
import { MentionsInput, Mention } from 'react-mentions'
import defaultStyle from '../react-mentions/defaultStyle';
import { useBoolean } from '../../../hooks';

const JobCardOverview = ({
    title,
    itemData = [],
    user,
    style,
    linkedbay,
    handleSelectDate,
    handleKanbanDownloadJobLabel,
    setEditJobModal,
    handleEditJob,
    handleRefreshData,
    kanbanData,
    selectedJobCard, 
    setSelectedJobCard,
    locationData
}) => {
    const userScope = useUserScope();
    const allowModify = ALLOW_MODIFY_CARD_SCOPE.includes(userScope);
    const [showModal, setShowModal] = useState(false);
    const handleCloseModal = () => setShowModal(false);
    const [selectedData, setSelectedData] = useState([]);
    const [selectedDataDetails, setSelectedDataDetails] = useState([]);
    const [selectedDataComments, setSelectedDataComments] = useState([]);
    const [totalComments, setTotalComments] = useState(0);
    const [addingComment, setAddingComment] = useState(false);
    const [selectedDataBays, setSelectedDataBays] = useState([]);
    const [selectedColour, setSelectedColour] = useState();
    const [jobAmount, setJobAmount] = useState(0);
    const [comment, setComment] = useState('');
    const [displayEditor, setDisplayEditor] = useState('none');
    // const [placeholder, setPlaceholder] = useState('');
    const [groupReplies, setGroupReplies] = useState([]);
    const [selectedScheduleData, setSelectedScheduleData] = useState(null);
    const [lineItemsCount, setLineItemsCount] = useState(0);
    const [isReply, setIsReply] = useState(false);
    const [commentParentId, setCommentParentId] = useState('');
    const [jobId, setJobId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [mentionedUsers, setMentionedUsers] = useState([]);
    const [showOverrideQCModal, toggleOverrideQCModal] = useBoolean(false);

    useEffect(() => {
        getUsers().then(res => {
            // console.log("users", res);
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
        let amount = 0;
        itemData.map((item) => {
            amount += parseFloat(item.details.amount) !== 'NaN' ? parseFloat(item.details.amount) : 0;
            return item;
        });
        setJobAmount(amount);
    }, [itemData]);
    
    // Update modal data after save
    useEffect(() => {
        if (showModal) {
            const allJobs = kanbanData.reduce((acc, curr) => [...acc, ...curr.invoices], []);
            const newData = allJobs.find((item) => item.jobId === selectedData.jobId);
           if (newData !== undefined) {
                setSelectedData(newData);
                scheduleData(newData);
           }
        }
    }, [itemData]);

    const handleInvoiceData = (item) => {
        formatComments(item.comments);
        scheduleData(item);
        setJobId(item.jobId);
        setSelectedData(item);
        setSelectedDataDetails(item.details);
        setSelectedDataComments(item.comments);
        setSelectedColour(item.color);
        setSelectedDataBays(item.baysValue);
        setLineItemsCount(item.lineitems.length);
        setShowModal(true);
        setSelectedJobCard(item.jobId)
    };

    const formatComments = (comments) => {
        let parentComments = [];
        let replyContainer = [];

        if (comments.length > 0) {
            for (let comment_index = 0; comment_index < comments.length; comment_index++) {
                const comment = comments[comment_index];

                let comment_exists_index = parentComments.findIndex((elem) => elem.commentId === comment.commentId);
                let reply_exists_index = replyContainer.findIndex((elem) => elem.commentId === comment.commentId);

                if (comment_exists_index < 0 && reply_exists_index < 0) {
                    if (!comment.parentId) {
                        parentComments.push(comment);
                    } else {
                        replyContainer.push(comment);
                    }
                }
            }

            var groupBy = function (xs, key) {
                return xs.reduce(function (rv, x) {
                    (rv[x[key]] = rv[x[key]] || []).push(x);
                    return rv;
                }, {});
            };

            var grouped_replies = groupBy(replyContainer, 'parentId');
            var total_comments = parentComments.length + replyContainer.length;

            setTotalComments(total_comments);
            setGroupReplies(grouped_replies);
            setSelectedDataComments(parentComments);
        } else {
            setGroupReplies([]);
            setSelectedDataComments([]);
            setTotalComments(0);
        }
    };

    const handleAddComment = () => {
        setDisplayEditor('block');
        // setPlaceholder('Add new comment');
        setIsReply(false);
        setComment('');
        setAddingComment(true);
    };

    const handleReply = (commentParentId) => {
        // setPlaceholder('Reply . . . ');
        setDisplayEditor('block');
        setComment('');
        setIsReply(true);
        setCommentParentId(commentParentId);
    };

    const handleSaveComment = () => {
        setIsLoading(true);

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
        };

        addComment(data)
            .then((res) => {
                if (res.status === 200) {
                    let new_comment = res.data.data;

                    const comment_data = {
                        comment: new_comment.comment,
                        commentId: new_comment.comment_id,
                        parentId: new_comment.parent_id,
                    };

                    const index = itemData.findIndex((index) => index.jobId === jobId);
                    itemData[index].comments.push(comment_data);

                    formatComments(itemData[index].comments);
                    setDisplayEditor('none');
                    setIsLoading(false);
                    handleMessage('success', 'Successfully added');
                    setMentionedUsers([])
                }
            })
            .catch((err) => {
                setIsLoading(false);
                handleMessage('error', err);
            });
    };

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
        setDisplayEditor('none');
        setAddingComment(false);
    };

    const handleMessage = (icon, text) => {
        Swal.fire({
            icon: icon,
            text: text,
        });
    };

    if (title === 'ready') title = 'Ready to Schedule';

    const scheduleData = (value) => {
        let arr = [];
        console.log('value', value);
        arr.push({
            amount: value.details.amount,
            bays: value.baysValue,
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
            status: value.status,
        });

        setSelectedScheduleData(arr[0]);
    };

    const showEditJobModal = (job) => () => {
        setEditJobModal(true);
        setShowModal(false);
        handleEditJob(job);
    };

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
        <div className={styles.card} style={style}>
            <Link exact to={{ pathname: linkedbay }} style={{ textDecoration: 'none' }}>
                <div className={styles.header}>
                    <span className={styles.title}>
                        {title.charAt(0).toUpperCase() + title.slice(1)} {userScope === SCOPE.ADMINISTRATOR ? ` - $${numberWithCommas(jobAmount)}` : ''}
                    </span>
                </div>
            </Link>
            <Droppable droppableId={`${title}`}>
                {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                        {itemData.map((item, index) => {
                            const { details, bayDates, bayStatus, jobId } = item;
                            let selectedBay = '';
                            let status = "Awaiting Schedule";
                            let bay = details.bay;
                            if (bayDates !== undefined) {
                                Object.values(bayDates).forEach((bay, key) => {
                                    let selectedKey = Object.keys(bayDates)[key];
                                    if (bay !== null && DateTime.fromISO(title).hasSame(bay)) {
                                        selectedBay = selectedKey;
                                    }
                                });
                            }
                            console.log(details)
                            if (details.bay?.toLowerCase() === 'chem') {
                                bay = 'chem';
                                selectedBay = 'Chem Bay';
                                status = bayStatus.chemBay;
                            }
    
                            if (details.bay?.toLowerCase() === 'treatment') {
                                bay = 'treatment';
                                selectedBay = 'Treatment Bay';
                                status = bayStatus.treatmentBay;
                            }
    
                            if (details.bay?.toLowerCase() === 'burn') {
                                bay = 'burn';
                                selectedBay = 'Burn Bay';
                                status = bayStatus.burnBay;
                            }
    
                            if (details.bay?.toLowerCase() === 'blast') {
                                bay = 'blast';
                                selectedBay = 'Blast Bay';
                                status = bayStatus.blastBay;
                            }
    
                            if (details.bay?.toLowerCase() === 'main line') {
                                bay = 'powder';
                                selectedBay = `Powder - Main Line`;
                                status = bayStatus.powderBay;
                            }
    
                            if (details.bay?.toLowerCase() === 'big batch') {
                                bay = 'powder';
                                selectedBay = `Powder - Big Batch`;
                                status = bayStatus.powderBay;
                            }
    
                            if (details.bay?.toLowerCase() === 'small batch') {
                                bay = 'powder';
                                selectedBay = `Powder - Small Batch`;
                                status = bayStatus.powderBay;
                            }
                            if (item.status === 'Awaiting QC') status = item.status;

                            const color = statusColour(status);
                            itemData[index].status = status;
                            itemData[index].color = color;
                            itemData[index].selectedBay = selectedBay;
                            return (
                                <JobCard
                                    key={`${jobId}--${selectedBay}`}
                                    index={index}
                                    jobData={item}
                                    dragDisabled={true}
                                    title={title}
                                    bay={bay}
                                    isSelectedDataByQR={null}
                                    handleInvoiceData={handleInvoiceData}
                                    handleRefreshData={handleRefreshData}
                                    currentPage='overview'
                                    selectedJobCard={selectedJobCard}
                                    locationData={locationData}
                                />
                            );
                        })}
                    </div>
                )}
            </Droppable>
            
            <Modal show={showModal} onHide={handleCloseModal} size='lg'>
                <Modal.Body>
                    <Card>
                        <Card.Header>
                            {selectedData.invoiceNumber}{' '}
                            <span style={{ float: 'right', fontWeight: 'bold' }}>
                                Due Date: {selectedDataDetails.date}
                            </span>{' '}
                        </Card.Header>  
                            <Card.Body>
                            <div style={{ float: 'right', marginTop: 0, display: 'flex' }}>
                                    {title.toLowerCase() !== 'ready to schedule' && (
                                        <div
                                            className={styles.modalStatus}
                                            style={{ backgroundColor: '#808080', color: '#FFFFFF', textAlign: 'center', marginRight: 20 }}
                                        >
                                            <span>{title}</span>
                                        </div>
                                    )}
                                    <span
                                        className={styles.modalStatus}
                                        style={{ backgroundColor: selectedColour, color: selectedColour === 'yellow' ? 'black' : 'white' }}
                                    >
                                        {selectedDataBays[title.replace(/\s+/g, '')[0].toLowerCase() + title.replace(/\s+/g, '').slice(1)] !== undefined
                                            ? selectedDataBays[title.replace(/\s+/g, '')[0].toLowerCase() + title.replace(/\s+/g, '').slice(1)].toUpperCase()
                                            : selectedData.status}
                                    </span>
                                </div>

                            </Card.Body>
                        <Card.Body>
                            
                        
                            <div style={{ marginTop:"-3.1rem" }}>
                                
                                <div className='mt-1'>
                                    <div className='job-details mt-1 d-inline-block p-2'>
                                        <div className={styles.cardDetailsItem}>
                                            <span className={styles.cardDetailsItemLabel}>PO Number</span>
                                            <span>
                                                <a href={selectedDataDetails.poLink} target='_blank' rel='noreferrer'>
                                                    {selectedDataDetails.poNumber}
                                                </a>
                                            </span>
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
                                            {userScope === SCOPE.ADMINISTRATOR && (
                                                <>
                                                    <span className={styles.cardDetailsItemLabel}>Amount</span>
                                                    <span>${selectedDataDetails.amount ? numberWithCommas(selectedDataDetails.amount) : ''}</span>
                                                </>
                                            )}
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
                                            <span>{selectedDataDetails.location !== null ? selectedDataDetails.location : ''}</span>
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
                        <Card.Header style={{ textAlign: 'left' }}>
                            Comments ({totalComments} items)
                            <MdAddCircleOutline onClick={handleAddComment} className={'mt-1 ' + styles.floatRight} />
                        </Card.Header>
                        <Card.Body style={{ height: totalComments > 3 || addingComment ? '300px' : `${totalComments * 50}px`, overflowY: 'scroll' }}>
                            {isLoading ? (
                                <center>
                                    <Oval color='#fff' height={80} width={80} />
                                </center>
                            ) : (
                                <>
                                    {selectedDataComments.map((comment, i) => {
                                        let replies_to_render = groupReplies[comment.commentId];

                                        return (
                                            <>
                                            {
                                                !comment.parentId ? <div key={`job-comment-${comment.commentId}`} style={{ textAlign: 'left' }}>
                                                    <div key={i} style={{ backgroundColor: '#f0f2f8', padding: '5px 15px', marginTop: '20px' }}>
                                                        {/* <span key={i}>{comment.comment}</span> */}
                                                        <div dangerouslySetInnerHTML={{__html: comment.comment}} />
                                                    </div>
                                                </div> : ""
                                            }
                                                {replies_to_render && replies_to_render.length > 0
                                                    ? replies_to_render.map((reply) => {
                                                          return (
                                                              <>
                                                                  <div
                                                                      key={`job-comment-${reply.commentId}`}
                                                                      style={{ textAlign: 'left' }}
                                                                      className={styles.repliesDiv}
                                                                  >
                                                                      <div
                                                                          key={i}
                                                                          style={{ backgroundColor: '#f0f2f8', padding: '5px 15px', marginTop: '5px' }}
                                                                      >
                                                                          {/* <span key={i}>{reply.comment}</span> */}
                                                                          <div dangerouslySetInnerHTML={{__html: reply.comment}} />
                                                                      </div>
                                                                  </div>
                                                              </>
                                                          );
                                                      })
                                                    : ''}
                                                {
                                                    !comment.parentId ? <div>
                                                        <span className={styles.commentReplyIcon} onClick={() => handleReply(comment.commentId)}>Reply</span>
                                                    </div> : ""
                                                }
                                               
                                            </>
                                        );
                                    })}
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
                                        <button onClick={handleSaveComment} className={'btn btn-primary text-decoration-none my-3 ' + styles.inputField}>
                                            Save
                                        </button>
                                        <button onClick={handleCancelComment} className={'btn btn-dark text-decoration-none my-3 mx-2 ' + styles.inputField}>
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                    <Card className='mt-2'>
                        <Card.Header style={{ textAlign: 'left' }}>Items - {lineItemsCount}</Card.Header>
                        <Card.Body style={{ height: '300px', overflowY: 'scroll' }}>
                            {lineItemsCount > 0 ? <LineItemTable data={selectedData.lineitems} handleRefreshData={() => {}} title='overview'/> : 'No available line items'}
                        </Card.Body>
                    </Card>
                </Modal.Body>
                <Modal.Footer>
                    {userScope === SCOPE.ADMINISTRATOR && (
                        <Button style={{borderRadius: 'unset' }} variant='success' onClick={toggleOverrideQCModal}>
                            Move to QC
                        </Button>
                    )}
                    {allowModify && (
                        <Fragment>
                            <Button style={{borderRadius: 'unset' }} variant='danger'  onClick={handleSelectDate(selectedScheduleData)}>
                                Schedule
                            </Button>
                            <Button style={{borderRadius: 'unset' }} variant='primary' onClick={showEditJobModal(selectedScheduleData)}>
                                Edit
                            </Button>
                        </Fragment>
                    )}
                    <Button style={{borderRadius: 'unset' }}variant='warning' onClick={handleKanbanDownloadJobLabel(selectedScheduleData)}>
                        Download Label
                    </Button>
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
    );
};

export default JobCardOverview;
