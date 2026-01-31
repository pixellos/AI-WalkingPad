import './App.css';
import { useWalkingPad } from './hooks/useWalkingPad';
import { useHistory } from './hooks/useHistory';
import { ConnectionScreen } from './components/ConnectionScreen';
import { Header } from './components/Header';
import { StatusDisplay } from './components/StatusDisplay';
import { SpeedControl } from './components/SpeedControl';
import { ModeSelector } from './components/ModeSelector';
import { Settings } from './components/Settings';
import { HistoryView } from './components/History/HistoryView';
import { StatsView } from './components/Stats/StatsView';
import { ProfileView } from './components/Profile/ProfileView';
import { useEffect, useState, useRef } from 'react';

type Tab = 'home' | 'history' | 'stats' | 'profile';

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
    stop,
    idleKeepAlive,
    setIdleKeepAlive,
    lastActivityTime,
  } = useWalkingPad();

  const {
    workouts,
    settings,
    addWorkout,
    removeWorkout,
    updateSettings,
    stats
  } = useHistory();

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Ref to track last non-zero status for saving workout
  const lastActiveStatusRef = useRef(status);
  const wasRunningRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isRunning = status.state === 1 || status.state === 5;

  // Latch status when running
  useEffect(() => {
    if (isRunning) {
      lastActiveStatusRef.current = status;
      wasRunningRef.current = true;
    } else if (wasRunningRef.current && !isRunning) {
      // Just stopped. Check if we should save.
      const lastStatus = lastActiveStatusRef.current;
      if (lastStatus.distance > 5 || lastStatus.time > 10) { // at least 50m or 10s
        console.log('Saving workout session...');
        addWorkout({
          date: Date.now(),
          duration: lastStatus.time,
          distance: lastStatus.distance,
          steps: lastStatus.steps,
          avgSpeed: lastStatus.speed, // simplified, could be actual avg
          maxSpeed: lastStatus.speed
        });
      }
      wasRunningRef.current = false;
    }
  }, [isRunning, status, addWorkout]);

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

  const handleStartStop = () => {
    if (isRunning) {
      stop();
    } else {
      start();
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="widget-grid">
            <StatusDisplay
              status={status}
              params={params}
            />
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
                idleKeepAlive={idleKeepAlive}
                onIdleKeepAliveChange={setIdleKeepAlive}
                lastActivityTime={lastActivityTime}
              />
            </div>
          </div>
        );
      case 'history':
        return <HistoryView workouts={workouts} onDelete={removeWorkout} />;
      case 'stats':
        return <StatsView stats={stats} />;
      case 'profile':
        return settings ? (
          <ProfileView settings={settings} onUpdate={updateSettings} />
        ) : null;
      default:
        return null;
    }
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
          name={settings?.name}
          avatar={settings?.avatar}
        />

        <main className="main-content">
          {renderContent()}
        </main>

        <nav className="bottom-nav bear-nav">
          <button
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <div className="nav-icon-bg">🏠</div>
            <span>Home</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <div className="nav-icon-bg">📜</div>
            <span>History</span>
          </button>

          <div className="nav-center-action">
            <button className="center-pulse-btn" onClick={handleStartStop}>
              {isRunning ? '⏹️' : '▶️'}
            </button>
          </div>

          <button
            className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <div className="nav-icon-bg">📊</div>
            <span>Stats</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <div className="nav-icon-bg">🐻</div>
            <span>Profile</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

export default App;
