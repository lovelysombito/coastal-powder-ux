import { Table } from 'react-bootstrap';
import { useTable, useExpanded, useSortBy } from 'react-table';
import { Fragment, useEffect, useState } from 'react';
import { AiFillCaretDown, AiFillCaretUp } from 'react-icons/ai';
import styles from './index.module.css';
import useUserScope from '../../../hooks/useUserScope';
import { BAY_ARRAY_DETAIL, SCOPE } from '../../../constants';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import React from 'react';
import { addToList, convertWeekend, removeFromList, showAlert, showConfirmation } from '../../../utils/utils';
import { updateBayJobDate, updateJobs } from '../../../server';
import { DateTime } from 'luxon';

const DragDropTable = ({
    columns,
    ExpandedComponent = null,
    expandedRowStyle = {},
    tableData,
    setTableData,
    bay,
    setSelectedJobData,
    setIsSchedule,
    setShow,
    handleRefreshData,
}) => {
    const userScope = useUserScope();
    const [data, setData] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    let originTargetItem = null;

    useEffect(() => {
        if (Object.keys(tableData).length) {
            const rowData = Object.keys(tableData).reduce((acc, curr) => [...acc, ...tableData[curr]], []);
            setData(rowData);
        }
    }, [tableData]);

    const SortingIcon = ({ isSorted, isSortedDesc }) => {
        if (isSorted) {
            return <div>{isSortedDesc ? <AiFillCaretDown /> : <AiFillCaretUp />}</div>;
        } else {
            return null;
        }
    };

    const initialState = { hiddenColumns: userScope === SCOPE.ADMINISTRATOR ? [] : ['amount'] };

    const { getTableProps, headerGroups, rows, prepareRow, visibleColumns } = useTable(
        {
            columns,
            data,
            initialState,
        },
        useSortBy,
        useExpanded
    );

    const onTableDragEnd = (result) => {
        setIsDragging(false);
        if (!result.destination) {
            return;
        }
    
        const tableCopy = JSON.parse(JSON.stringify(tableData));
        const title = result.source.droppableId.split('--')[1];
        const sourceList = tableData[title];
        // Get removed Element and remove it from list
        const [targetItem, newSourceList] = removeFromList(sourceList, result.source.index);
        // Apply change to table
        tableCopy[title] = newSourceList;
        // Get destination
        const destinationTitle = result.destination.droppableId.split('--')[1];
        const destinationLists = tableCopy[destinationTitle];

        if (title === destinationTitle) return;

        // Drop to 'Ready to Schedule' reset current bay date and priority
        if (title !== destinationTitle && destinationTitle === 'Ready to Schedule') {
            targetItem.bays[`${bay}Date`] = null;
            updateJobs({ [`${bay}_date`]: null, [`${bay}_priority`]: -1 }, targetItem.jobId).catch(() => {
                return showAlert('error', `An error has occured updating the jobs date`);
            });
            tableCopy[destinationTitle] = addToList(destinationLists, result.destination.index, targetItem);
            return setTableData(tableCopy);
        }
        const dropZoneDate = destinationTitle;
        tableCopy[destinationTitle] = addToList(destinationLists, result.destination.index, targetItem);
        setTableData(tableCopy);
        calculateBaysDateDetails(targetItem, dropZoneDate);
    }

    const calculateBaysDateDetails = async (targetItem, dropZoneDate) => {
        originTargetItem = JSON.parse(JSON.stringify(targetItem));
        const bayKeys = BAY_ARRAY_DETAIL.map(item => item.key);
        const currentBayKey = `${bay}Date`;
        const currentBayEndKey = `${bay}DateEnd`;
        let continueRun = true;

        // Show confirmation if current bay is on multiple dates
        if (targetItem.bays[currentBayEndKey]) {
            await showConfirmation({
                icon: 'question',
                message: 'This job was previously scheduled on multiple dates for this bay. Do you want to schedule it on single day?',
                confirmButtonText: 'Yes',
                showDenyButton: true,
                denyButtonText: 'No',
                reject: () => continueRun = false,
            })
        }
        if (!continueRun) {
            handleRefreshData();
            return;
        }
        targetItem.bays[currentBayEndKey] = null;
        targetItem.bays[currentBayKey] = dropZoneDate;
        const jobCardBays = Object.keys(targetItem.bays).filter(key => bayKeys.includes(key) && !['NA', 'Awaiting schedule', null].includes(targetItem.bays[key]));
        const jobCardBaysInOrder = bayKeys.filter(key => jobCardBays.includes(key));
        const currentBayIndex = jobCardBaysInOrder.indexOf(currentBayKey);
        let dateToCompare = DateTime.fromISO(dropZoneDate);
        const modifyEndDate = (key, newStartDate) => {
            const {days: dateDiff} = DateTime.fromISO(newStartDate).diff(DateTime.fromISO(targetItem.bays[key]), 'days').toObject();
            if (targetItem.bays[`${key}End`] && DateTime.fromISO(newStartDate) > DateTime.fromISO(targetItem.bays[`${key}End`])) {
                targetItem.bays[`${key}End`] = convertWeekend(DateTime.fromISO(targetItem.bays[`${key}End`]).plus({ days: dateDiff }).toFormat('yyyy-MM-dd'));
            }
        }
        jobCardBaysInOrder.forEach((key, index) => {
            if (index !== currentBayIndex) {
                const isBefore = DateTime.fromISO(targetItem.bays[key]) < dateToCompare;
                const isAfter = DateTime.fromISO(targetItem.bays[key]) > dateToCompare;

                if (index < currentBayIndex && (isAfter || targetItem.bays[key] === null)) {
                    // Is today
                    if (DateTime.fromISO(DateTime.now().toFormat('YYYY-MM-DD')).hasSame(dateToCompare)) {
                        modifyEndDate(key, dropZoneDate);
                        targetItem.bays[key] = dropZoneDate;
                    } else {
                        const newStartDate = convertWeekend(dateToCompare.add(-1, 'day'), currentBayIndex > index);
                        modifyEndDate(key, newStartDate);
                        targetItem.bays[key] = newStartDate;
                        dateToCompare = DateTime.fromISO(targetItem.bays[key]);
                    }
                } else if (index > currentBayIndex && (isBefore || targetItem.bays[key] === null)) {
                    const newStartDate = convertWeekend(dateToCompare.add(1, 'day'), currentBayIndex > index);
                    modifyEndDate(key, newStartDate);
                    targetItem.bays[key] = newStartDate;
                    dateToCompare = DateTime.fromISO(targetItem.bays[key]);
                }
            } else dateToCompare = DateTime.fromISO(dropZoneDate);

        })
        saveOrOpenModal(targetItem)
    }

    const saveOrOpenModal = (targetItem) => {
        const changedBays = [];
        for (const key in targetItem.bays) {
            if (targetItem.bays[key] !== originTargetItem.bays[key]) {
                changedBays.push({ [key]: targetItem.bays[key] });
            }
        }
        // If there is any bay that before today, reset all dates and show a popup
        for (const item of changedBays) {
            const value = Object.values(item)[0];
            const isBefore = DateTime.fromISO(value)< (DateTime.fromISO(DateTime.now().toFormat('YYYY-MM-DD')));
            if (isBefore) {
                setSelectedJobData({ ...originTargetItem, dueDate: targetItem.details.date });
                setIsSchedule(true);
                setShow(true);
                handleRefreshData();
                return;
            }
        }
        if (changedBays.length === 1) {
            const details = BAY_ARRAY_DETAIL.reduce((acc, curr) => {
                const bayDate = DateTime.fromISO(targetItem.bays[curr.key], 'YYYY-MM-DD');
                if (bayDate.isValid) return { ...acc, [curr.databaseKey]: DateTime.fromJSDate(new Date(targetItem.bays[curr.key])).toISODate() };
                else return { ...acc }
            }, {});

            updateBayJobDate(details, targetItem.jobId).then(res => {
                handleRefreshData();
                return showAlert('success', res.data.msg);
            }).catch(err => {
                return showAlert('error', err)
            })
        } else {
            setSelectedJobData({ ...targetItem, dueDate: targetItem.dueDate });
            setIsSchedule(true);
            setShow(true);
        }
    }

    return (
        <div className={styles.tableContainer}>
            <Table {...getTableProps()} className={`no-border ${styles.dataTable}`}>
                <thead>
                    {headerGroups.map((headerGroup, i) => (
                        <tr key={i}>
                            {headerGroup.headers.map((column, key) => (
                                <th
                                    key={key}
                                    style={column.style}
                                    {...column.getHeaderProps()}
                                    onClick={() => {
                                        if (column.isSortable) {
                                            column.toggleSortBy(!column.isSortedDesc);
                                        }
                                    }}
                                >
                                    <div>
                                        {column.render('Header')}&nbsp;
                                        {column.isSortable ? <SortingIcon isSorted={column.isSorted} isSortedDesc={column.isSortedDesc} /> : ''}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <DragDropContext
                    onDragEnd={onTableDragEnd}
                    onBeforeDragStart={() => setIsDragging(true)}
                >
                    {Object.keys(tableData).map((key) => {
                        const rowsOfKey = rows.filter((row) => tableData[key].some((item) => item.jobId === row.original.jobId));
                        return (
                            <Droppable key={`${key}`} droppableId={`droppable--${key}`}>
                                {(provided) => (
                                    <tbody {...provided.droppableProps} ref={provided.innerRef} style={{ border: '1px solid lightgrey', margin: '10px 0' }}>
                                        <Fragment>
                                            <tr style={{ height: 30 }}>
                                                <td colSpan={visibleColumns.length} className={styles.rowKey} style={{ paddingLeft: 20, paddingTop: 27 }}>
                                                    {DateTime.fromISO(key).isValid ? DateTime.fromISO(key).toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY) : key}
                                                </td>
                                            </tr>
                                            {rowsOfKey.length ? (
                                                rowsOfKey.map((row, i) => {
                                                    prepareRow(row);
                                                    return (
                                                        <Draggable key={i} draggableId={`${row.original.jobId}--${'test'}`} index={i}>
                                                            {(provided) => {
                                                                return (
                                                                    <Fragment>
                                                                        <tr
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            {...provided.dragHandleProps}
                                                                            {...row.getRowProps()}
                                                                        >
                                                                            {row.cells.map((cell, idx) => {
                                                                                return (
                                                                                    <LockedCell key={idx} isDragOccurring={isDragging}>
                                                                                        <div className={styles.tableBodyCellContainer}>
                                                                                            {cell.render('Cell')}
                                                                                        </div>
                                                                                    </LockedCell>
                                                                                );
                                                                            })}
                                                                        </tr>
                                                                        {row.isExpanded && ExpandedComponent && (
                                                                            <tr className='mb-2'>
                                                                                <td colSpan={visibleColumns.length} style={{ ...expandedRowStyle }}>
                                                                                    <ExpandedComponent data={row.original.data} />
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </Fragment>
                                                                );
                                                            }}
                                                        </Draggable>
                                                    );
                                                })
                                            ) : (
                                                <tr style={{ background: 'white', height: 70 }}>
                                                    <td colSpan={visibleColumns.length} style={{ paddingLeft: 20, paddingTop: 27 }}>
                                                        Empty
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                        {provided.placeholder}
                                    </tbody>
                                )}
                            </Droppable>
                        );
                    })}
                </DragDropContext>
            </Table>
        </div>
    );
};

// Custom cell component that persist the width when dragging
class LockedCell extends React.Component {
    ref;

    getSnapshotBeforeUpdate(prevProps) {
        if (!this.ref) return null;
        const isDragStarting = this.props.isDragOccurring && !prevProps.isDragOccurring;
        if (!isDragStarting) return null;
        const { width, height } = this.ref.getBoundingClientRect();
        const snapshot = {
            width,
            height,
        };
        return snapshot;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const ref = this.ref;
        if (!ref) return;
        
        if (snapshot) {
            if (ref.style.width === snapshot.width) return;
            ref.style.width = `${snapshot.width}px`;
            ref.style.height = `${snapshot.height}px`;
            return;
        }
        if (this.props.isDragOccurring) return;
        
        // inline styles not applied
        if (ref.style.width == null) return;
        
        // no snapshot and drag is finished - clear the inline styles
        ref.style.removeProperty('height');
        ref.style.removeProperty('width');
    }

    setRef = (ref) => {
        this.ref = ref;
    };

    render() {
        return (
            <td className='align-middle' ref={this.setRef}>
                {this.props.children}
            </td>
        );
    }
}

export default DragDropTable;
