#!/usr/bin/env node

/**
 * Startup script for GazeQuest Adventures
 * Handles HTTPS setup for eye tracking
 */

import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startServer() {
  console.log('🎮 Starting GazeQuest Adventures...');

  try {
    // Create Vite development server
    const server = await createServer({
      root: __dirname,
      server: {
        port: 3000,
        host: 'localhost',
        open: true,
        // Start with HTTP, user can enable HTTPS later for eye tracking
        https: false
      },
      define: {
        __DEV__: true,
        __PROD__: false
      }
    });

    // Start the server
    await server.listen();

    console.log('\n✅ GazeQuest Adventures is running!');
    console.log('\n📍 Access the game at:');
    console.log('   🌐 http://localhost:3000');
    console.log('\n📋 Notes:');
    console.log('   • Use keyboard/mouse for navigation initially');
    console.log('   • For eye tracking, you\'ll need HTTPS');
    console.log('   • Camera permission required for eye tracking');
    console.log('\n🎯 To enable HTTPS for eye tracking:');
    console.log('   1. Stop the server (Ctrl+C)');
    console.log('   2. Run: npm run dev:https');
    console.log('\n🚀 Ready to play! Navigate with:');
    console.log('   • Arrow keys + Enter');
    console.log('   • Tab + Space/Enter');
    console.log('   • Mouse clicks');

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();