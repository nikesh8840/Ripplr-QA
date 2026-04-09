const fs = require('fs');
const net = require('net');
const { Client } = require('ssh2');
const mysql = require('mysql2/promise');
const config = require('../config/base.config');

let _tunnel = null;   // SSH client instance
let _server = null;   // net.Server for the local forward
let _pool   = null;   // mysql2 connection pool

/**
 * Opens the SSH tunnel and creates a MySQL connection pool.
 * Call once before any DB queries (e.g., in test.beforeAll).
 */
async function openTunnel() {
    const { ssh, mysql: mysqlCfg } = config.db;

    return new Promise((resolve, reject) => {
        const sshClient = new Client();

        const server = net.createServer((sock) => {
            sshClient.forwardOut(
                '127.0.0.1', ssh.localPort,
                mysqlCfg.host, mysqlCfg.port,
                (err, stream) => {
                    if (err) {
                        sock.end();
                        return;
                    }
                    sock.pipe(stream);
                    stream.pipe(sock);
                }
            );
        });

        server.on('error', (err) => {
            sshClient.end();
            reject(err);
        });

        server.listen(ssh.localPort, '127.0.0.1', () => {
            sshClient.connect({
                host: ssh.host,
                port: ssh.port,
                username: ssh.username,
                privateKey: fs.readFileSync(ssh.privateKeyPath),
                readyTimeout: 60000,
                keepaliveInterval: 10000,
            });
        });

        sshClient.on('ready', async () => {
            console.log(`SSH tunnel open: 127.0.0.1:${ssh.localPort} → ${mysqlCfg.host}:${mysqlCfg.port}`);
            _tunnel = sshClient;
            _server = server;

            _pool = mysql.createPool({
                host: '127.0.0.1',
                port: ssh.localPort,
                user: mysqlCfg.user,
                password: mysqlCfg.password,
                database: mysqlCfg.database,
                waitForConnections: true,
                connectionLimit: 5,
            });

            resolve(_pool);
        });

        sshClient.on('error', (err) => {
            server.close();
            reject(err);
        });
    });
}

/**
 * Closes the MySQL pool and SSH tunnel.
 * Call in test.afterAll.
 */
async function closeTunnel() {
    if (_pool) {
        await _pool.end();
        _pool = null;
    }
    if (_server) {
        _server.close();
        _server = null;
    }
    if (_tunnel) {
        _tunnel.end();
        _tunnel = null;
    }
    console.log('DB tunnel closed');
}

/**
 * Runs a query and returns all rows.
 * @param {string} sql   — parameterised SQL, e.g. 'SELECT * FROM orders WHERE id = ?'
 * @param {Array}  params — bound values
 */
async function query(sql, params = []) {
    if (!_pool) throw new Error('Tunnel not open — call openTunnel() first');
    const [rows] = await _pool.execute(sql, params);
    return rows;
}

/**
 * Runs a query and returns a single row (or null).
 */
async function queryOne(sql, params = []) {
    const rows = await query(sql, params);
    return rows[0] ?? null;
}

module.exports = { openTunnel, closeTunnel, query, queryOne };
