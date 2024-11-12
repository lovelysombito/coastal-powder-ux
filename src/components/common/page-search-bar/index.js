import styles from './index.module.css';

const PageSearchBar = ({dataKanban, handleSearchPageData, title}) => {
    const handleSearchChange = (e) => {
        if (title == 'overview') {
            let newData = []
            for(let data of dataKanban) {
                if (data.invoices.length > 0) {
                    let filtered = data.invoices.filter(invoice => invoice.invoiceNumber.toLowerCase().includes(e.target.value.toLowerCase()))
                    newData.push({title: data.title, invoices: filtered})
                    continue
                }
    
                newData.push(data)
            }

            return handleSearchPageData(newData)
        }

        let newData = {}
        for( var key in dataKanban ) {
            if (dataKanban[key].Uranked !== undefined || dataKanban[key].Ranked !== undefined) {
                let filteredRank = dataKanban[key].Ranked.filter(invoice => invoice.invoiceNumber.toLowerCase().includes(e.target.value.toLowerCase()))
                let filteredUnranked = dataKanban[key].Unranked.filter(invoice => invoice.invoiceNumber.toLowerCase().includes(e.target.value.toLowerCase()))
                newData[key] = { Unranked: filteredUnranked, Ranked: filteredRank }
            } else {
                let filtered = dataKanban[key].data.filter(invoice => invoice.invoiceNumber.toLowerCase().includes(e.target.value.toLowerCase()))
                newData[key] =  {data: filtered}
            }
        }

        return handleSearchPageData(newData)
    }

    return (
        <input className={styles.input} onChange={handleSearchChange} placeholder="Search here"/>
    )

}

export default PageSearchBar