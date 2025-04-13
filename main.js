const express = require('express');
const { ExpressPeerServer } = require("peer");
const PlayerRegistry = require('./player_registry');
const RoomRegistry = require('./room_registry');

const app = express();
const server = require('http').createServer(app);
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: "/p2p",
});
const playerRegistry = new PlayerRegistry();
const roomRegistry = new RoomRegistry();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use("/", peerServer);

app.get('/', (req, res) =>
{
    res.render('home');
});
app.get('/players', (req, res) => 
{
    res.send(playerRegistry.all().map(player => player.getInfo()));
});
app.get('/rooms', (req, res) => 
{
    res.send(roomRegistry.all().map(room => room.getInfo()));
});
app.post('/rooms/host', (req, res) => 
{
    const { playerId } = req.body;
    const player = playerRegistry.find(playerId);
    const room = player ? roomRegistry.create(player) : null;
    if (room)
    {
        res.send(room.getInfo());
        return;
    }
    res.status(400).send("Bad Request");
});

app.post('/rooms/join', (req, res) => 
{
    const { roomId, playerId } = req.body;
    const player = playerRegistry.find(playerId);
    let room = roomRegistry.find(roomId);
    if (room && player && room.isFull() == false)
    {
        room.add(player);
        res.send(room.getInfo());
        return;
    }
    res.status(400).send("Bad Request");
});

peerServer.on('connection', (peer) =>
{
    const player = playerRegistry.add(peer);
    console.log(`Player ${player.id} connected...`);
});
peerServer.on('disconnect', (peer) =>
{
    const playerId = playerRegistry.remove(peer);
    console.log(`Player ${playerId} disconnected...`)

    const room = roomRegistry.findByUserId(playerId);
    if (room)
    {
        room.remove(playerId);
        if (room.isEmpty())
        {
            roomRegistry.remove(room.id);
        }
    }
});

server.listen(3000, () =>
{
    console.log('Signaling server listening on port 3000');
});