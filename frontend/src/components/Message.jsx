export default function Message({ message, isOwn }) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`message ${isOwn ? 'own' : 'other'}`}>
      <div className="bubble">
        <p>{message.message}</p>
        <span className="time">{time}</span>
      </div>
    </div>
  )
}
