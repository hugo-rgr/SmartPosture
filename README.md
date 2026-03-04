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
| **Messaging** | Bridge NodeJS, MQTT (HiveMQ), Apache Kafka |
| **Simulation** | Arduino (PlatformIO), Wokwi, 2x MPU6050 |

## Structure du Projet

```
SmartPosture/
├── backend/          # API FastAPI + Docker
├── frontend/         # Application React
├── bridge/           # Pont TCP → MQTT (Node.js)
├── simulation_1/     # Code Arduino (Wokwi)
└── simulation_2/     # Code Arduino (Wokwi)
```

## Installation

### Prérequis

- Docker et Docker Compose
- Node.js (v18+)
- npm

### Backend & Frontend

à la racine du projet
```bash
docker-compose up -d
```

Services démarrés :
- **MongoDB** : port 27019
- **Kafka** : port 9092
- **API** : port 8000
- **Frontend** : port 5173 accessible sur http://localhost:5173

### Simulation des gilets
---

#### 1. Prérequis & Extensions VS Code

##### Logiciels requis

| Outil | Version minimale | Lien |
|---|---|---|
| [VS Code](https://code.visualstudio.com/) | Dernière stable | — |
| [Node.js](https://nodejs.org/) | v18+ | — |
| [Git](https://git-scm.com/) | — | — |

---

#### 2. Installation de PlatformIO

PlatformIO est l'environnement de développement embarqué qui permet de compiler le code Arduino (C++) directement depuis VS Code.

##### Étapes

1. Ouvrir VS Code
2. Aller dans l'onglet **Extensions** (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Rechercher **PlatformIO IDE**
4. Cliquer sur **Install** sur l'extension publiée par *PlatformIO*

> ⚠️ L'installation peut prendre quelques minutes car PlatformIO télécharge son propre environnement Python et les toolchains nécessaires. **Redémarrer VS Code** une fois l'installation terminée.

Une icône PlatformIO apparaît dans la barre latérale gauche de VS Code une fois l'installation réussie.

---

#### 3. Installation de l'extension Wokwi

Wokwi est le simulateur de microcontrôleurs. L'extension VS Code permet de lancer les simulations directement dans l'éditeur, en lisant les fichiers `diagram.json` et le firmware compilé par PlatformIO.

##### Étapes

1. Dans VS Code, aller dans **Extensions** (`Ctrl+Shift+X`)
2. Rechercher **Wokwi Simulator**
3. Cliquer sur **Install** sur l'extension publiée par *Wokwi*

##### Activer la licence Wokwi (obligatoire)

L'extension Wokwi pour VS Code nécessite une licence gratuite :

1. Appuyer sur `F1` pour ouvrir la palette de commandes
2. Taper `Wokwi: Request a Free License`
3. Suivre les instructions (connexion au compte Wokwi sur le navigateur)
4. Une fois la licence activée, le message *"Wokwi license activated"* s'affiche

> 💡 La licence est **gratuite** pour un usage personnel. Elle est liée à votre compte Wokwi.

---

#### 4. Structure des simulations

Le projet contient **deux simulations identiques** (à l'exception du port TCP et de l'identifiant du gilet), représentant deux gilets connectés distincts.

```
SmartPosture/
├── simulation_1/
│   ├── src/
│   │   └── main.cpp          ← Code Arduino (gilet 1, port TCP propre)
│   ├── platformio.ini        ← Configuration PlatformIO
│   ├── diagram.json          ← Schéma du circuit Wokwi
│   └── wokwi.toml            ← Configuration Wokwi
│
├── simulation_2/
│   ├── src/
│   │   └── main.cpp          ← Code Arduino (gilet 2, port TCP différent)
│   ├── platformio.ini
│   ├── diagram.json
│   └── wokwi.toml
│
└── bridge/
    ├── index.js              ← TCP → MQTT bridge (Node.js)
    ├── listen.js             ← Script de test MQTT
    └── package.json
```

> 🔑 Les deux `main.cpp` diffèrent uniquement par :
> - Le **port TCP** utilisé pour envoyer les données
> - L'**identifiant du gilet** (`gilet_id`) envoyé dans le payload MQTT

---

#### 5. Compilation des projets Arduino

Chaque simulation doit être compilée et lancée séparément dans sa **propre fenêtre VS Code**.

##### Simulation 1

1. Dans VS Code, faire **Fichier → Ouvrir le dossier** (`Ctrl+K Ctrl+O`)
2. Naviguer jusqu'à `SmartPosture/simulation_1/` et ouvrir ce dossier
3. PlatformIO détecte automatiquement le `platformio.ini`
4. Compiler `src/main.cpp` avec le raccourci : `Ctrl+Alt+B`
5. Attendre le message **`SUCCESS`** dans le terminal

##### Simulation 2

1. Ouvrir **une nouvelle fenêtre VS Code** (`Ctrl+Shift+N`)
2. Faire **Fichier → Ouvrir le dossier** et naviguer jusqu'à `SmartPosture/simulation_2/`
3. Répéter les mêmes étapes de compilation

> ⚠️ Il est impératif d'avoir **deux fenêtres VS Code distinctes** — une par simulation. Wokwi s'exécute dans le contexte du dossier ouvert dans la fenêtre courante.

---

#### 6. Lancement des simulations Wokwi

Une fois les deux projets compilés, lancer chaque simulateur dans sa fenêtre respective.

##### Dans chaque fenêtre VS Code (simulation_1 et simulation_2)

1. Appuyer sur `F1` pour ouvrir la palette de commandes
2. Taper `Wokwi: Start Simulator`
3. Appuyer sur `Entrée`

Le simulateur s'ouvre dans un panneau VS Code et affiche le circuit Arduino avec les deux capteurs MPU6050. La simulation démarre automatiquement. Restez sur cettre fenêtre VSCode pour que la simulation reste en execution.

##### Ordre de lancement recommandé

```
Fenêtre 1 : Wokwi: Start Simulator  (simulation_1)
Fenêtre 2 : Wokwi: Start Simulator  (simulation_2)
↓
Les deux simulations tournent en parallèle et envoient
leurs données sur leurs ports TCP respectifs.
```

---

#### 7. Lancement du TCP Bridge

Le bridge est un serveur Node.js qui écoute les connexions TCP des simulations Wokwi et relaie les données vers un broker MQTT (HiveMQ public).

##### Installation des dépendances

Ouvrir un terminal à la racine du projet :

```bash
cd bridge
npm install
```

##### Démarrage du bridge

Créez et configurez un fichier .env sous le format : 

```
# MQTT Configuration
MQTT_BROKER=mqtt://broker.hivemq.com 
MQTT_TOPIC_TEMPLATE=safewear/gilet_id/capteurs

# Wokwi / TCP Configuration
WOKWI_HOST=127.0.0.1
WOKWI_PORT_1=4000
WOKWI_PORT_2=4001

# Testing (Listener)
TEST_GILET_ID=gilet_01
```
Toutes ces variables sont paramétrables pour ajuster le projet à d'autres besoins, veillez seulement à garder un chemin /gilet_id/ dans le MQTT_TOPIC_TEMPLATE.

Lancez ensuite le bridge avec :

```bash
npm run start
```

Le bridge se met en écoute sur les ports TCP configurés et affiche dans la console les messages reçus des deux simulations ainsi que les publications MQTT effectuées.

**Ce qui se passe en coulisses :**

```
simulation_1 (Wokwi) ──TCP──► bridge :port1 ──MQTT──► broker.hivemq.com
simulation_2 (Wokwi) ──TCP──► bridge :port2 ──MQTT──► broker.hivemq.com
```

> 💡 Le bridge doit être lancé de préférence **après** les deux simulations Wokwi.

---

#### 8. Tester l'écoute MQTT

Pour vérifier que les messages MQTT sont bien publiés par le bridge, un script d'écoute est disponible :

```bash
# Dans le dossier /bridge (dans un nouveau terminal)
npm run listen
```

Ce script se connecte au broker MQTT et s'abonne aux topics des gilets. Chaque message reçu est affiché dans la console avec son topic et son payload JSON (données des capteurs MPU6050, posture détectée, etc.).

---

#### 9. Résumé du flux complet

Voici l'ordre de démarrage complet pour avoir les deux simulations opérationnelles :

```
① Ouvrir simulation_1/ dans VS Code (fenêtre 1)
   └── PlatformIO: Build  (Ctrl+Alt+B)

② Ouvrir simulation_2/ dans VS Code (fenêtre 2)
   └── PlatformIO: Build  (Ctrl+Alt+B)

③ Dans fenêtre 1 → F1 → Wokwi: Start Simulator
④ Dans fenêtre 2 → F1 → Wokwi: Start Simulator

⑤ Dans un terminal :
   cd bridge
   npm install      (première fois seulement)
   npm run start

⑥ (Optionnel) Dans un second terminal :
   cd bridge
   npm run listen   (pour vérifier la réception MQTT)
```

---

##### Architecture globale de la simulation

```
[Wokwi sim_1] ──TCP──┐
                      ├──► [Bridge Node.js] ──MQTT──► [Backend FastAPI] ──► [Frontend React]
[Wokwi sim_2] ──TCP──┘                                      │
                                                       [MongoDB + Kafka]
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
- **Capteur haut** : placé entre les deux omoplates
- **Capteur bas** : placé au niveau des lombaires

Classification :
- **Bonne posture** : différence d'angle ≤ 25°
- **Mauvaise posture** : différence d'angle > 25°

Activités détectées :
- `STAND_UP` : Debout
- `SIT_DOWN` : Assis
- `LAY_DOWN` : Couché

## Licence

Projet académique - ESGI
