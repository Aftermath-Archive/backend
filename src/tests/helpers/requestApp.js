const { IncomingMessage, ServerResponse } = require('node:http');
const { Duplex } = require('node:stream');
const { stringify } = require('node:querystring');

/**
 * Send requests through the complete Express pipeline using native HTTP streams.
 * This avoids opening a port, so route tests also run in restricted environments.
 */
function requestApp(app) {
    const methods = {};
    for (const method of ['get', 'post', 'patch', 'delete', 'options']) {
        methods[method] = (url) => {
            const headers = {};
            let body;
            let query = '';
            const request = {
                set(name, value) {
                    headers[name.toLowerCase()] = value;
                    return request;
                },
                send(value) {
                    body = JSON.stringify(value);
                    return request;
                },
                query(value) {
                    query = stringify(value);
                    return request;
                },
                then(resolve, reject) {
                    return new Promise((done, fail) => {
                        const chunks = [];
                        const socket = new Duplex({
                            read() {},
                            write(chunk, encoding, callback) {
                                chunks.push(Buffer.from(chunk));
                                callback();
                            },
                        });
                        const req = new IncomingMessage(socket);
                        req.method = method.toUpperCase();
                        req.url = query ? `${url}?${query}` : url;
                        req.complete = true;
                        req.headers = { ...headers };
                        if (body !== undefined) {
                            req.headers['content-type'] = 'application/json';
                            req.headers['content-length'] = String(
                                Buffer.byteLength(body)
                            );
                        }
                        const res = new ServerResponse(req);
                        res.assignSocket(socket);
                        socket.on('error', fail);
                        res.on('error', fail);
                        res.on('finish', () => {
                            const raw = Buffer.concat(chunks).toString();
                            const content = raw.slice(
                                raw.indexOf('\r\n\r\n') + 4
                            );
                            try {
                                done({
                                    status: res.statusCode,
                                    headers: res.getHeaders(),
                                    body: content
                                        ? String(res.getHeader('content-type')).includes('application/json')
                                            ? JSON.parse(content)
                                            : content
                                        : {},
                                });
                            } catch (error) {
                                fail(error);
                            } finally {
                                socket.destroy();
                            }
                        });
                        if (body !== undefined) req.push(body);
                        req.push(null);
                        app.handle(req, res);
                    }).then(resolve, reject);
                },
            };
            return request;
        };
    }
    return methods;
}

module.exports = requestApp;
