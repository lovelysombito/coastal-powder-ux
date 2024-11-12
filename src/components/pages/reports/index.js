import BarChart from '../../common/charts/bar';
import styles from './index.module.css';
import { forwardRef, useCallback, useEffect, useState } from 'react';
import { generateJobReport, getJobsBayReport } from '../../../server';
import DatePicker from 'react-datepicker';
import { DateTime } from 'luxon';
import { capitalizeFirstLetter, showAlert } from '../../../utils/utils';
import Button from '../../common/button';
import { Modal } from 'react-bootstrap';
import { Oval } from  'react-loader-spinner';
import moment from 'moment';


const Reports = () => {
    const [filterStartDate, setFilterStartDate] = useState(new Date());
    const [filterEndDate, setFilterEndDate] = useState(DateTime.now().plus({ days: 7 }).toJSDate());
    const [bay, setBay] = useState('chem')
    const [status, setStatus] = useState('ready')
    const [data, setData] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [isGettingData, setIsGettingData] = useState(true);
    const handleRefreshData = useCallback(() => setIsGettingData(!isGettingData), [isGettingData]);
    const [showModal, setShowModal] = useState(false)
    const [reportStartDate, setReportStartDate] = useState(new Date());
    const [reportEndDate, setReportEndDate] = useState(DateTime.now().plus({ days: 7 }).toJSDate());


    const ExampleCustomInput = forwardRef(({ value, onClick }, ref) => (
      <button className={styles.customCalendar} onClick={onClick} ref={ref}>
          {value}
      </button>
    ));

    const getReport = () => {
      getJobsBayReport({bay , status, filterStartDate, filterEndDate}).then(res => {
        setData(res.data);
      }).catch(err => {
        console.log('err', err);
      })
    }

    useEffect(() => {
      getReport()
    }, [isGettingData])

    const onChange = (dates) => {
      const [start, end] = dates;
      setFilterStartDate(start);
      setFilterEndDate(end);

      if (start !== null && end !== null) {
        if (bay == null)
          return showAlert('error', 'Please select bay')

        if (status == null)
          return showAlert('error', 'Please select status')
          
        handleRefreshData()
      }
    };

    const totalValueByCategoryData = {
      labels: [`Total ${capitalizeFirstLetter(bay)} Value`, 'Total Completed Jobs Value', 'Total QC Failed Value'],
      datasets: [
        {
          data: [
            data.jobs !== undefined ? data.jobs.current_value_of_jobs : 0, 
            data.jobs !== undefined ? data.jobs.current_value_of_completed_jobs : 0, 
            data.jobs !== undefined ? data.failed_jobs.current_value_of_failed_jobs : 0
          ],
          backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(53, 162, 235, 0.5', 'rgb(60, 179, 113)']
        }
      ],
    }

    const handleChangeBay = (event) => {
      if (filterStartDate == null && filterEndDate == null) {
        return showAlert('error', 'Please Select Date')
      }
      if (status == null) {
        return showAlert('error', 'Please select Status')
      }

      setBay(event.target.value)
      handleRefreshData()
    }

    const handleChangeStatus = (event) => {
      if (filterStartDate == null && filterEndDate == null) {
        return showAlert('error', 'Please Select Date')
      }
      if (bay == null) {
        return showAlert('error', 'Please select Bay')
      }

      setStatus(event.target.value)
      handleRefreshData()
    }

    const handleGenerateCSV = () => {
      setIsLoading(true);
      const reportDateData = { reportStartDate: moment(reportStartDate).format("YYYY-MM-DD"), reportEndDate: moment(reportEndDate).format("YYYY-MM-DD")}
      generateJobReport(reportDateData).then(res =>{
        if (res.status == 200) {
          setIsLoading(false)
          showAlert('success', 'Report has been successfully generated, please check your email.')
          setShowModal(false)
        }
      })
    }

    const onChangeReport = (dates) => {
      const [start, end] = dates;
      setReportStartDate(start);
      setReportEndDate(end);
    };

    return (
        <>
            <div className={styles.contentContainer}>
            {Oval}
                <div className={styles.headerContainer}>
                    <h3>Reports</h3>
                    <div className={styles.headerActions}>
                        <DatePicker
                            dateFormat='dd/MM/yyyy'
                            selected={filterStartDate}
                            startDate={filterStartDate}
                            endDate={filterEndDate}
                            onChange={onChange}
                            selectsRange
                            customInput={<ExampleCustomInput />}
                        />
                         <select onChange={handleChangeBay} defaultValue={bay} className={styles.select}>
                            <>
                                <option selected disabled> --Bay-- </option>
                                <option value="chem">Chem</option>
                                <option value="burn">Burn</option>
                                <option value="treatment">Treatment</option>
                                <option value="blast">Blast</option>
                                <option value="main line">Powder - Main Line</option>
                                <option value="small batch">Powder - Small Batch</option>
                                <option value="big line">Powder - Big Batch</option>
                            </>
                        </select>

                        <select onChange={handleChangeStatus} defaultValue={status} className={styles.select}>
                            <>
                                <option selected disabled> --Status-- </option>
                                <option value="Ready">Ready</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Awaiting QC">Awaiting QC</option>
                                <option value="QC Passed">QC Passed</option>
                                <option value="Complete">Complete</option>
                            </>
                        </select>

                    </div>
                    <Button onClick={() => setShowModal(true)} style={{height: '83%!important', marginLeft: '2px'}}>Generate CSV</Button>

                </div>
                <div className={styles.content}>
                    <div className={styles.chartItem}>
                        <BarChart yLabel="Value" xLabel={`Bay: ${data.jobs !== undefined ? data.jobs.number_of_bay : 0} Failed Jobs: ${data.jobs !== undefined ? data.failed_jobs.number_of_failed_jobs : 0}`} data={totalValueByCategoryData}/>
                    </div>
                </div>
            </div>



            <Modal show={showModal} onHide={() => setShowModal(false)} size='sm'>
              <Modal.Body>
                <div style={{textAlign: 'center'}}>
                  <DatePicker
                    dateFormat='dd/MM/yyyy'
                    selected={reportStartDate}
                    startDate={reportStartDate}
                    endDate={reportEndDate}
                    onChange={onChangeReport}
                    selectsRange
                    customInput={<ExampleCustomInput />}
                  />
                </div>
              </Modal.Body>
              <Modal.Footer>
                  <Button onClick={() => setShowModal(false)} colorVariant='dark'>
                      Cancel
                  </Button>
                  <Button onClick={handleGenerateCSV} colorVariant='cyan' disabled={isLoading}>
                      {isLoading ? <Oval color="#fff" height={20} width={70} /> : 'Generate'}
                  </Button>
              </Modal.Footer>
            </Modal>
        </>
    )
}

export default Reports