const Player = require('./player');

class PlayerRegistry
{
    #players = new Map();

    all()
    {
        return Array.from(this.#players.values());
    }

    add(peer)
    {
        const player = new Player(peer);
        this.#players.set(player.id, player);
        return player;
    }

    find(playerId)
    {
        return this.#players.get(playerId);
    }

    remove(peer)
    {
        const playerId = peer.id;
        console.assert(this.#players.has(playerId), `Player ${playerId} does not exists...`);
        this.#players.delete(playerId);
        return playerId;
    }
}

module.exports = PlayerRegistry;