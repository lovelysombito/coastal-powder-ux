import styles from './index.module.css';
import { forwardRef, useCallback, useEffect, useState } from 'react';
import { generateJobReport, getJobsBayReport } from '../../../../server';
import DatePicker from 'react-datepicker';
import { DateTime } from 'luxon';
import { capitalizeFirstLetter, showAlert } from '../../../../utils/utils';
import Button from '../../../common/button';
import { Modal } from 'react-bootstrap';
import { Oval } from  'react-loader-spinner';
import BarChart from '../../../common/charts/bar';
import moment from 'moment';


const BayReport = () => {
    const [filterStartDate, setFilterStartDate] = useState(new Date());
    const [filterEndDate, setFilterEndDate] = useState(DateTime.now().plus({ days: 7 }).toJSDate());
    const [bay, setBay] = useState('chem')
    const [status, setStatus] = useState('ready')
    const [data, setData] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [isGettingReport, setIsGettingReport] = useState(false)
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
      const reportDateData = { filterStartDate: moment(filterStartDate).format("YYYY-MM-DD"), filterEndDate: filterEndDate !== null ? moment(filterEndDate).format("YYYY-MM-DD") : null,
      bay: bay, status: capitalizeFirstLetter(status)}
      getJobsBayReport(reportDateData).then(res => {
        if (isGettingReport && res.data.jobs.lists.length <= 0) {
          setIsGettingReport(false);
          showAlert('error', 'No jobs report found!')
        }
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
        setIsGettingReport(true)
        handleRefreshData()
      }
    };

    const totalValueByCategoryData = {
      labels: [`Total ${capitalizeFirstLetter(bay)} $ Value`],
      datasets: [
        {
          data: [
            data.jobs !== undefined ? data.jobs.current_value_of_bay : 0, 
          ],
          backgroundColor: ['rgba(255, 99, 132, 0.5)']
        }
      ],
    }

    const totalCountByCategoryData = {
        labels: [`Total Jobs Count`],
        datasets: [
          {
            data: [
              data.jobs !== undefined ? data.jobs.number_of_bay : 0, 
            ],
            backgroundColor: ['rgba(53, 162, 235, 0.5']
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
      setIsGettingReport(true)
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
      setIsGettingReport(true)
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
                    <h3>Bay Reports</h3>
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
                        <BarChart data={totalValueByCategoryData}/>
                    </div>
                    <div className={styles.chartItem}>
                        <BarChart data={totalCountByCategoryData}/>
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

export default BayReport