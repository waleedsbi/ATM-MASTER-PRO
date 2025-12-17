const { PrismaClient } = require('@prisma/client');

let prismaInstance = null;

function getPrismaClient() {
  if (prismaInstance) {
    return prismaInstance;
  }

  prismaInstance = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });

  return prismaInstance;
}

module.exports = {
  get prisma() {
    return getPrismaClient();
  },
  getPrismaClient,
};
