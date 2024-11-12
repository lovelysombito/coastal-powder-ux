/* eslint-disable no-undef */
import Pusher from 'pusher-js';
import { createContext, useState } from 'react';

export const webContext = createContext(null);
const WebsocketProvider = ({ children }) => {
    const [jobItem, setJobItem] = useState(null);

    // If environment !== jest test, init pusher
    if (!process.env.JEST_WORKER_ID) {
        const pusher = new Pusher('b6f672349482df6ef578', {
            cluster: 'ap4',
        });

        pusher.connection.bind('error', function (err) {
            console.log('err', err.data.message);
            
        });

        const channel = pusher.subscribe('my-channel');
        channel.bind('my-event', function (data) {
            setJobItem(data);
        });

    }

    return <webContext.Provider value={{ jobItem }}>{children}</webContext.Provider>;
};

export default WebsocketProvider;
