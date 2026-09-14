import { config } from '../config';
import net from 'net';
import dns from 'dns';
import fs from 'fs';
import path from 'path';
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
  dot_env_exists: boolean;
  node_version: string;
  process_cwd: string;
  error?: string;
  public_host_check?: {
    resolved: boolean;
    reachable: boolean;
  };
}

export const getScrubbedDbInfo = async (): Promise<DbDiagnostic> => {
  const url = process.env.DATABASE_URL || '';

  const env_vars_found = Object.keys(process.env).filter(key =>
    key.toUpperCase().includes('DATABASE') ||
    key.toUpperCase().includes('DB_') ||
    key.toUpperCase().includes('URL')
  );

  const dot_env_exists = fs.existsSync(path.join(process.cwd(), '.env'));
  const node_version = process.version;
  const process_cwd = process.cwd();

  const public_host = 'mysql-33e0f80b-tousif425150-9b2d.aivencloud.com';
  let public_host_check = { resolved: false, reachable: false };

  // Check public host independently
  try {
    await lookupPromise(public_host);
    public_host_check.resolved = true;
    public_host_check.reachable = await new Promise<boolean>((resolve) => {
      const s = new net.Socket();
      s.setTimeout(3000);
      s.on('connect', () => { s.destroy(); resolve(true); })
       .on('error', () => resolve(false))
       .on('timeout', () => { s.destroy(); resolve(false); })
       .connect(24560, public_host);
    });
  } catch (e) {}

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
      env_vars_found,
      dot_env_exists,
      node_version,
      process_cwd,
      public_host_check
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
        dot_env_exists,
        node_version,
        process_cwd,
        public_host_check,
        error: 'Regex failed to parse URL'
      };
    }

    const hostname = match[1];
    const port = match[2] || '3306';
    const database = match[3];
    const ssl = url.includes('ssl-mode=REQUIRED') || url.includes('sslmode=require');

    // More descriptive hint: "mysql-...i.aivencloud.com" vs "mysql-...aivencloud.com"
    const is_internal = hostname.includes('.i.');
    const hostname_hint = `${hostname.substring(0, 8)}...${is_internal ? '.i.' : '.'}${hostname.split('.').slice(-2).join('.')}`;

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
      env_vars_found,
      dot_env_exists,
      node_version,
      process_cwd,
      public_host_check
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
      dot_env_exists,
      node_version,
      process_cwd,
      public_host_check,
      error: e.message
    };
  }
};
