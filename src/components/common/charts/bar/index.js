import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';


  const BarChart = ({title, yLabel, xLabel, data, isHorizontal = false, hideTicksX = false, hideTicksY = false}) => {
    ChartJS.register(
        CategoryScale,
        LinearScale,
        BarElement,
        Title,
        Tooltip,
        Legend
    )

    const options = {
        indexAxis: isHorizontal ? "y" : "x",
        responsive: true,
        elements: {
            bar: {
              borderWidth: 2,
            },
        },
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
        <Bar options={options} data={data} />
    )
  }

  export default BarChart