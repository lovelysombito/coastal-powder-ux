import { Table } from 'react-bootstrap'
import { useTable, useExpanded, useSortBy } from 'react-table'
import { Fragment } from 'react'
import { AiFillCaretDown, AiFillCaretUp } from 'react-icons/ai'
import styles from './index.module.css';
import useUserScope from '../../../hooks/useUserScope';
import { SCOPE } from '../../../constants';

const DataTable = ({ columns, data, ExpandedComponent = null, expandedRowStyle = {}, onRowClick = null }) => {

    const userScope = useUserScope();

    const SortingIcon = ({ isSorted, isSortedDesc }) => {
        if (isSorted) {
            return (
                <div>
                    {isSortedDesc ? <AiFillCaretDown /> : <AiFillCaretUp />}
                </div>
            )
        } else {
            return null
        }
    }

    const initialState = { hiddenColumns: userScope === SCOPE.ADMINISTRATOR ? [] : ['amount'] };

    const { getTableProps, headerGroups, rows, prepareRow, visibleColumns } = useTable(
        {
            columns,
            data,
            initialState,
        },
        useSortBy,
        useExpanded,
    )
    return (
        <div className={styles.tableContainer}>
            <Table {...getTableProps()} className={`no-border ${styles.dataTable}`}>
                <thead>
                    {headerGroups.map((headerGroup, i) => (
                        <tr key={i}>
                            {headerGroup.headers.map((column, key) => (
                                <th key={key} style={column.style} {...column.getHeaderProps()} onClick={() => {
                                    if (column.isSortable) {
                                        column.toggleSortBy(!column.isSortedDesc)
                                    }
                                }}>
                                    <div>
                                        {column.render('Header')}&nbsp;
                                        {column.isSortable ? <SortingIcon isSorted={column.isSorted} isSortedDesc={column.isSortedDesc} /> : ""}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {rows.map((row, i) => {
                        prepareRow(row)
                        return (
                            <Fragment key={i}>
                                <tr {...row.getRowProps()}>
                                    {row.cells.map((cell, idx) => {
                                        return (
                                            <td className="align-middle" key={idx} {...cell.getCellProps()} onClick={() => {
                                                if (onRowClick && idx !== 0) {
                                                    onRowClick(row)
                                                }
                                            }}>
                                                {row.original.weight < row.original.low_weight ? (

                                                    <div className={styles.tableBodyCellContainerRed}>
                                                        {cell.render('Cell')}
                                                    </div>
                                                )

                                                    :
                                                    (
                                                        <div className={styles.tableBodyCellContainer}>
                                                            {cell.render('Cell')}
                                                        </div>
                                                    )}


                                            </td>
                                        )
                                    })}
                                </tr>
                                {row.isExpanded && ExpandedComponent ? (
                                    <tr className='mb-2'>
                                        <td colSpan={visibleColumns.length} style={{ ...expandedRowStyle }}>
                                            <ExpandedComponent data={row.original.data} />
                                        </td>
                                    </tr>
                                ) : ""}
                            </Fragment>
                        )
                    })}
                </tbody>
            </Table>
        </div>
    )
}

export default DataTable