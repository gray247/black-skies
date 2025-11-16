Status: Deferred
Version: 0.5.0
Last Reviewed: 2025-11-15

# Voice Notes & Transcription Plan (Deferred)

> **Status:** This feature is scoped but **not** shipping in v1.1. The plan remains for future phases; renderer and services do not expose voice note recording/transcription today.

## Objectives
- Enable creators to record voice notes, transcribe them into scene annotations, and manage audio assets within budget constraints.
- Ensure privacy controls and local-first storage while allowing optional cloud transcription.

## Functional Scope (future)
1. **Record**: capture microphone input, show waveform + timer, allow pause/resume.
2. **Playback**: inline player per note with seek, speed control, delete.
3. **Transcription**: convert audio to text via local model or external API (configurable).
4. **Editing & Linking**: edit transcripts, attach to scenes, and push into critique or rewrite workflows.

## Architecture (future)
- Electron renderer handles recording via `MediaRecorder`; stores temporary chunks in app data folder.
- Main process exposes IPC (`voice-notes:*`) to manage file persistence, metadata, and playback.
- Services side adds `/api/v1/voice/transcribe` endpoint for offline transcription or bridging to external provider.
- Budget module tracks transcription spend (`transcription_usd`) similar to draft/critique costs.

## Data Model
- `VoiceNote` JSON:
  - `note_id` (uuid), `project_id`, `scene_id` (optional)
  - `created_at`, `duration_ms`, `file_path`, `transcription_path`
  - `status`: `recorded | transcribed | failed`
  - `transcription`: `{ text, confidence, segments[] }`
  - `cost_usd`, `provider` metadata
- Stored under `history/voice_notes/{note_id}/` with audio (`.ogg` by default) and transcript (`.json`).

## Pipeline Tasks
1. **Recording** (renderer)
   - UI component prompts for mic permission.
   - Save raw chunks to temp folder; on stop, hand off to main process for persistence.
   - Main process normalizes to target format (Opus/OGG) using FFmpeg (packaged binary).
2. **Metadata Persistence**
   - Create metadata entry; append to `history/voice_notes/index.json`.
   - Generate waveform preview data for quick rendering.
3. **Transcription Options**
   - **Local**: integrate whisper.cpp or Vosk via bundled binaries; respects `BLACKSKIES_TRANSCRIPTION_ENABLED`.
   - **External**: configurable provider (OpenAI Whisper API) with per-minute cost tracking.
   - Endpoint accepts audio path, language, diarization flag; returns `VoiceNote.transcription`.
4. **Budget Integration**
   - Before transcription, estimate cost (duration * rate). Use `classify_budget` to guard against limit breaches.
   - On success, persist spend via `persist_project_budget`.
5. **Privacy Controls**
   - Opt-in toggle in settings to allow external upload; default local only.
   - Encryption at rest: optional AES encryption of audio files using project key (future work).
   - Deletion wipes audio + transcript and removes metadata entry.
6. **Editing & UI**
   - Transcript editor with timestamps; allow pushing selected text into DraftEditor as notes.
   - Link notes to scenes (store `scene_id`), show icon in scene list.
   - Provide playback within editor with highlight following transcript segments.

## API Surface
- `POST /api/v1/voice/transcribe`: `{project_id, note_id, provider}` returns transcription payload + cost.
- `GET /api/v1/voice/notes?project_id=`: list metadata.
- `DELETE /api/v1/voice/notes/{note_id}`: remove assets.
- IPC handlers mirror these operations for desktop UI.

## Task Breakdown
1. **Foundation**
   - Implement file storage service in main process.
   - Add metadata schemas and persistence helpers.
2. **Recording UI**
   - Build React hooks/components for recording, playback, waveform preview.
3. **Transcription Engine**
   - Integrate local transcription binary; wire FastAPI route.
   - Add provider abstraction supporting external API.
   - Update budgeting to track transcription spend.
4. **Transcript Editor**
   - Build editing UI, allow linking to scenes and exporting to notes.
   - Surface status badges (`Pending`, `Transcribed`, `Failed`).
5. **Settings & Permissions**
   - Add settings page toggles for microphone permissions, external provider terms, retention window.
   - Document privacy policy impacts in `policies.md`.
6. **Testing**
   - Unit tests for metadata persistence and budgeting.
   - Integration tests for transcription endpoint (mock local engine).
   - E2E flow covering record → transcribe → attach to scene.

## Open Questions
- Do we require offline-only deployment? Decide on bundling whisper.cpp vs. optional download.
- How to handle large audio (>30 min) — chunking vs. rejecting.
- Should voice notes participate in revision streak analytics? (Future enhancement).
