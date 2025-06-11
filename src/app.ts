// src/index.ts
import dotenv from 'dotenv';
dotenv.config();

import { serverApp } from './config/server/serverExpress';

const portServer = process.env.PORT || 5000;

serverApp.listen(portServer, () => {
  console.log(`🚀 Servidor Express corriendo en el puerto ${portServer}`);
});