import {createServer} from 'http';
import {WebSocket, WebSocketServer} from 'ws';
import {readFile} from 'fs/promises';
import 'dotenv/config'


const httpServer = createServer(async (req, res) => {
    const url = req.url
    //res.writeHead(200)
    //res.end('Websocket server running')
    try {
        if (url === '/rss') {
            // should use .env, but node does not like
            const file = await readFile(`./changelogs.xml`)
            res.writeHead(200, {'Content-Type': 'application/rss+xml; charset=utf-8'})
            res.end(file)
        }
    } catch (err) {
        console.error('Could not read changelogs', err)
        res.writeHead(500)
        res.end('No feed.')
    }

})

const wss = new WebSocketServer({server: httpServer})
const clients = new Map()
const voxels = new Map()

function broadcastClients(wss, payload) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload)
        }
    })
}

wss.on('connection', (ws, request) => {
    console.log('Client connected')
    ws.on('message', (data) => {
        const message = JSON.parse(data)
        //console.log(message)
        if (message.type === 'join') {
            const username = message.username ? message.username : 'visitor'
            clients.set(ws, {
                username: username,
                coordinates: message.coordinates
            })

            const existingClients = Array.from(clients.entries())
                .filter(([client]) => client !== ws)
                .map(([, data]) => data)

            const existingVoxels = Array.from(voxels.entries())
                .map(([key, color]) => {
                    const [x, y, z] = key.split(',')
                    return {
                        x: x,
                        y: y,
                        z: z,
                        color: color
                    }
                })

            const existingPayload = JSON.stringify({
                type: 'users',
                users: existingClients,
                voxels: existingVoxels
            })

            ws.send(existingPayload)

            const payload = JSON.stringify({
                type: 'userJoin',
                username: username,
                coordinates: message.coordinates
            })

            wss.clients.forEach((client) => {
                if (ws !== client && client.readyState === WebSocket.OPEN) {
                    client.send(payload)
                }
            })
        } else if (message.type === 'voxelUpdate') {
            const {x, y, z, color} = message.data
            voxels.set(toKey(x, y, z), color)
            const payload = JSON.stringify({
                type: 'voxelUpdate',
                data: message.data
            })
            broadcastClients(wss, payload)
        } else if (message.type === 'voxelDelete') {
            const payload = JSON.stringify({
                type: 'voxelDelete',
                data: message.data
            })
            broadcastClients(wss, payload)
        } else if (message.type === 'cameraUpdate') {
            const payload = JSON.stringify({
                type: 'cameraUpdate',
                username: clients.get(ws).username,
                data: message.data
            })
            wss.clients.forEach((client) => {
                if (ws !== client && client.readyState === WebSocket.OPEN) {
                    client.send(payload)
                }
            })
        }
    })

    ws.on('close', () => {
        console.log(`Websocket connection with user ${clients.get(ws).username} has been closed.`)

        const payload = JSON.stringify({
            type: 'userDisconnected',
            username: clients.get(ws).username
        })

        clients.delete(ws)

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payload)
            }
        })

    })

    ws.on('error', () => {

    })
})

function toKey(x, y, z) {
    return `${x},${y},${z}`
}

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})