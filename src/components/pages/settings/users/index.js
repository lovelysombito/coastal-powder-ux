import styles from './index.module.css';
import { Form } from 'react-bootstrap'
import DataTable from '../../../common/data-table';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import PageTitle from '../../../common/page-title';
import Button from '../../../common/button'
import { addUser, deleteUser, updateUser } from '../../../../server/index';
import axios from 'axios'
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../../../../constants';
import { useContext } from 'react';
import { UserContext } from '../../../../context/user-context';
import { Oval } from  'react-loader-spinner';
import { webContext } from '../../../../context/websocket-context';

const SettingsUsers = () => {
    const { jobItem } = useContext(webContext);
    const { user } = useContext(UserContext)
    const [data, setData] = useState(null)
    const [selectedItems, setSelectedItems] = useState([])
    const [isUpdating, setIsUpdating] = useState(false)
    const [updateType, setUpdateType] = useState("")
    const [isFetching, setIsFetching] = useState(true)
    const userData = user
    const [userId, setUserId] = useState()
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [role, setRole] = useState("administrator")
    const [message, setMessage] = useState("")
    const [editCurrentUser, setEditCurrentUser] = useState(false);
    
    const updateTypes = useMemo(() => {
        return {
            ADD : "Add",
            EDIT: "Edit"
        }
    }, [])

    const renderUpdateForm = useCallback((type, item = null) => {
        setIsUpdating(true)
        setUpdateType(type)

        if(type === updateTypes.EDIT) {
            if(user.email === item.email){ setEditCurrentUser(true) } else { setEditCurrentUser(false) }
            setLastName(item.lastName)
            setFirstName(item.firstName)
            setEmail(item.email)
            setRole(item.accessPermission)
            setUserId(item.id)
        } else {
            setEditCurrentUser(false)
            setFirstName("")
            setLastName("")
            setEmail("")
        }
    }, [updateTypes])

    const handleGetUserData = (url) => {
        axios.get(url).then(res => {
            let users = [];
            if (res.data.code === 200) {
                res.data.message.forEach(user => {
                    users.push({
                        id: user.user_id,
                        fullName: user.firstname + ' ' + user.lastname,
                        firstName: user.firstname,
                        lastName: user.lastname,
                        email: user.email,
                        accessPermission: user.scope
                    })
                });
                setData(users);
                setIsFetching(false)
            }
        }).catch((err) => {
            setData([]);
            setIsFetching(false)
            handleMessage('error', err)
        })
    }
    
    useEffect(() => {
        if (isFetching) {
            handleGetUserData(`${API_BASE_URL}/users/`)
        }
    }, [isFetching])

    useEffect(() => {
        if (jobItem !== null && jobItem.message == 'user') {
            handleGetUserData(`${API_BASE_URL}/users/`)
        }
    }, [jobItem])

    const columns = useMemo(
        () => [
            {
                id: 'select',
                style: { width: 80 },
                Cell: ({ row }) => {
                    const index = row.id
                    const handleSelectItem = (index, isChecked) => {
                        if(isChecked) {
                            if(!selectedItems.includes(index)) {
                                setSelectedItems([...selectedItems, index])
                            }
                        } else {
                            setSelectedItems([...selectedItems].filter(el => el !== index))
                        }
                    }
                    return (
                        <div style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            flex: "1 1 auto"
                        }}> 
                        {
                            userData.email === row.original.email ? (
                                <Form.Check 
                                    disabled
                                    className={styles.tableCheckBox}
                                    type="checkbox"
                                    checked={selectedItems.includes(index)}
                                    onChange={ (event) => { handleSelectItem(index, event.target.checked) }}
                                />
                            ) : (
                                <Form.Check 
                                    className={styles.tableCheckBox}
                                    type="checkbox"
                                    checked={selectedItems.includes(index)}
                                    onChange={ (event) => { handleSelectItem(index, event.target.checked) }}
                                />
                            )
                        }

                            
                        </div>
                            
                    )
                }
            },
            {
                isSortable: true,
                Header: 'Full Name',
                accessor: 'fullName',
            },
            {
                isSortable: true,
                Header: 'E-mail',
                accessor: 'email',
            },
            {
                isSortable: true,
                Header: 'Access Permission',
                accessor: 'accessPermission',
                Cell: ({ data, row }) => {
                    const permissionColors = {
                        purple: "#8760fb",
                        green: "#03c895",
                        red: "#fc3d3b"
                    }

                    const accessPermission = data[row.id].accessPermission
                    let color = permissionColors.purple

                    if (accessPermission === "Supervisor") {
                        color = permissionColors.red
                    } else if (accessPermission === "Admin") {
                        color = permissionColors.green
                    } else if (accessPermission === "Standard User") {
                        color = permissionColors.purple
                    } else {
                        color = permissionColors.purple
                    }

                    return (
                        <div style={{color: color}} className={styles.permission}>
                            <span>{accessPermission}</span>
                        </div>
                    )
                }
            },
            {
                id: 'action',
                style: { width: "105px" },
                Cell: props => {
                    const index = props.row.id
                    const user = props.data[index]
                    
                    return (
                        <div>
                            <Button colorVariant="cyan" onClick={() => renderUpdateForm(updateTypes.EDIT, user)}>EDIT</Button>
                        </div>
                        
                    )
                }
            }
        ],
        // eslint-disable-next-line
        [selectedItems, renderUpdateForm, updateTypes]
    )

    const handleRemoveSelected = async ()  => {
        // eslint-disable-next-line
        if (selectedItems.length === 0) {
            handleMessage('error', "Select user to delete")
            return 0;
        }

        for (const index of selectedItems) {
            await deleteUser(data[index].id).then(res => {
                if (res.status === 200) {
                    setIsFetching(true)
                    setSelectedItems([])
                }
            }).catch((err) => {
                handleMessage('error', err.response.data.message)
            })
        }

        handleMessage('success', "Successfully deleted")
        
    }

    const handleSubmitForm = () => {
        if (!checkForm()) {
            handleMessage('error', message)
            return false;
        }

        let item = {
            firstname: firstName,
            lastname: lastName,
            email: email,
            scope: role
        }

        if(updateType === updateTypes.EDIT) {
            updateUser(item, userId).then(res => {
                if (res.status === 200) {
                    setIsFetching(true)
                    setIsUpdating(false)
                    handleMessage('success', 'Successfully updated')
                }
            }).catch((err) => {
                handleMessage('error', err.response.data.message)
            })
        } else {
            addUser(item).then(res => {
                console.log('res', res);
                if (res.status === 200) {
                    setIsFetching(true)
                    setIsUpdating(false)
                    handleMessage('success', res.data.message)

                }
            }).catch((err) => {
                console.log('err', err);
                handleMessage('error', err.response.data.message)
            })
        }
    }

    const checkForm = () => {
        if (firstName === "") {
            setMessage("First name missing")
            return false
        }
        
        if (lastName === "") {
            setMessage("Last name is missing")
            return false
        }
        
        if (email === "") {
            setMessage("Email is missing")
            return false
        }

        return true

    }

    const handleMessage = (icon, text) => {
        Swal.fire({
            icon: icon,
            text: text,
        })
    }

    return (
        <>
            <div className={styles.headerContainer}>
                <PageTitle title={`Users (Active) ${isUpdating ? " - " + updateType + " User" : ""}`}/>
                <div className={styles.headerActions}  hidden={!data}>
                    <Button onClick={handleRemoveSelected} colorVariant="red">REMOVE</Button>
                    <Button onClick={() => renderUpdateForm(updateTypes.ADD)} colorVariant="dark">ADD USER</Button>
                </div>
            </div>
            <div className={styles.contentContainer}>
                {isUpdating ? <div className={styles.updateFormContainer}>
                <Form>
                    <Form.Group className={styles.fieldItem}>
                        <Form.Label>First Name</Form.Label>
                        <Form.Control className={styles.fieldItemField} type="text" value = { firstName } onChange = { (event) => { setFirstName(event.target.value) } }
                            placeholder = "First Name"/>
                    </Form.Group>

                    <Form.Group className={styles.fieldItem}>
                        <Form.Label>Last Name</Form.Label>
                        <Form.Control className={styles.fieldItemField} type="text" value = { lastName } onChange = { (event) => { setLastName(event.target.value) } }
                            placeholder = "Last Name"/>
                    </Form.Group>

                    <Form.Group className={styles.fieldItem}>
                        <Form.Label>Email</Form.Label>
                        <Form.Control disabled={editCurrentUser ? true : false} className={styles.fieldItemField} type="text" value = { email } onChange = { (event) => { setEmail(event.target.value) } }
                            placeholder = "Email"/>
                    </Form.Group>

                    <Form.Group className={styles.fieldItem}>
                        <Form.Label className={styles.fieldItemLabel}>Access Level</Form.Label>
                        <Form.Select className={styles.selectItemField} value={ role } onChange = { (event) => { setRole(event.target.value)}}>
                            <option value="administrator">Administrator</option>
                            <option value="user">Standard User</option>
                            <option value="supervisor">Supervisor</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className={styles.formButton}>
                        <Button onClick={handleSubmitForm} colorVariant="cyan">{updateType === updateTypes.ADD ? "SEND INVITE" : "SAVE"}</Button>
                    </Form.Group>
                </Form>
                </div> : ""}
                {isFetching && !data ? (
                    <div className='loading-container'>
                        <Oval color='#fff' height={80} width={80} />
                    </div>
                ) : (
                    <DataTable columns={columns} data={data}/>
                )}
            </div>
        </>
    )
}

export default SettingsUsers


