import './App.css';
import { useWalkingPad } from './hooks/useWalkingPad';
import { ConnectionScreen } from './components/ConnectionScreen';
import { Header } from './components/Header';
import { StatusDisplay } from './components/StatusDisplay';
import { SpeedControl } from './components/SpeedControl';
import { ModeSelector } from './components/ModeSelector';
import { Settings } from './components/Settings';
import { useEffect, useState } from 'react';

function App() {
  const {
    isConnected,
    isConnecting,
    isReconnecting,
    deviceName,
    error,
    apiSupport,
    status,
    params,
    autoReconnect,
    setAutoReconnect,
    cancelReconnect,
    connect,
    connectAny,
    disconnect,
    setSpeed,
    setMode,
    start,
    setStartSpeed,
    setSensitivity,
    setAutoStart,
    setMaxSpeed,
    setUnit,
  } = useWalkingPad();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!isConnected) {
    return (
      <ConnectionScreen
        onConnect={connect}
        onConnectAny={connectAny}
        isConnecting={isConnecting}
        isReconnecting={isReconnecting}
        error={error}
        autoReconnect={autoReconnect}
        onAutoReconnectChange={setAutoReconnect}
        onCancelReconnect={cancelReconnect}
        apiSupport={apiSupport}
      />
    );
  }

  const isRunning = status.state === 1 || status.state === 5;

  const handleStartStop = () => {
    if (isRunning) {
      setMode(2);
    } else {
      start();
    }
  };

  const formatDate = (date) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="app bear-theme">
      <div className="app-layout">

        {/* Aesthetic Date Widget */}
        <div className="date-widget">
          <div className="plaid-small"></div>
          <div className="date-content">
            <span className="current-weekday">{currentTime.toLocaleDateString('en-US', { weekday: 'long' })}</span>
            <span className="current-date">{currentTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flower-decor">✿</div>
        </div>

        <Header
          deviceName={deviceName}
          isConnected={isConnected}
          onDisconnect={disconnect}
          autoReconnect={autoReconnect}
          onAutoReconnectChange={setAutoReconnect}
        />

        <main className="main-content">
          <div className="widget-grid">
            {/* Speed Widget */}
            <StatusDisplay
              status={status}
              params={params}
            />

            {/* Controls Widget */}
            <SpeedControl
              currentSpeed={status.speed}
              maxSpeed={params.maxSpeed}
              startSpeed={params.startSpeed}
              onSpeedChange={setSpeed}
              onStartSpeedChange={setStartSpeed}
              onStart={handleStartStop}
              isRunning={isRunning}
            />

            <div className="small-widgets">
              <ModeSelector
                currentMode={status.mode}
                onModeChange={setMode}
              />

              <Settings
                params={params}
                onSensitivityChange={setSensitivity}
                onAutoStartChange={setAutoStart}
                onUnitChange={setUnit}
                onMaxSpeedChange={setMaxSpeed}
              />
            </div>
          </div>
        </main>

        <nav className="bottom-nav bear-nav">
          <button className="nav-item active">
            <div className="nav-icon-bg">🏠</div>
            <span>Home</span>
          </button>

          <button className="nav-item">
            <div className="nav-icon-bg">📜</div>
            <span>History</span>
          </button>

          <div className="nav-center-action">
            <button className="center-pulse-btn" onClick={handleStartStop}>
              {isRunning ? '⏹️' : '▶️'}
            </button>
          </div>

          <button className="nav-item">
            <div className="nav-icon-bg">📊</div>
            <span>Stats</span>
          </button>

          <button className="nav-item">
            <div className="nav-icon-bg">🐻</div>
            <span>Profile</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

export default App;
