import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Test setup: read DB credentials from local docker secret file.
// Real value never appears in source.
const secretFile = resolve(__dirname, '../../../infra/docker/db_password.txt');
const dbPwd = readFileSync(secretFile, 'utf-8').trim();

process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5440';
process.env.DB_NAME = 'letget';
process.env.DB_USER = 'letget';
process.env.DB_PASSWORD = dbPwd;
