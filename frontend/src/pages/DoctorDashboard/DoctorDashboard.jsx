import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';
import { appointmentService } from '../../services/appointmentService';
import { Calendar, Clock, Users, MapPin, Stethoscope } from 'lucide-react';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const socket = useWebSocket();
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingAppointments: 0,
    totalPatients: 0
  });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    // Socket listeners are now handled globally in Navbar
  }, [socket]);

  const loadDashboardData = async () => {
    try {
      const data = await appointmentService.getAppointments();
      
      const today = new Date().toDateString();
      const todayApts = data.appointments.filter(
        apt => new Date(apt.date).toDateString() === today
      );
      const pending = data.appointments.filter(apt => apt.status === 'pending');
      const uniquePatients = new Set(data.appointments.map(apt => apt.patient._id));

      setStats({
        todayAppointments: todayApts.length,
        pendingAppointments: pending.length,
        totalPatients: uniquePatients.size
      });

      setAppointments(data.appointments.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSharingLocation = () => {
    if ('geolocation' in navigator) {
      setIsSharing(true);
      navigator.geolocation.watchPosition(
        (position) => {
          if (socket) {
            const doctorId = user._id || user.id;
            console.log('Emitting location update:', {
              doctorId,
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            socket.emit('doctor:location:update', {
              doctorId,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          }
        },
        (error) => {
          console.error('Location error:', error);
          setIsSharing(false);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
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
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 rounded-full">
              <Stethoscope className="w-8 h-8 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Dr. {user?.name}
              </h1>
              <p className="text-slate-600">{user?.specialization} • {user?.workingHospital}</p>
            </div>
          </div>
          <button
            onClick={startSharingLocation}
            className={`px-4 py-2 rounded-xl font-medium transition-colors shadow-sm ${
              isSharing
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {isSharing ? 'Sharing Location' : 'Share Location'}
            </div>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Today's Appointments</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {stats.todayAppointments}
              </p>
            </div>
            <div className="p-3 bg-teal-50 rounded-full">
              <Calendar className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.pendingAppointments}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.totalPatients}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Appointments</h2>
        {appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div key={apt._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-teal-50 rounded-full">
                    <Users className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{apt.patient?.name}</p>
                    <p className="text-sm text-slate-600">{apt.reason}</p>
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
        ) : (
          <p className="text-gray-600 text-center py-8">No appointments yet</p>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
