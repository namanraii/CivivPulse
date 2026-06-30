import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Activity } from 'lucide-react';

// Fix Leaflet marker icon issue in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export default function IssueMap() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default Center: San Francisco
  const center = [37.7749, -122.4194];

  useEffect(() => {
    const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const issuesData = [];
      snapshot.forEach((doc) => {
        issuesData.push({ id: doc.id, ...doc.data() });
      });
      setIssues(issuesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6 h-[calc(100vh-12rem)] flex flex-col">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          Live Issue Map
        </h1>
        <p className="text-gray-400 mt-2">Geospatial overview of reported civic issues in the area.</p>
      </div>

      <div className="w-full flex-grow glass-panel rounded-3xl overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {issues.map((issue, index) => {
              // Create a deterministic mock offset around SF center since we don't have real GPS yet
              const latOffset = (index % 5) * 0.01 - 0.02;
              const lngOffset = (index % 7) * 0.01 - 0.03;
              const position = [center[0] + latOffset, center[1] + lngOffset];

              return (
                <Marker key={issue.id} position={position}>
                  <Popup>
                    <div className="min-w-[200px]">
                      <h3 className="font-bold text-gray-900 mb-1">{issue.title}</h3>
                      <div className="flex gap-2 text-xs mb-2">
                         <span className={`px-2 py-0.5 rounded text-white font-medium ${
                            issue.severity === 'High' ? 'bg-red-500' :
                            issue.severity === 'Medium' ? 'bg-orange-500' :
                            'bg-green-500'
                          }`}>
                            {issue.severity}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-medium">
                            {issue.category}
                          </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{issue.description}</p>
                      {issue.urgency_score && (
                        <div className="text-indigo-600 font-bold text-sm flex items-center gap-1">
                          <Activity className="w-3 h-3"/> Score: {issue.urgency_score}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
