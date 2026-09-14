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
  error?: string;
}

export const getScrubbedDbInfo = async (): Promise<DbDiagnostic> => {
  const url = process.env.DATABASE_URL || '';
  if (!url) {
    return {
      present: false,
      hostname: 'MISSING',
      port: 'MISSING',
      database: 'MISSING',
      ssl: false,
      dnsResolved: false,
      tcpReachable: false
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
        error: 'Regex failed to parse URL'
      };
    }

    const hostname = match[1];
    const port = match[2] || '3306';
    const database = match[3];
    const ssl = url.includes('ssl-mode=REQUIRED') || url.includes('sslmode=require');

    let dnsResolved = false;
    let tcpReachable = false;

    // DNS Check
    try {
      await lookupPromise(hostname);
      dnsResolved = true;
    } catch (e) {
      dnsResolved = false;
    }

    // TCP Check
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
      tcpReachable
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
      error: e.message
    };
  }
};
