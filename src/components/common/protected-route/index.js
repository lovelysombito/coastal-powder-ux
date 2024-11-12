import { UserContext } from '../../../context/user-context'
import { useContext } from 'react'
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({children}) => {
    const { user } = useContext(UserContext)
    if (user) {
        return children
    } else {
        localStorage.setItem('return_url', window.location.pathname + window.location.search);
        return <Navigate to="/login" />
    }
}

export default ProtectedRoute