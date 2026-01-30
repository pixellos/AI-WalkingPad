import './ConnectionScreen.css';

export function ConnectionScreen({
    onConnect,
    onConnectAny,
    isConnecting,
    isReconnecting,
    error,
    autoReconnect,
    onAutoReconnectChange,
    onCancelReconnect,
    apiSupport
}) {
    return (
        <div className="bear-connection-page">
            <div className="welcome-widget card">
                <div className="bear-hero">🐻</div>
                <h1 className="title">WalkingPad</h1>
                <p className="subtitle">Ready for your walk?</p>
            </div>

            <div className="card connect-widget">
                <h2 className="title-section">Connect Device</h2>

                <p className="desc">Wake up your pad and tap the button below to start.</p>

                <button
                    className={`bear-connect-btn ${isConnecting ? 'loading' : ''}`}
                    onClick={onConnect}
                    disabled={isConnecting}
                >
                    {isConnecting ? 'Connecting...' : 'Connect Now'}
                </button>

                <button className="manual-link" onClick={onConnectAny}>
                    Show all devices
                </button>
            </div>

            <div className="settings-row">
                <div className="card mini-setting">
                    <span className="mini-label">Auto Sync</span>
                    <label className="bear-toggle">
                        <input
                            type="checkbox"
                            checked={autoReconnect}
                            onChange={(e) => onAutoReconnectChange(e.target.checked)}
                        />
                        <span className="bear-slider-toggle"></span>
                    </label>
                </div>

                <div className="card mini-setting">
                    <span className="mini-label">Status</span>
                    <div className={`status-dot ${apiSupport?.bluetooth ? 'online' : 'offline'}`}></div>
                </div>
            </div>

            {error && (
                <div className="card error-widget">
                    <span className="error-emoji">⚠️</span>
                    <p>{error}</p>
                </div>
            )}

            {isReconnecting && (
                <div className="reconnect-overlay">
                    <div className="card popup">
                        <div className="spinner-bear">🐻</div>
                        <h3>Searching...</h3>
                        <button className="cancel-text" onClick={onCancelReconnect}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}
