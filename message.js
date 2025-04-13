export default class Message 
{
    static build(id, data)
    {
        return {
            type: 'message',
            id,
            data
        };
    }

    static validate(data)
    {
        return data && typeof data === 'object' && data.type === 'message';
    }
}