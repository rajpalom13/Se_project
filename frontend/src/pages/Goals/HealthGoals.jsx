import React, { useState, useEffect } from 'react';
import { goalService } from '../../services/goalService';
import { Plus, Trash2, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const HealthGoals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    target: '',
    unit: ''
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const data = await goalService.getGoals();
      setGoals(data.goals);
    } catch {
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await goalService.addGoal(formData);
      toast.success('Goal added!');
      setShowModal(false);
      setFormData({ title: '', target: '', unit: '' });
      loadGoals();
    } catch {
      toast.error('Failed to add goal');
    }
  };

  const handleUpdateProgress = async (id, currentProgress, increment) => {
    try {
      const newProgress = Math.max(0, currentProgress + increment);
      await goalService.updateProgress(id, newProgress);
      setGoals(prev => prev.map(g => g._id === id ? { ...g, progress: newProgress } : g));
    } catch {
      toast.error('Failed to update progress');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this goal?')) {
      try {
        await goalService.deleteGoal(id);
        toast.success('Goal deleted');
        loadGoals();
      } catch {
        toast.error('Failed to delete goal');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-100 rounded-full">
            <Award className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Health Goals</h1>
            <p className="text-slate-600">Track your daily healthy habits</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const percentage = Math.min(100, (goal.progress / goal.target) * 100);
          
          return (
            <div key={goal._id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-slate-900 text-lg">{goal.title}</h3>
                <button 
                  onClick={() => handleDelete(goal._id)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">Progress</span>
                  <span className="text-slate-500">{goal.progress} / {goal.target} {goal.unit}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${percentage >= 100 ? 'bg-green-500' : 'bg-teal-500'}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleUpdateProgress(goal._id, goal.progress, -1)}
                  className="flex-1 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-600"
                >
                  -
                </button>
                <button 
                  onClick={() => handleUpdateProgress(goal._id, goal.progress, 1)}
                  className="flex-1 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 font-medium"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 text-slate-900">Add New Goal</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Goal Title</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Water Intake"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="e.g., 8"
                    value={formData.target}
                    onChange={(e) => setFormData({...formData, target: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., glasses"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Add Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthGoals;
