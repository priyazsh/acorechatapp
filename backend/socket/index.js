const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

function setupSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return next(new Error('Invalid token'));
      socket.user = user;
      next();
    });
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user.name}`);

    socket.join(`user:${socket.user.id}`);

    await getPool().query(
      'UPDATE users SET online_status = ?, last_seen = NOW() WHERE id = ?',
      ['online', socket.user.id]
    );

    io.emit('user status', { userId: socket.user.id, online_status: 'online' });

    socket.on('private message', async ({ receiverId, message }, callback) => {
      try {
        if (!receiverId || !message?.trim()) {
          return callback?.({ error: 'Invalid message' });
        }

        const [result] = await getPool().query(
          'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
          [socket.user.id, receiverId, message.trim()]
        );

        const msgData = {
          id: result.insertId,
          sender_id: socket.user.id,
          sender_name: socket.user.name,
          receiver_id: receiverId,
          message: message.trim(),
          created_at: new Date().toISOString(),
        };

        io.to(`user:${receiverId}`).emit('private message', msgData);
        socket.emit('private message', msgData);

        callback?.({ success: true });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.name}`);

      await getPool().query(
        'UPDATE users SET online_status = ?, last_seen = NOW() WHERE id = ?',
        ['offline', socket.user.id]
      );

      io.emit('user status', {
        userId: socket.user.id,
        online_status: 'offline',
        last_seen: new Date().toISOString(),
      });
    });
  });
}

module.exports = setupSocket;
