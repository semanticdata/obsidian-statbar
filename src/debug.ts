// Debug utility for conditional logging

export let DEBUG_MODE = false; // Set to true to enable debug logs

export function debugLog(...args: any[]) {
    if (DEBUG_MODE) {
        // eslint-disable-next-line no-console
        console.log(...args);
    }
}
