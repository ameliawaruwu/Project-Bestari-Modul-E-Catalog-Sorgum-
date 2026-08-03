// PM2 ecosystem config — BESTARI Sorgum E-Catalog (FE + BE)
// Start:   pm2 start ecosystem.config.cjs
// Status:  pm2 status / pm2 logs
// Stop:    pm2 stop ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'bestari-be',
      cwd: './backend',
      script: './node_modules/.bin/tsx',
      args: 'src/index.ts',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
      },
      // 20203 backend; jangan start ulang otomatis berlebihan saat dev
      max_restarts: 10,
      restart_delay: 1000,
    },
    {
      name: 'bestari-fe',
      cwd: '.',
      script: './node_modules/.bin/vite',
      args: '--port=3000 --host=0.0.0.0',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
      },
      max_restarts: 10,
      restart_delay: 1000,
    },
  ],
};
