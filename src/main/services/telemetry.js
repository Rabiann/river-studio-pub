/**
 * @fileoverview Telemetry Service (Deprecated)
 * 
 * This service previously collected resource usage and events.
 * It has been disabled to improve privacy and reduce overhead.
 */
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const os = require('os');

class TelemetryService {
    constructor() {
        this.events = [];
        this.metrics = [];
        // User data directory is safe for writing logs
        this.logPath = path.join(app.getPath('userData'), 'telemetry.json');
        this.flushInterval = null;
        this.isMonitoring = false;
    }

    // initialize the service
    init() {
        // Telemetry collection disabled
        // this.startResourceMonitoring();
        // this.flushInterval = setInterval(() => this.flush(), 60000); // Flush every minute
    }

    trackEvent(eventName, properties = {}) {
        const event = {
            type: 'event',
            name: eventName,
            timestamp: new Date().toISOString(),
            properties,
        };
        this.events.push(event);
    }

    trackMetric(metricName, value, properties = {}) {
        const metric = {
            type: 'metric',
            name: metricName,
            timestamp: new Date().toISOString(),
            value,
            properties,
        };
        this.metrics.push(metric);
    }

    startResourceMonitoring() {
        // Disabled
    }

    async flush() {
        // Disabled
    }

    stop() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        this.flush(); // Final flush
    }
}

module.exports = new TelemetryService();
