import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchWithAuth } from '../utils/api';

export default function Stats() {
  const [allStats, setAllStats] = useState([]);
  const [selectedStats, setSelectedStats] = useState(null);
  const [selectedGiletId, setSelectedGiletId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [uniqueGiletIds, setUniqueGiletIds] = useState([]);

  useEffect(() => {
    fetchWithAuth('http://localhost:8000/api/v1/reports')
      .then(res => res.json())
      .then(response => {
        const stats = response.data || [];
        setAllStats(stats);

        // Extraire les gilet_id uniques
        const giletIds = [...new Set(stats.map(s => s.gilet_id))];
        setUniqueGiletIds(giletIds);

        // Par défaut : afficher la dernière stat (la plus récente)
        if (stats.length > 0) {
          const latest = stats[0]; // Backend retourne déjà trié par date décroissante
          setSelectedStats(latest);
          setSelectedGiletId(latest.gilet_id);
          setSelectedDate(latest.date_key);
        }
      })
      .catch(err => console.error(err));
  }, []);

  // Mettre à jour les dates disponibles quand un gilet est sélectionné
  useEffect(() => {
    if (selectedGiletId) {
      const dates = allStats
        .filter(s => s.gilet_id === selectedGiletId)
        .map(s => s.date_key)
        .sort((a, b) => b.localeCompare(a)); // Tri décroissant
      setAvailableDates(dates);

      // Si la date sélectionnée n'existe pas pour ce gilet, prendre la première disponible
      if (!dates.includes(selectedDate) && dates.length > 0) {
        setSelectedDate(dates[0]);
      }
    }
  }, [selectedGiletId, allStats]);

  // Mettre à jour les stats affichées quand gilet_id ou date change
  useEffect(() => {
    if (selectedGiletId && selectedDate) {
      const stat = allStats.find(
        s => s.gilet_id === selectedGiletId && s.date_key === selectedDate
      );
      setSelectedStats(stat || null);
    }
  }, [selectedGiletId, selectedDate, allStats]);

  // Formater date_key (YYYYMMDD) en format lisible
  const formatDate = (dateKey) => {
    if (!dateKey) return '';
    const year = dateKey.substring(0, 4);
    const month = dateKey.substring(4, 6);
    const day = dateKey.substring(6, 8);
    return `${day}/${month}/${year}`;
  };

  // Données pour le graphique en barres (activités)
  const activityData = selectedStats?.activity_counts
    ? Object.entries(selectedStats.activity_counts).map(([activity, count]) => ({
        activité: activity === 'STAND_UP' ? 'Debout' :
                  activity === 'SIT_DOWN' ? 'Assis' :
                  activity === 'LAY_DOWN' ? 'Couché' :
                  activity === 'UNKNOWN' ? 'Inconnue' : activity,
        nombre: count
      }))
    : [];

  // Données pour le camembert (répartition postures)
  const postureData = selectedStats ? [
    { name: 'Bonne', value: selectedStats.good_postures, color: '#10b981' },
    { name: 'Mauvaise', value: selectedStats.bad_postures, color: '#ef4444' }
  ].filter(d => d.value > 0) : [];

  if (!selectedStats) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Statistiques</h2>
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          Aucune donnée disponible
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Alerte unique pour tous les gilets si mauvaises postures détectées, pour la dernière date globale */}
      {(() => {
        // Trouver la date la plus récente parmi toutes les stats
        const allDates = allStats.map(s => s.date_key);
        const lastDate = allDates.length > 0 ? allDates.sort((a, b) => b.localeCompare(a))[0] : null;
        const alertes = uniqueGiletIds.map(giletId => {
          const statsGilet = allStats.filter(s => s.gilet_id === giletId && s.date_key === lastDate)[0];
          if (!statsGilet) return null;
          const ratio = statsGilet.total_postures > 0 ? (statsGilet.bad_postures / statsGilet.total_postures) : 0;
          if (ratio >= 0.2) {
            return {
              giletId,
              ratio,
              maxStreak: statsGilet.max_bad_posture_streak
            };
          }
          return null;
        }).filter(Boolean);
        if (alertes.length > 0 && lastDate) {
          const maxToShow = 3;
          const alertesToShow = alertes.slice(0, maxToShow);
          const nbAutresGiletAlerte = alertes.length - maxToShow;
          return (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">Attention requise pour la journée du {formatDate(lastDate)}</h3>
                  <ul className="mt-2 text-sm text-orange-700 list-disc list-inside space-y-1">
                    {alertesToShow.map(a => (
                      <li key={a.giletId}>
                        {a.giletId} : {a.ratio * 100 >= 100 ? '100' : (a.ratio * 100).toFixed(1)}% de mauvaises postures détectées pour ce gilet.
                        {a.maxStreak >= 25 && (
                          <span className="font-semibold"> Une série de {a.maxStreak} mauvaises postures consécutives a été enregistrée.</span>
                        )}
                      </li>
                    ))}
                    {nbAutresGiletAlerte > 0 && (
                      <li className="font-semibold">Et {nbAutresGiletAlerte} autres gilets</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          );
        } else {
          return null;
        }
      })()}

      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Statistiques</h2>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gilet</label>
            <select
              value={selectedGiletId}
              onChange={(e) => setSelectedGiletId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {uniqueGiletIds.map(giletId => (
                <option key={giletId} value={giletId}>{giletId}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {availableDates.map(date => (
                <option key={date} value={date}>{formatDate(date)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Postures Totales</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{selectedStats.total_postures}</p>
          <p className="text-sm text-gray-600 mt-1">Détections à ce jour</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Bonnes Postures</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {(selectedStats.good_posture_ratio * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {selectedStats.good_postures} / {selectedStats.total_postures}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Angle Moyen</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {selectedStats.angle_diff_mean.toFixed(2)}°
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Max: {selectedStats.angle_diff_max.toFixed(1)}°
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Mauvaises Postures</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{selectedStats.bad_postures}</p>
          <p className="text-sm text-gray-600 mt-1">
            Série max: {selectedStats.max_bad_posture_streak}
          </p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar Chart - Activités */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des Activités</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="activité" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="nombre" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-4 text-sm text-gray-600">
            Activité la plus fréquente: <span className="font-medium">
              {selectedStats.most_common_activity === 'STAND_UP' ? 'Debout' :
               selectedStats.most_common_activity === 'SIT_DOWN' ? 'Assis' :
               selectedStats.most_common_activity === 'LAY_DOWN' ? 'Couché' :
               selectedStats.most_common_activity === 'UNKNOWN' ? 'Inconnue' :
               selectedStats.most_common_activity}
            </span>
          </p>
        </div>

        {/* Pie Chart - Répartition Postures */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des Postures</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={postureData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {postureData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Statistiques détaillées */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques Détaillées</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm text-gray-500">Angle Diff Moyen</p>
            <p className="text-xl font-bold text-gray-900">{selectedStats.angle_diff_mean.toFixed(2)}°</p>
          </div>
          <div className="border-l-4 border-red-500 pl-4">
            <p className="text-sm text-gray-500">Angle Diff Max</p>
            <p className="text-xl font-bold text-gray-900">{selectedStats.angle_diff_max.toFixed(2)}°</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-sm text-gray-500">Angle Diff Min</p>
            <p className="text-xl font-bold text-gray-900">{selectedStats.angle_diff_min.toFixed(2)}°</p>
          </div>
          <div className="border-l-4 border-yellow-500 pl-4">
            <p className="text-sm text-gray-500">Écart-type</p>
            <p className="text-xl font-bold text-gray-900">{selectedStats.angle_diff_std.toFixed(2)}°</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Séries de mauvaises postures</p>
              <p className="text-lg font-semibold text-gray-900">
                {selectedStats.bad_posture_streak_count} séries détectées
              </p>
              <p className="text-sm text-gray-600">
                Plus longue série: {selectedStats.max_bad_posture_streak} détections
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Dernière mise à jour</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(selectedStats.last_updated_at * 1000).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}