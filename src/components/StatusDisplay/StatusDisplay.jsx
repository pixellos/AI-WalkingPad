import './StatusDisplay.css';
import { formatTime, formatDistance } from '../../utils/protocol';

export function StatusDisplay({ status, params }) {
    const { speed, time, distance, steps, isRunning } = status;

    return (
        <div className="bear-status-grid">
            {/* Speed Widget - Large */}
            <div className="card speed-widget">
                <div className="widget-label">Current Speed</div>
                <div className="speed-display">
                    <span className="speed-value">{(speed / 10).toFixed(1)}</span>
                    <span className="speed-unit">km/h</span>
                </div>
                <div className={`status-badge ${isRunning ? 'running' : 'paused'}`}>
                    {isRunning ? 'Walking' : 'Resting'}
                </div>
            </div>

            <div className="stats-subgrid">
                {/* Time Widget */}
                <div className="card mini-widget time">
                    <div className="widget-icon">⏱️</div>
                    <div className="mini-details">
                        <span className="mini-value">{formatTime(time)}</span>
                        <span className="mini-label">Time</span>
                    </div>
                </div>

                {/* Distance Widget */}
                <div className="card mini-widget distance">
                    <div className="widget-icon">📍</div>
                    <div className="mini-details">
                        <span className="mini-value">{formatDistance(distance)}</span>
                        <span className="mini-label">Dist</span>
                    </div>
                </div>

                {/* Steps Widget */}
                <div className="card mini-widget steps">
                    <div className="widget-icon">🐾</div>
                    <div className="mini-details">
                        <span className="mini-value">{steps.toLocaleString()}</span>
                        <span className="mini-label">Steps</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
