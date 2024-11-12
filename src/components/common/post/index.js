import { useState } from "react";
import { ListGroup, Stack } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Post = ({ post }) => {
    let navigate = useNavigate()
    const [showListGroup, setshowListGroup] = useState(true)
    const handleItemClicked = () => {
        setshowListGroup(false)
        navigate(`/jobs/${post.job_id}`)
        window.location.reload()
    }



    return (
        <>
            {showListGroup ? (
                <Stack>
                    <ListGroup >
                        <ListGroup.Item action onClick={handleItemClicked}>
                            {post.job_title}
                        </ListGroup.Item>
                    </ListGroup>
                </Stack>
            )
                :
                <> 
                
                </>
            }

        </>

    );
}
export default Post