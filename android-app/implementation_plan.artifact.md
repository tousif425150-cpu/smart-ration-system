# Implementation Plan - Backend Production Fixes

Fix the backend production blockers to ensure the Render service becomes healthy and reachable.

## User Review Required

> [!IMPORTANT]
> - This plan modifies path resolution logic to be compatible with both development (TS) and production (JS/dist) environments.
> - It enables the `FACE_MODELS_DIR` environment variable to locate face-api models on Render.

## Proposed Changes

### [Backend API]

#### [MODIFY] [config/index.ts](file:///C:/Users/MY%20COMPUTER/Desktop/trae_projects/aap%20development%20verson1/smart-ration-system/backend/src/config/index.ts)
- Add `faceModelsDir` to the config object, reading from `process.env.FACE_MODELS_DIR`.

#### [MODIFY] [services/faceService.ts](file:///C:/Users/MY%20COMPUTER/Desktop/trae_projects/aap%20development%20verson1/smart-ration-system/backend/src/services/faceService.ts)
- Use `config.faceModelsDir` for model loading.
- Use `path.join(process.cwd(), ...)` for robust path resolution that works in both `src` and `dist`.

#### [MODIFY] [server.ts](file:///C:/Users/MY%20COMPUTER/Desktop/trae_projects/aap%20development%20verson1/smart-ration-system/backend/src/server.ts)
- Update `uploadDir` resolution using `path.join(process.cwd(), config.upload.dir)`.
- Wrap `fs.mkdirSync` in a try-catch block to prevent startup crashes.

---

## Verification Plan

### Automated Tests
- `npm run build` in the `backend` directory to ensure no compilation errors.

### Manual Verification
- Verify the production health endpoint: `https://smart-ration-api.onrender.com/api/v1/health/ping`.
- Check backend startup logs for "Face-api models loaded successfully" message.
