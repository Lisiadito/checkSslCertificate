#!/usr/bin/env node

import * as https from 'https'
import { TLSSocket } from 'tls'
import yargs from 'yargs'

export interface UrlObject {
    hostname: string
    method?: 'HEAD' | 'GET'
    path?: string
    port?: number
}

export interface SslCheckResponse {
    error?: string
    originalObject: UrlObject
    valid: boolean
    validFrom?: string
    validUntil?: string
}

export default function checkSslCertificate(obj: UrlObject): Promise<SslCheckResponse> {
    return new Promise<SslCheckResponse>(resolve => {
        if (!obj.hostname || obj.hostname === '') {
            resolve({ error: 'Host missing', originalObject: obj, valid: false })
        }

        if (obj.hostname.slice(-1) === '/' || obj.hostname.match(/(?<!\?.+)(?<=\/)[\w-]+(?=[/\r\n?]|$)/)) {
            resolve({
                error: 'No trailing slashes or path in the hostname. Use path property instead.',
                originalObject: obj,
                valid: false
            })
        }

        const options = {
            hostname: obj.hostname,
            path: obj.path || '',
            port: obj.port || 443,
            method: obj.method || 'HEAD'
        }

        const req = https.request(options, res => {
            if (res.statusCode !== 200) {
                resolve({ error: (res.statusCode || '').toString(), originalObject: obj, valid: false })
            }

            const connection = res.connection as TLSSocket
            const validFrom = connection.getPeerCertificate().valid_from
            const validUntil = connection.getPeerCertificate().valid_to

            resolve({ valid: true, validFrom, validUntil, originalObject: obj })
        })

        req.on('error', error => {
            resolve({ valid: false, originalObject: obj, error: error.message })
        })

        req.end()
    })
}

const runningAsScript = !module.parent

if (runningAsScript) {
    const argv = yargs
        .usage(
            'Check if a SSL certificate for a given hostname is valid.\n' +
                'Usage: checkSslCertificate({hostname: "example.com"})'
        )
        .help('help')
        .option('hostname', {
            type: 'string',
            alias: 'h'
        })
        .option('method', {
            description: 'E.g. GET or HEAD',
            default: 'HEAD',
            alias: 'm'
        })
        .option('path', {
            type: 'string',
            description: 'E.g. /foo',
            default: ''
        })
        .option('port', {
            type: 'number',
            description: 'E.g. 443',
            default: 443
        })
        .demandOption('hostname').argv

    checkSslCertificate({
        hostname: argv.hostname,
        path: argv.path,
        port: argv.port,
        method: argv.method
    } as UrlObject).then(result => console.log(result))
}
