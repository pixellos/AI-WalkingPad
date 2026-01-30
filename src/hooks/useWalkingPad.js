import { useState, useCallback, useRef, useEffect } from 'react';
import {
    WALKING_PAD_SERVICE_UUID,
    WALKING_PAD_READ_CHAR_UUID,
    WALKING_PAD_WRITE_CHAR_UUID,
    commands,
    parseMessage,
    MODE_MANUAL,
} from '../utils/protocol';

const QUERY_INTERVAL = 750; // Query status every 750ms
const SEND_INTERVAL = 50; // Send commands with 50ms delay between them
const RECONNECT_DELAY = 2000; // Wait 2 seconds before attempting reconnect
const MAX_RECONNECT_ATTEMPTS = 5; // Maximum number of reconnection attempts

// Local storage keys
const STORAGE_KEY_AUTO_RECONNECT = 'walkingpad_auto_reconnect';
const STORAGE_KEY_LAST_DEVICE = 'walkingpad_last_device';

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function useWalkingPad() {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [deviceName, setDeviceName] = useState('');
    const [error, setError] = useState(null);

    // Auto-reconnect settings
    const [autoReconnect, setAutoReconnectState] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY_AUTO_RECONNECT);
        return stored === null ? true : stored === 'true';
    });

    // WalkingPad status
    const [status, setStatus] = useState({
        state: 0,
        speed: 0,
        mode: 2, // Sleep mode
        time: 0,
        distance: 0,
        steps: 0,
        isRunning: false,
    });

    // Parameters
    const [params, setParams] = useState({
        maxSpeed: 60,
        startSpeed: 20,
        startMode: 0,
        sensitivity: 2,
        unit: 0,
    });

    // Records
    const [records, setRecords] = useState([]);

    // Refs for Bluetooth objects
    const deviceRef = useRef(null);
    const serverRef = useRef(null);
    const serviceRef = useRef(null);
    const writeCharRef = useRef(null);
    const readCharRef = useRef(null);
    const sendQueueRef = useRef([]);
    const queryIntervalRef = useRef(null);
    const sendIntervalRef = useRef(null);
    const queriedParamsRef = useRef(false);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef(null);
    const isManualDisconnectRef = useRef(false);

    // Set auto-reconnect preference
    const setAutoReconnect = useCallback((enabled) => {
        setAutoReconnectState(enabled);
        localStorage.setItem(STORAGE_KEY_AUTO_RECONNECT, String(enabled));
    }, []);

    // Handle incoming data
    const handleCharacteristicValueChanged = useCallback((event) => {
        const value = event.target.value;
        const parsed = parseMessage(value.buffer);

        if (parsed.type === 'info') {
            setStatus({
                state: parsed.state,
                speed: parsed.speed,
                mode: parsed.mode,
                time: parsed.time,
                distance: parsed.distance,
                steps: parsed.steps,
                isRunning: parsed.isRunning,
            });
        } else if (parsed.type === 'params') {
            queriedParamsRef.current = true;
            setParams({
                maxSpeed: parsed.maxSpeed,
                startSpeed: parsed.startSpeed,
                startMode: parsed.startMode,
                sensitivity: parsed.sensitivity,
                unit: parsed.unit,
            });
        } else if (parsed.type === 'record') {
            if (parsed.duration > 0) {
                setRecords(prev => [...prev, parsed]);
            }
        }
    }, []);

    // Send command to device
    const sendCommand = useCallback((command) => {
        sendQueueRef.current.push(command);
    }, []);

    // Process send queue
    const processSendQueue = useCallback(() => {
        if (!writeCharRef.current || sendQueueRef.current.length === 0) return;

        const command = sendQueueRef.current.shift();
        writeCharRef.current.writeValueWithoutResponse(command).catch(err => {
            console.error('Error sending command:', err);
        });
    }, []);

    // Query status periodically
    const tick = useCallback(() => {
        sendCommand(commands.query());
        if (!queriedParamsRef.current) {
            sendCommand(commands.queryParams());
        }
    }, [sendCommand]);

    // Clear all intervals and timeouts
    const clearTimers = useCallback(() => {
        clearInterval(queryIntervalRef.current);
        clearInterval(sendIntervalRef.current);
        clearTimeout(reconnectTimeoutRef.current);
    }, []);

    // Internal connect function that works with existing device
    const connectToDevice = useCallback(async (device, retryCount = 0) => {
        const MAX_RETRIES = 3;

        try {
            // Clear any existing intervals
            clearInterval(queryIntervalRef.current);
            clearInterval(sendIntervalRef.current);

            // Check if already connected, disconnect first
            if (device.gatt.connected) {
                console.log('Device already connected, using existing connection');
            } else {
                console.log('Connecting to GATT server...');
                // Connect to GATT server
                await device.gatt.connect();
            }

            // Small delay to let the connection stabilize
            await wait(500);

            // Verify connection is still active
            if (!device.gatt.connected) {
                throw new Error('Connection lost after connect');
            }

            const server = device.gatt;
            serverRef.current = server;

            console.log('Getting primary service...');
            // Get primary service with retry
            let service;
            try {
                service = await server.getPrimaryService(WALKING_PAD_SERVICE_UUID);
            } catch (serviceErr) {
                // If service fetch fails, the device might not be a WalkingPad
                if (serviceErr.message.includes('disconnected')) {
                    throw serviceErr; // Re-throw to trigger retry
                }
                throw new Error('Device does not appear to be a WalkingPad. Service not found.');
            }
            serviceRef.current = service;

            console.log('Getting characteristics...');
            // Get characteristics
            const readChar = await service.getCharacteristic(WALKING_PAD_READ_CHAR_UUID);
            const writeChar = await service.getCharacteristic(WALKING_PAD_WRITE_CHAR_UUID);

            readCharRef.current = readChar;
            writeCharRef.current = writeChar;

            console.log('Starting notifications...');
            // Subscribe to notifications
            await readChar.startNotifications();
            readChar.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);

            // Start query interval
            queryIntervalRef.current = setInterval(tick, QUERY_INTERVAL);

            // Start send interval
            sendIntervalRef.current = setInterval(processSendQueue, SEND_INTERVAL);

            // Reset reconnect attempts on successful connection
            reconnectAttemptsRef.current = 0;

            setIsConnected(true);
            setIsConnecting(false);
            setIsReconnecting(false);
            setError(null);

            console.log('Connected successfully!');

            // Query initial status after a small delay
            await wait(100);
            tick();

            return true;
        } catch (err) {
            console.error('Connection error:', err);

            // Retry logic for connection failures
            if (retryCount < MAX_RETRIES &&
                (err.message.includes('disconnected') ||
                    err.message.includes('GATT') ||
                    err.message.includes('Connection lost'))) {
                console.log(`Retrying connection (${retryCount + 1}/${MAX_RETRIES})...`);
                await wait(1000 * (retryCount + 1)); // Exponential backoff
                return connectToDevice(device, retryCount + 1);
            }

            throw err;
        }
    }, [handleCharacteristicValueChanged, tick, processSendQueue]);

    // Attempt to reconnect
    const attemptReconnect = useCallback(async () => {
        if (!deviceRef.current || isManualDisconnectRef.current) {
            return;
        }

        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
            setError(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
            setIsReconnecting(false);
            reconnectAttemptsRef.current = 0;
            return;
        }

        reconnectAttemptsRef.current += 1;
        setIsReconnecting(true);
        setError(null);

        console.log(`Reconnection attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`);

        try {
            await connectToDevice(deviceRef.current);
            console.log('Reconnection successful!');
        } catch (err) {
            console.error('Reconnection failed:', err);

            // Schedule next reconnect attempt
            reconnectTimeoutRef.current = setTimeout(() => {
                attemptReconnect();
            }, RECONNECT_DELAY * reconnectAttemptsRef.current); // Exponential backoff
        }
    }, [connectToDevice]);

    // Handle disconnection event
    const handleDisconnection = useCallback(() => {
        console.log('Device disconnected');

        clearTimers();
        sendQueueRef.current = [];
        queriedParamsRef.current = false;

        setIsConnected(false);
        setIsConnecting(false);

        // Attempt to reconnect if auto-reconnect is enabled and this wasn't a manual disconnect
        if (autoReconnect && !isManualDisconnectRef.current && deviceRef.current) {
            console.log('Auto-reconnect enabled, attempting to reconnect...');
            reconnectTimeoutRef.current = setTimeout(() => {
                attemptReconnect();
            }, RECONNECT_DELAY);
        }
    }, [autoReconnect, clearTimers, attemptReconnect]);

    // Connect to WalkingPad
    const connect = useCallback(async () => {
        if (!navigator.bluetooth) {
            setError('Web Bluetooth is not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        setIsConnecting(true);
        setError(null);
        isManualDisconnectRef.current = false;

        try {
            let device;

            // Try multiple filter strategies
            // Strategy 1: Filter by name prefixes (most common WalkingPad names)
            try {
                device = await navigator.bluetooth.requestDevice({
                    filters: [
                        { namePrefix: 'WalkingPad' },
                        { namePrefix: 'walkingpad' },
                        { namePrefix: 'KS-' },  // Kingsmith prefix
                        { namePrefix: 'ks-' },
                        { namePrefix: 'R1' },   // WalkingPad R1 models
                        { namePrefix: 'r1' },   // lowercase - user confirmed "r1 pro"
                        { namePrefix: 'R2' },
                        { namePrefix: 'r2' },
                        { namePrefix: 'A1' },
                        { namePrefix: 'a1' },
                        { namePrefix: 'C1' },
                        { namePrefix: 'c1' },
                        { namePrefix: 'C2' },
                        { namePrefix: 'c2' },
                        { namePrefix: 'X21' },
                        { namePrefix: 'x21' },
                        { namePrefix: 'P1' },
                        { namePrefix: 'p1' },
                    ],
                    optionalServices: [WALKING_PAD_SERVICE_UUID],
                });
            } catch (filterErr) {
                // If user cancels or no devices found with filters, they can try again
                // The error will be caught by the outer try/catch
                throw filterErr;
            }

            deviceRef.current = device;
            setDeviceName(device.name || 'Unknown Device');

            // Save device name for display purposes
            localStorage.setItem(STORAGE_KEY_LAST_DEVICE, device.name || 'Unknown Device');

            // Handle disconnection
            device.addEventListener('gattserverdisconnected', handleDisconnection);

            await connectToDevice(device);

        } catch (err) {
            console.error('Connection error:', err);
            setError(err.message);
            setIsConnecting(false);
        }
    }, [connectToDevice, handleDisconnection]);

    // Connect with open device picker (shows all Bluetooth devices)
    const connectAny = useCallback(async () => {
        if (!navigator.bluetooth) {
            setError('Web Bluetooth is not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        setIsConnecting(true);
        setError(null);
        isManualDisconnectRef.current = false;

        try {
            // Use acceptAllDevices to show all nearby Bluetooth devices
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [WALKING_PAD_SERVICE_UUID],
            });

            deviceRef.current = device;
            setDeviceName(device.name || 'Unknown Device');

            // Save device name for display purposes
            localStorage.setItem(STORAGE_KEY_LAST_DEVICE, device.name || 'Unknown Device');

            // Handle disconnection
            device.addEventListener('gattserverdisconnected', handleDisconnection);

            await connectToDevice(device);

        } catch (err) {
            console.error('Connection error:', err);
            setError(err.message);
            setIsConnecting(false);
        }
    }, [connectToDevice, handleDisconnection]);

    // Disconnect from WalkingPad
    const disconnect = useCallback(() => {
        isManualDisconnectRef.current = true;
        reconnectAttemptsRef.current = 0;

        clearTimers();

        if (deviceRef.current?.gatt?.connected) {
            deviceRef.current.gatt.disconnect();
        }

        sendQueueRef.current = [];
        setIsConnected(false);
        setIsReconnecting(false);
        queriedParamsRef.current = false;
    }, [clearTimers]);

    // Cancel reconnection attempts
    const cancelReconnect = useCallback(() => {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectAttemptsRef.current = 0;
        setIsReconnecting(false);
        isManualDisconnectRef.current = true;
    }, []);

    // Control functions
    const setSpeed = useCallback((speed) => {
        sendCommand(commands.setSpeed(speed));
    }, [sendCommand]);

    const setMode = useCallback((mode) => {
        sendCommand(commands.setMode(mode));
    }, [sendCommand]);

    const start = useCallback(() => {
        if (status.mode === 2) { // Sleep mode
            sendCommand(commands.setMode(MODE_MANUAL));
        }
        sendCommand(commands.start());
    }, [status.mode, sendCommand]);

    const stop = useCallback(() => {
        sendCommand(commands.setMode(2)); // Sleep mode
    }, [sendCommand]);

    const setStartSpeed = useCallback((speed) => {
        sendCommand(commands.setStartSpeed(speed));
    }, [sendCommand]);

    const setSensitivity = useCallback((sensitivity) => {
        sendCommand(commands.setSensitivity(sensitivity));
    }, [sendCommand]);

    const setAutoStart = useCallback((enable) => {
        sendCommand(commands.setAutoStart(enable ? 1 : 0));
    }, [sendCommand]);

    const setMaxSpeed = useCallback((speed) => {
        sendCommand(commands.setMaxSpeed(speed));
    }, [sendCommand]);

    const setUnit = useCallback((unit) => {
        sendCommand(commands.setUnit(unit));
    }, [sendCommand]);

    // Compatibility check
    const apiSupport = {
        bluetooth: !!navigator.bluetooth,
        getDevices: !!navigator.bluetooth?.getDevices,
        watchAdvertisements: !!window.BluetoothDevice?.prototype?.watchAdvertisements,
    };

    // Try to auto-reconnect to previously paired device on mount
    const tryAutoReconnect = useCallback(async () => {
        const isEdge = navigator.userAgent.includes('Edg/');

        if (!navigator.bluetooth?.getDevices) {
            if (isEdge) {
                console.warn('Edge users: If auto-reconnect is missing, try enabling edge://flags/#enable-experimental-web-platform-features');
            }
            return false;
        }

        if (!autoReconnect || isManualDisconnectRef.current) {
            return false;
        }

        try {
            console.log('Attempting persistent auto-reconnect...');
            setIsReconnecting(true);
            setError(null);

            const devices = await navigator.bluetooth.getDevices();
            if (devices.length === 0) {
                console.log('No previously paired devices found in browser cache.');
                setIsReconnecting(false);
                return false;
            }

            // For now, try the first device that matches WalkingPad criteria
            const device = devices.find(d =>
                d.name?.toLowerCase().includes('walkingpad') ||
                d.name?.toLowerCase().includes('r1') ||
                d.name?.toLowerCase().includes('r2') ||
                d.name?.toLowerCase().includes('ks-')
            ) || devices[0];

            console.log('Targeting device for auto-reconnect:', device.name);

            // Function to handle the actual connection attempt
            const performConnection = async () => {
                try {
                    deviceRef.current = device;
                    setDeviceName(device.name || 'WalkingPad');
                    device.addEventListener('gattserverdisconnected', handleDisconnection);

                    await connectToDevice(device);
                    console.log('Auto-reconnect successful!');
                    return true;
                } catch (err) {
                    if (err.message.includes('in range') || err.message.includes('disconnected')) {
                        console.log(`Device "${device.name}" still not in range. waiting...`);

                        // Try again in 5 seconds if not manually canceled
                        if (!isManualDisconnectRef.current) {
                            reconnectTimeoutRef.current = setTimeout(performConnection, 5000);
                        }
                    } else {
                        throw err;
                    }
                    return false;
                }
            };

            // Use watchAdvertisements if available (Chrome 91+)
            if (device.watchAdvertisements) {
                console.log('Watching for advertisements from', device.name);
                try {
                    await device.watchAdvertisements();
                    const onAdv = async (event) => {
                        console.log('Advertisement received! Device is awake.');
                        device.removeEventListener('advertisementreceived', onAdv);
                        await performConnection();
                    };
                    device.addEventListener('advertisementreceived', onAdv);

                    // Also try connecting immediately just in case
                    performConnection();
                } catch (err) {
                    console.log('watchAdvertisements failed, falling back to polling:', err.message);
                    performConnection();
                }
            } else {
                // Fallback to polling every 5 seconds
                performConnection();
            }

            return true;
        } catch (err) {
            console.error('Auto-reconnect process failed:', err);
            setIsReconnecting(false);
            return false;
        }
    }, [autoReconnect, connectToDevice, handleDisconnection]);

    // Try auto-reconnect on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isConnected && !isConnecting) {
                tryAutoReconnect();
            }
        }, 1000); // Give browser a second to breathe

        return () => clearTimeout(timer);
    }, []);

    // Re-trigger auto-reconnect if it's enabled after being disabled
    useEffect(() => {
        if (autoReconnect && !isConnected && !isConnecting && !isReconnecting) {
            tryAutoReconnect();
        }
    }, [autoReconnect, isConnected, isConnecting, isReconnecting, tryAutoReconnect]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearTimers();
            if (deviceRef.current?.gatt?.connected) {
                deviceRef.current.gatt.disconnect();
            }
        };
    }, [clearTimers]);

    return {
        // Connection state
        isConnected,
        isConnecting,
        isReconnecting,
        deviceName,
        error,
        apiSupport,

        // Auto-reconnect
        autoReconnect,
        setAutoReconnect,
        cancelReconnect,
        reconnectAttempts: reconnectAttemptsRef.current,
        maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,

        // Status
        status,
        params,
        records,

        // Connection
        connect,
        connectAny,  // Fallback: show all Bluetooth devices
        disconnect,

        // Controls
        setSpeed,
        setMode,
        start,
        stop,
        setStartSpeed,
        setSensitivity,
        setAutoStart,
        setMaxSpeed,
        setUnit,
    };
}
