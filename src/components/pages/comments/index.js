import { useEffect, useContext } from 'react';
import styles from './index.module.css';
import PageTitle from '../../common/page-title';
import { Form } from 'react-bootstrap'
import { useState } from 'react';
import Button from '../../common/button'
import { addComment, getAllComments, getUsers } from '../../../server';
import { showAlert } from '../../../utils/utils';
import { UserContext } from '../../../context/user-context';
import { MentionsInput, Mention } from 'react-mentions';
import defaultStyle from '../../common/react-mentions/defaultStyle';
import { webContext } from '../../../context/websocket-context';

const Comments = () => {
    const { jobItem } = useContext(webContext)
    const [commentVal, setCommentVal] = useState('')
    const [replyVal, setReplyVal] = useState('');
    const [comments, setComments] = useState([])
    const [commentListData, setCommentListData] = useState([])
    const [groupCommentsOjectKeys, setGroupCommentsOjectKeys] = useState([]);
    const { user } = useContext(UserContext);
    const [users, setUsers] = useState([]);
    const [mentionedUsers, setMentionedUsers] = useState([]);
    const [showComment, setShowComment] = useState("none");
    const [currentObjectId, setCurrentObjectId] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isShowContainer, setIsShowContainer] = useState(true);

    useEffect(() => {
        getAllComments().then((res) => {
            formatComments(res.data.message)
        }).catch((err) => {
            console.log("getAllComments-err", err);
        })
    }, []);

    useEffect(() => {
        if (jobItem !== null && jobItem.message === 'job event call') {
            getAllComments().then((res) => {
                formatComments(res.data.message)
            }).catch((err) => {
                console.log("getAllComments-err", err);
            })
        }
    }, [jobItem])

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
       setComments(comments)
    }, [comments]);  

    const formatComments = (commentsData) => {
        
        let comment_array = []
        if (commentsData.length > 0) {
            for (let comment_index = 0; comment_index < commentsData.length; comment_index++) {
                const comment = commentsData[comment_index];
                let comment_object = {
                    comment_id: comment.comment_id,
                    object_id: comment.object_id,
                    name: `${comment.job.deals.deal_name} ${comment.job.job_number}`,
                    comment: comment.comment,
                    users: comment.users,
                    iconColor: "orange",
                    iconInitial: comment.users.firstname.charAt(0).toUpperCase(),
                    isReply: false,
                }

                if(comment.parent_id){
                    /* reply */
                    let comment_index = comment_array.findIndex(elem => elem.comment_id === comment.parent_id)
                    if(comment_index !== -1){
                        if(!comment_array[comment_index]["replies"]){
                            comment_array[comment_index]["replies"] = []
                        } 
                        comment_array[comment_index]["replies"].push(comment_object)
                        comment_array[comment_index].isReply = false;
                    } 
                } else {
                    /* comment */
                    comment_array.push(comment_object)
                }
            }

            var groupBy = function (xs, key) {
                return xs.reduce(function (rv, x) {
                    (rv[x[key]] = rv[x[key]] || []).push(x);
                    return rv;
                }, {});
            };

            var grouped_comments = groupBy(comment_array, 'object_id');

            setGroupCommentsOjectKeys(Object.keys(grouped_comments));
            setCommentListData(grouped_comments)

            if(currentObjectId){
                setIsShowContainer(false)
                console.log("currentObjectId", currentObjectId);
                let commentData = grouped_comments[currentObjectId]
                console.log("commentData", commentData);
                setComments(commentData)
            }

            setIsSending(false)
            setReplyVal('')
            setCommentVal('')

        } else {
            setCommentListData([]);
            setIsSending(false)
        }
    }

    const ProfileIcon = ({color="green", initials, size="45px", fontSize="16px"}) => {
        return (
            <div style={{height: size, width: size, fontSize: fontSize}} className={`${styles.profileIcon} ${styles[color]}`}>
                <span>{initials}</span>
            </div>
        )
    }

    const handleClickComment = (object_id) => {
        let commentData = commentListData[object_id]
        setIsShowContainer(false)
        setCurrentObjectId(object_id)
        setShowComment("block")
        setComments(commentData)
    }

    const handleShowReplyTextField = (comment) => {
        setReplyVal('')
        let commentIndex = comments.findIndex(elem => elem.comment_id === comment.comment_id)
        comments[commentIndex].isReply = true;
        setComments([...comments])
    }

    const handleAddCommentOrReply = (comment, type) => {
        setIsSending(true)
        let comment_reply_data = {}
        let commentData = ""
        if(type === "comment"){
            commentData = finalizeComment(commentVal)
        } else {
            commentData = finalizeComment(replyVal)
        }

        comment_reply_data = {
            user_id: user.user_id,
            parent_id: type === "comment" ? null : comment.comment_id,
            object_id: type === "comment" ? comments[0].object_id : comment.object_id,
            object_type: 'JOB',
            comment: commentData.commentToSave,
            mentioned_users:commentData.newMentionedUsers,
            notification_object_type: "COMMENT"
        };

        addNewCommentFn(comment_reply_data)
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

    const addNewCommentFn = (data) => {
        addComment(data)
            .then(() => {
                setMentionedUsers([])
                // showAlert('success', 'Successfully added');
            })
            .catch((err) => {
                console.log("err", err);
                showAlert('error', err.response.data.errors.comment[0] ? err.response.data.errors.comment[0] : "Error occured while saving comment.");
            });
    };

    const onChangeReply = (e, newValue, newPlainTextValue, mentions) => {
        if(!newPlainTextValue){ setMentionedUsers([]) }
        if(mentions.length > 0){
            setMentionedUsers(elem => {
                return [
                    ...elem,
                    mentions[0]
                ]
            })
        }
        setReplyVal(newPlainTextValue)
    }

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
        setCommentVal(newPlainTextValue)
    }

    return (
        <>
            <PageTitle title="Comments"/>
            {
                groupCommentsOjectKeys.length === 0 ? <h6>No available comments</h6> : <>
                    <div className={styles.contentContainer}>
                        <div className={styles.commentList}>
                            <Form.Group className={styles.searchFieldItem}>
                                {/* <Form.Control className={styles.textField} type="text" value = { search } onChange = { (event) => { setSearch(event.target.value) } }/> */}
                            </Form.Group>
                            <div className={styles.commentListDataContainer}>
                                {   
                                    groupCommentsOjectKeys.map((object_id, idx) => {
                                        let commentData = commentListData[object_id]
                
                                        let name = commentData[0].name
                                        let lastMsg = commentData[0].lastMsg
                                        let lastMsgDate = commentData[0].lastMsgDate
                                        let unreadMsgs = commentData[0].unreadMsgs
                                        let iconColor = commentData[0].iconColor
                                        let iconInitial = commentData[0].iconInitial
                
                                        return (
                                            <div key={idx} className={styles.commentListItem} onClick={() => handleClickComment(object_id)}>
                                                <ProfileIcon color={iconColor} initials={iconInitial}/>
                                                <div className={styles.commentListItemPreview}>
                                                    <div className={styles.commentListItemPreviewName}>
                                                        <span>{name}</span>
                                                    </div>
                                                    <div className={styles.commentListItemPreviewComment}>
                                                        <span>{lastMsg}</span>
                                                    </div>
                                                </div>
                                                <div className={styles.commentListItemOtherInfo}>
                                                    <div className={styles.commentListItemPreviewDate}>
                                                        <span>{lastMsgDate}</span>
                                                    </div>
                                                    {unreadMsgs > 0 ? 
                                                    <div className={styles.commentListItemPreviewUnread}>
                                                        <span>{unreadMsgs}</span>
                                                    </div>
                                                    :""}
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>
                        <div className={styles.comments} hidden={isShowContainer}>
                            <div className={styles.commentsHeader}>
                                <div className={styles.commentsHeaderInfo}>
                                    <span className={styles.commentsHeaderName}>{ comments[0] ? comments[0].name : ''}</span>
                                </div>
                            </div>
                            <div className={styles.commentsContents}>
                                {
                                    comments.map((comment,idx) => {
                                        let initialIcon = comment.users ? comment.users.firstname.charAt(0).toUpperCase() : "";
                                        return (
                                            <>
                                                <div className={styles.commentCardBody + " card"}>                                       
                                                    <div className="card-body">
                                                        <div key={idx} className={styles.commentItem}>
                                                            <ProfileIcon initials={initialIcon}/>
                                                            <div className={styles.commentMessageInfo}>
                                                                <div className={styles.commentMessage}>
                                                                    <div dangerouslySetInnerHTML={{__html: comment.comment}} />
                                                                </div>    
                                                                <span className={styles.commentReplyIcon} onClick={() => {handleShowReplyTextField(comment)}}>Reply</span>    
                                                            </div>
                                                        </div>
                                                        {
                                                            comment.replies ? comment.replies.map((reply, key) => {
                                                                let initialIconReply = reply.users ? reply.users.firstname.charAt(0).toUpperCase() : "";
                                                                return <div key={idx} className={styles.replyItem}> 
                                                                    <ProfileIcon initials={initialIconReply}/>
                                                                    <div key={key} className={styles.commentMessageInfo}>
                                                                        <div className={styles.commentMessage}>
                                                                            <div dangerouslySetInnerHTML={{__html: reply.comment}} />
                                                                        </div>  
                                                                    </div>
                                                                </div>
                                                            }) : ""
                                                        }
                                                        {
                                                            comment.isReply ?  <div className={styles.commentsActions}>
                                                                <Form.Group className={styles.commentsActionsFieldGroup}>
                                                                    <MentionsInput
                                                                        className={styles.textField}
                                                                        style={defaultStyle}
                                                                        value={replyVal}
                                                                        onChange={onChangeReply}
                                                                        placeholder="Type @ to mention user"
                                                                    >
                                                                        <Mention
                                                                            trigger="@"
                                                                            data={users}
                                                                            displayTransform={(_, display) => { return `@${display}`}}
                                                                        />
                                                                    </MentionsInput>
                                                                    <Button colorVariant="green" onClick={() => handleAddCommentOrReply(comment, "reply")} disabled={isSending ? true : false}>{isSending ? "Sending" : "Reply"}</Button>
                                                                </Form.Group>
                                                            </div> : ""
                                                        }
                                                    </div>
                                                </div>
                                            </>
                                        )
                                    })}
                                
                                <div className={styles.commentsActions} style={{ "display": showComment}}>
                                    <Form.Group className={styles.commentsActionsFieldGroup}>
                                        <MentionsInput
                                            className={styles.textField}
                                            style={defaultStyle}
                                            value={commentVal}
                                            onChange={onChangeComment}
                                        >
                                            <Mention
                                                trigger="@"
                                                data={users}
                                                displayTransform={(_, display) => { return `@${display}`}}
                                            />
                                        </MentionsInput>
                                        <Button colorVariant="green" onClick={() => handleAddCommentOrReply(null, "comment")} disabled={isSending ? true : false}>{isSending ? "Sending" : "Comment"}</Button>
                                    </Form.Group>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            }
            
        </>
    )
}

export default Comments