import App from './app';
import dotenv from 'dotenv';
import "reflect-metadata";
import gtfsFlexController from './controller/gtfs-flex-controller';
import healthController from './controller/health-controller';
import { environment } from './environment/environment';

//Load environment variables
dotenv.config()

const PORT: number = environment.appPort;

new App(
    [
        gtfsFlexController,
        healthController
    ],
    PORT,
).listen();
