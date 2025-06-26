// Debug utility for conditional logging

export const DEBUG_MODE = false; // Set to true to enable debug logs

export function debugLog(...args: unknown[]) {
    if (DEBUG_MODE) {
         
        console.log(...args);
    }
}
