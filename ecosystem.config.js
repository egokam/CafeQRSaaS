module.exports = {
  apps: [
    {
      name: "serveqr",
      cwd: __dirname,
      script: "server-entry.cjs",
      env: {
        PORT: 3000,
        HOSTNAME: "0.0.0.0"
      }
    }
  ]
};
