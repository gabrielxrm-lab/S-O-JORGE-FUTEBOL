import app from '../server.js';
import express from 'express';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

export default function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (error) {
    console.error('Critical Error in Serverless Function:', error);
    res.status(500).json({ error: 'Critical Serverless Error', details: String(error) });
  }
}