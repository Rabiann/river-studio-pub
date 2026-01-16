# Preload Scripts

This directory contains preload scripts that bridge the Main and Renderer processes.

## Responsibilities

- Exposing safe APIs to the Renderer process using `contextBridge`.
- preventing direct Node.js access in the Renderer for security.

## Files

- `index.js`: The main preload script.
