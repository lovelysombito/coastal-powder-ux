import styles from './index.module.css';

const ToggleButton = ({checked, onChange}) => {
    return (
        <div className={`${styles.toggleButton} ${checked ? styles.toggleButtonOn : styles.toggleButtonOff}`} onClick={() => onChange(!checked)}>
            <div className={styles.toggleButtonDot}></div>
        </div>
    )
}

export default ToggleButton