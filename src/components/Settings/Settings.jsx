import './Settings.css';
import {
    SENSITIVITY_HIGH,
    SENSITIVITY_MEDIUM,
    SENSITIVITY_LOW,
    UNIT_METRIC,
    UNIT_IMPERIAL
} from '../../utils/protocol';

export function Settings({
    params,
    onSensitivityChange,
    onAutoStartChange,
    onUnitChange,
    onMaxSpeedChange
}) {
    return (
        <div className="settings-container card">
            <h2 className="title-section">Device Settings</h2>

            <div className="settings-grid">
                <div className="setting-item">
                    <div className="setting-info">
                        <span className="setting-title">Auto Start</span>
                        <span className="setting-desc">Starts when you step on</span>
                    </div>
                    <label className="toggle-label">
                        <input
                            type="checkbox"
                            checked={params.startMode === 1}
                            onChange={(e) => onAutoStartChange(e.target.checked)}
                        />
                        <span className="toggle-switch"></span>
                    </label>
                </div>

                <div className="setting-item">
                    <div className="setting-info">
                        <span className="setting-title">Sensitivity</span>
                        <span className="setting-desc">Automatic mode response</span>
                    </div>
                    <div className="options-group">
                        <button
                            className={`option-btn ${params.sensitivity === SENSITIVITY_LOW ? 'active' : ''}`}
                            onClick={() => onSensitivityChange(SENSITIVITY_LOW)}
                        >
                            Low
                        </button>
                        <button
                            className={`option-btn ${params.sensitivity === SENSITIVITY_MEDIUM ? 'active' : ''}`}
                            onClick={() => onSensitivityChange(SENSITIVITY_MEDIUM)}
                        >
                            Med
                        </button>
                        <button
                            className={`option-btn ${params.sensitivity === SENSITIVITY_HIGH ? 'active' : ''}`}
                            onClick={() => onSensitivityChange(SENSITIVITY_HIGH)}
                        >
                            High
                        </button>
                    </div>
                </div>

                <div className="setting-item">
                    <div className="setting-info">
                        <span className="setting-title">Units</span>
                        <span className="setting-desc">Measurement system</span>
                    </div>
                    <div className="options-group">
                        <button
                            className={`option-btn ${params.unit === UNIT_METRIC ? 'active' : ''}`}
                            onClick={() => onUnitChange(UNIT_METRIC)}
                        >
                            KM
                        </button>
                        <button
                            className={`option-btn ${params.unit === UNIT_IMPERIAL ? 'active' : ''}`}
                            onClick={() => onUnitChange(UNIT_IMPERIAL)}
                        >
                            MI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
