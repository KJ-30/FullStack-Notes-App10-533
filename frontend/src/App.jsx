import React from "react"
import ProtectedRoutes from "./components/ProtectedRoutes"
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import NotificationSlider from "./components/Notification"
import NotificationProvider from "./context/NotificationContextProvider"

import Login from "./pages/Login"
import Register from "./pages/Register"
import Home from "./pages/Home"
import NotFound from "./pages/NotFound"
import CreateNote from "./pages/CreateNote"
import Header from "./components/Header"

function Logout() {
  localStorage.clear()
  return <Navigate to="/login" />
}

function Signup() {
  localStorage.clear()
  return <Register />
}

function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <NotificationSlider />
        <Header />
        <Routes>
          <Route path="/" element={<ProtectedRoutes><Home /></ProtectedRoutes>} />
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/register" element={<Signup />} />
          <Route path="/create-note" element={<ProtectedRoutes><CreateNote /></ProtectedRoutes>} />
          <Route path="/edit-note/:id" element={<ProtectedRoutes><CreateNote /></ProtectedRoutes>}/>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  )
}

export default App
