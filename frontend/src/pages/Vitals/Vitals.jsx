import React, { useState, useEffect } from 'react';
import { vitalService } from '../../services/vitalService';
import toast from 'react-hot-toast';
import { Activity, Plus, Trash2, Calendar } from 'lucide-react';

const Vitals = () => {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'blood_pressure',
    value: '',
    unit: 'mmHg',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const vitalTypes = [
    { value: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg' },
    { value: 'heart_rate', label: 'Heart Rate', unit: 'bpm' },
    { value: 'blood_sugar', label: 'Blood Sugar', unit: 'mg/dL' },
    { value: 'weight', label: 'Weight', unit: 'kg' },
    { value: 'temperature', label: 'Temperature', unit: '°C' },
    { value: 'oxygen_level', label: 'Oxygen Level', unit: '%' }
  ];

  useEffect(() => {
    loadVitals();
  }, []);

  const loadVitals = async () => {
    try {
      const data = await vitalService.getVitals();
      setVitals(data.vitals);
    } catch {
      toast.error('Failed to load vitals');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (e) => {
    const type = vitalTypes.find(t => t.value === e.target.value);
    setFormData(prev => ({
      ...prev,
      type: type.value,
      unit: type.unit
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await vitalService.addVital(formData);
      toast.success('Vital recorded successfully');
      setShowModal(false);
      setFormData({
        type: 'blood_pressure',
        value: '',
        unit: 'mmHg',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      });
      loadVitals();
    } catch {
      toast.error('Failed to add vital');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        await vitalService.deleteVital(id);
        toast.success('Record deleted');
        loadVitals();
      } catch {
        toast.error('Failed to delete record');
      }
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
        <h1 className="text-2xl font-bold text-gray-900">Vitals Tracking</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Log Vital
        </button>
      </div>

      <div className="grid gap-4">
        {vitals.length > 0 ? (
          vitals.map((vital) => (
            <div key={vital._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${
                    vital.type === 'blood_pressure' ? 'bg-red-100 text-red-600' :
                    vital.type === 'heart_rate' ? 'bg-pink-100 text-pink-600' :
                    vital.type === 'blood_sugar' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 capitalize">
                      {vital.type.replace('_', ' ')}
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {vital.value} <span className="text-sm text-gray-500 font-normal">{vital.unit}</span>
                    </p>
                    {vital.notes && (
                      <p className="text-sm text-gray-600 mt-1">{vital.notes}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 text-sm text-gray-500 mb-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(vital.date).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => handleDelete(vital._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-12">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No vitals recorded yet</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Log New Vital</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={handleTypeChange}
                  className="input"
                >
                  {vitalTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  <input
                    type="text"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="input"
                    required
                    placeholder="e.g., 120/80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    readOnly
                    className="input bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vitals;
