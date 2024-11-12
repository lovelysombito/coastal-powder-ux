import { createContext, useState } from 'react'  

const initialUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
export const UserContext = createContext(initialUser)

const UserProvider = ({ children }) => {
    const [user, setUser] = useState(initialUser);

    const loginUserContext = (user) => {
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
    }

    const logoutUserContext = () => {
      setUser(null);
      localStorage.removeItem('user');
    }

    return (
      <UserContext.Provider value={{user, loginUserContext, logoutUserContext}}>
        {children}
      </UserContext.Provider>
    )
}

export default UserProvider