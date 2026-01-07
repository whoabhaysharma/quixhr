import winston from 'winston';
import 'winston-daily-rotate-file';
import { config } from '@/config';
import path from 'path';

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const level = () => {
    return config.logging.level;
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

// Custom format for JSON logging
const jsonFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.json()
);

// Custom format for Console logging (Human Readable)
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => {
            const { timestamp, level, message, ...meta } = info;
            const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
            return `${timestamp} ${level}: ${message} ${metaString}`;
        }
    ),
);

const transports = [
    // Console transport
    new winston.transports.Console({
        format: consoleFormat,
    }),

    // Daily Rotate File transport
    new winston.transports.DailyRotateFile({
        filename: path.join(config.logging.dir, '%DATE%-app.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '1d', // Keep logs for 1 day as requested
        format: jsonFormat,
        level: level(), // Log everything from the configured level
    }),
];

export const Logger = winston.createLogger({
    level: level(),
    levels,
    transports,
});
