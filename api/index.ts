import app from '../server';

console.log('API Function Booting...');

export const config = {
  api: {
    bodyParser: false,
  },
};

export default app;
