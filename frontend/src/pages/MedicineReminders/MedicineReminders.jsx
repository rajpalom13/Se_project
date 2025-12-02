import React, { useState, useEffect } from 'react';
import { medicineService } from '../../services/medicineService';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { Pill, Plus, X, Clock, Check, AlertCircle } from 'lucide-react';

const MedicineReminders = () => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'once',
    timings: [''],
    startDate: '',
    endDate: '',
    instructions: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // In a real app, we might need to handle the patient ID for logs
      // assuming user.id is correct for the logged in patient
      const [medicinesData, logsData] = await Promise.all([
        medicineService.getMedicines(),
        medicineService.getPatientLogs(user.id || user._id)
      ]);
      setMedicines(medicinesData.medicines);
      setLogs(logsData.logs);
    } catch (error) {
      console.error(error);
      // toast.error('Failed to load data'); // Suppress initial error if logs are empty
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await medicineService.addMedicine(formData);
      toast.success('Medicine reminder added!');
      setShowModal(false);
      setFormData({
        name: '',
        dosage: '',
        frequency: 'once',
        timings: [''],
        startDate: '',
        endDate: '',
        instructions: ''
      });
      loadData();
    } catch (error) {
      toast.error('Failed to add medicine');
    }
  };

  const handleLogIntake = async (medicineId, status) => {
    try {
      await medicineService.logIntake({
        medicineId,
        status,
        takenAt: new Date()
      });
      toast.success(`Marked as ${status}!`);
      loadData();
    } catch {
      toast.error('Failed to log intake');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this medicine?')) {
      try {
        await medicineService.deleteMedicine(id);
        toast.success('Medicine deleted');
        loadData();
      } catch {
        toast.error('Failed to delete medicine');
      }
    }
  };

  // Helper to check if medicine was taken today
  const isTakenToday = (medicineId) => {
    const today = new Date().toDateString();
    return logs.find(log => 
      log.medicine._id === medicineId && 
      new Date(log.takenAt).toDateString() === today &&
      log.status === 'taken'
    );
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
        <h1 className="text-2xl font-bold text-gray-900">Medicine Reminders</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Medicine
        </button>
      </div>

      <div className="grid gap-4">
        {medicines.length > 0 ? (
          medicines.map((med) => {
            const takenLog = isTakenToday(med._id);
            return (
              <div key={med._id} className={`card ${takenLog ? 'bg-green-50 border-green-200' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className={`p-3 rounded-full h-fit ${takenLog ? 'bg-green-200 text-green-700' : 'bg-blue-100 text-blue-600'}`}>
                      <Pill className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{med.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {med.dosage} • {med.frequency} daily
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {med.timings.map((time, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200 text-sm text-gray-600">
                            <Clock className="w-3 h-3" />
                            {time}
                          </div>
                        ))}
                      </div>
                      {med.instructions && (
                        <p className="text-sm text-gray-700 mt-2">
                          <span className="font-medium">Instructions:</span> {med.instructions}
                        </p>
                      )}
                      
                      {/* Doctor Comments on Logs */}
                      {takenLog?.doctorComment && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800 flex gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Dr. Comment:</span> {takenLog.doctorComment}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    {takenLog ? (
                      <span className="flex items-center gap-1 text-green-600 font-medium bg-green-100 px-3 py-1 rounded-full text-sm">
                        <Check className="w-4 h-4" /> Taken Today
                      </span>
                    ) : (
                      <button
                        onClick={() => handleLogIntake(med._id, 'taken')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Mark Taken
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(med._id)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="card text-center py-12">
            <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No medicines added yet</p>
          </div>
        )}
      </div>

      {/* Add Medicine Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Medicine</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medicine Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dosage
                </label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  className="input"
                  placeholder="e.g., 500mg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="input"
                >
                  <option value="once">Once daily</option>
                  <option value="twice">Twice daily</option>
                  <option value="thrice">Thrice daily</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time (HH:MM)
                </label>
                <input
                  type="time"
                  value={formData.timings[0]}
                  onChange={(e) => setFormData({ ...formData, timings: [e.target.value] })}
                  className="input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions (Optional)
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>

              <button type="submit" className="w-full btn-primary">
                Add Medicine
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineReminders;
