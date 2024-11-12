import { useState, useEffect } from 'react';
import styles from './index.module.css';
import { Modal,  } from 'react-bootstrap';
import { MentionsInput, Mention } from 'react-mentions';
import defaultStyle from '../../common/react-mentions/defaultStyle';
import { addComment } from '../../../server';
import { showAlert } from '../../../utils/utils';

const TableViewComment = ({ data, showCommentModal, users, commentObjectId, commentObjectType, handleCloseCommentModal, user }) => {

    console.log("data", data);
    const [messageType, setMessageType] = useState("");
    const [commentPlaceholder, setCommentPlaceholder] = useState('');
    const [isSavingComment, setIsSavingComment] = useState(false);
    const [displayAddNewCommentEditor, setDisplayAddNewCommentEditor] = useState('none');
    const [commentParentId, setCommentParentId] = useState('');
    const [replyMessage, setReplyMessage] = useState('');
    const [commentData, setCommentData] = useState([]);
    const [mentionedUsers, setMentionedUsers] = useState([]);

    useEffect(() => {
        let comment_array = []
        if(data.length > 0){
            comment_array = data;
            for (let index = 0; index < data.length; index++) {
                
                const comment = data[index];
                let comment_index = comment_array.findIndex(elem => elem.commentId === comment.parentId)
                if(comment.parentId){
                    /* reply */
                    let comment_object = {
                        commentId: comment.commentId,
                        parentId: comment.parentId,
                        comment: comment.comment,
                        isReply: true,
                    }

                    if(comment_index >= 0){
                        if(!comment_array[comment_index]["replies"]){
                            comment_array[comment_index]["replies"] = []
                        } 
                        comment_array[comment_index]["replies"].push(comment_object)
                    } 
                } else {
                    /* comment */
                    if(comment_index >= 0){
                        comment_array[comment_index]["isReply"] = false
                    } 
                }
            }
        }

        setCommentData(comment_array);
        
    }, [data]);
    
    const handleReply = (parent_id) => {
        setMessageType("reply")
        setReplyMessage('');
        setCommentPlaceholder("Reply. Type @ to mention user")
        setDisplayAddNewCommentEditor('block');
        setCommentParentId(parent_id);
    };

    const handlAddNewCommentModal = () => {
        setMessageType("comment")
        setReplyMessage('');
        setDisplayAddNewCommentEditor('block');
        setCommentPlaceholder("Comment. Type @ to mention user")
    };

    const handleCancelReply = () => {
        setDisplayAddNewCommentEditor('none');
    };   

    const onChangeComment = (e, newValue, newPlainTextValue, mentions) => {
        if(!newPlainTextValue){ setMentionedUsers([]) }
        if(mentions.length > 0){
            setMentionedUsers(elem => {
                return [
                    ...elem,
                    mentions[0]
                ]
            })
        }
        setReplyMessage(newPlainTextValue)
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
        };
    }

    const handleSaveNewComment = () => {

       let finilizedData = finalizeComment(replyMessage)
       setIsSavingComment(true)

        const data = {
            user_id: user.user_id,
            parent_id: messageType == "reply" ? commentParentId : null,
            object_id: commentObjectId,
            object_type: commentObjectType === 'job' ? 'JOB' : 'LINE_ITEM',
            comment: finilizedData.commentToSave,
            mentioned_users:finilizedData.newMentionedUsers,
            notification_object_type: "COMMENT"
        };

        addNewCommentFn(data);

    };

    const addNewCommentFn = (data) => {
        addComment(data)
            .then((res) => {
                if (res.status === 200) {
                    let comment_object = {
                        commentId: res.data.data.comment_id,
                        parentId: res.data.data.parent_id,
                        comment: res.data.data.comment,
                        isReply: res.data.data.parent_id ? true : false,
                    }
                    if(res.data.data.parent_id){
                        let comment_index = commentData.findIndex(elem => elem.commentId === res.data.data.parent_id)
                        if(comment_index >= 0){
                            if(!commentData[comment_index]["replies"]){
                                commentData[comment_index]["replies"] = []
                            } 
                            commentData[comment_index]["replies"].push(comment_object)
                        } 
                    } else {
                        commentData.push(comment_object)
                    }

                    setCommentData([...commentData])
                    setReplyMessage("")
                    setIsSavingComment(false)
                    setDisplayAddNewCommentEditor('none');
                    showAlert('success', 'Successfully added');
                }
            })
            .catch(() => {
                showAlert('error', 'Error');
            });
    };

    return (
        <>
            <Modal show={showCommentModal} size='lg' backdrop='static'>
                <Modal.Header>Comments</Modal.Header>
                <Modal.Body>
                    <div>
                        <div className='card'>
                            <div className='card-header'>
                                <div className='row'>
                                    <div className='col-lg-6'>
                                        <h6 className='card-subtitle mb-2 text-muted'>
                                            {/* {element.firstname} {element.lastname} */}
                                        </h6>
                                    </div>
                                </div>
                            </div>
                            <div className={'card-body ' + styles.cardBody} style={{height: commentData.length > 10 ? "800px" : "150px" }}>
                                {
                                    commentData.length > 0 ? (
                                        commentData.map((element, idx) => {
                                            return (
                                                <>
                                                    <div key={idx} className={styles.commentItem}>
                                                        {/* <ProfileIcon initials="M"/> */}
                                                        <div className={styles.commentMessageInfo}>
                                                            <div className={styles.commentMessage} style={{ backgroundColor: '#f0f2f8', marginTop: '30px' }}>
                                                                <div dangerouslySetInnerHTML={{__html: element.comment}} />
                                                            </div>    
                                                            <span className={styles.commentReplyIcon} onClick={() => handleReply(element.commentId)}>Reply</span>
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'left' }} className={styles.repliesDiv}>
                                                        {
                                                            element.replies ? element.replies.map((reply) => {
                                                                // let initialIconReply = reply.users ? reply.users.firstname.charAt(0).toUpperCase() : "";
                                                                return (
                                                                    <>
                                                                        
                                                                        <div style={{ backgroundColor: '#f0f2f8', padding: '5px 15px', marginTop: "5px"}}>
                                                                            <div dangerouslySetInnerHTML={{__html: reply.comment}} />
                                                                        </div>
                                                                        
                                                                    </>
                                                                );
                                                            }) : ""
                                                        }
                                                    </div>
                                                </>
                                            )
                                        })
                                    ) : <p>No comment available</p>
                                }
                            </div>
                        </div>
                                   
                    </div>

                    {/* Add new comment text area */}
                    <div style={{ display: displayAddNewCommentEditor }}>
                        <MentionsInput
                            className={styles.textField}
                            style={defaultStyle}
                            value={replyMessage}
                            onChange={onChangeComment}
                            placeholder={commentPlaceholder}
                        >
                            <Mention
                                trigger="@"
                                data={users}
                                displayTransform={(_, display) => { return `@${display}`}}
                            />
                        </MentionsInput>
                        <button onClick={handleSaveNewComment} style={{borderRadius: 'unset' }} className='btn btn-primary text-decoration-none my-3' disabled={ isSavingComment ? true : false }>
                            { isSavingComment ? "Saving" : "Save" }
                        </button>
                        <button onClick={handleCancelReply} style={{borderRadius: 'unset' }} className='btn btn-danger text-decoration-none my-3 mx-2'>
                            Cancel
                        </button>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <button style={{borderRadius: 'unset' }} className='btn btn-primary text-decoration-none my-3' onClick={handlAddNewCommentModal}>
                        Add New
                    </button>
                    <button style={{borderRadius: 'unset' }} className='btn btn-dark text-decoration-none my-3 mx-2' onClick={handleCloseCommentModal}>
                        Close
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default TableViewComment;