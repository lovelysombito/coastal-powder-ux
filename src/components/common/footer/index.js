import styles from './index.module.css';

const Footer = () => {
    return (
        <div className={styles.footer}>
            <span>Copyright @ 2022 &nbsp;</span>
            <span className={styles.companyName}>Coastal</span>
            <span>. All rights reserved.</span>
        </div>
    )
}

export default Footer