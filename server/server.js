import {createServer} from 'http';
import {WebSocket, WebSocketServer} from 'ws';


const httpServer = createServer(async (req, res) => {
    const url = req.url
    res.writeHead(200)
    res.end('Websocket server running')
})

const wss = new WebSocketServer({server: httpServer})
const clients = new Map()

function broadcastClients(wss, payload) {
    wss.clients.forEach((client) => {
        client.send(payload)
    })
}

wss.on('connection', (ws, request) => {
    console.log('Client connected')
    ws.on('message', (data) => {
        const message = JSON.parse(data)
        console.log(message)

        if (message.type === 'join') {
            console.log(message.username)
            clients.set(ws, message.username)

            const payload = JSON.stringify({
                type: 'users',
                users: Array.from(clients.values())
            })

            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(payload)
                }
            })
        } else if (message.type === 'voxelUpdate') {
            console.log(message.data)

            const payload = JSON.stringify({
                type: 'voxelUpdate',
                data: message.data
            })
            broadcastClients(wss, payload)
            console.log('Everything has been broadcast.')

        } else if (message.type === 'voxelDelete') {

        }
    })

    ws.on('close', () => {
        console.log(`Websocket connection with user ${clients.get(ws)} has been closed.`)

        clients.delete(ws)

        const payload = JSON.stringify({
            type: 'users',
            users: Array.from(clients.values())
        })

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payload)
            }
        })

    })

    ws.on('error', () => {

    })
})

httpServer.listen(3000, () => {
    console.log(`Listening on port 3000`)
})