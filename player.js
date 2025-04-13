class Player
{
    #id = undefined;
    #peer = null;

    get id() { return this.#id; }

    constructor(peer)
    {
        this.#id = peer.id;
        this.#peer = peer;
    }

    getInfo()
    {
        return {
            id: this.#id
        };
    }

    send(data)
    {
        this.#peer.send(data);
    }
}

module.exports = Player;