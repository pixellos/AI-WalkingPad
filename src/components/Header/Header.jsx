import './Header.css';

export function Header({
    deviceName,
    isConnected,
    onDisconnect,
}) {
    return (
        <header className="bear-header card">
            <div className="header-widget">
                <div className="bear-avatar">
                    🐻
                </div>
                <div className="header-text">
                    <h1 className="header-greeting">Hello, Bear!</h1>
                    <p className="device-info">
                        {isConnected ? `Connected: ${deviceName}` : 'Device Offline'}
                    </p>
                </div>

                {isConnected && (
                    <button className="disconnect-circle" onClick={onDisconnect}>
                        ✕
                    </button>
                )}
            </div>
        </header>
    );
}
