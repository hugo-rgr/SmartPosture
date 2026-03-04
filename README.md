# SmartPosture

Plateforme de surveillance de posture en temps réel utilisant des gilets intelligents équipés de capteurs IMU.

## Objectif

SmartPosture permet de :
- Détecter les mauvaises postures en temps réel
- Alerter les utilisateurs (travailleurs en environnement professionnel)
- Analyser les données de mouvement et générer des rapports quotidiens
- Visualiser les données via un dashboard interactif

## Architecture

```
[Arduino/Wokwi] → [Bridge TCP/MQTT] → [Backend FastAPI] → [Frontend React]
                                            ↓
                                    [MongoDB + Kafka]
```

## Stack Technique

| Composant | Technologies |
|-----------|--------------|
| **Frontend** | React 19, Vite, Tailwind CSS, Recharts |
| **Backend** | FastAPI, Motor (MongoDB async), aiokafka |
| **Base de données** | MongoDB |
| **Messaging** | MQTT (HiveMQ), Apache Kafka |
| **Simulation** | Arduino (PlatformIO), Wokwi, 2x MPU6050 |

## Structure du Projet

```
SmartPosture/
├── backend/          # API FastAPI + Docker
├── frontend/         # Application React
├── bridge/           # Pont TCP → MQTT (Node.js)
└── simulation/       # Code Arduino (Wokwi)
```

## Installation

### Prérequis

- Docker et Docker Compose
- Node.js (v18+)
- npm

### Backend

```bash
cd backend
docker-compose up -d
```

Services démarrés :
- **MongoDB** : port 27019
- **Kafka** : port 9092
- **API** : port 8000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Accessible sur http://localhost:5173

### Bridge (optionnel - pour simulation)

```bash
cd bridge
npm install
npm start
```

## Fonctionnalités

### Dashboard Temps Réel
- Affichage de l'activité détectée (Debout/Assis/Couché)
- Indicateur de posture (Bonne/Mauvaise)
- Graphique de l'angle en temps réel
- Données brutes des capteurs

### Historique
- Liste paginée des postures enregistrées
- Filtres par date, gilet, activité, posture
- Détails des données capteurs

### Rapports
- Statistiques quotidiennes par gilet
- Ratio bonne/mauvaise posture
- Analyse des séquences de mauvaise posture

## API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/v1/auth/login` | Authentification |
| GET | `/api/v1/postures` | Liste des postures |
| GET | `/api/v1/reports` | Rapports quotidiens |
| WS | `/ws/posture/{gilet_id}` | Streaming temps réel |

## Configuration

Créer un fichier `.env` dans `backend/` :

```env
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=safewear
JWT_SECRET_KEY=votre-clé-secrète
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
MQTT_HOST=broker.hivemq.com
MQTT_PORT=1883
```

## Détection de Posture

Le système utilise 2 capteurs IMU (MPU6050) :
- **Capteur haut** : placé au niveau des épaules
- **Capteur bas** : placé au niveau du bassin

Classification :
- **Bonne posture** : différence d'angle ≤ 25°
- **Mauvaise posture** : différence d'angle > 25°

Activités détectées :
- `STAND_UP` : Debout
- `SIT_DOWN` : Assis
- `LAY_DOWN` : Couché

## Licence

Projet académique - ESGI
