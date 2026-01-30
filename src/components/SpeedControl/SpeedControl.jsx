import './SpeedControl.css';

export function SpeedControl({
    currentSpeed,
    maxSpeed,
    onSpeedChange,
    onStart,
    isRunning
}) {
    const handleIncrement = () => {
        if (currentSpeed < maxSpeed) onSpeedChange(currentSpeed + 1);
    };

    const handleDecrement = () => {
        if (currentSpeed > 5) onSpeedChange(currentSpeed - 1);
    };

    return (
        <div className="bear-speed-control">
            <div className="card control-widget">
                <h2 className="title-section">Adjust Pad</h2>

                <div className="slider-container">
                    <input
                        type="range"
                        min="5"
                        max={maxSpeed}
                        value={currentSpeed}
                        onChange={(e) => onSpeedChange(parseInt(e.target.value))}
                        className="bear-slider"
                    />
                    <div className="slider-labels">
                        <span>Min</span>
                        <span className="current-set-speed">{(currentSpeed / 10).toFixed(1)}</span>
                        <span>Max</span>
                    </div>
                </div>

                <div className="control-button-grid">
                    <button className="icon-widget-btn" onClick={handleDecrement}>
                        <div className="btn-inner">➖</div>
                        <span>Slower</span>
                    </button>

                    <button className="icon-widget-btn main" onClick={onStart}>
                        <div className="btn-inner">{isRunning ? '⏹️' : '▶️'}</div>
                        <span>{isRunning ? 'Stop' : 'Start'}</span>
                    </button>

                    <button className="icon-widget-btn" onClick={handleIncrement}>
                        <div className="btn-inner">➕</div>
                        <span>Faster</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
