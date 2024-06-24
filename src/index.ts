import 'module-alias/register';
import 'dotenv/config';
import 'i18n';
import { consoleError } from 'utils/log';
import client from './client';
import { init } from './utils/init';
init(client);

process.on('uncaughtException', (err) => consoleError('UNCAUGHT_EXCEPTION', err));
process.on('unhandledRejection', (err) => consoleError('UNHANDLED_REJECTION', err));
