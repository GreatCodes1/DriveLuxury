import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/Authcontext'
import { ProtectedRoute } from './components/common/ProtectedRoute'

import LandingPage from './pages/LandingPage'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import VerifyOtp from './pages/VerifyOtp'
import ForgotPassword from './pages/Forgotpassword'
import Fleet from './pages/Fleet'
import SearchResults from './pages/SearchResults'
import Wishlist from './pages/Wishlist'
import CarDetails from './pages/CarDetails'
import Checkout from './pages/Checkout'
import PaymentCallback from './pages/PaymentCallback'

import DashboardHome from './pages/dashboard/DashboardHome'
import MyBookings from './pages/dashboard/MyBookings'
import DashboardWishlist from './pages/dashboard/Wishlist'
import Messages from './pages/dashboard/Messages'
import Profile from './pages/dashboard/Profile'
import Settings from './pages/dashboard/Settings'
import PaymentMethods from './pages/dashboard/PaymentMethods'
import HelpSupport from './pages/dashboard/HelpSupport'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminVehicles from './pages/admin/Vehicles'
import AdminBookings from './pages/admin/Bookings'
import AdminCustomers from './pages/admin/Customers'
import AdminMessages from './pages/admin/Messages'
import AdminPayments from './pages/admin/Payments'
import AdminReviews from './pages/admin/Reviews'
import AdminAnalytics from './pages/admin/Analytics'
import AdminSettings from './pages/admin/Settings'
import About from './pages/About'
import Locations from './pages/Locations'
import Contact from './pages/Contact' 
import BookingDetail from './pages/dashboard/BookingDetail'
import AdminRefunds from './components/admin/AdminRefunds'
import AdminContactRequests from './pages/admin/ContactRequests'
import AdminCategories from './pages/admin/Categories'


function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public */}
            <Route path='/' element={<LandingPage />} />
            <Route path='/about' element={<About />} />
            <Route path='/locations' element={<Locations />} />
            <Route path='/contact' element={<Contact />} />
            <Route path='/signup' element={<SignUp />} />
            <Route path='/login' element={<SignIn />} />
            <Route path='/verify-otp' element={<VerifyOtp />} />
            <Route path='/forgot-password' element={<ForgotPassword />} />
            <Route path='/fleet' element={<Fleet />} />
            <Route path='/search-results' element={<SearchResults />} />
            <Route path='/wishlist' element={<Wishlist />} />
            <Route path='/cars/:id' element={<CarDetails />} />
            <Route path='/checkout' element={<Checkout />} />
            <Route path='/payment/callback' element={<PaymentCallback />} />

            {/* Customer dashboard */}
            <Route path='/dashboard' element={<ProtectedRoute requireRole="customer"><DashboardHome /></ProtectedRoute>} />
            <Route path='/dashboard/bookings' element={<ProtectedRoute requireRole="customer"><MyBookings /></ProtectedRoute>} />
            <Route path='/dashboard/wishlist' element={<ProtectedRoute requireRole="customer"><DashboardWishlist /></ProtectedRoute>} />
            <Route path='/dashboard/messages' element={<ProtectedRoute requireRole="customer"><Messages /></ProtectedRoute>} />
            <Route path='/dashboard/profile' element={<ProtectedRoute requireRole="customer"><Profile /></ProtectedRoute>} />
            <Route path='/dashboard/settings' element={<ProtectedRoute requireRole="customer"><Settings /></ProtectedRoute>} />
            <Route path='/dashboard/payment-methods' element={<ProtectedRoute requireRole="customer"><PaymentMethods /></ProtectedRoute>} />
            <Route path='/dashboard/help' element={<ProtectedRoute requireRole="customer"><HelpSupport /></ProtectedRoute>} />
            <Route path='/dashboard/bookings/:id' element={<ProtectedRoute requireRole="customer"><BookingDetail /></ProtectedRoute>} />

            {/* Admin */}
            <Route path='/admin' element={<ProtectedRoute requireRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path='/admin/vehicles' element={<ProtectedRoute requireRole="admin"><AdminVehicles /></ProtectedRoute>} />
            <Route path='/admin/bookings' element={<ProtectedRoute requireRole="admin"><AdminBookings /></ProtectedRoute>} />
            <Route path='/admin/customers' element={<ProtectedRoute requireRole="admin"><AdminCustomers /></ProtectedRoute>} />
            <Route path='/admin/messages' element={<ProtectedRoute requireRole="admin"><AdminMessages /></ProtectedRoute>} />
            <Route path='/admin/payments' element={<ProtectedRoute requireRole="admin"><AdminPayments /></ProtectedRoute>} />
            <Route path='/admin/reviews' element={<ProtectedRoute requireRole="admin"><AdminReviews /></ProtectedRoute>} />
            <Route path='/admin/analytics' element={<ProtectedRoute requireRole="admin"><AdminAnalytics /></ProtectedRoute>} />
            <Route path='/admin/settings' element={<ProtectedRoute requireRole="admin"><AdminSettings /></ProtectedRoute>} />
            <Route path='/admin/refunds' element={<ProtectedRoute requireRole="admin"><AdminRefunds /></ProtectedRoute>} />
            <Route path='/admin/contact-requests' element={<ProtectedRoute requireRole="admin"><AdminContactRequests /></ProtectedRoute>} />
            <Route path='/admin/categories' element={<ProtectedRoute requireRole="admin"><AdminCategories /></ProtectedRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App