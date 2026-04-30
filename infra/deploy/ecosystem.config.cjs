module.exports = {
  apps: [
    {
      name: 'letget-web',
      script: 'apps/web/.next/standalone/apps/web/server.js',
      env: { NODE_ENV: 'production', PORT: 3040 },
      max_memory_restart: '500M',
      error_file: '~/logs/letget/web.err.log',
      out_file: '~/logs/letget/web.out.log',
    },
    {
      name: 'letget-bot',
      script: 'apps/bot/dist/index.js',
      env: { NODE_ENV: 'production', PORT: 3041 },
      max_memory_restart: '300M',
      error_file: '~/logs/letget/bot.err.log',
      out_file: '~/logs/letget/bot.out.log',
    },
  ],
};
