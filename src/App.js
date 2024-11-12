import React from 'react';
import './App.css'
import ContentWrapper from './components/common/content-wrapper'
import Login from './components/pages/login'
import Verify from './components/pages/verify'
import ProtectedRoute from './components/common/protected-route'
import { Routes, Route, BrowserRouter } from 'react-router-dom'
import { LOGIN_LINK, VERIFY_TWO_FACTOR_AUTH_PAGE, VERIFY_LINK } from './constants'
import VerifyTwoFactorAuthPage from './components/pages/login/verify-two-factor-auth-page';
import axios from 'axios'
import WebsocketProvider from './context/websocket-context';
import UserProvider from './context/user-context'

axios.interceptors.response.use(function (response) {
  return response
}, function (error) {
  if (error.response.status === 401) {
    localStorage.removeItem('user');
    localStorage.setItem('return_url', window.location.pathname + window.location.search);
    window.location.href = LOGIN_LINK
  }
  return Promise.reject(error)
})

function App() {

  return (
    <BrowserRouter>
      <UserProvider>
        <WebsocketProvider>
            <main>
              <Routes>
                <Route path={LOGIN_LINK} element={ <Login/> } />
                <Route path={VERIFY_LINK} element={ <Verify/> } />
                <Route path={VERIFY_TWO_FACTOR_AUTH_PAGE} element={ <VerifyTwoFactorAuthPage/> } />
                <Route path="*" element={ <ProtectedRoute><ContentWrapper/></ProtectedRoute> } />
              </Routes>
            </main>
        </WebsocketProvider>
      </UserProvider>
    </BrowserRouter>
	)
}

export default App;
