import { NextApiRequest, NextApiResponse } from 'next';
import { Server as NetServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { whatsappService } from '@/lib/whatsappService';

export const config = {
    api: {
        bodyParser: false,
    },
};

const SocketHandler = (req: NextApiRequest, res: any) => {
    if (!res.socket.server.io) {
        console.log('--- Initializing Socket.io server at /api/socket ---');
        const httpServer: NetServer = res.socket.server as any;
        const io = new SocketServer(httpServer, {
            path: '/api/socket',
            addTrailingSlash: false,
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        res.socket.server.io = io;
    }

    // Always sync the io instance with the service (crucial for module reloads in dev)
    whatsappService.setIo(res.socket.server.io);
    res.end();
};

export default SocketHandler;
