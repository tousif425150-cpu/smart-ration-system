import { config } from '../config';
import net from 'net';
import dns from 'dns';
import { promisify } from 'util';

const lookupPromise = promisify(dns.lookup);

export interface DbDiagnostic {
  present: boolean;
  hostname: string;
  port: string;
  database: string;
  ssl: boolean;
  dnsResolved: boolean;
  tcpReachable: boolean;
  hostname_hint: string;
  env_vars_found: string[];
  url_length: number;
  error?: string;
}

export const getScrubbedDbInfo = async (): Promise<DbDiagnostic> => {
  const url = process.env.DATABASE_URL || '';

  // Find all keys that might contain a DB URL
  const env_vars_found = Object.keys(process.env).filter(key =>
    key.toUpperCase().includes('DATABASE') ||
    key.toUpperCase().includes('DB_') ||
    key.toUpperCase().includes('URL')
  );

  if (!url) {
    return {
      present: false,
      hostname: 'MISSING',
      port: 'MISSING',
      database: 'MISSING',
      ssl: false,
      dnsResolved: false,
      tcpReachable: false,
      hostname_hint: 'NONE',
      url_length: 0,
      env_vars_found
    };
  }

  try {
    const match = url.match(/@([^:/]+)(?::(\d+))?\/([^?]+)/);
    if (!match) {
      return {
        present: true,
        hostname: 'INVALID_FORMAT',
        port: 'INVALID_FORMAT',
        database: 'INVALID_FORMAT',
        ssl: false,
        dnsResolved: false,
        tcpReachable: false,
        hostname_hint: 'INVALID',
        url_length: url.length,
        env_vars_found,
        error: 'Regex failed to parse URL'
      };
    }

    const hostname = match[1];
    const port = match[2] || '3306';
    const database = match[3];
    const ssl = url.includes('ssl-mode=REQUIRED') || url.includes('sslmode=require');

    const hostname_hint = hostname.length > 8
      ? hostname.substring(0, 3) + '...' + hostname.substring(hostname.length - 3)
      : hostname;

    let dnsResolved = false;
    let tcpReachable = false;

    try {
      await lookupPromise(hostname);
      dnsResolved = true;
    } catch (e) {
      dnsResolved = false;
    }

    if (dnsResolved) {
      tcpReachable = await new Promise<boolean>((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(5000);
        socket
          .on('connect', () => {
            socket.destroy();
            resolve(true);
          })
          .on('error', () => {
            resolve(false);
          })
          .on('timeout', () => {
            socket.destroy();
            resolve(false);
          })
          .connect(parseInt(port), hostname);
      });
    }

    return {
      present: true,
      hostname,
      port,
      database,
      ssl,
      dnsResolved,
      tcpReachable,
      hostname_hint,
      url_length: url.length,
      env_vars_found
    };
  } catch (e: any) {
    return {
      present: true,
      hostname: 'ERROR',
      port: 'ERROR',
      database: 'ERROR',
      ssl: false,
      dnsResolved: false,
      tcpReachable: false,
      hostname_hint: 'ERROR',
      url_length: url.length,
      env_vars_found,
      error: e.message
    };
  }
};
