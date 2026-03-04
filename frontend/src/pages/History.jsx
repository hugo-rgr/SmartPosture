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
  const [currentPage, setCurrentPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    fetchWithAuth(`http://localhost:8000/api/v1/postures?skip=${currentPage * PAGE_SIZE}&limit=${PAGE_SIZE}`)
      .then(res => res.json())
      .then(data => {
        setHistory(Array.isArray(data.data) ? data.data : []);
        setTotal(typeof data.total === 'number' ? data.total : 0);
      })
      .catch(err => console.error(err));
  }, [currentPage, refreshCount]);

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
    if (filters.giletId && !item.gilet_id?.toLowerCase().includes(filters.giletId.toLowerCase())) return false;
    if (filters.posture !== 'all' && item.posture !== filters.posture) return false;
    if (filters.activity !== 'all' && item.activity !== filters.activity) return false;
    // Filtre date locale (YYYY-MM-DD)
    if (filters.date) {
      const itemDate = new Date(item.timestamp).toISOString().slice(0, 10);
      if (itemDate !== filters.date) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Bouton de rafraîchissement
  const handleRefresh = () => {
    setRefreshCount(c => c + 1);
  };

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
              onChange={(e) => {
                setCurrentPage(0);
                setFilters({...filters, date: e.target.value});
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gilet ID</label>
            <input
              type="text"
              placeholder="Rechercher par ID..."
              value={filters.giletId}
              onChange={e => {
                setCurrentPage(0);
                setFilters({...filters, giletId: e.target.value});
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activité</label>
            <select
              value={filters.activity}
              onChange={(e) => {
                setCurrentPage(0);
                setFilters({...filters, activity: e.target.value});
              }}
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
              onChange={(e) => {
                setCurrentPage(0);
                setFilters({...filters, posture: e.target.value});
              }}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredHistory.map((item, index) => {
              const postureInfo = getPostureDisplay(item.posture);

              return (
                <>
                  <tr key={item._id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {item.gilet_id}
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
                      <td colSpan="6" className="px-6 py-4 bg-gray-50">
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
      {/* Pagination et rafraîchissement */}
      <div className="flex items-center py-4 justify-between w-full">
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-4">
            <button
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              Précédent
            </button>
            <span className="text-sm">Page {currentPage + 1} sur {totalPages}</span>
            <button
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage + 1 >= totalPages}
            >
              Suivant
            </button>
          </div>
        </div>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ml-4"
          onClick={handleRefresh}
        >
          Rafraîchir
        </button>
      </div>
    </div>
  );
}