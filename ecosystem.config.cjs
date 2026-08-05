module.exports = {
  apps: [
    {
      name: 'bestari-be',
      cwd: './backend',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'src/index.ts',
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
      script: 'node_modules/vite/bin/vite.js',
      args: '--port=3000 --host=0.0.0.0',
      env: {
        NODE_ENV: 'development',
      },
      max_restarts: 10,
      restart_delay: 1000,
    },
  ],
};
