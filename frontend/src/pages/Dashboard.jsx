import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useWebSocket from '../utils/useWebSocket';
import {WS_BASE_URL} from "../utils/api.js";

export default function Dashboard() {
  const { data } = useWebSocket(`${WS_BASE_URL}/ws/posture`);
  // Stocke l'historique des données par gilet
  const [giletData, setGiletData] = useState({}); // { [giletId]: [data, ...] }
  const [selectedId, setSelectedId] = useState('gilet_01');
  const [availableIds, setAvailableIds] = useState(['gilet_01']);

  useEffect(() => {
    if (data) {
      // Ajoute dynamiquement les nouveaux gilets détectés
      if (data.id) {
        if (data.status !== 'DISCONNECTED') {
          setAvailableIds(prev => prev.includes(data.id) ? prev : [...prev, data.id]);
          // Met à jour l'historique du gilet concerné
          setGiletData(prev => {
            const prevArr = prev[data.id] || [];
            // Limite à 12 points sur le graphique
            const newArr = [...prevArr, data];
            if (newArr.length > 12) {
              newArr.shift(); // retire le plus ancien
            }
            return {
              ...prev,
              [data.id]: newArr
            };
          });
        }
      }
    }
  }, [data]);

  // Données du gilet sélectionné
  const selectedGiletData = giletData[selectedId] || [];
  const currentData = selectedGiletData.length > 0 ? selectedGiletData[selectedGiletData.length - 1] : null;
  const chartData = selectedGiletData.map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString(),
    angle_diff: d.angle_diff || 0,
    posture: d.posture || null
  }));

  // Fonction pour colorer les points selon la posture
  const customDot = (props) => {
    const { cx, cy, payload } = props;
    let fill = '#d1d5db'; // gris par défaut
    if (payload.posture === 'GOOD_POSTURE') fill = '#22c55e'; // vert
    if (payload.posture === 'BAD_POSTURE') fill = '#ef4444'; // rouge
    return (
      <circle cx={cx} cy={cy} r={5} fill={fill} stroke="#fff" strokeWidth={1} />
    );
  };

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
      default: return 'Inconnue';
    }
  };

  const postureInfo = getPostureDisplay(currentData?.posture);
  const isAlert = currentData?.posture === 'BAD_POSTURE';

  // Tooltip personnalisé pour afficher l'activité pour les points du graphique
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded shadow text-sm border border-gray-200">
          <div><span className="font-semibold">Heure :</span> {label}</div>
          <div><span className="font-semibold">Angle :</span> {data.angle_diff?.toFixed(2)}°</div>
          <div><span className="font-semibold">Posture :</span> {getPostureDisplay(data.posture).label}</div>
          <div><span className="font-semibold">Activité :</span> {getActivityDisplay(data.activity)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Sélecteur d'ID de gilet */}
      <div className="flex justify-end items-center mb-2">
        <label htmlFor="gilet-select" className="mr-2 text-sm text-gray-700 font-medium">Gilet :</label>
        <select
          id="gilet-select"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          {availableIds.map(id => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
      </div>
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard Temps Réel</h2>
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${currentData?.status === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">{currentData?.status === 'CONNECTED' ? 'Connecté' : 'Déconnecté'}</span>
        </div>
      </div>

      {/* Cards État Gilet */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Carte Gilet */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Gilet</p>
              <p className="text-2xl font-semibold text-gray-900">{currentData?.id || selectedId}</p>
            </div>
          </div>
        </div>

        {/* Carte Activité */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Activité</p>
          <div className="mt-2 flex items-center space-x-2">
            <p className="text-2xl font-bold text-gray-900">
              {getActivityDisplay(currentData?.activity) || 'N/A'}
            </p>
          </div>
          <p className="mt-2 text-sm text-gray-600">Détectée automatiquement</p>
        </div>

        {/* Carte Différence Angle */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Différence Angle</p>
          <div className="mt-2 flex items-end space-x-2">
            <p className="text-4xl font-bold text-gray-900">
              {currentData?.angle_diff?.toFixed(2) || '0.00'}
            </p>
            <p className="text-lg text-gray-500 pb-1">°</p>
          </div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                (currentData?.angle_diff || 0) <= 25 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min((currentData?.angle_diff || 0) * 2, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Carte Posture Actuelle */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Posture Actuelle</p>
          <div className="mt-2 flex items-center space-x-3">
            <span className={`inline-flex items-center justify-center w-3 h-3 rounded-full ${postureInfo.color === 'green' ? 'bg-green-500' : postureInfo.color === 'red' ? 'bg-red-500' : 'bg-gray-400'}`}></span>
            <span className="text-sm font-medium">{postureInfo.label}</span>
          </div>
          {isAlert && (
            <p className="mt-2 text-sm text-red-600 font-medium">⚠️ Alerte active</p>
          )}
        </div>
      </div>

      {/* Graphique Temps Réel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Différence d'Angle en Temps Réel</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" label={{ value: 'Temps', offset: 0, position: 'insideBottom' }} />
            <YAxis label={{ value: 'Degrés (°)', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="angle_diff" stroke="#3b82f6" name="Différence angle" strokeWidth={2} dot={customDot} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 flex justify-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-green-500 rounded"></div>
            <span>Bonne posture</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-red-500 rounded"></div>
            <span>Mauvaise posture (&gt;25°)</span>
          </div>
        </div>
      </div>

      {/* Données Brutes - 2 capteurs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Données Capteurs en Direct</h3>

        {/* Capteur Haut */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-700 mb-3">Capteur Haut (Omoplates)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Accéléromètre (m/s²)</p>
              <div className="bg-blue-50 rounded p-3 font-mono text-sm">
                <div>X: {currentData?.sensorHigh?.accX?.toFixed(2) || '0.00'}</div>
                <div>Y: {currentData?.sensorHigh?.accY?.toFixed(2) || '0.00'}</div>
                <div>Z: {currentData?.sensorHigh?.accZ?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Gyroscope (°/s)</p>
              <div className="bg-blue-50 rounded p-3 font-mono text-sm">
                <div>X: {currentData?.sensorHigh?.gyrX?.toFixed(2) || '0.00'}</div>
                <div>Y: {currentData?.sensorHigh?.gyrY?.toFixed(2) || '0.00'}</div>
                <div>Z: {currentData?.sensorHigh?.gyrZ?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Capteur Bas */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Capteur Bas (Lombaires)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Accéléromètre (m/s²)</p>
              <div className="bg-green-50 rounded p-3 font-mono text-sm">
                <div>X: {currentData?.sensorLow?.accX?.toFixed(2) || '0.00'}</div>
                <div>Y: {currentData?.sensorLow?.accY?.toFixed(2) || '0.00'}</div>
                <div>Z: {currentData?.sensorLow?.accZ?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Gyroscope (°/s)</p>
              <div className="bg-green-50 rounded p-3 font-mono text-sm">
                <div>X: {currentData?.sensorLow?.gyrX?.toFixed(2) || '0.00'}</div>
                <div>Y: {currentData?.sensorLow?.gyrY?.toFixed(2) || '0.00'}</div>
                <div>Z: {currentData?.sensorLow?.gyrZ?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}