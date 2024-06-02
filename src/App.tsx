import { useCallback, useEffect, useState } from 'react'
import './App.css'
import authService from './services/auth';

function App() {
  const [accessToken, setAccessToken] = useState<string>();
  const [refreshToken, setRefreshToken] = useState<string>();


  const login = useCallback(() => {
    authService.initiateAuthRequest();
  },[])

  useEffect(()=>{
    authService.getRedirectResult().then((response)=> {
      if(!response){
        return;
      }
      setAccessToken(response.accessToken);
      setRefreshToken(response.refreshToken);
    })
  },[])
  return (
    <>
      
      <h1>PKCE Demo</h1>
      <div className="card">
        {!accessToken ? <button onClick={login}>
          Login
        </button>: <p>User is logged in</p>}
        <p>
          Access Token: {accessToken}<br/>
          Refresh Token: {refreshToken}<br/>
        </p>
      </div>
      
    </>
  )
}

export default App
