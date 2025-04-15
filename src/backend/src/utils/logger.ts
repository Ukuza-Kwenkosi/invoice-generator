import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

// If we're not in production, log to the console
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

export const logInvoiceGeneration = (req: any, success: boolean, error?: string) => {
    const logData = {
        timestamp: new Date().toISOString(),
        customerName: req.body.customerName,
        customerEmail: req.body.customerEmail,
        items: req.body.items,
        success,
        error,
        ip: req.ip,
        userAgent: req.get('user-agent')
    };

    if (success) {
        logger.info('Invoice generated successfully', logData);
    } else {
        logger.error('Invoice generation failed', logData);
    }
};

export default logger; 