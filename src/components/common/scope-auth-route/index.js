import { Navigate, Outlet } from 'react-router-dom';
import { useUserScope } from '../../../hooks';

// Restrict user access to routes by their scope
const ScopeAuthRoute = ({ scope }) => {
    const userScope = useUserScope();
    return scope.includes(userScope) ? <Outlet /> : <Navigate to='/' />;
};

export default ScopeAuthRoute;
