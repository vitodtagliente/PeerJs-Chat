const { v4: uuidV4 } = require('uuid');
const RoomSettings = require('./room_settings');

class Room 
{
    #connectionId = undefined;
    #id = undefined;
    #members = new Map();
    #owner = null;
    settings = null;

    get connectionId() { return this.#connectionId; }
    get id() { return this.#id; }

    constructor(owner, settings)
    {
        this.#connectionId = owner.id;
        this.#id = uuidV4();
        this.#members.set(owner.id, owner);
        this.#owner = owner;
        this.settings = settings ?? new RoomSettings();
    }

    add(user)
    {
        if (this.#members.has(user.id))
        {
            console.log(`User ${user.id} is already in the room ${this.id}`);
            return false;
        }

        if (this.isFull())
        {
            console.log(`Room full. User ${user.id} cannot join the room ${this.id}`);
            return false;
        }

        this.#members.set(user.id, user);
        return true;
    }

    getInfo()
    {
        return {
            id: this.#id,
            members: this.getMembers().map(player => player.getInfo()),
            owner: this.#owner.id,
            settings: this.settings
        };
    }

    getMembers()
    {
        return Array.from(this.#members.values());
    }

    isEmpty()
    {
        return this.#members.size === 0;
    }

    isFull()
    {
        return this.#members.size >= this.settings.max_players;
    }

    isMember(userId)
    {
        return this.#members.has(userId);
    }

    isOwner(userId)
    {
        return this.#owner.id === userId;
    }

    remove(userId)
    {
        if (!this.#members.has(userId))
        {
            console.log(`User ${userId} is not in the room ${this.#id}`);
            return false;
        }

        if (userId === this.#owner.id)
        {
            // TODO: disconnect every other player
        }
        this.#members.delete(userId);
        return true;
    }
}

module.exports = Room;