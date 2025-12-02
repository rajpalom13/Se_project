// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';

// Pages
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import PatientDashboard from './pages/PatientDashboard/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard/DoctorDashboard';
import Appointments from './pages/Appointments/Appointments';
import MedicineReminders from './pages/MedicineReminders/MedicineReminders';
import LiveTracking from './pages/LiveDoctorTracking/LiveTracking';
import Vitals from './pages/Vitals/Vitals';
import MyPrescriptions from './pages/Prescriptions/MyPrescriptions';
import MyReports from './pages/Reports/MyReports';
import HealthGoals from './pages/Goals/HealthGoals';
import SymptomChecker from './pages/SymptomChecker/SymptomChecker';
import ChatPage from './pages/Chat/ChatPage';
import Chatbot from './pages/Chatbot/Chatbot';
import PatientsList from './pages/Patients/PatientsList';
import PatientDetail from './pages/Patients/PatientDetail';
import VideoCall from './pages/VideoCall/VideoCall';

// Layout
import Layout from './components/Layout/Layout';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'} />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to={user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'} />} />
        
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
          {/* Patient Routes */}
          <Route path="patient/dashboard" element={user?.role === 'patient' ? <PatientDashboard /> : <Navigate to="/doctor/dashboard" />} />
          <Route path="patient/medicines" element={user?.role === 'patient' ? <MedicineReminders /> : <Navigate to="/doctor/dashboard" />} />
          <Route path="patient/goals" element={user?.role === 'patient' ? <HealthGoals /> : <Navigate to="/doctor/dashboard" />} />
          <Route path="patient/vitals" element={user?.role === 'patient' ? <Vitals /> : <Navigate to="/doctor/dashboard" />} />
          <Route path="patient/prescriptions" element={user?.role === 'patient' ? <MyPrescriptions /> : <Navigate to="/doctor/dashboard" />} />
          <Route path="patient/reports" element={user?.role === 'patient' ? <MyReports /> : <Navigate to="/doctor/dashboard" />} />
          <Route path="patient/symptom-checker" element={user?.role === 'patient' ? <SymptomChecker /> : <Navigate to="/doctor/dashboard" />} />
          <Route path="patient/tracking" element={user?.role === 'patient' ? <LiveTracking /> : <Navigate to="/doctor/dashboard" />} />
          
          {/* Doctor Routes */}
          <Route path="doctor/dashboard" element={user?.role === 'doctor' ? <DoctorDashboard /> : <Navigate to="/patient/dashboard" />} />
          <Route path="doctor/patients" element={user?.role === 'doctor' ? <PatientsList /> : <Navigate to="/patient/dashboard" />} />
          <Route path="doctor/patients/:id" element={user?.role === 'doctor' ? <PatientDetail /> : <Navigate to="/patient/dashboard" />} />
          
          {/* Shared Routes */}
          <Route path="appointments" element={<Appointments />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="chatbot" element={<Chatbot />} />
          <Route path="video-call/:roomId" element={<VideoCall />} />
          
          <Route path="/" element={<Navigate to={user?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'} />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
