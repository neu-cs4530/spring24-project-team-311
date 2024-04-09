import Express from 'express';
import * as http from 'http';
import CORS from 'cors';
import { AddressInfo } from 'net';
import swaggerUi from 'swagger-ui-express';
import { ValidateError } from 'tsoa';
import fs from 'fs/promises';
import { Server as SocketServer } from 'socket.io';
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { RegisterRoutes } from '../generated/routes';
import TownsStore from './lib/TownsStore';
import { ClientToServerEvents, ServerToClientEvents } from './types/CoveyTownSocket';
import { TownsController } from './town/TownsController';
import { logError } from './Utils';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCIOW_Yip0CHd5hJe5mjO674dpm40YOeTk',
  authDomain: 'covey-town-pets.firebaseapp.com',
  projectId: 'covey-town-pets',
  storageBucket: 'covey-town-pets.appspot.com',
  messagingSenderId: '209075765212',
  appId: '1:209075765212:web:530a8d8586598b760cd919',
  databaseURL: 'https://covey-town-pets-default-rtdb.firebaseio.com',
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
// eslint-disable-next-line import/prefer-default-export
export const database = getDatabase(firebaseApp);

// Create the server instances
const app = Express();
app.use(CORS());
const server = http.createServer(app);
const socketServer = new SocketServer<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: { origin: '*' },
});

// Initialize the towns store with a factory that creates a broadcast emitter for a town
TownsStore.initializeTownsStore((townID: string) => socketServer.to(townID));

// Connect the socket server to the TownsController. We use here the same pattern as tsoa
// (the library that we use for REST), which creates a new controller instance for each request
socketServer.on('connection', socket => {
  // new TownsController().joinTown(socket);
  new TownsController().joinTown(socket);
});

// Set the default content-type to JSON
app.use(Express.json());

// Add a /docs endpoint that will display swagger auto-generated documentation
app.use('/docs', swaggerUi.serve, async (_req: Express.Request, res: Express.Response) => {
  const swaggerSpec = await fs.readFile('../shared/generated/swagger.json', 'utf-8');
  return res.send(swaggerUi.generateHTML(JSON.parse(swaggerSpec)));
});

// Register the TownsController routes with the express server
RegisterRoutes(app);

// Add a middleware for Express to handle errors
app.use(
  (
    err: unknown,
    _req: Express.Request,
    res: Express.Response,
    next: Express.NextFunction,
  ): Express.Response | void => {
    if (err instanceof ValidateError) {
      return res.status(422).json({
        message: 'Validation Failed',
        details: err?.fields,
      });
    }
    if (err instanceof Error) {
      logError(err);
      return res.status(500).json({
        message: 'Internal Server Error',
      });
    }

    return next();
  },
);

// Start the configured server, defaulting to port 8081 if $PORT is not set
server.listen(process.env.PORT || 8081, () => {
  const address = server.address() as AddressInfo;
  // eslint-disable-next-line no-console
  console.log(`Listening on ${address.port}`);
  if (process.env.DEMO_TOWN_ID) {
    TownsStore.getInstance().createTown(process.env.DEMO_TOWN_ID, false);
  }
});
