import { useEffect, useState } from 'react';
import Pagination from 'react-bootstrap/Pagination';

const TablePagination = ({ handlePageChange, handleFirst, handlePrev, handleNext, handleLast, pages, currentPage, numberOfPagesShown = 10 }) => {
    const [pagesToDisplay, setPagesToDisplay] = useState([]);
    useEffect(() => {
        const currentPages = pages.length;
        if (currentPages > 10) {
            if (currentPage === 1) {
                setPagesToDisplay([...pages.slice(0, numberOfPagesShown), '...']);
            } else if (currentPage - numberOfPagesShown > 0 && currentPages - currentPage >= numberOfPagesShown) {
                setPagesToDisplay(['...', ...pages.slice(currentPage - 1, currentPage + numberOfPagesShown), '...']);
            } else if (currentPages === currentPage || currentPages - currentPage < numberOfPagesShown) {
                setPagesToDisplay(['...', ...pages.slice(-numberOfPagesShown)]);
            }
        } else setPagesToDisplay(pages);
    }, [pages]);
    return (
        <div className='pagination' style={{ marginTop: 20 }}>
            <Pagination>
                <Pagination.First onClick={handleFirst} />
                <Pagination.Prev onClick={handlePrev} />
                {pagesToDisplay.map((value, index) => (
                    <Pagination.Item
                        value={value}
                        key={index}
                        onClick={(e) =>
                            {
                                value === '...'
                                ? index < numberOfPagesShown
                                    ? handlePageChange(currentPage - numberOfPagesShown)
                                    : handlePageChange(currentPage + numberOfPagesShown)
                                : handlePageChange(e.target.text)
                            }
                        }
                        active={currentPage === value ? true : false}
                    >
                        {value}
                    </Pagination.Item>
                ))}
                <Pagination.Next onClick={handleNext} />
                <Pagination.Last onClick={handleLast} />
            </Pagination>
        </div>
    );
};

export default TablePagination;
