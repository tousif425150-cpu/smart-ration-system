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
  url_prefix: string;
  env_vars_all: string[];
  service_info: {
    name: string;
    id: string;
    instance_id: string;
  };
  error?: string;
}

export const getScrubbedDbInfo = async (): Promise<DbDiagnostic> => {
  const url = process.env.DATABASE_URL || '';

  const env_vars_all = Object.keys(process.env).sort();

  return {
    present: !!url,
    url_prefix: url ? url.substring(0, 15) : 'NONE',
    hostname: '', // Will be filled below
    port: '',
    database: '',
    ssl: false,
    dnsResolved: false,
    tcpReachable: false,
    hostname_hint: '',
    env_vars_all,
    service_info: {
      name: process.env.RENDER_SERVICE_NAME || 'UNKNOWN',
      id: process.env.RENDER_SERVICE_ID || 'UNKNOWN',
      instance_id: process.env.RENDER_INSTANCE_ID || 'UNKNOWN'
    }
  };
};

// Simplified for quick diagnostic
export const getFullDiagnostic = async (): Promise<any> => {
  const info = await getScrubbedDbInfo();
  const url = process.env.DATABASE_URL || '';

  if (url) {
    const match = url.match(/@([^:/]+)(?::(\d+))?\/([^?]+)/);
    if (match) {
      info.hostname = match[1];
      info.port = match[2] || '3306';
      info.database = match[3];
      info.ssl = url.includes('ssl-mode=REQUIRED');

      const is_internal = info.hostname.includes('.i.');
      info.hostname_hint = `${info.hostname.substring(0, 5)}...${is_internal ? 'INTERNAL' : 'PUBLIC'}...${info.hostname.slice(-4)}`;

      try {
        await lookupPromise(info.hostname);
        info.dnsResolved = true;

        info.tcpReachable = await new Promise<boolean>((resolve) => {
          const s = new net.Socket();
          s.setTimeout(3000);
          s.on('connect', () => { s.destroy(); resolve(true); })
           .on('error', () => resolve(false))
           .on('timeout', () => { s.destroy(); resolve(false); })
           .connect(parseInt(info.port), info.hostname);
        });
      } catch (e) {}
    }
  }

  return info;
};
