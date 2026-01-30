import './ModeSelector.css';
import { MODE_AUTO, MODE_MANUAL, MODE_SLEEP } from '../../utils/protocol';

const modes = [
    {
        id: MODE_SLEEP,
        name: 'Sleep',
        desc: 'Standby mode for safety'
    },
    {
        id: MODE_MANUAL,
        name: 'Manual',
        desc: 'Control speed manually'
    },
    {
        id: MODE_AUTO,
        name: 'Auto',
        desc: 'Adaptive speed control'
    },
];

export function ModeSelector({ currentMode, onModeChange }) {
    return (
        <div className="mode-selector-container card">
            <h2 className="title-section">Exercise Mode</h2>

            <div className="mode-buttons">
                {modes.map((mode) => (
                    <button
                        key={mode.id}
                        className={`mode-btn ${currentMode === mode.id ? 'active' : ''}`}
                        onClick={() => onModeChange(mode.id)}
                    >
                        <span className="mode-title">{mode.name}</span>
                        <span className="mode-description">{mode.desc}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
