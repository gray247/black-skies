const defaultServicePort = 10000 + (process.pid % 20000);

export const SERVICE_PORT = Number(
  process.env.PLAYWRIGHT_SERVICE_PORT ??
    process.env.BLACKSKIES_E2E_PORT ??
    defaultServicePort,
);
