import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';
import { appointmentService } from '../../services/appointmentService';
import { medicineService } from '../../services/medicineService';
import { Calendar, Pill, MapPin, MessageCircle, Clock, Heart, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const PatientDashboard = () => {
  const { user } = useAuth();
  const socket = useWebSocket();
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    activeMedicines: 0,
    todayReminders: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [todayMedicines, setTodayMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('emergency:response', (data) => {
        // Only show if it's for this patient
        if (data.patientId === (user.id || user._id)) {
          toast.success(`Doctor ${data.doctorName} is responding to your emergency!`, {
            duration: 8000,
            icon: '🚑',
            style: {
              background: '#10B981',
              color: '#FFFFFF',
              fontWeight: 'bold',
            },
          });
        }
      });

      socket.on('patient:update', (data) => {
        if (data.patientId === (user.id || user._id)) {
          toast(data.message, {
            duration: 5000,
            icon: '🔔',
            style: {
              background: '#EFF6FF',
              color: '#1E40AF',
              border: '1px solid #3B82F6'
            }
          });
        }
      });

      return () => {
        socket.off('emergency:response');
        socket.off('patient:update');
      };
    }
  }, [socket, user]);

  const loadDashboardData = async () => {
    try {
      const [appointmentsData, medicinesData] = await Promise.all([
        appointmentService.getAppointments(),
        medicineService.getMedicines()
      ]);

      // Calculate stats
      const upcoming = appointmentsData.appointments.filter(
        apt => new Date(apt.date) > new Date() && apt.status !== 'cancelled'
      );

      const today = new Date().toDateString();
      const todayMeds = medicinesData.medicines.filter(med => {
        const startDate = new Date(med.startDate).toDateString();
        const endDate = new Date(med.endDate).toDateString();
        return startDate <= today && endDate >= today;
      });

      setStats({
        upcomingAppointments: upcoming.length,
        activeMedicines: medicinesData.medicines.length,
        todayReminders: todayMeds.length
      });

      setRecentAppointments(appointmentsData.appointments.slice(0, 3));
      setTodayMedicines(todayMeds.slice(0, 3));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergency = () => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex flex-col ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Send Emergency Alert?
              </p>
              <p className="mt-1 text-sm text-gray-500">
                This will immediately notify your doctor of a medical emergency.
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-t border-gray-200">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              sendEmergencySignal();
            }}
            className="w-full border border-transparent rounded-none rounded-bl-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Yes, Send Alert
          </button>
          <div className="w-px bg-gray-200" />
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-br-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
          >
            Cancel
          </button>
        </div>
      </div>
    ));
  };

  const sendEmergencySignal = () => {
    if (socket) {
      const loadingToast = toast.loading('Sending alert...');
      navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('patient:emergency', {
          patientId: user.id || user._id,
          patientName: user.name,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
        });
        toast.dismiss(loadingToast);
        toast.success('Emergency alert sent to doctor!');
      }, () => {
        toast.dismiss(loadingToast);
        toast.error('Could not get location, sending alert anyway...');
        socket.emit('patient:emergency', {
          patientId: user.id || user._id,
          patientName: user.name,
          location: null
        });
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-white shadow-sm border-l-4 border-teal-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 rounded-full">
              <Heart className="w-8 h-8 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-slate-600">Here's your health summary for today</p>
            </div>
          </div>
          <button
            onClick={handleEmergency}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg animate-pulse font-bold"
          >
            <AlertTriangle className="w-6 h-6" />
            SOS EMERGENCY
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/appointments" className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Upcoming Appointments</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {stats.upcomingAppointments}
              </p>
            </div>
            <div className="p-3 bg-teal-50 rounded-full">
              <Calendar className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </Link>

        <Link to="/patient/medicines" className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Active Medicines</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {stats.activeMedicines}
              </p>
            </div>
            <div className="p-3 bg-teal-50 rounded-full">
              <Pill className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </Link>

        <Link to="/patient/medicines" className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Reminders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.todayReminders}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/patient/tracking"
            className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors"
          >
            <MapPin className="w-5 h-5 text-teal-600" />
            <span className="font-medium text-teal-900">Track Doctor</span>
          </Link>

          <Link
            to="/chatbot"
            className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
          >
            <MessageCircle className="w-5 h-5 text-indigo-600" />
            <span className="font-medium text-indigo-900">Ask AI Assistant</span>
          </Link>

          <Link
            to="/appointments"
            className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors"
          >
            <Calendar className="w-5 h-5 text-teal-600" />
            <span className="font-medium text-teal-900">Book Appointment</span>
          </Link>
        </div>
      </div>

      {/* Recent Appointments */}
      {recentAppointments.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Appointments</h2>
            <Link to="/appointments" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentAppointments.map((apt) => (
              <div key={apt._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{apt.doctor?.name}</p>
                    <p className="text-sm text-gray-600">{apt.doctor?.specialization}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(apt.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">{apt.time}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                    apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    apt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Medicines */}
      {todayMedicines.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Today's Medicine Schedule</h2>
            <Link to="/patient/medicines" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {todayMedicines.map((med) => (
              <div key={med._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Pill className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{med.name}</p>
                    <p className="text-sm text-gray-600">{med.dosage} - {med.frequency}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {med.timings.join(', ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
