import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { MapPin, Navigation, Clock } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LiveTracking = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);
  const socket = useWebSocket();

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      loadNearbyDoctors();
    }
  }, [userLocation]);

  useEffect(() => {
    if (socket) {
      socket.on('doctor:location:updated', (data) => {
        setDoctors(prev => {
          const exists = prev.find(doc => doc.doctorId?._id === data.doctorId);
          if (!exists) {
            loadNearbyDoctors();
            return prev;
          }
          return prev.map(doc => 
            doc.doctorId?._id === data.doctorId 
              ? { ...doc, location: { coordinates: [data.longitude, data.latitude] } }
              : doc
          );
        });
      });

      socket.on('eta:calculated', (data) => {
        setEta(data);
        toast.success(`ETA: ${data.eta} minutes`);
      });

      return () => {
        socket.off('doctor:location:updated');
        socket.off('eta:calculated');
      };
    }
  }, [socket, userLocation]);

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Location error:', error);
          toast.error('Unable to get your location');
          // Default location (example)
          setUserLocation({
            latitude: 30.3165,
            longitude: 78.0322
          });
        }
      );
    }
  };

  const loadNearbyDoctors = async () => {
    try {
      if (!userLocation) return;
      
      const { data } = await api.get('/tracking/doctors', {
        params: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          maxDistance: 50000
        }
      });
      
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast.error('Failed to load nearby doctors');
    } finally {
      setLoading(false);
    }
  };

  const trackDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    
    if (socket && userLocation) {
      socket.emit('patient:track:doctor', {
        patientId: user.id,
        doctorId: doctor.doctorId._id,
        patientLocation: userLocation
      });
    }
  };

  const center = userLocation 
    ? [userLocation.latitude, userLocation.longitude]
    : [30.3165, 78.0322];

  if (loading || !userLocation) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Live Doctor Tracking</h1>
        <p className="text-gray-600">Track nearby doctors in real-time and view their estimated arrival time</p>
      </div>

      {eta && (
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900">Estimated Arrival</h3>
              <p className="text-2xl font-bold text-blue-600 mt-1">{eta.eta} minutes</p>
              <p className="text-sm text-blue-700">Distance: {eta.distance} km</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctors List */}
        <div className="space-y-4">
          <h2 className="font-bold text-gray-900">Nearby Doctors</h2>
          
          {doctors.length > 0 ? (
            doctors.map((doctor) => (
              <div 
                key={doctor._id}
                className={`card cursor-pointer transition-all ${
                  selectedDoctor?._id === doctor._id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => trackDoctor(doctor)}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {doctor.doctorId?.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {doctor.doctorId?.specialization}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {doctor.doctorId?.workingHospital}
                    </p>
                    <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Track Doctor →
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="card text-center py-8">
              <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No doctors nearby</p>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <div className="card p-0 overflow-hidden" style={{ height: '500px' }}>
            <MapContainer 
              center={center} 
              zoom={13} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              
              {/* User Location */}
              <Marker position={center}>
                <Popup>Your Location</Popup>
              </Marker>
              <Circle center={center} radius={500} color="blue" fillOpacity={0.1} />

              {/* Doctor Markers */}
              {doctors.map((doctor) => {
                if (doctor.location?.coordinates) {
                  const [lng, lat] = doctor.location.coordinates;
                  return (
                    <Marker key={doctor._id} position={[lat, lng]}>
                      <Popup>
                        <div>
                          <p className="font-bold">{doctor.doctorId?.name}</p>
                          <p className="text-sm">{doctor.doctorId?.specialization}</p>
                          <button
                            onClick={() => trackDoctor(doctor)}
                            className="mt-2 text-sm text-blue-600"
                          >
                            Calculate ETA
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                }
                return null;
              })}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
