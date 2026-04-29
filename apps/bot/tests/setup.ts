// Set defaults but don't override values already set by CI/env
process.env.DB_HOST ??= 'localhost';
process.env.DB_PORT ??= '5440';
process.env.DB_NAME ??= 'letget';
process.env.DB_USER ??= 'letget';
process.env.DB_PASSWORD ??= 'stub';
process.env.REDIS_HOST ??= 'localhost';
process.env.REDIS_PORT ??= '6382';
process.env.REDIS_DB ??= '0';
process.env.TELEGRAM_BOT_TOKEN ??= 'stub-token';
process.env.TELEGRAM_BOT_USERNAME ??= 'letget_bot';
process.env.TELEGRAM_USE_LONG_POLLING ??= 'true';
