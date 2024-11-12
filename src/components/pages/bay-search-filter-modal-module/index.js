import styles from './index.module.css';
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { addSearchFilter, getSearchFilter } from '../../../server';
import { showAlert } from '../../../utils/utils';
import { Oval } from 'react-loader-spinner';
import Select from 'react-select';
import { 
    API_BASE_URL,
    COLUMN_TYPE_OPTIONS, 
    COMPARISON_OPERATOR_OPTIONS, 
    JOB_STATUS_OPTIONS, 
    MATERIAL_OPTIONS,
} from '../../../constants';
import axios from 'axios';
import { GrPowerReset } from 'react-icons/gr'

const BaySearchFilterModalModule = ({ showModal, handleClose, kanbanJobLists, onChange, parentFunctionName }) => {

    const [rows, setRows] = useState([]);
    const [isLoadingFilterSave, setIsLoadingFilterSave] = useState(false);
    const [initialClientNames, setInitialClientNames] = useState([]);
    const [initialColours, setInitialColours] = useState([]);
    const [initialPONumbers, setInitialPONumbers] = useState([]);
    const [initialInvoiceNumbers, setInitialInvoiceNumbers] = useState([]);
    const [initialJobStatus] = useState(JOB_STATUS_OPTIONS);
    const [initialMaterials] = useState(MATERIAL_OPTIONS);
    const [treatments, setTreatments] = useState([]);
    const [column_type_arr] = useState(COLUMN_TYPE_OPTIONS);
    const [comparison_operator_arr] = useState(COMPARISON_OPERATOR_OPTIONS);
    // const [kanbanDataToFilter, setKanbanDataToFilter] = useState([]);
    const [isGettingSearchFilter, setIsGettingSearchFilter] = useState(false);
    const [dataToSave, setDataToSave] = useState([]);

    useEffect(() => {
        formatDataForFilter(kanbanJobLists)
    }, [kanbanJobLists])

    useEffect(() => {
        getTreatments();
        getSearchFilterData();
    }, [isGettingSearchFilter]);

    const getTreatments = () => {
        axios
            .get(`${API_BASE_URL}/treatments`)
            .then((res) => {
                if (res.data.data !== undefined) {
                    const options = res.data.data.map((item) => ({
                        value: item.treatment_id,
                        label: item.treatment,
                        materials: item.materials,
                    }));
                    setTreatments(options);
                } else {
                    setTreatments([]);
                }
            })
            .catch((err) => {
                setTreatments([]);
                showAlert('error', err);
            });
    };
    
    const handleRemove = (id) => {
        let row_to_remove = rows;
        if(row_to_remove.length > 1){
            let row_index = row_to_remove.findIndex(e => e.id == id)
            const list = [...rows];
            list.splice(row_index, 1);
            setRows(list);
        }

        if(dataToSave.length > 1){
            let find_index = dataToSave.findIndex(e => e.id == id)
            const list = [...dataToSave];
            list.splice(find_index, 1)
            setDataToSave(list)
        }
    }

    const handleAddNewRow = () => {

        let cur_id = dataToSave[dataToSave.length - 1].id
        let dataToSaveObject = {
            id: cur_id + 1,
            columnType: "",
            comparisonOperator: "",
            dataValue: []
        }

        let rowToAdd = {
            id: cur_id + 1,
            type: "text",
            value: ""
        }

        setDataToSave([...dataToSave, dataToSaveObject]);
        setRows([...rows, rowToAdd])

    }

    const handleSaveFilters = async () => {
        setIsLoadingFilterSave(true)
        let filtersToSave = []

        for (let index = 0; index < dataToSave.length; index++) {
            const element = dataToSave[index];
            let filterValContainer = []

            for (let i = 0; i < element.dataValue.length; i++) {
                const filterVal = element.dataValue[i];
                filterValContainer.push(filterVal.value)
            }

            filtersToSave.push({
                order: index + 1,
                column_type: element.columnType,
                table_name: "job_scheduling",
                column_value: filterValContainer.toString(),
                operator: element.comparisonOperator,
                where_type: "or"
            })            
        }

        const data = {
            data: filtersToSave
        }

        await addSearchFilter(data)
                .then((res) => {
                    console.log("addSearchFilter", res);
                })
                .catch(() => {
                    showAlert('error', 'Error');
                });

        setIsLoadingFilterSave(false)
        showAlert('success', 'Filter successfully saved.');

    }

    const formatDataForFilter = (kanbanJobLists) => {

        if(parentFunctionName === "overview"){
            formatDataForFilterOverviewFn(kanbanJobLists)
        } else {
            formatDataForFilterFn(kanbanJobLists)
        }

    }

    const formatDataForFilterOverviewFn = (kanbanJobLists) => {

        const clientNames = [];
        const colours = [];
        const poNumbers = [];
        const invoiceNumbers = [];

        for(var key in kanbanJobLists){
            if(kanbanJobLists[key]["invoices"].length > 0){
                for(var invoiceKey in kanbanJobLists[key]["invoices"]){

                    let clientName = kanbanJobLists[key]["invoices"][invoiceKey].clientName;
                    let colour = kanbanJobLists[key]["invoices"][invoiceKey].colour;
                    let poNumber = kanbanJobLists[key]["invoices"][invoiceKey].poNumber;
                    let invoiceNumber = kanbanJobLists[key]["invoices"][invoiceKey].invoiceNumber;

                    if(clientName !== null){
                        if(clientNames.findIndex(e => e.value === clientName) < 0){
                            let clientNameObject = {
                                value: clientName,
                                label: clientName
                            }
                            clientNames.push(clientNameObject)
                        }
                    }

                    if(colour !== null){
                        if(colours.findIndex(e => e.value === colour) < 0){
                            let colourObject = {
                                value: colour,
                                label: colour
                            }
                            colours.push(colourObject)
                        }
                    }

                    if(poNumber !== null){
                        if(poNumbers.findIndex(e => e.value === poNumber) < 0){
                            let poNumberObject = {
                                value: poNumber,
                                label: poNumber
                            }
                            poNumbers.push(poNumberObject)
                        }
                    }

                    if(invoiceNumber !== null){
                        if(invoiceNumbers.findIndex(e => e.value === invoiceNumber) < 0){
                            let invoiceNumberObject = {
                                value: invoiceNumber,
                                label: invoiceNumber
                            }
                            invoiceNumbers.push(invoiceNumberObject)
                        }
                    }

                }
            }
        }   

        setInitialClientNames(clientNames)
        setInitialColours(colours)
        setInitialPONumbers(poNumbers)
        setInitialInvoiceNumbers(invoiceNumbers)

    }
    
    const formatDataForFilterFn = (kanbanJobLists) => {

        const clientNames = [];
        const colours = [];
        const poNumbers = [];
        const invoiceNumbers = [];

        for (let bayIndex of Object.keys(kanbanJobLists)) { 
            let tempDatas = kanbanJobLists[bayIndex]

            if(tempDatas.length > 0){
                for(var key in tempDatas){
                    let clientName = tempDatas[key].deal.client_name;
                    let colour = tempDatas[key].colour;
                    let poNumber = tempDatas[key].deal.po_number;
                    let invoiceNumber = tempDatas[key].deal.invoice_number;
    
                    if(clientName !== null){  
                        if(clientNames.findIndex(e => e.value === clientName) < 0){
                            let clientNameObject = {
                                value: clientName,
                                label: clientName
                            }
                            clientNames.push(clientNameObject)
                        }
                    }
    
                    if(colour !== null){ 
                        if(colours.findIndex(e => e.value === colour) < 0){
                            let colourObject = {
                                value: colour,
                                label: colour
                            }
                            colours.push(colourObject)
                        }
                    }
    
                    if(poNumber !== null){
                        if(poNumbers.findIndex(e => e.value === poNumber) < 0){
                            let poNumberObject = {
                                value: poNumber,
                                label: poNumber
                            }
                            poNumbers.push(poNumberObject)
                        }
                    }
    
                    if(invoiceNumber !== null){
                        if(invoiceNumbers.findIndex(e => e.value === invoiceNumber) < 0){
                            let invoiceNumberObject = {
                                value: invoiceNumber,
                                label: invoiceNumber
                            }
                            invoiceNumbers.push(invoiceNumberObject)
                        }
                    }
                }
            }
        }

        setInitialClientNames(clientNames)
        setInitialColours(colours)
        setInitialPONumbers(poNumbers)
        setInitialInvoiceNumbers(invoiceNumbers)

    }

    const handleSetColumnType = (id, val) => {

        let indexOfId = dataToSave?.findIndex(e => e.id == id)
        if(indexOfId >= 0){
            setDataToSave(s => {
                const newArr = s.slice();
                newArr[indexOfId].columnType = val;
                return newArr;
            });
        }
        
    }

    const handleSetComparisonOperator = (id, val) => {

        let indexOfId = dataToSave?.findIndex(e => e.id == id)
        if(indexOfId >= 0){ 
            setDataToSave(s => {
                const newArr = s.slice();
                newArr[indexOfId].comparisonOperator = val;
                return newArr;
            });
        }

    }

    const handleSelect = (id, selectedValues) => {

        let indexOfId = dataToSave?.findIndex(e => e.id == id)
        if(selectedValues.length > 0){
            if(indexOfId >= 0){
                setDataToSave(s => {
                    const newArr = s.slice();
                    newArr[indexOfId].dataValue = selectedValues;
                    return newArr;
                });
            }
            
        }

    }

    const getSearchFilterData = async () => {
        const data = {
            table_name: "job_scheduling"
        }

        getSearchFilter(data)
            .then((res) => {
                // console.log("getSearchFilter", res);

                if(res.data.data.length > 0){

                    let initialFilterData = []
                    let initialRows = []

                    for (let index = 0; index < res.data.data.length; index++) {
                        const filterData = res.data.data[index];
                        let selectValues = []

                        if(filterData){

                            let filterDatas = filterData.column_value.split(",");

                            for (let b = 0; b < filterDatas.length; b++) {
                                const filterDataVal = filterDatas[b];
                                selectValues.push({
                                    label: filterDataVal,
                                    value: filterDataVal
                                })
                            }

                            let initialDataToSave = {
                                id: filterData.order,
                                columnType: filterData.column_type,
                                comparisonOperator: filterData.operator,
                                dataValue: selectValues
                            }

                            let initialRowToAdd = {
                                id: filterData.order,
                                type: "text",
                                value: ""
                            }
                            
                            initialRows.push(initialRowToAdd)
                            initialFilterData.push(initialDataToSave)
                        }
                    }

                    setRows(initialRows)
                    setDataToSave(initialFilterData)

                } else {
                    const initialDataObject = {
                        id: 0,
                        columnType: "",
                        comparisonOperator: "",
                        dataValue: []
                    }

                    const inputArr = {
                        type: "text",
                        id: 0,
                        value: ""
                    }

                    setRows([inputArr])
                    setDataToSave([initialDataObject])
                }

                setIsGettingSearchFilter(false)
            })
            .catch((error) => {
                console.error(error);
                setIsGettingSearchFilter(false)
            });
    }

    const handleSearch = () => {
        if(parentFunctionName === "overview"){
            searchFunctionForOverview()
        } else {
            searchFunctionForBays()
        }
    }

    const searchFunctionForOverview = async () => {
        const tempDatasForFilter = [
            { title: 'ready', invoices: [] },
            { title: 'chem', invoices: [] },
            { title: 'burn', invoices: [] },
            { title: 'treatment', invoices: [] },
            { title: 'blast', invoices: [] },
            { title: 'big batch', invoices: [] },
            { title: 'small batch', invoices: [] },
            { title: 'main line', invoices: [] },
        ];

        const dataFilterResults = [];

        if(dataToSave.length > 0){

            for (let index = 0; index < dataToSave.length; index++) {

                const searchData = dataToSave[index];
                let dataValues = searchData.dataValue

                for (let kanbanIndex = 0; kanbanIndex < kanbanJobLists.length; kanbanIndex++) {

                    const kanbanBay = kanbanJobLists[kanbanIndex];
                    let kanbanInvoices = kanbanBay.invoices

                    if(kanbanInvoices.length > 0){

                        let kanbanFilterResults = [];
                        let current_column_type = searchData.columnType;

                        if(searchData.columnType === "client_name"){
                            current_column_type = "clientName"
                        } 
                        
                        if (searchData.columnType === "invoice_number") {
                            current_column_type = "invoiceNumber"
                        }

                        if (searchData.columnType === "po_number") {
                            current_column_type = "poNumber"
                        }

                        if (searchData.columnType === "treatment") {
                            current_column_type = "process"
                        }

                        if(searchData.comparisonOperator === "is"){  
                            for (let dataValueIndex = 0; dataValueIndex < dataValues.length; dataValueIndex++) {
                                const dataValue = dataValues[dataValueIndex];
                                kanbanInvoices.filter((invoice) => {
                                    if(invoice[current_column_type] === dataValue.value){
                                        kanbanFilterResults.push(invoice)
                                    }
                                });
                            }

                        } else {

                            let kanbanInvoicesLeft = kanbanInvoices  
                            var jobIds = [];
                            for (let dataValueIndex = 0; dataValueIndex < dataValues.length; dataValueIndex++) {
                                const dataValue = dataValues[dataValueIndex];
                                kanbanInvoices.filter((invoice) => {
                                    if(invoice[current_column_type] === dataValue.value){
                                        jobIds.push(invoice.jobId)
                                    }
                                });
                            }     

                            for (let i = 0; i < jobIds.length; i++) {
                                let jobIndex = kanbanInvoicesLeft.findIndex(elem => elem.jobId === jobIds[i])
                                kanbanInvoicesLeft.splice(jobIndex,1);
                            }

                            for (var leftInvoiceIndex = 0; leftInvoiceIndex < kanbanInvoicesLeft.length; leftInvoiceIndex++){
                                kanbanFilterResults.push(kanbanInvoicesLeft[leftInvoiceIndex]);
                            }

                        }
                        await setKanbanResults(kanbanFilterResults, tempDatasForFilter, kanbanBay.title, dataFilterResults)
                    }
                }
            }
        }
    }

    const setKanbanResults = async (kanbanFilterResults, tempDatasForFilter, kanbanBayTitle, dataFilterResults) => {
        if(kanbanFilterResults.length > 0){
            for (let i = 0; i < kanbanFilterResults.length; i++) {
                const res = kanbanFilterResults[i];
                let tempDatasForFilterIndex = tempDatasForFilter.findIndex(elem => elem.title === kanbanBayTitle)
                let invoiceIndex = tempDatasForFilter[tempDatasForFilterIndex].invoices.findIndex(elem => elem.jobId === res.jobId)
                if(invoiceIndex < 0 ){
                   await tempDatasForFilter[tempDatasForFilterIndex].invoices.push(res)
                }
                if(dataFilterResults.findIndex(elem => elem.jobId === res.jobId) < 0){
                    dataFilterResults.push(res)
                }
            }
            onChange(tempDatasForFilter, dataFilterResults)
        }
    }

    const searchFunctionForBays = () => {
        let dataToformat = []
        if(dataToSave.length > 0){
            for (let index = 0; index < dataToSave.length; index++) {
                
                const searchData = dataToSave[index];
                let current_column_type = searchData.columnType;
                let dataValues = searchData.dataValue

                for (let bayIndex of Object.keys(kanbanJobLists)) { 
                    let tempDatas = kanbanJobLists[bayIndex];
                    let kanbanFilterResults = [];

                    if(searchData.comparisonOperator === "is"){  

                        for (let dataValueIndex = 0; dataValueIndex < dataValues.length; dataValueIndex++) {
                            const dataValue = dataValues[dataValueIndex];
    
                            tempDatas.filter((job) => {
    
                                if(searchData.columnType === "colour" || 
                                    searchData.columnType === "status" || 
                                    searchData.columnType === "material" ||
                                    searchData.columnType === "treatment"
                                ){
                                    if(job[current_column_type] === dataValue.value){
                                        kanbanFilterResults.push(job)
                                    }
                                }
    
                                if(searchData.columnType === "client_name" ||
                                    searchData.columnType === "invoice_number" || 
                                    searchData.columnType === "po_number"
                                ){
                                    if(job.deal[current_column_type] === dataValue.value){
                                        kanbanFilterResults.push(job)
                                    }
                                } 
                              
                            });
                        }
    
                    } else {
    
                        let kanbanInvoicesLeft = tempDatas  
                        var jobIds = [];
    
                        for (let dataValueIndex = 0; dataValueIndex < dataValues.length; dataValueIndex++) {
                            const dataValue = dataValues[dataValueIndex];
                            tempDatas.filter((job) => {
                                if(searchData.columnType === "colour" || 
                                    searchData.columnType === "status" || 
                                    searchData.columnType === "material" ||
                                    searchData.columnType === "treatment"
                                ){
                                    if(job[current_column_type] === dataValue.value){
                                        jobIds.push(job.job_id)
                                    }
                                }
    
                                if(searchData.columnType === "client_name" ||
                                    searchData.columnType === "invoice_number" || 
                                    searchData.columnType === "po_number"
                                ){
                                    if(job.deal[current_column_type] === dataValue.value){
                                        jobIds.push(job.job_id)
                                    }
                                } 
                            });
                        }     
    
                        for (let i = 0; i < jobIds.length; i++) {
                            let jobIndex = kanbanInvoicesLeft.findIndex(elem => elem.job_id === jobIds[i])
                            kanbanInvoicesLeft.splice(jobIndex,1);
                        }
    
                        for (var leftInvoiceIndex = 0; leftInvoiceIndex < kanbanInvoicesLeft.length; leftInvoiceIndex++){
                            kanbanFilterResults.push(kanbanInvoicesLeft[leftInvoiceIndex]);
                        }
                    }

                    let keyExist = Object.keys(dataToformat).some(key => key === bayIndex);

                    if(keyExist){

                        for (let dataToFormatIndex = 0; dataToFormatIndex < kanbanFilterResults.length; dataToFormatIndex++) {

                            const element = kanbanFilterResults[dataToFormatIndex];
                            if(dataToformat[bayIndex].findIndex(elem => elem.job_id === element.job_id) < 0){
                                dataToformat[bayIndex].push(element) 
                            }

                        }
                    } else {
                        dataToformat[bayIndex] = kanbanFilterResults
                    }
                }
            }
            onChange(dataToformat)
        }
    }

    const handleReset = () => {
        const initialDataObject = {
            id: 0,
            columnType: "",
            comparisonOperator: "",
            dataValue: []
        }

        const inputArr = {
            type: "text",
            id: 0,
            value: ""
        }

        setRows([inputArr])
        setDataToSave([initialDataObject])
    }
    
    return <>
        <Modal show={showModal} size="lg" onHide={handleClose}>
            <Modal.Header>
                Filter
                <GrPowerReset onClick={handleReset}/>
            </Modal.Header>
            <Modal.Body>
                <div>
                    {
                        isLoadingFilterSave ? <div className='loading-container'><Oval color='#fff' height={80} width={80} /></div> : <>
                            <div className="row">
                                {
                                    rows.map((item, i) => {
                                        let cur_data = (dataToSave || []).filter(e => e.id === item.id)
                                        let type_of_column = cur_data.length > 0 ? cur_data[0].columnType : ""
                                        let selectOptions = []

                                        console.log("cur_data", cur_data);

                                        if(type_of_column === "client_name"){
                                            selectOptions = initialClientNames
                                        }

                                        if(type_of_column === "colour"){
                                            selectOptions = initialColours
                                        }

                                        if(type_of_column === "status"){
                                            selectOptions = initialJobStatus
                                        }

                                        if(type_of_column === "material"){
                                            selectOptions = initialMaterials
                                        }

                                        if(type_of_column === "treatment"){
                                            selectOptions = treatments
                                        }

                                        if(type_of_column === "po_number"){
                                            selectOptions = initialPONumbers
                                        }

                                        if(type_of_column === "invoice_number"){
                                            selectOptions = initialInvoiceNumbers
                                        }
                                        
                                        return <>
                                            <div className="col-lg-4 mt-2">
                                                <Form className="d-flex">
                                                    <Form.Select 
                                                        value={cur_data[0] ? cur_data[0].columnType : ""}
                                                        className={styles.textField}
                                                        id={i}
                                                        onChange={(e) => handleSetColumnType(item.id, e.target.value)}
                                                    >
                                                        <option>-Select-</option>
                                                        {
                                                            column_type_arr.map((column, i) => {
                                                                return <option key={i} value={column.value}>{column.name}</option>
                                                            })
                                                        }
                                                    </Form.Select>
                                                </Form>
                                            </div>
                                            <div className="col-lg-2 mt-2">
                                                <Form className="d-flex">
                                                    <Form.Select 
                                                        value={cur_data[0] ? cur_data[0].comparisonOperator : ""}
                                                        className={styles.textField}
                                                        id={i}
                                                        onChange={(e) => handleSetComparisonOperator(item.id, e.target.value)}
                                                    >
                                                        <option>-Select-</option>
                                                        {
                                                            comparison_operator_arr.map((operator, i) => {
                                                                return <option key={i} value={operator.value}>{operator.name}</option>
                                                            })
                                                        }
                                                    </Form.Select>
                                                </Form>
                                            </div> 	 	
                                            <div className="col-lg-5 mt-2">
                                                <Form className="d-flex">
                                                    <Select
                                                        isMulti
                                                        value={cur_data[0] ? cur_data[0].dataValue : []}
                                                        defaultValue={cur_data[0] ? cur_data[0].dataValue : []}
                                                        options={selectOptions}
                                                        onChange={(selectedValues) => handleSelect(item.id, selectedValues)}   
                                                        className={styles.textField}                                      
                                                        closeMenuOnSelect={true}
                                                    >
                                                    </Select>
                                                </Form>
                                            </div>
                                            {
                                                rows.length > 1 ? <>
                                                    <div className="col-lg-1 mt-2">
                                                        <center><span onClick={() => handleRemove(item.id)}>x</span></center>
                                                    </div>
                                                </> : ""
                                            }
                                        </>
                                    })
                                }
                            </div>
                            <Button variant="primary" className={"mt-3 "  + styles.borderRadius0} style={{cursor:"pointer"}} onClick={handleAddNewRow}>Add New</Button>
                        </>
                    }
                </div> 
            </Modal.Body>
            <Modal.Footer>
                <Button variant="success" className={styles.borderRadius0} onClick={handleSaveFilters}>Save</Button>
                <Button variant="primary" className={styles.borderRadius0} onClick={handleSearch}>Search</Button>
            </Modal.Footer>
        </Modal>
    </>
   
}

export default BaySearchFilterModalModule;

