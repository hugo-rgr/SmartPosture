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
  const [refreshCount, setRefreshCount] = useState(0);
  const PAGE_SIZE = 50;
  const [total, setTotal] = useState(0);

  // Construction dynamique de l'URL avec pagination et filtres
  useEffect(() => {
    const params = new URLSearchParams();
    params.append('skip', currentPage * PAGE_SIZE);
    params.append('limit', PAGE_SIZE);
    if (filters.giletId) params.append('gilet_id', filters.giletId);
    if (filters.posture !== 'all' && filters.posture) params.append('posture', filters.posture);
    if (filters.activity !== 'all' && filters.activity) params.append('activity', filters.activity);
    if (filters.date) {
      // Conversion de la date (YYYY-MM-DD) en format attendu par l'API (YYYYMMDD)
      const dateKey = filters.date.replaceAll('-', '');
      params.append('date_key', dateKey);
    }
    fetchWithAuth(`http://localhost:8000/api/v1/postures?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setHistory(Array.isArray(data.data) ? data.data : []);
        setTotal(typeof data.total === 'number' ? data.total : 0);
      })
      .catch(err => console.error(err));
  }, [currentPage, filters, refreshCount]);

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
      case 'UNKNOWN': return 'Inconnue';
      default: return activity;
    }
  };

  // Pagination sur les données reçues (plus de slice côté client)
  const paginatedHistory = history;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));


  // Bouton de rafraîchissement
  const handleRefresh = () => {
    setRefreshCount(c => c + 1);
  };

  // Utilitaire pour convertir le timestamp (secondes ou millisecondes) en Date JS
  const parseTimestamp = (ts) => {
    if (!ts) return null;
    // Si le timestamp est en secondes (10 chiffres), convertir en ms
    if (typeof ts === 'number' && ts < 1e12) return new Date(ts * 1000);
    // Sinon, supposer millisecondes
    return new Date(ts);
  };

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Historique</h2>
      </div>

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
              <option value="UNKNOWN">Inconnue</option>
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
            {paginatedHistory.map((item, index) => {
              const postureInfo = getPostureDisplay(item.posture);
              const globalIndex = currentPage * PAGE_SIZE + index;
              return (
                <>
                  <tr key={item._id || globalIndex} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {parseTimestamp(item.timestamp)?.toLocaleString('fr-FR')}
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
                        onClick={() => setExpandedRow(expandedRow === globalIndex ? null : globalIndex)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {expandedRow === globalIndex ? '▲ Masquer' : '▼ Voir'}
                      </button>
                    </td>
                  </tr>
                  {expandedRow === globalIndex && (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 bg-gray-50">
                        {/* Capteur Haut */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Capteur Haut (Omoplates)</h4>
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
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Capteur Bas (Lombaires)</h4>
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

                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
        {paginatedHistory.length === 0 && (
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