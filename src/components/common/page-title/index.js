import styles from './index.module.css';

const PageTitle = ({title}) => {
    return (
        <div className={styles.pageTitle}>
            <span>{title}</span>
        </div>
    )
}

export default PageTitle