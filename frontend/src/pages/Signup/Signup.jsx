import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { Heart } from 'lucide-react';

const Signup = () => {
  const [role, setRole] = useState('patient');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'patient'
  });

  const [emergencyContact, setEmergencyContact] = useState({
    name: '',
    phone: '',
    relation: ''
  });

  const [shiftTiming, setShiftTiming] = useState({
    start: '',
    end: ''
  });

  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setFormData({ ...formData, role: newRole });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // FINAL payload for backend – this is the FIX
    let payload = { ...formData };

    if (role === "patient") {
      payload = {
        ...payload,
        emergencyContact,
      };
    }

    if (role === "doctor") {
      payload = {
        ...payload,
        shiftTiming,
      };
    }

    try {
      const data = await signup(payload);
      toast.success('Account created successfully!');
      navigate(data.user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-slate-100 px-4 py-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-teal-50 rounded-full">
              <Heart className="w-8 h-8 text-teal-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Create Account</h2>
          <p className="text-slate-600 mt-2">Join MediTrack AI</p>
        </div>

        {/* Role Selection */}
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => handleRoleChange('patient')}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              role === 'patient'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            I'm a Patient
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('doctor')}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              role === 'doctor'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            I'm a Doctor
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
          </div>

          {/* Email + Password */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input"
                minLength={6}
                required
              />
            </div>
          </div>

          {/* PATIENT FIELDS */}
          {role === 'patient' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age || ''}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disease / Condition
                  </label>
                  <input
                    type="text"
                    name="disease"
                    value={formData.disease || ''}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital Admitted
                </label>
                <input
                  type="text"
                  name="hospitalAdmitted"
                  value={formData.hospitalAdmitted || ''}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              {/* EMERGENCY CONTACT */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Name
                  </label>
                  <input
                    type="text"
                    value={emergencyContact.name}
                    onChange={(e) =>
                      setEmergencyContact({ ...emergencyContact, name: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    value={emergencyContact.phone}
                    onChange={(e) =>
                      setEmergencyContact({ ...emergencyContact, phone: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Relation</label>
                  <input
                    type="text"
                    value={emergencyContact.relation}
                    onChange={(e) =>
                      setEmergencyContact({ ...emergencyContact, relation: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* DOCTOR FIELDS */}
          {role === 'doctor' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization || ''}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Number
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber || ''}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working Hospital
                </label>
                <input
                  type="text"
                  name="workingHospital"
                  value={formData.workingHospital || ''}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              {/* SHIFT TIMING */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shift Start</label>
                  <input
                    type="text"
                    value={shiftTiming.start}
                    onChange={(e) =>
                      setShiftTiming({ ...shiftTiming, start: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shift End</label>
                  <input
                    type="text"
                    value={shiftTiming.end}
                    onChange={(e) =>
                      setShiftTiming({ ...shiftTiming, end: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 hover:text-teal-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
