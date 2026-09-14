import { config } from '../config';

export const getScrubbedDbInfo = () => {
  const url = process.env.DATABASE_URL || '';
  if (!url) {
    return {
      present: false,
      hostname: 'MISSING',
      port: 'MISSING',
      database: 'MISSING',
      ssl: false
    };
  }

  try {
    // Basic regex to extract hostname and port without revealing credentials
    // mysql://user:pass@host:port/db
    const match = url.match(/@([^:/]+)(?::(\d+))?\/([^?]+)/);
    if (!match) {
      return {
        present: true,
        format: 'INVALID',
        url_start: url.substring(0, 10) + '...'
      };
    }

    return {
      present: true,
      hostname: match[1],
      port: match[2] || '3306',
      database: match[3],
      ssl: url.includes('ssl-mode=REQUIRED') || url.includes('sslmode=require')
    };
  } catch (e) {
    return {
      present: true,
      error: 'Failed to parse URL'
    };
  }
};
