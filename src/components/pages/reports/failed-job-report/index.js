import styles from './index.module.css';
import { forwardRef, useCallback, useEffect, useState } from 'react';
import { getFailedJobsReport } from '../../../../server';
import DatePicker from 'react-datepicker';
import { DateTime } from 'luxon';
import { showAlert } from '../../../../utils/utils';
import { Oval } from  'react-loader-spinner';
import BarChart from '../../../common/charts/bar';
import moment from 'moment';


const FailedReports = () => {
    const [filterStartDate, setFilterStartDate] = useState(new Date());
    const [filterEndDate, setFilterEndDate] = useState(DateTime.now().plus({ days: 7 }).toJSDate());
    const [bay, setBay] = useState('chem')
    const [data, setData] = useState([])
    const [isGettingReport, setIsGettingReport] = useState(false)
    const [isGettingData, setIsGettingData] = useState(true);
    const handleRefreshData = useCallback(() => setIsGettingData(!isGettingData), [isGettingData]);

    const ExampleCustomInput = forwardRef(({ value, onClick }, ref) => (
      <button className={styles.customCalendar} onClick={onClick} ref={ref}>
          {value}
      </button>
    ));

    const getReport = () => {
      const reportDateData = { filterStartDate: moment(filterStartDate).format("YYYY-MM-DD"), filterEndDate: filterEndDate !== null ? moment(filterEndDate).format("YYYY-MM-DD") : null, bay: bay}
      getFailedJobsReport(reportDateData).then(res => {
        if (isGettingReport && res.data.failed_jobs.lists.length <= 0) {
          setIsGettingReport(false);
          showAlert('error', 'No failed jobs report found!')
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
        setIsGettingReport(true)
        handleRefreshData()
      }
    };

    const totalValueByCategoryData = {
      labels: [`Total Failed Jobs $ Value`],
      datasets: [
        {
          data: [
            data.failed_jobs !== undefined ? data.failed_jobs.current_value_of_failed_jobs : 0, 
          ],
          backgroundColor: ['rgba(255, 99, 132, 0.5)']
        }
      ],
    }

    const totalCountByCategoryData = {
        labels: [`Total Failed Jobs Count`],
        datasets: [
          {
            data: [
              data.failed_jobs !== undefined ? data.failed_jobs.number_of_failed_jobs : 0, 
            ],
            backgroundColor: ['rgba(53, 162, 235, 0.5']
          }
        ],
    }

    const handleChangeBay = (event) => {
        if (filterStartDate == null && filterEndDate == null) {
          return showAlert('error', 'Please Select Date')
        }
  
        setBay(event.target.value)
        setIsGettingReport(true)
        handleRefreshData()
    }

    return (
        <>
            {Oval}
            <div className={styles.headerContainer}>
                <h3>Failed Jobs Report</h3>
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
                </div>
            </div>
            <div className={styles.contentContainer}>
                <div className={styles.content}>
                    <div className={styles.chartItem}>
                        <BarChart data={totalValueByCategoryData}/>
                    </div>
                    <div className={styles.chartItem}>
                        <BarChart data={totalCountByCategoryData}/>
                    </div>
                </div>
            </div>
        </>
    )
}

export default FailedReports