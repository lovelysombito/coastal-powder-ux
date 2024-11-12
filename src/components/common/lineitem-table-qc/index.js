import { Table } from 'react-bootstrap'
import { useTable } from 'react-table'
import { useMemo } from 'react'
import styles from './index.module.css';
import useUserScope from '../../../hooks/useUserScope';
import { SCOPE } from '../../../constants';
import SelectJobStatus from '../select';
import { statusColour } from '../../../utils/utils';

const LineItemTableQC = ({ data, handleRefreshData, bay }) => {

    const userScope = useUserScope();
    const initialState = { hiddenColumns: userScope === SCOPE.ADMINISTRATOR ? [] : ['amount'] };

    const columns = useMemo(
        () => [
            {
                Header: 'Product',
                accessor: 'lineItem',
                Cell: ({ data, row }) => {
                    return data[row.id].file_link ? <a href={data[row.id].file_link} target="_blank" rel="noreferrer">{data[row.id].lineItem}</a> : data[row.id].lineItem
                }
            },
            {
                Header: 'Status',
                accessor: 'line_item_status',
                Cell: ({ data, row }) => {
                    const status = data[row.id].line_item_status;
                    if (bay) {
                        return <SelectJobStatus status={status} id={data[row.id].line_item_id} type="line_status" handleRefreshData={handleRefreshData}/>
                    } else {
                        return <span style={{ backgroundColor: statusColour(status), fontSize: 12, color: 'black'}} className={styles.status}>{status}</span>
                        // return <SelectJobStatus status={status} id={data[row.id].line_item_id} type="line_status" handleRefreshData={handleRefreshData}/>
                    }
                },
            },
            {
                Header: '',
                id: 'space'
            },
            {
                Header: 'Quantity',
                accessor: 'quantity',
            },
        ], [bay, handleRefreshData]
    );

    const { getTableProps, headerGroups, rows, prepareRow } = useTable(
        {
            columns,
            data,
            initialState,
        },
    )
    return (
        <Table {...getTableProps()} className={`no-border ${styles.lineItemTable} mt-2`}>
            <thead>
                {headerGroups.map((headerGroup, i) => (
                    <tr key={i}>
                        {headerGroup.headers.map((column, columnIndex) => (
                            <th key={columnIndex} {...column.getHeaderProps()}>{column.render('Header')}</th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody>
                {rows.map((row, i) => {
                    prepareRow(row)
                    return (
                      // Apply the row props
                      <tr key={i} {...row.getRowProps()}>
                        {// Loop over the rows cells
                        row.cells.map((cell, cellIndex) => {
                          // Apply the cell props
                          return (
                            <td key={cellIndex} {...cell.getCellProps()}>
                              {// Render the cell contents
                              cell.render('Cell')}
                            </td>
                          )
                        })}
                      </tr>
                    )
                })}
            </tbody>
        </Table>
    )
}

export default LineItemTableQC