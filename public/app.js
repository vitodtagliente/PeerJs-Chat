const peer = new Peer(
    // let peerjs to provide as a valid id
    undefined,
    {
        host: 'localhost',
        port: 3000,
        path: '/p2p'
    }
);

let is_host = false;
// Used by the host to keep track of the connected peers
const room =
{
    members: new Map()
};
// Used by the app instance acting as joining peer
let conn;

const ui = {
    room_container: document.getElementById('room'),
    rooms_container: document.getElementById('rooms'),
    startup_container: document.getElementById('startup'),
};

function fetchRooms()
{
    ui.rooms_container.innerHTML = '';
    fetch('/rooms', {
        method: 'GET'
    })
        .then(response =>
        {
            if (response.status === 200)
            {
                return response.json(); // Parse JSON only if OK
            } else
            {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        })
        .then(data =>
        {
            data.forEach(room => ui.rooms_container.innerHTML += `
                    <button onclick="joinRoom('${room.id}')">Join Room ${room.id}</button>
                `
            );
        })
        .catch(error =>
        {
            console.error('Error:', error);
        });
}

function hostRoom()
{
    fetch('/rooms/host', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId: peer.id })
    })
        .then(response => 
        {
            setDomVisibility(ui.startup_container, false);
            setDomVisibility(ui.room_container, true);
            is_host = true;
        })
        .catch(error =>
        {
            console.error('Error:', error);
        });
}

function joinRoom(roomId)
{
    fetch('/rooms/join', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId, playerId: peer.id })
    })
        .then(response =>
        {
            if (response.status === 200)
            {
                return response.json(); // Parse JSON only if OK
            } else
            {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        })
        .then(data =>
        {
            connectTo(data.owner);
        })
        .catch(error =>
        {
            console.error('Error:', error);
        });
}

function connectTo(otherId)
{
    console.log("Attempting to connect to:", otherId);
    conn = peer.connect(otherId);

    conn.on('open', () =>
    {
        appendMessage(`✅ Room joined successfully...`);
        setDomVisibility(ui.startup_container, false);
        setDomVisibility(ui.room_container, true);
    });

    conn.on('data', (data) =>
    {
        appendMessage(data);
    });

    conn.on('error', (err) =>
    {
        // console.error("Error in data connection:", err);
        // appendMessage(`❌ Data error from host ${err}...`);
    });

    conn.on('close', () =>
    {
        appendMessage(`⚠️ The room has been closed by the host...`);

        fetchRooms();
        setTimeout(() =>
        {
            setDomVisibility(ui.startup_container, true);
            setDomVisibility(ui.room_container, false);
        }, 200);
    });
}

function setDomVisibility(dom, visible)
{
    if (visible)
    {
        dom.classList.remove('hidden');
    }
    else
    {
        if (!dom.classList.contains('hidden'))
        {
            dom.classList.add('hidden');
        }
    }
}

peer.on('open', (id) =>
{
    document.getElementById('my-id').textContent = id;
    fetchRooms();
});

peer.on('connection', (connection) =>
{
    // Happens anytime a client connects to us
    const peerId = connection.peer;
    room.members.set(peerId, connection);
    setupClientConnection(connection);
});

function setupClientConnection(connection)
{
    const peerId = connection.peer;

    connection.on('open', () =>
    {
        const msg = `✅ Peer ${peerId} has joined the room...`;
        appendMessage(msg);
        broadcastMessage(msg, peerId);
    });

    connection.on('data', (data) =>
    {
        const msg = `${peerId}: ${data}`;
        appendMessage(msg);
        broadcastMessage(msg, peerId);
    });

    connection.on('error', (err) =>
    {
        // console.error("Error in data connection:", err);
        // appendMessage(`❌ Data error from peer ${peerId}: ${err}...`);
    });

    connection.on('close', () =>
    {
        const msg = `⚠️ ${peerId} has left the room...`;
        appendMessage(msg);
        broadcastMessage(msg);
        room.members.delete(peerId);
    });
}

function sendMessage()
{
    const input = document.getElementById('message-input');
    const msg = input.value;
    if (is_host)
    {
        broadcastMessage(`${peer.id}: ${msg}`);
        appendMessage("You: " + msg, 'mine');
        input.value = '';
    }
    else if (conn && conn.open)
    {
        conn.send(msg);
        appendMessage("You: " + msg, 'mine');
        input.value = '';
    }
    else
    {
        appendMessage("Connection is not open.");
    }
}

function handleKeyPress(event)
{
    if (event.key === 'Enter')
    {
        sendMessage();
    }
}

function appendMessage(msg, cls = '')
{
    const area = document.getElementById('messages');
    area.value += msg + "\n";
    area.scrollTop = area.scrollHeight;
}

function broadcastMessage(msg, senderId = undefined)
{
    for (const peerId of room.members.keys())
    {
        if (peerId === senderId) continue;
        const peerConnection = room.members.get(peerId);
        peerConnection.send(msg);
    };
}