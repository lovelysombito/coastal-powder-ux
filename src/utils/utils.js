import { DateTime } from 'luxon';
import moment from 'moment';
import Swal from 'sweetalert2';
import { BAY_OBJECT } from '../constants';
import { updateBayJobPriority, updateJobs } from '../server';

export const onDragEnd = (result, kanbanData, setKanbanData, calculateBaysDate, bay) => {
    if (!result.destination) {
        return;
    }

    const kanbanCopy = JSON.parse(JSON.stringify(kanbanData));
    const [title, subTitle] = result.source.droppableId.split('--');
    const subLists = kanbanCopy[title][subTitle];
    // Get removed Element and remove it from subLists
    const [targetItem, newSubLists] = removeFromList(subLists, result.source.index);
    // Apply change to kanban
    kanbanCopy[title][subTitle] = newSubLists;
    // Get destination
    const [destinationTitle, destinationSubTitle] = result.destination.droppableId.split('--');
    const destSubLists = kanbanCopy[destinationTitle][destinationSubTitle];

    // Drop to 'Ready to Schedule' reset current bay date and priority
    if (title !== destinationTitle && destinationTitle === 'Ready to Schedule') {
        targetItem.bays[`${bay}Date`] = null;
        updateJobs({ [`${bay}_date`]: null, [`${bay}_priority`]: -1 }, targetItem.jobId).catch(() => {
            return showAlert('error', `An error has occured updating the jobs date`);
        });
        kanbanCopy[destinationTitle][destinationSubTitle] = addToList(destSubLists, result.destination.index, targetItem);
        return setKanbanData(kanbanCopy);
    }
    // Move this to new subLists and apply change to kanban
    kanbanCopy[destinationTitle][destinationSubTitle] = addToList(destSubLists, result.destination.index, targetItem);

    const currentBayDate = targetItem.bayDates[BAY_OBJECT[targetItem.selectedBay]];
    const previousBayKey = getPreviousBayKey(targetItem.selectedBay);
    const previousBayValue = targetItem.bayDates[previousBayKey] ? moment(targetItem.bayDates[previousBayKey]) : null;
    const currentBayValue = moment(currentBayDate);

    // Drop in same title column we only adjust the priority
    if (title === destinationTitle) {
        // Arrange cards inside ranked column
        if (subTitle === 'Ranked' && destinationSubTitle === 'Ranked') {
            kanbanCopy[destinationTitle][destinationSubTitle] = sortPriority(kanbanCopy[destinationTitle][destinationSubTitle], false, bay);
            return setKanbanData(kanbanCopy);

            // Move unranked to ranked
        } else if (subTitle === 'Unranked' && destinationSubTitle === 'Ranked') {
            kanbanCopy[destinationTitle][destinationSubTitle] = sortPriority(kanbanCopy[destinationTitle][destinationSubTitle], false, bay);
            return setKanbanData(kanbanCopy);
            // Move ranked to unranked
        } else if (subTitle === 'Ranked' && destinationSubTitle === 'Unranked') {
            targetItem[`${bay}_priority`] = -1;
            updateBayJobPriority({ [`${bay}_priority`]: -1 }, targetItem.jobId);
            return setKanbanData(kanbanCopy);
        } else if ((subTitle === 'Unranked' && destinationSubTitle === 'Unranked') || (subTitle === 'data' && destinationSubTitle === 'data')) {
            return;
        }

        // Drop in different title column we adjust the priority then calculate the dates
    } else if (title !== destinationTitle) {
        if (previousBayValue && (currentBayValue.isBefore(previousBayValue))) {
            return showAlert('error', `Cannot set bay date before previous bay`);
        }
        // Arrange cards inside ranked column
        if (subTitle === 'Ranked' && destinationSubTitle === 'Ranked') {
            kanbanCopy[destinationTitle][destinationSubTitle] = sortPriority(kanbanCopy[destinationTitle][destinationSubTitle], true, bay);
            setKanbanData(kanbanCopy);

            // Move unranked/'ready to schedule' to ranked
        } else if (subTitle !== 'Ranked' && destinationSubTitle === 'Ranked') {
            kanbanCopy[destinationTitle][destinationSubTitle] = sortPriority(kanbanCopy[destinationTitle][destinationSubTitle], true, bay);
            setKanbanData(kanbanCopy);
        // Move ranked to unranked
        } else if (subTitle === 'Ranked' && destinationSubTitle === 'Unranked') {
            targetItem[`${bay}_priority`] = -1;
        }
    }

    setKanbanData(kanbanCopy);
    // Find dropZoneDate
    let dropZoneDate = null;
    if (destinationTitle === 'Today') {
        dropZoneDate = moment().format('YYYY-MM-DD');
    } else if (destinationTitle === 'Tomorrow') {
        dropZoneDate = moment().add(1, 'days').format('YYYY-MM-DD');
    } else if (destinationTitle !== 'Ready to Schedule' && destinationTitle !== 'Today' && destinationTitle !== 'Tomorrow') {
        dropZoneDate = destinationTitle;
    }
    calculateBaysDate({ targetItem, dropZoneDate, listWithNewPriority: kanbanCopy[destinationTitle][destinationSubTitle] });
};

export const getPreviousBayKey = (currentBay) => {
    const currentBayIndex = Object.keys(BAY_OBJECT).indexOf(currentBay);
    if (currentBayIndex > 0) return BAY_OBJECT[Object.keys(BAY_OBJECT)[currentBayIndex - 1]];
    else return null;
};

export const sortPriority = (currentList, onlyReturnUpdatedList, bay) => {
    try {
        const listWithNewPriority = currentList.map((item, index) => ({ ...item, [`${bay}_priority`]: index }));
        // Keep this promise background run to avoid card jumps back to original because of long time
        if (onlyReturnUpdatedList) {
            return listWithNewPriority;
        } else {
            Promise.all(listWithNewPriority.map((item) => updateBayJobPriority({ [`${bay}_priority`]: item[`${bay}_priority`] }, item.jobId))); //.then(() => showAlert('success', 'Updated priority!'));
            return listWithNewPriority;
        }
    } catch (error) {
        showAlert('error', error.message);
        return currentList;
    }
};

export const removeFromList = (list, index) => {
    const result = Array.from(list);
    const [removed] = result.splice(index, 1);
    return [removed, result];
};

export const addToList = (list, index, element) => {
    const result = Array.from(list);
    result.splice(index, 0, element);
    return result;
};

export const convertWeekend = (value, goBackward = false) => {
    value = DateTime.fromFormat(value, 'yyyy-MM-dd');
    let numericDayValue = value.weekday;
    if (numericDayValue === 7) {
        if (goBackward) value = value.minus({ days: 1 });
        else value = value.plus({ days: 1 });
    }
    return value.toFormat('yyyy-MM-dd');
};

//check for holidays and weekends
export const handleCheckDateIfWeekendOrHoliday = (value) => {
    /** Check if holiday */
    let date = moment(value);
    let day = date.date();
    let month = date.month() + 1;
    let year = date.year();
    let daysInMonth = moment(`${year}-${month}`).daysInMonth();
    while (checkHolidays(`${month}/${day}`)) {
        day++;
        if (day === daysInMonth) {
            day = 1;
            month++;
        }

        if (month === 12) {
            month = 1;
            year++;
        }
    }
    /** Check if the day is weekend */
    day ++
    if (day === daysInMonth) {
        day = 1;
        month++;
    }
    if (month === 12) {
        month = 1;
        year++;
    }
    let numericDayValue = moment(`${year}-${month}-${day}`).day();
    while ( numericDayValue === 0) {
        day++;
        numericDayValue++;
        if (numericDayValue === 7) numericDayValue = 0;
    }
    
    
    return moment(`${year}-${month}-${day}`).format('YYYY-MM-DD');
};

export const checkHolidays = () => {
    // for (let index = 0; index < holidays.length; index++) {
    //     if (holidays[index].date === date) {
    //         return true;
    //     }
    // }

    return false;
};

export const showAlert = (icon, message) => {
    return Swal.fire({
        icon: icon,
        html: message,
        allowOutsideClick: false
    });
};

export const showConfirmation = ({ icon, message, confirmButtonText = 'Yes', showDenyButton = true, denyButtonText = 'No', confirm = () => {}, reject = () => {} }) => {
    return Swal.fire({
        icon: icon,
        html: message,
        confirmButtonText,
        showDenyButton,
        denyButtonText,
    }).then((result) => {
        try {
            if (result.isConfirmed) confirm();
            else if (result.isDenied) reject();
        } catch (error) {
            showAlert('error', error.message);
        }
    });
};

export const handleGetBayDates = (bays) => {
    let arrayBays = {};
    if (bays.chem_date !== null) {
        arrayBays['chemDate'] = bays.chem_date;
    }

    if (bays.treatment_date !== null) {
        arrayBays['treatmentDate'] = bays.treatment_date;
    }

    if (bays.burn_date !== null) {
        arrayBays['burnDate'] = bays.burn_date;
    }

    if (bays.blast_date !== null) {
        arrayBays['blastDate'] = bays.blast_date;
    }

    if (bays.powder_date !== null) {
        arrayBays['powderDate'] = bays.powder_date;
    }

    return arrayBays;
};

export const handleGetBay = (bays) => {
    let arrayBays = {};
    if (bays.chem_bay !== null) {
        arrayBays['chemBay'] = bays.chem_bay;
    }

    if (bays.treatment_bay !== null) {
        arrayBays['treatmentBay'] = bays.treatment_bay;
    }

    if (bays.burn_bay !== null) {
        arrayBays['burnBay'] = bays.burn_bay;
    }

    if (bays.blast_bay !== null) {
        arrayBays['blastBay'] = bays.blast_bay;
    }

    if (bays.powder_bay !== null) {
        arrayBays['powderBay'] = bays.powder_bay;
    }

    return arrayBays;
};

export const handleGetBayJobStatus = (bays) => {
    let arrayBays = {}
    if (bays.chem_status !== null && bays.chem_status !== 'na') {
        arrayBays['chemBay'] = bays.chem_status
    }

    if (bays.treatment_status !== null && bays.treatment_status !== 'na') {
        arrayBays['treatmentBay'] = bays.treatment_status
    }

    if (bays.burn_status !== null && bays.burn_status !== 'na') {
        arrayBays['burnBay'] = bays.burn_status
    }

    if (bays.blast_status !== null && bays.blast_status !== 'na') {
        arrayBays['blastBay'] = bays.blast_status
    }

    if (bays.powder_status !== null && bays.powder_status !== 'na') {
        arrayBays['powderBay'] = `${bays.powder_status}`
    }

    return arrayBays
};

export const handleGetBayValues = (bays) => {
    let arrayBays = {};
    if (bays.chem_bay_required === 'yes') {
        arrayBays['chemBay'] = bays.chem_bay;
        arrayBays['chemDate'] = bays.chem_date;
        arrayBays['chemDateEnd'] = bays.end_chem_date;
        arrayBays['chemDateAndBay'] = bays.chem_date ? DateTime.fromFormat(bays.chem_date, 'yy-LL-dd').toFormat('dd/LL/yy') + ' ' + bays.chem_status : 'Awaiting schedule';
        arrayBays['chem_contractor_return_date'] = bays.chem_contractor_return_date;
    } else {
        arrayBays['chemBay'] = 'NA';
        arrayBays['chemDate'] = 'NA';
        arrayBays['chemDateAndBay'] = 'NA';
        arrayBays['chem_contractor_return_date'] = 'NA';
    }

    if (bays.treatment_bay_required === 'yes') {
        arrayBays['treatmentBay'] = bays.treatment_bay;
        arrayBays['treatmentDate'] = bays.treatment_date;
        arrayBays['treatmentDateEnd'] = bays.end_treatment_date;
        arrayBays['treatmentDateAndBay'] = bays.treatment_date ? DateTime.fromFormat(bays.treatment_date, 'yy-LL-dd').toFormat('dd/LL/yy') + ' ' + bays.treatment_status : 'Awaiting schedule'
        arrayBays['treatment_contractor_return_date'] = bays.treatment_contractor_return_date;
    } else {
        arrayBays['treatmentBay'] = 'NA';
        arrayBays['treatmentDate'] = 'NA';
        arrayBays['treatmentDateAndBay'] = 'NA';
        arrayBays['treatment_contractor_return_date'] = 'NA';
    }

    if (bays.burn_bay_required === 'yes') {
        arrayBays['burnBay'] = bays.burn_bay;
        arrayBays['burnDate'] = bays.burn_date;
        arrayBays['burnDateEnd'] = bays.end_burn_date;
        arrayBays['burnDateAndBay'] = bays.burn_date ? DateTime.fromFormat(bays.burn_date, 'yy-LL-dd').toFormat('dd/LL/yy') + ' ' + bays.burn_status : 'Awaiting schedule';
        arrayBays['burn_contractor_return_date'] = bays.burn_contractor_return_date;
    } else {
        arrayBays['burnBay'] = 'NA';
        arrayBays['burnDate'] = 'NA';
        arrayBays['burnDateAndBay'] = 'NA';
        arrayBays['burn_contractor_return_date'] = null;
    }

    if (bays.blast_bay_required === 'yes') {
        arrayBays['blastBay'] = bays.blast_bay;
        arrayBays['blastDate'] = bays.blast_date;
        arrayBays['blastDateEnd'] = bays.end_blast_date;
        arrayBays['blastDateAndBay'] = bays.blast_date ? DateTime.fromFormat(bays.blast_date, 'yy-LL-dd').toFormat('dd/LL/yy') + ' ' + bays.blast_status : 'Awaiting schedule';
        arrayBays['blast_contractor_return_date'] = bays.blast_contractor_return_date;
    } else {
        arrayBays['blastBay'] = 'NA';
        arrayBays['blastDate'] = 'NA';
        arrayBays['blastDateAndBay'] = 'NA';
        arrayBays['blast_contractor_return_date'] = null;
    }
    if (bays.powder_bay_required === 'yes') {
        arrayBays['powderBay'] = bays.powder_bay;
        arrayBays['powderDate'] = bays.powder_date;
        arrayBays['powderDateEnd'] = bays.end_powder_date;
        arrayBays['powderDateAndBay'] = bays.powder_date ? DateTime.fromFormat(bays.powder_date, 'yy-LL-dd').toFormat('dd/LL/yy') + ' ' + bays.powder_status : 'Awaiting schedule';
    } else {
        arrayBays['powderBay'] = 'NA';
        arrayBays['powderDate'] = 'NA';
        arrayBays['powderDateAndBay'] = 'NA';
    }
    return arrayBays;
};

export const statusColour = (status) => {
    let colour = 'blue';
    if (status) {
        switch (status.toLowerCase()) {
            case 'ready':
            case 'ready (main line)':
            case 'ready (small batch)':
            case 'ready (big batch)':
                colour = 'orange';
                break;
            case 'awaiting schedule':
            case 'awaiting schedule (main line)':
            case 'awaiting schedule (small batch)':
            case 'awaiting schedule (big batch)':
                colour = 'blue';
                break;
            case 'in progress':
            case 'in progress (main line)':
            case 'in progress (small batch)':
            case 'in progress (big batch)':
                colour = 'yellow';
                break;
            case 'waiting on pre treatment':
                colour = 'red';
                break;
            case 'awaiting qc' || 'awaiting qc (main line)' || 'awaiting qc (small batch)' || 'awaiting qc (big batch)':
                colour = 'pink';
                break;
            case 'error | redo':
            case 'error | redo (small batch)':
            case 'error | redo (main line)':
            case 'error | redo (big batch)':
                colour = 'black';
                break;
            case 'passed qc':
            case 'ready for dispatch':
            case 'complete':
            case 'complete (small batch)':
            case 'complete (main line)':
            case 'complete (big batch)':
                colour = 'green';
                break;
            default:
                colour = 'blue';
                break;
        }
    }

    return colour;
};

export const checkConflictBeforeSave = (dateDetails) => {
    // let isSame = false;
    let isAfter = false;
    const keyAndValue = {
        chem_date: 'Chem Date',
        burn_date: 'Burn Date',
        treatment_date: 'Treatment Date',
        blast_date: 'Blast Date',
        powder_date: 'Powder Date',
    };
    const keyOrder = ['chem_date', 'burn_date', 'treatment_date', 'blast_date', 'powder_date'];
    const keyToLoop = keyOrder.filter((key) => Object.keys(dateDetails).includes(key));
    for (let i = 0; i < keyToLoop.length; i++) {
        const key = keyToLoop[i];
        for (let j = i + 1; j < keyToLoop.length; j++) {
            const keyToCompare = keyToLoop[j];
            const nextBayDate = moment(dateDetails[keyToCompare]);
            const nextBayDateEnd = moment(dateDetails[`end_${keyToCompare}`]);
            // isSame = moment(dateDetails[key]).isSame(nextBayDate);
            isAfter = moment(dateDetails[key]).isAfter(nextBayDate) || moment(dateDetails[key]).isAfter(nextBayDateEnd);
            // if (isSame) {
            //     showAlert('error', `${keyAndValue[key]} is same with ${keyAndValue[keyToCompare]}!`);
            //     break;
            // }
            if (isAfter) {
                showAlert('error', `${keyAndValue[key]} is after ${keyAndValue[keyToCompare]}!`, 'error');
                break;
            }
        }
        // if (isSame || isAfter) break;
        if (isAfter) break;
    }
    // return isSame || isAfter;
    return isAfter;
};

export const numberWithCommas = (number, decimals = 2) => parseFloat(number).toFixed(decimals).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const generateDataBasedOnSelectedDate = (kanbanJobs, dateRange, startDate, type) => {
    let newDateRange = removeSundayFromDateRange(dateRange, startDate);
    const newData = {};
    const keyList = ['Ready to Schedule'];
    let lastKey = moment(startDate).format('YYYY-MM-DD');

    // Today
    if (DateTime.fromISO(lastKey).weekday !== 7) keyList.push(DateTime.fromISO(lastKey).toFormat('yyyy-MM-dd'));
    const lengthToSubstract = keyList.length - 1;

    for (let index = 0; index <= newDateRange - lengthToSubstract; index++) {
        lastKey = moment(lastKey).add(1, 'day').format('YYYY-MM-DD');
        let newKey = convertWeekend(lastKey);
        keyList.push(newKey);
        lastKey = newKey;
    }

    const subLists = {
        Unranked: [],
        Ranked: [],
    }

    keyList.forEach((key) => {
        if (kanbanJobs[key]) newData[key] = kanbanJobs[key];
        else if (key === 'Ready to Schedule') newData[key] = type === 'kanban' ? { data: [] } : [];
        else newData[key] = type === 'kanban' ? subLists : [];
    });
    return newData;
};

const removeSundayFromDateRange = (dateRange, startDate) => {
    let newDateRange = dateRange;
    let lastKey = moment(startDate).format('YYYY-MM-DD');
    if (moment(lastKey).day() === 0) newDateRange = newDateRange - 1
    
    let finalDateRange = newDateRange
    for (let index = 0; index <= newDateRange ; index++) {
        if (moment(lastKey).day() === 0) {
            finalDateRange = finalDateRange - 1
        }
        lastKey = moment(lastKey).add(1, 'day').format('YYYY-MM-DD');

    }

    return finalDateRange;
}

export const overviewStatusOptions = [
    {
        label: 'Ready',
        color: 'orange',
        id: 'ready'
    },
    {
        label: 'Waiting',
        color: 'red',
        id: 'waiting'
    },
    {
        label: 'In Progress',
        color: 'gold',
        id: 'in progress'
    },
    {
        label: 'Complete',
        color: 'green',
        id: 'complete'
    },
    {
        label: 'Error | Redo',
        color: 'red',
        id: 'error | redo'
    }
];

export const handleGetJobBay = (bays) => {
    if (bays.chem_status !== null) {
        if (bays.chem_status == 'ready' || bays.chem_status == 'in progress' || bays.chem_status == 'waiting') {
            return 'chem'
        }
    }
    if (bays.burn_status !== null) {
        if (bays.burn_status == 'ready' || bays.burn_status == 'in progress' || bays.burn_status == 'waiting') {
            return 'burn'
        } 
    }

    if (bays.treatment_status !== null) {
        if (bays.treatment_status == 'ready' || bays.treatment_status == 'in progress' || bays.treatment_status == 'waiting') {
            return 'treatment'
        }
    }

    if (bays.blast_status !== null) {
        if (bays.blast_status == 'ready' || bays.blast_status == 'in progress' || bays.blast_status == 'waiting') {
            return 'blast'
        } 
    }

    if (bays.powder_status !== null) {
        if (bays.powder_status == 'ready' || bays.powder_status == 'in progress' || bays.powder_status == 'waiting') {
            return 'powder'
        } 
    }
    
    return getFinalJobBay(bays)
};

const getFinalJobBay = (bays) => {
    if (bays.powder_status !== null) {
        if (bays.powder_status == 'complete') {
            return 'powder'
        } 
    }

    if (bays.blast_status !== null) {
        if (bays.blast_status == 'complete') {
            return 'blast'
        } 
    }

    if (bays.treatment_status !== null) {
        if (bays.treatment_status == 'complete') {
            return 'treatment'
        }
    }

    if (bays.burn_status !== null) {
        if (bays.burn_status == 'complete') {
            return 'burn'
        } 
    }

    if (bays.chem_status !== null) {
        if (bays.chem_status == 'complete') {
            return 'chem'
        }
    }
}

export const capitalizeFirstLetter = (str) => {

    // converting first letter to uppercase
    if (str !== '' || str !== null) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    return str;
}

export const lowerFirstLetter = (str) => {

    // converting first letter to lowercase
    if (str !== '' || str !== null) {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }

    return str;
}

export const elementObserver = (selector) => {
    return new Promise((resolve) => {
        if (document.querySelectorAll(selector)) {
            return resolve(document.querySelectorAll(selector));
        }
        const observer = new MutationObserver(() => {
            if (document.querySelectorAll(selector)) {
                resolve(document.querySelectorAll(selector));
                observer.disconnect();
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    });
};

export const getBayPeriod = (startDate, endDate) => {
    let output = startDate ? DateTime.fromFormat(startDate, 'yyyy-LL-dd').toFormat('dd-LL-yyyy') : 'Awaiting Schedule';
    if (endDate) {
        output = `${DateTime.fromFormat(startDate, 'yyyy-LL-dd').toFormat('dd-LL-yyyy')} - ${DateTime.fromFormat(endDate, 'yyyy-LL-dd').toFormat('dd-LL-yyyy')}`;
    }
    return output;
}

export const dataUrlToFile = (data_url, file_name) => {
    var arr = data_url.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], file_name, { type: mime });
};
