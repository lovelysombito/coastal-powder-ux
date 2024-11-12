import { useParams } from 'react-router-dom';
import { useState, useEffect, useContext, useRef } from 'react';
import { addComment, getCommentNotification, getUsers } from '../../../server';
import styles from './index.module.css';
import Button from '../../common/button'
import { Form } from 'react-bootstrap';
import { UserContext } from '../../../context/user-context';
import { showAlert } from '../../../utils/utils';
import { MentionsInput, Mention } from 'react-mentions'
import defaultStyle from '../../common/react-mentions/defaultStyle';

const CommentNotification = () => {
    
    const [commentVal, setCommentVal] = useState('')
    const [comments, setComments] = useState([]);
    const [mentionedUsers, setMentionedUsers] = useState([]);
    const [isReply, setIsReply] = useState(false);
    const [replyVal, setReplyVal] = useState('');   
    const { user } = useContext(UserContext);
    const [users, setUsers] = useState([]);
    const param = useParams();
    const id = param.id;
  
    const pageRef = useRef(null);

    useEffect(() => {
        let str_url = window.location.href;
        let comment_id = str_url.split('#')[1];
        document?.getElementById(`${comment_id}`)?.scrollIntoView({ behavior: 'smooth' });
    });

    useEffect(() => {
        getCommentNotificationFn(id)
    }, [id]);

    useEffect(() => {
        getUsersFn()
    }, []);

    const getCommentNotificationFn = (id) => {
        getCommentNotification(id).then(res => {
            let comment_array = []
            comment_array.push(res.data.data)
            if(res.data.status){
                setComments(comment_array)
            }
            console.log("comment_array", comment_array);
        }).catch(err => {
            console.log("err", err)
        })
    }

    const getUsersFn = () => {
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
    }


    const onChange = (e, newValue, newPlainTextValue, mentions) => {
        if(mentions.length > 0){
            setMentionedUsers(elem => {
                return [
                    ...elem, 
                    mentions[0]
                ]
            })
        }
        if(isReply){
            setReplyVal(newPlainTextValue)
        } else {
            setCommentVal(newPlainTextValue)
        }
    }   

    const handleShowReplyTextField = (comment) => {
        console.log("comment", comment);
        console.log("comments", comments);

        setReplyVal('')
        let commentIndex = comments.findIndex(elem => elem.comment_id === comment.comment_id)
        comments[commentIndex].isReply = true;
        setComments([...comments])
        setIsReply(true)
    }

    const ProfileIcon = ({color="green", initials, size="45px", fontSize="16px"}) => {
        return (
            <div style={{height: size, width: size, fontSize: fontSize}} className={`${styles.profileIcon} ${styles[color]}`}>
                <span>{initials}</span>
            </div>
        )
    }

    const handleAddCommentOrReply = (comment, type) => {
        let comment_reply_data = {}
        if(type === "comment"){
            comment_reply_data = {
                user_id: user.user_id,
                parent_id: null,
                object_id: comments[0].object_id,
                object_type: 'JOB',
                comment: commentVal,
                mentioned_users: mentionedUsers,
                notification_object_type: "COMMENT"
            };
        } else {

            comment_reply_data = {
                user_id: user.user_id,
                parent_id: comment.comment_id,
                object_id: comment.object_id,
                object_type: 'JOB',
                comment: replyVal,
                mentioned_users: mentionedUsers,
                notification_object_type: "COMMENT"
            };
        }
        addNewCommentFn(comment_reply_data)
    }

    const addNewCommentFn = (data) => {
        addComment(data)
            .then((res) => {
                console.log("addComment", res);
                if (res.status === 200) {
                    if(data.parent_id){
                        let comment_index = comments.findIndex(elem => elem.comment_id === data.parent_id)
                        comments[comment_index]["replied_comment"].push(res.data.data)
                        comments[comment_index].isReply = false;
                    } else {
                        comments.push(res.data.data)
                    }

                    setComments([...comments])
                    setReplyVal('')
                    setCommentVal('')
                    setIsReply(false)
                    setMentionedUsers([])
                    showAlert('success', 'Successfully added');
                }
            })
            .catch((err) => {
                console.log("err", err);
                showAlert('error', err.response.data.errors.comment[0] ? err.response.data.errors.comment[0] : "Error occured while saving comment.");
            });
    };


    return <>
            <div className={styles.contentContainer}>
                <div className={styles.comments}>
                    <div className={styles.commentsHeader}>
                        <div className={styles.commentsHeaderInfo}>
                            <ProfileIcon initials={user ? user.firstname.charAt(0).toUpperCase() : ""}/>
                            <div className={styles.commentMessageInfo}>
                                <div className={styles.commentMessage}>
                                    <span className={styles.commentsHeaderName}>{ user ? `${user.firstname.toUpperCase()} ${user.lastname.toUpperCase()}` : ""}</span>                      
                                </div>    
                            </div>
                        </div>
                    </div>
                    <div className={styles.commentsContents}>
                        {comments.map((comment,idx) => {

                            let commentInitialIcon = comment.users ? comment.users.firstname.charAt(0).toUpperCase() : "";
                            return (
                                <>
                                    <div className={styles.card + " card"}>                                       
                                        <div className="card-body">
                                            <div key={idx} className={styles.commentItem} id={comment.comment_id} ref={pageRef}>
                                                <ProfileIcon initials={commentInitialIcon}/>
                                                <div className={styles.commentMessageInfo}>
                                                    <div className={styles.commentMessage}>
                                                        <div dangerouslySetInnerHTML={{__html: comment.comment}} />                      
                                                    </div>    
                                                    <span className={styles.commentReplyIcon} onClick={() => {handleShowReplyTextField(comment)}}>Reply</span>    
                                                </div>
                                            </div>
                                            {
                                                comment.replied_comment.length > 0 ? comment.replied_comment.map((reply, key) => {
                                                    let replyInitialIcon = reply.users ? reply.users.firstname.charAt(0).toUpperCase() : "";
                                                    return <div key={idx} className={styles.replyItem} id={reply.comment_id} ref={pageRef}> 
                                                        <ProfileIcon initials={replyInitialIcon}/>
                                                        <div key={key} className={styles.commentMessageInfo}>
                                                            <div className={styles.commentMessage}>
                                                                <div dangerouslySetInnerHTML={{__html: reply.comment}} />   
                                                            </div>  
                                                        </div>
                                                    </div>
                                                }) : ""
                                            }
                                            {
                                                comment.isReply ? <div className={styles.commentsActions}>
                                                    <Form.Group className={styles.commentsActionsFieldGroup}>
                                                        <MentionsInput
                                                            className={styles.textField}
                                                            style={defaultStyle}
                                                            value={replyVal}
                                                            onChange={onChange}
                                                            placeholder="Type @ to mention user"
                                                        >
                                                            <Mention
                                                                trigger="@"
                                                                data={users}
                                                            />
                                                        </MentionsInput>
                                                        <Button colorVariant="green" onClick={() => handleAddCommentOrReply(comment, "reply")}>Reply</Button>
                                                    </Form.Group>
                                                </div> : ""
                                            }
                                        </div>
                                    </div>
                                </>
                                
                            )

                        })}
                    </div>
                    {/* <div className={styles.commentsActions}>
                        <Form.Group className={styles.commentsActionsFieldGroup}>
                            <MentionsInput
                                className={styles.textField}
                                style={defaultStyle}
                                value={commentVal}
                                onChange={onChange}
                                placeholder="Type @ to mention user"
                            >
                                <Mention
                                    trigger="@"
                                    data={users}
                                />
                            </MentionsInput>
                            <Button colorVariant="green" onClick={() => handleAddCommentOrReply(null, "comment")} >Comment</Button>
                        </Form.Group>
                    </div> */}
                </div>
                
            </div>
        </>


}

export default CommentNotification