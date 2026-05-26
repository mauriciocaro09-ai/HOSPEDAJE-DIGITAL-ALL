const { execSync } = require('child_process');

const DEFAULT_PORT = 3000;
const rawPort = process.argv[2] || process.env.PORT || DEFAULT_PORT;
const port = Number(rawPort);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(`Puerto invalido: ${rawPort}`);
    process.exit(1);
}

const unique = (values) => Array.from(new Set(values));

function getPidsOnWindows(targetPort) {
    try {
        const output = execSync(`netstat -ano -p tcp | findstr :${targetPort}`, { encoding: 'utf8' });

        const pids = output
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => line.split(/\s+/))
            .filter((parts) => {
                if (parts.length < 5) return false;
                const localAddress = parts[1];
                const state = parts[3];
                return localAddress.endsWith(`:${targetPort}`) && state === 'LISTENING';
            })
            .map((parts) => Number(parts[4]))
            .filter((value) => Number.isInteger(value) && value > 0);

        return unique(pids);
    } catch {
        return [];
    }
}

function getPidsOnUnix(targetPort) {
    try {
        const output = execSync(`lsof -ti tcp:${targetPort}`, { encoding: 'utf8' });
        return unique(
            output
                .split(/\r?\n/)
                .map((line) => Number(line.trim()))
                .filter((value) => Number.isInteger(value) && value > 0)
        );
    } catch {
        return [];
    }
}

function killPidOnWindows(pid) {
    execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
}

function killPidOnUnix(pid) {
    execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
}

const pids = process.platform === 'win32' ? getPidsOnWindows(port) : getPidsOnUnix(port);

if (pids.length === 0) {
    console.log(`No hay procesos escuchando en el puerto ${port}`);
    process.exit(0);
}

const kill = process.platform === 'win32' ? killPidOnWindows : killPidOnUnix;

const killed = [];
const failed = [];

pids.forEach((pid) => {
    try {
        kill(pid);
        killed.push(pid);
    } catch {
        failed.push(pid);
    }
});

if (killed.length > 0) {
    console.log(`Procesos detenidos en puerto ${port}: ${killed.join(', ')}`);
}

if (failed.length > 0) {
    console.error(`No se pudieron detener estos procesos: ${failed.join(', ')}`);
    process.exit(1);
}
