export let isDebug = process.argv.includes('--debug');

export function logDebug(message: string) {
    if (isDebug) {
        console.log(message);
    }
}
