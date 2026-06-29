import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import Message from '../components/Message'
import MessageInput from '../components/MessageInput'

let socket = null

function formatLastSeen(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return d.toLocaleDateString()
}

export default function Chat() {
  const { user, token, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [connected, setConnected] = useState(false)
  const messagesEndRef = useRef(null)
  const selectedUserRef = useRef(null)

  useEffect(() => {
    socket = io('http://localhost:3000', { auth: { token } })

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('private message', (msg) => {
      const current = selectedUserRef.current
      if (current && (msg.sender_id === current.id || msg.receiver_id === current.id)) {
        setMessages((prev) => [...prev, msg])
      }
    })

    socket.on('user status', ({ userId, online_status, last_seen }) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, online_status, last_seen: last_seen ?? u.last_seen } : u
        )
      )
    })

    return () => { socket?.disconnect() }
  }, [token])

  useEffect(() => {
    selectedUserRef.current = selectedUser
  }, [selectedUser])

  useEffect(() => {
    fetch('http://localhost:3000/api/messages/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setUsers)
      .catch(console.error)
  }, [token])

  useEffect(() => {
    if (!selectedUser) return
    setMessages([])
    fetch(`http://localhost:3000/api/messages/${selectedUser.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setMessages)
      .catch(console.error)
  }, [selectedUser, token])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function sendMessage(text) {
    if (!selectedUser || !text.trim()) return
    socket.emit('private message', { receiverId: selectedUser.id, message: text })
  }

  return (
    <div className="chat-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Acore Chat</h2>
          <div className="status-dot" data-connected={connected} />
        </div>
        <div className="user-list">
          <div className="user-list-header">Users</div>
          {users.map((u) => (
            <div
              key={u.id}
              className={`user-item ${selectedUser?.id === u.id ? 'active' : ''}`}
              onClick={() => setSelectedUser(u)}
            >
              <div className="avatar">{u.name[0].toUpperCase()}</div>
              <div className="user-info">
                <span className="user-name">{u.name}</span>
                <span className={`user-status ${u.online_status}`}>
                  {u.online_status === 'online' ? 'Online' : `Last seen ${formatLastSeen(u.last_seen)}`}
                </span>
              </div>
            </div>
          ))}
        </div>
        <button className="logout-btn" onClick={logout}>Log out</button>
      </aside>

      <main className="chat-area">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="avatar">{selectedUser.name[0].toUpperCase()}</div>
              <div className="chat-user-info">
                <span>{selectedUser.name}</span>
                <span className={`user-status ${selectedUser.online_status}`}>
                  {selectedUser.online_status === 'online' ? 'Online' : `Last seen ${formatLastSeen(selectedUser.last_seen)}`}
                </span>
              </div>
            </div>
            <div className="messages">
              {messages.map((msg) => (
                <Message
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_id === user.id}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
            <MessageInput onSend={sendMessage} />
          </>
        ) : (
          <div className="no-chat">Select a user to start chatting</div>
        )}
      </main>
    </div>
  )
}
