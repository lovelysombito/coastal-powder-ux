import styles from './index.module.css';
import { Form, Modal, Table } from 'react-bootstrap'
import DataTable from '../../../common/data-table';
import { useMemo, useState, useEffect, useCallback, useContext } from 'react';
import PageTitle from '../../../common/page-title';
import Button from '../../../common/button'
import { API_BASE_URL } from '../../../../constants';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Oval } from 'react-loader-spinner';
import { addProduct, deleteProduct,getProductSearch, exportProducts, importProducts, updateProduct } from '../../../../server';
import TablePagination from '../../../common/pagination';
import { DateTime } from 'luxon';
import { webContext } from '../../../../context/websocket-context';
// import { Oval } from  'react-loader-spinner';

const SettingsProducts = () => {
    const { jobItem } = useContext(webContext);
    const [data, setData] = useState(null)
    const [selectedItems, setSelectedItems] = useState([])
    const [isUpdating, setIsUpdating] = useState(false)
    const [updateType, setUpdateType] = useState("")
    const [isFetching, setIsFetching] = useState(true)
    const [file, setFile] = useState(null);
    const [productId, setProductId] = useState("")
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [price, setPrice] = useState("")
    const [fileLink, setFileLink] = useState("")
    const [brand, setBrand] = useState("")
    const [showInputFileModal, setShowInputFileModal] = useState(false);
    const [IsLoadingImportFile, setIsLoadingImportFile] = useState(false);
    const [importFileSuccessMessage, setImportFileSuccessMessage] = useState("");
    const [lastPageUrl, setLastPageUrl] = useState('');
    const [prevPageUrl, setPrevPageUrl] = useState('');
    const [nextPageUrl, setNextPageUrl] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [firstPageUrl, setFirstPageUrl] = useState('');
    const [pages, setPages] = useState([]);

    const updateTypes = useMemo(() => {
        return {
            ADD: "Add",
            EDIT: "Edit"
        }
    }, [])

    const renderUpdateForm = useCallback((type, item = null) => {
        setIsUpdating(true)
        setUpdateType(type)

        if (type === updateTypes.EDIT) {
            setName(item.name)
            setDescription(item.description)
            setPrice(item.price)
            setProductId(item.id)
            setFileLink(item.file_link)
            setBrand(item.brand)
        } else {
            setName("")
            setDescription("")
            setPrice("")
            setFileLink("")
            setBrand("")
        }
    }, [updateTypes])

    const handleShowImage = (selected_product) => {

        if (selected_product.file_link) {
            Swal.fire({
                title: selected_product.name,
                text: selected_product.brand,
                imageUrl: selected_product.file_link,
                imageWidth: 400,
                imageHeight: 200,
                imageAlt: 'Product Image',
            })
        } else {
            handleMessage("success", "No image url provided for this product")
        }

    }

    useEffect(() => {
        if (isFetching) {
            getTableData(`${API_BASE_URL}/products?page=${currentPage}`);
        }
    });

    useEffect(() => {
        if (jobItem !== null && jobItem.message == 'product') {
            getTableData(`${API_BASE_URL}/products?page=${currentPage}`);
        }
    }, [jobItem]);

    const getTableData = (url) => {
        axios.get(url).then(res => {
            let products = [];
            if (res?.data?.data?.data?.length) {
                res.data.data.data.forEach(product => {
                    products.push({
                        id: product.product_id,
                        name: product.product_name,
                        description: product.description,
                        price: product.price,
                        brand: product.brand,
                        file_link: product.file_link,
                        updated_at: DateTime.fromISO(product.updated_at).toFormat('yyyy LLL dd')
                    })
                });
                setData(products);
                let pageItems = [];
                for (let index = 0; index < res.data.data.last_page; index++) {
                    pageItems.push(index + 1);
                }
                setPages(pageItems);
                setCurrentPage(res.data.data.current_page);
                setFirstPageUrl(res.data.data.first_page_url);
                setNextPageUrl(res.data.data.next_page_url);
                setPrevPageUrl(res.data.data.prev_page_url);
                setLastPageUrl(res.data.data.last_page_url);
                setIsFetching(false);
            } else {
                setData([]);
                setIsFetching(false);
            }
        }).catch((err) => {
            handleMessage('error', err)
        })
    }

    const columns = useMemo(
        () => [
            {
                id: 'select',
                style: { width: 80 },
                Cell: props => {
                    const index = props.row.id

                    const handleSelectItem = (index, isChecked) => {
                        if (isChecked) {
                            if (!selectedItems.includes(index)) {
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
                            <Form.Check
                                className={styles.tableCheckBox}
                                type="checkbox"
                                checked={selectedItems.includes(index)}
                                onChange={(event) => { handleSelectItem(index, event.target.checked) }}
                            />
                        </div>
                    )
                }
            },
            {
                isSortable: true,
                Header: 'Name',
                accessor: 'name',
            },
            {
                isSortable: true,
                Header: 'Description',
                accessor: 'description',
            },
            {
                isSortable: true,
                Header: 'File Link',
                accessor: 'file_link',
            },
            {
                isSortable: true,
                Header: 'Brand',
                accessor: 'brand',
            },
            {
                isSortable: true,
                Header: 'Price',
                accessor: 'price',
            },
            {
                isSortable: true,
                Header: 'Updated At',
                accessor: 'updated_at',
            },
            {
                id: 'action',
                style: { width: "130px" },
                Cell: props => {
                    const index = props.row.id
                    const product = props.data[index]
                    const selected_product = props.row.original

                    return (
                        <>
                            <div>
                                <Button colorVariant="cyan" onClick={() => renderUpdateForm(updateTypes.EDIT, product)}>EDIT</Button>
                            </div>
                            <div className={styles.ml5px}>
                                <Button colorVariant="cyan" onClick={() => handleShowImage(selected_product)}>IMAGE</Button>
                            </div>
                        </>
                    )
                }
            }
        ],
        // eslint-disable-next-line
        [selectedItems, renderUpdateForm, updateTypes]
    )

    const handleRemoveSelected = async () => {


        if (selectedItems.length === 0) {
            handleMessage('error', "Select product to delete")
            return 0;
        }

        let responseMessage = ''
        for(const val of selectedItems) {
            await deleteProduct(data[val].id).then(res => {
                if (res.status === 200) {
                    setIsFetching(true)
                    setSelectedItems([])
                    responseMessage = res.data.message
                }
            }).catch((err) => {
                handleMessage('error', err)
            })
        }

        handleMessage('success', responseMessage)
    }

    const handleSubmitForm = () => {
        if (!checkForm()) {
            return false;
        }

        let product = {
            product_name: name,
            description: description,
            price: price,
            file_link: fileLink,
            brand: brand
        }

        if (updateType === updateTypes.EDIT) {
            updateProduct(product, productId).then(res => {
                if (res.status === 200) {
                    setIsFetching(true)
                    setIsUpdating(false)
                    handleMessage('success', res.data.message)
                }
            }).catch((err) => {
                handleMessage('error', (err.response.data.message !== undefined) ? err.response.data.message : 'Something went wrong!')
            })
        } else {
            addProduct(product).then(res => {
                if (res.status === 200) {
                    setIsFetching(true)
                    setIsUpdating(false)
                    handleMessage('success', res.data.message)
                }
            }).catch((err) => {
                handleMessage('error', (err.response.data.message !== undefined) ? err.response.data.message : 'Something went wrong!')
            })
        }
    }

    const checkForm = () => {
        if (name === "" || name == null) {
            handleMessage('error', 'Product name cannot be empty')
            return false
        }

        if (description === "" || description === null) {
            handleMessage('error', "Description cannot be empty")
            return false
        }

        if (price === "" || price === null || price === 0) {
            handleMessage('error', "Price cannot be empty or 0")
            return false
        }

        return true
    }


    const submitFile = (e) => {
        const [file] = e.target.files;
        if (!file) return false;
        if (!checkFileName(file.name)) {
            handleMessage("error", "Invalid file type. Import CSV file only.")
            return false;
        }
        setFile(file)
    }

    const checkFileName = (name) => {
        const acceptableFileName = ["csv"];
        return acceptableFileName.includes(name.split(".").pop().toLowerCase());

    }

    const handleSubmit = (e) => {
        e.preventDefault();

        if (file) {
            setIsLoadingImportFile(true)
            const bodyFormData = new FormData();
            bodyFormData.append('file', file, file.name);
            importProducts(bodyFormData, { header: { 'Content-Type': 'multipart/form-data' } }).then(res => {
                if (res.status === 200) {
                    setFile(null)
                    setIsLoadingImportFile(false)
                    setImportFileSuccessMessage(res.data.message)
                }
            }).catch(() => {
                setIsLoadingImportFile(false)
                setFile(null)
                handleMessage("error", 'Cannot import products as product names need to be unique')
            });
        } else {
            setIsLoadingImportFile(false)
            setFile(null)
            handleMessage("error", "Input a CSV file only")
        }

    }

    const handleImport = () => { setShowInputFileModal(true) }

    const handleExport = () => {
        exportProducts().then(res => {
            if (res.status === 200) {
                handleMessage("success", res.data.message)
            }
        }).catch(err => {
            handleMessage("error", err?.response?.data?.message || "Error exporting products")
        })

    }

    const handleHideModal = () => {
        setImportFileSuccessMessage("")
        setShowInputFileModal(false)
        setFile(null)
    }

    const handleMessage = (icon, text) => {
        Swal.fire({
            icon: icon,
            text: text,
        })
    }

    const handleSearch = (value) => {
        let waiting = false
        if (!waiting) {
            getProductSearch(value).then(res => {
                let products = [];
                if (res?.data?.data?.data?.length) {
                    res.data.data.data.forEach(product => {
                        products.push({
                            id: product.product_id,
                            name: product.product_name,
                            description: product.description,
                            price: product.price,
                            brand: product.brand,
                            file_link: product.file_link,
                            updated_at: DateTime.fromISO(product.updated_at).toFormat('yyyy LLL dd')
                        })
                    });
                    setData(products);
                    let pageItems = [];
                    for (let index = 0; index < res.data.data.last_page; index++) {
                        pageItems.push(index + 1);
                    }
                    setPages(pageItems);
                    setCurrentPage(res.data.data.current_page);
                    setFirstPageUrl(res.data.data.first_page_url);
                    setNextPageUrl(res.data.data.next_page_url);
                    setPrevPageUrl(res.data.data.prev_page_url);
                    setLastPageUrl(res.data.data.last_page_url);
                    setIsFetching(false);
                } else {
                    setData([]);
                    setIsFetching(false);
                }
                waiting = true
                setTimeout(() => {
                    waiting = false
                }, 1500)
            }).catch((err) => {
                handleMessage('error', err)
            })
        }
    }

    function handlePageChange(page) {
        return getTableData(`${API_BASE_URL}/products?page=${page}`);
    }

    function handleFirst() {
        if (firstPageUrl !== null) return getTableData(firstPageUrl);
    }

    function handlePrev() {
        if (prevPageUrl !== null) return getTableData(prevPageUrl);
    }

    function handleNext() {
        if (nextPageUrl !== null) return getTableData(nextPageUrl);
    }

    function handleLast() {
        if (lastPageUrl !== null) return getTableData(lastPageUrl);
    }

    return (
        <>
            <div className={styles.headerContainer}>
                <PageTitle title={`Product Library ${isUpdating ? " - " + updateType + " Product" : ""}`} />
                <div className={styles.headerActions} hidden={!data}>
                    <Form className="d-flex" style={{ marginRight: 20, width: 500 }}>
                        <Form.Control
                            type="search"
                            placeholder="Search"
                            className={"me-2 " + styles.textField}
                            aria-label="Search"
                            // value={searchVal}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </Form>
                    <Button onClick={handleImport} colorVariant="blue">IMPORT</Button>
                    <Button onClick={handleExport} colorVariant="blue">EXPORT</Button>
                    <Button onClick={handleRemoveSelected} colorVariant="red">REMOVE</Button>
                    <Button onClick={() => renderUpdateForm(updateTypes.ADD)} colorVariant="dark">ADD PRODUCT</Button>
                </div>
            </div>
            {isFetching && !data ? (
                <div className='loading-container'>
                    <Oval color='#fff' height={80} width={80} />
                </div>
            ) : data.length > 0 ? (
                <div>
                    <div className={styles.contentContainer}>
                        {isUpdating ? <div className={styles.updateFormContainer}>
                            <Form>
                                <div className={styles.formFieldsContainer}>
                                    <div className={styles.fieldGroup}>
                                        <Form.Group className={styles.fieldItem}>
                                            <Form.Label>Name</Form.Label>
                                            <Form.Control className={styles.fieldItemField} type="text" value={name} onChange={(event) => { setName(event.target.value) }} />
                                        </Form.Group>

                                        <Form.Group className={styles.fieldItem}>
                                            <Form.Label>Description</Form.Label>
                                            <Form.Control className={styles.fieldItemField} type="text" value={description} onChange={(event) => { setDescription(event.target.value) }} />
                                        </Form.Group>

                                        <Form.Group className={styles.fieldItem}>
                                            <Form.Label>Brand</Form.Label>
                                            <Form.Control className={styles.fieldItemField} type="text" value={brand} onChange={(event) => { setBrand(event.target.value) }} />
                                        </Form.Group>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <Form.Group className={styles.fieldItem}>
                                            <Form.Label>File Link</Form.Label>
                                            <Form.Control className={styles.fieldItemField} type="text" value={fileLink} onChange={(event) => { setFileLink(event.target.value) }} />
                                        </Form.Group>
                                        <Form.Group className={styles.fieldItem}>
                                            <Form.Label>Price</Form.Label>
                                            <Form.Control className={styles.fieldItemField} type="number" value={price} onChange={(event) => { setPrice(event.target.value) }} />
                                        </Form.Group>
                                    </div>
                                </div>

                                <Form.Group className={styles.formButton}>
                                    <Button onClick={handleSubmitForm} colorVariant="cyan">SAVE</Button>
                                </Form.Group>
                            </Form>
                        </div> : ""}
                        <DataTable columns={columns} data={data} />
                        <TablePagination
                            handlePageChange={handlePageChange}
                            handleFirst={handleFirst}
                            handlePrev={handlePrev}
                            handleNext={handleNext}
                            handleLast={handleLast}
                            pages={pages}
                            currentPage={currentPage}
                        />
                    </div>
                </div>
            ) : (
                <div>
                    <div className={styles.contentContainer}>
                        {isUpdating ? <div className={styles.updateFormContainer}>
                            <Form>
                                <div className={styles.formFieldsContainer}>
                                    <div className={styles.fieldGroup}>
                                        <Form.Group className={styles.fieldItem}>
                                            <Form.Label>Name</Form.Label>
                                            <Form.Control className={styles.fieldItemField} type="text" value={name} onChange={(event) => { setName(event.target.value) }} />
                                        </Form.Group>

                                        <Form.Group className={styles.fieldItem}>
                                            <Form.Label>Description</Form.Label>
                                            <Form.Control className={styles.fieldItemField} type="text" value={description} onChange={(event) => { setDescription(event.target.value) }} />
                                        </Form.Group>

                                        <Form.Group className={styles.fieldItem}>
                                            <Form.Label>Brand</Form.Label>
                                            <Form.Control className={styles.fieldItemField} type="text" value={brand} onChange={(event) => { setBrand(event.target.value) }} />
                                        </Form.Group>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <Form.Group className={styles.fieldItem}>
                                            <Form.Label>File Link</Form.Label>
                                            <Form.Control className={styles.fieldItemField} type="text" value={fileLink} onChange={(event) => { setFileLink(event.target.value) }} />
                                        </Form.Group>
                                        <Form.Group className={styles.fieldItem}>
                                            <Form.Label>Price</Form.Label>
                                            <Form.Control className={styles.fieldItemField} type="number" value={price} onChange={(event) => { setPrice(event.target.value) }} />
                                        </Form.Group>
                                    </div>
                                </div>

                                <Form.Group className={styles.formButton}>
                                    <Button onClick={handleSubmitForm} colorVariant="cyan">SAVE</Button>
                                </Form.Group>
                            </Form>
                        </div> : ""}
                        <div className={styles.tableContainer}>
                            <Table className={`no-border ${styles.dataTable}`}>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Description</th>
                                        <th>File Link</th>
                                        <th>Brand</th>
                                        <th>Price</th>
                                        <th>Updated At</th>

                                    </tr>

                                </thead>
                                <tbody></tbody>

                            </Table>

                        </div>
                    </div>
                </div>
            )}



            <Modal
                show={showInputFileModal}
                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                onHide={handleHideModal}
            >
                <form>
                    <Modal.Header closeButton>
                        <Modal.Title id="contained-modal-title-vcenter">
                            Import from CSV
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {
                            IsLoadingImportFile ? <Oval color="#fff" height={80} width={80} /> : (importFileSuccessMessage !== "" ? <><center><h5>{importFileSuccessMessage} </h5></center></> : <>
                                <div className={styles.contentContainer}>
                                    <input className="form-control mt-50px" type="file" onChange={submitFile} />
                                </div></>)
                        }
                    </Modal.Body>
                    <Modal.Footer>
                        {importFileSuccessMessage === "" ? <Button onClick={handleSubmit} colorVariant="blue">Save</Button> : ""}
                        <Button onClick={handleHideModal} colorVariant="red">Close</Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </>
    )
}

export default SettingsProducts