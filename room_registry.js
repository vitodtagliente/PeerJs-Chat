const Room = require('./room');

class RoomRegistry
{
    #rooms = new Map();

    all()
    {
        return Array.from(this.#rooms.values());
    }

    create(owner)
    {
        if (this.findByUserId(owner.id))
        {
            return null;
        }

        const room = new Room(owner);
        this.#rooms.set(room.id, room);
        return room;
    }

    find(roomId)
    {
        return this.#rooms.get(roomId);
    }

    findByUserId(userId)
    {
        // Super slow, we need an extra layer of caching
        for (const roomId of this.#rooms.keys())
        {
            const room = this.#rooms.get(roomId);
            if (room?.isMember(userId))
            {
                return room;
            }
        }
        return null;
    }

    flush()
    {
        for (const roomId of this.#rooms.keys())
        {
            const room = this.#rooms.get(roomId);
            if (room?.isEmpty())
            {
                this.#rooms.delete(roomId);
            }
        }
    }

    remove(roomId)
    {
        console.assert(this.#rooms.has(roomId), `Room ${roomId} does not exists...`);
        this.#rooms.delete(roomId);
    }
}

module.exports = RoomRegistry;