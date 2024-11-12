import { Button as BsButton } from 'react-bootstrap'
import styles from './index.module.css';

const Button = ({style, children, colorVariant = "green", onClick, disabled}) => {
    return (
        <BsButton style={style} className={`${styles.button} ${styles[colorVariant]}`} onClick={onClick} disabled={disabled}>
            {children}
        </BsButton>
    )
}

export default Button