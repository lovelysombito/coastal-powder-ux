// import ListGroup from 'react-bootstrap/ListGroup';
import Post from '../post/index'
import styles from './index.module.css'

const LinkedListGroup = ({ filteredResults }) => {
    const results = filteredResults.results.map(post => <Post key={post.job_id} post={post} />)

    const content = results?.length ? results : <article><p>No Matching Results</p></article>

    return (
        <main className={styles.mainContentWrapper}>
            <div className={styles.fixbar}>{content}</div>

        </main>

    )
}

export default LinkedListGroup;