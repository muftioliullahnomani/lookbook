import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Profile from './pages/Profile'
import UserProfile from './pages/UserProfile'
import Friends from './pages/Friends'
import Pages from './pages/Pages'
import PageDetail from './pages/PageDetail'
import PostDetail from './pages/PostDetail'
import Groups from './pages/Groups'
import GroupDetail from './pages/GroupDetail'
import BlockedUsers from './pages/BlockedUsers'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router basename={import.meta.env.BASE_URL} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Public routes with Layout */}
          <Route element={<Layout />}>
            <Route path="/page/:username" element={<PageDetail />} />
            <Route path="/post/:id" element={<PostDetail />} />
          </Route>
          
          {/* Private routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/pages" element={<Pages />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/:id" element={<GroupDetail />} />
              <Route path="/blocked-users" element={<BlockedUsers />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App