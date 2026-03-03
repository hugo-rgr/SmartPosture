import { useState, useEffect } from 'react';
import {fetchWithAuth} from "../utils/api.js";

export default function History() {
  const [history, setHistory] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [filters, setFilters] = useState({
    date: '',
    activity: 'all',
    posture: 'all',
    giletId: ''
  });

  useEffect(() => {
    fetchWithAuth('http://localhost:8000/api/v1/postures')
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(err => console.error(err));
  }, []);

  const getPostureDisplay = (posture) => {
    switch(posture) {
      case 'GOOD_POSTURE': return { label: 'Bonne', color: 'green', emoji: '🟢' };
      case 'BAD_POSTURE': return { label: 'Mauvaise', color: 'red', emoji: '🔴' };
      default: return { label: posture, color: 'gray', emoji: '⚪' };
    }
  };

  const getActivityDisplay = (activity) => {
    switch(activity) {
      case 'STAND_UP': return 'Debout';
      case 'SIT_DOWN': return 'Assis';
      case 'LAY_DOWN': return 'Couché';
      case 'UNKNOWN': return 'Inconnu';
      default: return activity;
    }
  };

  const filteredHistory = history.filter(item => {
    if (filters.giletId && !item.id?.toLowerCase().includes(filters.giletId.toLowerCase())) return false;
    if (filters.posture !== 'all' && item.posture !== filters.posture) return false;
    if (filters.activity !== 'all' && item.activity !== filters.activity) return false;
    return true;
  });

  return (
    <div className="space-y-6">

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({...filters, date: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gilet ID</label>
            <input
              type="text"
              placeholder="Rechercher par ID..."
              value={filters.giletId}
              onChange={e => setFilters({...filters, giletId: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activité</label>
            <select
              value={filters.activity}
              onChange={(e) => setFilters({...filters, activity: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">Toutes</option>
              <option value="STAND_UP">Debout</option>
              <option value="SIT_DOWN">Assis</option>
              <option value="LAY_DOWN">Couché</option>
              <option value="UNKNOWN">Inconnu</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Posture</label>
            <select
              value={filters.posture}
              onChange={(e) => setFilters({...filters, posture: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">Toutes</option>
              <option value="GOOD_POSTURE">Bonne</option>
              <option value="BAD_POSTURE">Mauvaise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Heure</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gilet ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activité</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posture</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Angle Diff</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alerte</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredHistory.map((item, index) => {
              const postureInfo = getPostureDisplay(item.posture);
              const isAlert = item.posture === 'BAD_POSTURE';

              return (
                <>
                  <tr key={item._id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getActivityDisplay(item.activity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${postureInfo.color}-100 text-${postureInfo.color}-800`}>
                        {postureInfo.emoji} {postureInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.angle_diff?.toFixed(2)}°
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {isAlert ? (
                        <span className="text-red-600 font-medium">⚠️ Oui</span>
                      ) : (
                        <span className="text-gray-400">Non</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {expandedRow === index ? '▲ Masquer' : '▼ Voir'}
                      </button>
                    </td>
                  </tr>
                  {expandedRow === index && (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 bg-gray-50">
                        {/* Capteur Haut */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Capteur Haut (Épaules)</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-1">Accéléromètre (m/s²)</p>
                              <div className="bg-blue-50 rounded p-2 font-mono text-xs">
                                <div>X: {item.sensorHigh?.accX?.toFixed(2)}</div>
                                <div>Y: {item.sensorHigh?.accY?.toFixed(2)}</div>
                                <div>Z: {item.sensorHigh?.accZ?.toFixed(2)}</div>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-1">Gyroscope (°/s)</p>
                              <div className="bg-blue-50 rounded p-2 font-mono text-xs">
                                <div>X: {item.sensorHigh?.gyrX?.toFixed(2)}</div>
                                <div>Y: {item.sensorHigh?.gyrY?.toFixed(2)}</div>
                                <div>Z: {item.sensorHigh?.gyrZ?.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Capteur Bas */}
                        <div className="mb-3">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Capteur Bas (Bassin)</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-1">Accéléromètre (m/s²)</p>
                              <div className="bg-green-50 rounded p-2 font-mono text-xs">
                                <div>X: {item.sensorLow?.accX?.toFixed(2)}</div>
                                <div>Y: {item.sensorLow?.accY?.toFixed(2)}</div>
                                <div>Z: {item.sensorLow?.accZ?.toFixed(2)}</div>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-1">Gyroscope (°/s)</p>
                              <div className="bg-green-50 rounded p-2 font-mono text-xs">
                                <div>X: {item.sensorLow?.gyrX?.toFixed(2)}</div>
                                <div>Y: {item.sensorLow?.gyrY?.toFixed(2)}</div>
                                <div>Z: {item.sensorLow?.gyrZ?.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Timestamp:</span> {item.timestamp}ms |
                            <span className="font-medium"> Différence angle:</span> {item.angle_diff?.toFixed(2)}°
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
        {filteredHistory.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucune donnée trouvée
          </div>
        )}
      </div>
    </div>
  );
}