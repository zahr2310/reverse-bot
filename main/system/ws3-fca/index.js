"use strict";

/**
 * Compatibility adapter for the project's existing FCA import path.
 *
 * Keep consumers importing ../../system/ws3-fca unchanged while routing
 * login through @dongdev/fca-unofficial. The package exposes the same
 * login(loginData, options, callback) calling convention.
 *
 * Note: runtime API parity still needs verification against the bot's
 * command/event handlers before deploying this migration.
 */
const login = require("@dongdev/fca-unofficial");

module.exports = login;
