import styles from './index.module.css';
import { useCallback, useEffect, useState } from 'react';
import { getJobsCount } from '../../../../server';
import { Oval } from  'react-loader-spinner';
import BarChart from '../../../common/charts/bar';
import { capitalizeFirstLetter } from '../../../../utils/utils';

const AmountCountJobReport = () => {
    const [selectedAmount, setSelectedAmount] = useState(0)
    const [amount, setAmount] = useState(0);
    const [bays, setBays] = useState([]);
    const [isGettingData, setIsGettingData] = useState(true);
    const handleRefreshData = useCallback(() => setIsGettingData(!isGettingData), [isGettingData]);

    const getCounts = () => {
        getJobsCount().then(res => {
            setBays(res.data)
        })
    }

    useEffect(() => {
        getCounts()
    }, [])

    const totalNumberOfJobs = {
      labels: [`Total Jobs $ Amount`],
      datasets: [
        {
          data: [
            amount ?? 0, 
          ],
          backgroundColor: ['rgba(255, 99, 132, 0.5)']
        }
      ],
    }

    const handleChangeAmount = (event) => {
        let selectedBay = event.target.value.toString().split(',')[0];
        let jobsAmount = 0;
        if (bays.bays[selectedBay] !== undefined) {
            bays.bays[selectedBay].forEach(element => {
                jobsAmount += element.amount
            });
        }

        setSelectedAmount(event.target.value.toString().match(/\d/g).join(""))
        setAmount(jobsAmount)
        handleRefreshData()
    }

    return (
        <>
            {Oval}
            <div className={styles.headerContainer}>
                <h3>Jobs Amount Report</h3>
                <div className={styles.headerActions}>
                    {
                        <select onChange={handleChangeAmount} defaultValue={selectedAmount} className={styles.select}>
                            <option selected disabled> --Select Job Count-- </option>
                            
                            {
                                bays.counts !== undefined ?
                                Object.entries(bays.counts).map((value, key) => {
                                    if (value.toString().match(/\d/g).join("") > 0) {
                                        return <option key={key} value={value}>{capitalizeFirstLetter(value.toString().replace(',', ' - '))}</option>
                                    }
                                })
                                : <Oval color="#fff" height={20} width={70} />
                            }
                        </select> 
                    }
                    
                </div>
            </div>
            <div className={styles.contentContainer}>
                <div className={styles.content}>
                    <div className={styles.chartItem}>
                        <BarChart data={totalNumberOfJobs}/>
                    </div>
                </div>
            </div>
        </>
    )
}

export default AmountCountJobReport