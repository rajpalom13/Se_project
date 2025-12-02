import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { vitalService } from '../../services/vitalService';
import { prescriptionService } from '../../services/prescriptionService';
import { medicineService } from '../../services/medicineService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, FileText, Pill, Plus, Upload, Edit2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const PatientDetail = () => {
  const { id } = useParams();
  const [vitals, setVitals] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports] = useState([]);
  const [medicineLogs, setMedicineLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Prescription State
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    medicines: [{ name: '', dosage: '', instructions: '', duration: '' }],
    notes: '',
    image: null
  });

  // Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [reportForm, setReportForm] = useState({
    title: '',
    notes: '',
    type: 'clinical_note',
    file: null
  });

  // Medicine Comment State
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [vitalsData, prescriptionsData, reportsData, logsData] = await Promise.all([
        vitalService.getPatientVitals(id),
        prescriptionService.getPatientPrescriptions(id),
        api.get(`/reports/patient/${id}`).then(res => res.data),
        medicineService.getPatientLogs(id)
      ]);
      setVitals(vitalsData.vitals);
      setPrescriptions(prescriptionsData.prescriptions);
      setReports(reportsData.reports);
      setMedicineLogs(logsData.logs);
    } catch {
      toast.error('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const handleReportFileChange = (e) => {
    setReportForm({ ...reportForm, file: e.target.files[0] });
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('patientId', id);
    formData.append('title', reportForm.title);
    formData.append('notes', reportForm.notes);
    formData.append('type', reportForm.type);
    if (reportForm.file) {
      formData.append('file', reportForm.file);
    }

    try {
      if (editingReport) {
        await api.put(`/reports/${editingReport._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Report updated successfully');
      } else {
        await api.post('/reports', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Report added successfully');
      }
      setShowReportModal(false);
      setEditingReport(null);
      setReportForm({ title: '', notes: '', type: 'clinical_note', file: null });
      loadData();
    } catch {
      toast.error(editingReport ? 'Failed to update report' : 'Failed to add report');
    }
  };

  const openEditReport = (report) => {
    setEditingReport(report);
    setReportForm({
      title: report.title,
      notes: report.notes,
      type: report.type,
      file: null
    });
    setShowReportModal(true);
  };

  const handleMedicineChange = (index, field, value) => {
    const newMedicines = [...prescriptionForm.medicines];
    newMedicines[index][field] = value;
    setPrescriptionForm({ ...prescriptionForm, medicines: newMedicines });
  };

  const addMedicineField = () => {
    setPrescriptionForm({
      ...prescriptionForm,
      medicines: [...prescriptionForm.medicines, { name: '', dosage: '', instructions: '', duration: '' }]
    });
  };

  const handleFileChange = (e) => {
    setPrescriptionForm({ ...prescriptionForm, image: e.target.files[0] });
  };

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('patientId', id);
    formData.append('medicines', JSON.stringify(prescriptionForm.medicines));
    formData.append('notes', prescriptionForm.notes);
    if (prescriptionForm.image) {
      formData.append('image', prescriptionForm.image);
    }

    try {
      if (editingPrescription) {
        await api.put(`/prescriptions/${editingPrescription._id}`, formData, {
           headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Prescription updated successfully');
      } else {
        await prescriptionService.addPrescription(formData);
        toast.success('Prescription added successfully');
      }
      setShowPrescriptionModal(false);
      setEditingPrescription(null);
      setPrescriptionForm({
        medicines: [{ name: '', dosage: '', instructions: '', duration: '' }],
        notes: '',
        image: null
      });
      loadData();
    } catch (error) {
      console.error(error);
      toast.error(editingPrescription ? 'Failed to update prescription' : 'Failed to add prescription');
    }
  };

  const openEditPrescription = (prescription) => {
    setEditingPrescription(prescription);
    setPrescriptionForm({
      medicines: prescription.medicines,
      notes: prescription.notes || '',
      image: null
    });
    setShowPrescriptionModal(true);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      await medicineService.addComment(selectedLog._id, comment);
      toast.success('Comment added and patient notified');
      setShowCommentModal(false);
      setComment('');
      loadData();
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const getChartData = (type) => {
    return vitals
      .filter(v => v.type === type)
      .map(v => ({
        date: new Date(v.date).toLocaleDateString(),
        value: parseFloat(v.value.split('/')[0]), // Handle BP like 120/80 (take systolic)
        fullValue: v.value
      }));
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
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Patient Details</h1>
      </div>

      {/* Vitals Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-slate-800">Blood Pressure Trend</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getChartData('blood_pressure')}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2} dot={{ r: 4 }} name="Systolic BP" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-rose-600" />
            <h2 className="text-lg font-bold text-slate-800">Heart Rate Trend</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getChartData('heart_rate')}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#e11d48" strokeWidth={2} dot={{ r: 4 }} name="Heart Rate (bpm)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Notes & Reports */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-bold text-slate-800">Clinical Notes & Reports</h2>
          </div>
          <button 
            onClick={() => {
              setEditingReport(null);
              setReportForm({ title: '', notes: '', type: 'clinical_note', file: null });
              setShowReportModal(true);
            }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Note/Report
          </button>
        </div>

        <div className="space-y-4">
          {reports.length > 0 ? (
            reports.map((report) => (
              <div key={report._id} className="border border-slate-100 rounded-xl p-4 group hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900">{report.title}</h3>
                    <p className="text-xs text-slate-500">
                      {new Date(report.date).toLocaleDateString()} • {report.type.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.fileUrl && (
                      <a 
                        href={`http://localhost:5000${report.fileUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-teal-600 text-sm hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-4 h-4" /> View File
                      </a>
                    )}
                    <button 
                      onClick={() => openEditReport(report)}
                      className="p-1 text-slate-400 hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-700 mt-2">{report.notes}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No notes or reports found</p>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{editingReport ? 'Edit Report' : 'Add Clinical Note / Report'}</h2>
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  className="input"
                  value={reportForm.title}
                  onChange={(e) => setReportForm({...reportForm, title: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="input"
                  value={reportForm.type}
                  onChange={(e) => setReportForm({...reportForm, type: e.target.value})}
                >
                  <option value="clinical_note">Clinical Note</option>
                  <option value="lab_report">Lab Report</option>
                  <option value="imaging">Imaging</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Details/Notes</label>
                <textarea
                  className="input"
                  rows={4}
                  value={reportForm.notes}
                  onChange={(e) => setReportForm({...reportForm, notes: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (Optional)</label>
                <input
                  type="file"
                  className="input"
                  onChange={handleReportFileChange}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingReport ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Medicine Adherence */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <Pill className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-bold">Medicine Adherence</h2>
        </div>
        
        <div className="space-y-3">
          {medicineLogs.length > 0 ? (
            medicineLogs.map((log) => (
              <div key={log._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{log.medicine?.name} - {log.medicine?.dosage}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(log.takenAt).toLocaleString()}
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      log.status === 'taken' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {log.status}
                    </span>
                  </p>
                  {log.doctorComment && (
                    <p className="text-sm text-blue-600 mt-1">
                      <strong>Dr. Comment:</strong> {log.doctorComment}
                    </p>
                  )}
                </div>
                <button 
                  onClick={() => {
                    setSelectedLog(log);
                    setComment(log.doctorComment || '');
                    setShowCommentModal(true);
                  }}
                  className="text-gray-400 hover:text-blue-600"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center">No medicine logs found</p>
          )}
        </div>
      </div>

      {/* Prescriptions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-slate-800">Prescriptions</h2>
          </div>
          <button 
            onClick={() => {
              setEditingPrescription(null);
              setPrescriptionForm({
                medicines: [{ name: '', dosage: '', instructions: '', duration: '' }],
                notes: '',
                image: null
              });
              setShowPrescriptionModal(true);
            }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Prescription
          </button>
        </div>

        <div className="space-y-4">
          {prescriptions.length > 0 ? (
            prescriptions.map((pres) => (
              <div key={pres._id} className="border border-slate-100 rounded-xl p-4 group hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-slate-900">Dr. {pres.doctor?.name}</p>
                    <p className="text-xs text-slate-500">{new Date(pres.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pres.imageUrl && (
                      <a 
                        href={`http://localhost:5000${pres.imageUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-teal-600 text-sm hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-4 h-4" /> View Attachment
                      </a>
                    )}
                    <button 
                      onClick={() => openEditPrescription(pres)}
                      className="p-1 text-slate-400 hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {pres.medicines.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {pres.medicines.map((med, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg text-sm border border-slate-100">
                        <span className="font-medium text-slate-800">{med.name}</span> - <span className="text-slate-600">{med.dosage}</span> <span className="text-slate-400">({med.duration})</span>
                        <p className="text-slate-500 text-xs mt-1">{med.instructions}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {pres.notes && (
                  <p className="mt-3 text-sm text-slate-600 border-t border-slate-100 pt-2">
                    <span className="font-medium">Notes:</span> {pres.notes}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No prescriptions found</p>
          )}
        </div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Comment</h2>
            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <textarea
                className="input"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a note for the patient..."
                required
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCommentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Send Comment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingPrescription ? 'Edit Prescription' : 'Add Prescription'}</h2>
            <form onSubmit={handlePrescriptionSubmit} className="space-y-6">
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Medicines</label>
                  <button type="button" onClick={addMedicineField} className="text-sm text-blue-600 hover:text-blue-700">
                    + Add Medicine
                  </button>
                </div>
                
                {prescriptionForm.medicines.map((med, index) => (
                  <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 p-3 rounded">
                    <input
                      placeholder="Name"
                      className="input text-sm"
                      value={med.name}
                      onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                      required
                    />
                    <input
                      placeholder="Dosage"
                      className="input text-sm"
                      value={med.dosage}
                      onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                      required
                    />
                    <input
                      placeholder="Duration"
                      className="input text-sm"
                      value={med.duration}
                      onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                      required
                    />
                    <input
                      placeholder="Instructions"
                      className="input text-sm"
                      value={med.instructions}
                      onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Prescription (Photo/PDF)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {prescriptionForm.image ? prescriptionForm.image.name : 'Click to upload file'}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Clinical Notes</label>
                <textarea
                  className="input"
                  rows={3}
                  value={prescriptionForm.notes}
                  onChange={(e) => setPrescriptionForm({...prescriptionForm, notes: e.target.value})}
                  placeholder="Additional instructions or diagnosis..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowPrescriptionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingPrescription ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetail;
