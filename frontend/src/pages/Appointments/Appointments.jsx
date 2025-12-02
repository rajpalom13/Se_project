import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { appointmentService } from '../../services/appointmentService';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import { Calendar, Clock, Plus, X } from 'lucide-react';

const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    doctorId: '',
    date: '',
    time: '',
    reason: ''
  });

  useEffect(() => {
    loadAppointments();
    if (user?.role === 'patient') {
      loadDoctors();
    }
  }, [user]);

  const loadAppointments = async () => {
    try {
      const data = await appointmentService.getAppointments();
      setAppointments(data.appointments);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const data = await authService.getDoctors();
      setDoctors(data.doctors);
    } catch (error) {
      console.error('Failed to load doctors', error);
      toast.error('Failed to load doctors list');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await appointmentService.createAppointment(formData);
      toast.success('Appointment requested successfully!');
      setShowModal(false);
      setFormData({ doctorId: '', date: '', time: '', reason: '' });
      loadAppointments();
    } catch {
      toast.error('Failed to create appointment');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await appointmentService.updateAppointment(id, { status });
      toast.success(`Appointment ${status}`);
      loadAppointments();
    } catch {
      toast.error('Failed to update appointment');
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        {user?.role === 'patient' && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Book Appointment
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {appointments.length > 0 ? (
          appointments.map((apt) => (
            <div key={apt._id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="p-3 bg-blue-100 rounded-full h-fit">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">
                      {user?.role === 'patient' ? apt.doctor?.name : apt.patient?.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {user?.role === 'patient' && `${apt.doctor?.specialization} • ${apt.doctor?.workingHospital}`}
                      {user?.role === 'doctor' && apt.patient?.phone}
                    </p>
                    <div className="flex gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{new Date(apt.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{apt.time}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">
                      <span className="font-medium">Reason:</span> {apt.reason}
                    </p>
                    {apt.notes && (
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">Notes:</span> {apt.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                    apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    apt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    apt.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {apt.status}
                  </span>

                  {user?.role === 'doctor' && apt.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(apt._id, 'confirmed')}
                        className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(apt._id, 'cancelled')}
                        className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No appointments yet</p>
          </div>
        )}
      </div>

      {/* Book Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Book Appointment</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Doctor
                </label>
                <select
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Choose a doctor...</option>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      Dr. {doc.name} - {doc.specialization} ({doc.workingHospital})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="input"
                  rows={3}
                  required
                />
              </div>

              <button type="submit" className="w-full btn-primary">
                Book Appointment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
