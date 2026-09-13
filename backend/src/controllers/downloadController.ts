import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

export const getDownloadPage = (req: Request, res: Response) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Download Smart Ration App</title>
        <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f0f2f5; }
            .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
            h1 { color: #1890ff; margin-bottom: 0.5rem; }
            p { color: #666; margin-bottom: 2rem; }
            .btn { background: #1890ff; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 1.1rem; }
            .btn:hover { background: #40a9ff; }
            .info { margin-top: 2rem; font-size: 0.8rem; color: #999; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>🌾 Smart Ration System</h1>
            <p>Download the official Android application</p>
            <a href="/api/v1/download/apk" class="btn">Download APK</a>
            <div class="info">Version 1.0.0 | production-ready</div>
        </div>
    </body>
    </html>
  `;
  res.send(html);
};

export const downloadApk = (req: Request, res: Response) => {
  const apkPath = path.resolve(__dirname, '../../uploads/app-release.apk');

  if (fs.existsSync(apkPath)) {
    res.download(apkPath, 'SmartRation.apk');
  } else {
    res.status(404).send('APK file not found on server. Please upload app-release.apk to the uploads folder.');
  }
};
