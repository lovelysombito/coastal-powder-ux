import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';

  const LineChart = ({title, yLabel, xLabel, data, hideTicksX = false, hideTicksY = false}) => {
    ChartJS.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend
    )

    const options = {
        responsive: true,
        scales: {
            y: {
                axis: 'y',
                title: {
                    display: yLabel ? true : false,
                    text: yLabel,
                    align: 'center'
                },
                ticks: {
                    display: hideTicksY ? false : true
                }
            },
            x: {
                axis: 'x',
                title: {
                    display: xLabel ? true : false,
                    text: xLabel,
                    align: 'center'
                },
                ticks: {
                    display: hideTicksX ? false : true
                }
            }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: title,
          },
        },
    }

    return (
        <Line options={options} data={data} />
    )
  }

  export default LineChart