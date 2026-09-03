import React from 'react'
import ReactDOM from 'react-dom/client'
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom'
import App from './App'
import RemoteApp from './RemoteApp'
import './styles.css'

function NotFound(){
 return <main className="route-not-found"><div><span>Presence</span><h1>This route doesn’t exist.</h1><p>The workspace is still available.</p><a href="/">Return to Presence</a></div></main>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
 <React.StrictMode>
  <BrowserRouter>
   <Routes>
    <Route path="/" element={<App/>}/>
    <Route path="/remote/:sessionId" element={<RemoteApp/>}/>
    <Route path="/remote" element={<Navigate to="/" replace/>}/>
    <Route path="*" element={<NotFound/>}/>
   </Routes>
  </BrowserRouter>
 </React.StrictMode>
)
