# Main Process

This directory contains the code for the Electron Main Process.

## Responsibilities

- Application lifecycle management
- Native API access (File System, OS integration)
- Inter-Process Communication (IPC) handling
- Core business logic (Services)

## Structure

- `index.js`: Entry point of the application.
- `services/`: Modular business logic.
- `ipc/`: IPC handlers and channel definitions.
