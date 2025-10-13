module.exports = {
  apps: [
    {
      name: "ecopath-backend",
      cwd: "./",
      script: "dist/index.js",
      instances: 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      max_memory_restart: "512M",
      autorestart: true,
      watch: false,
    },
  ],
};
