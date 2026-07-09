import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationService } from '../../services'
import { toast } from 'react-toastify'
import { getDashboardPath } from '../../utils'

const formatTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export default function NotificationBell({ user }) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState([])
  const rootRef = useRef(null)
  const pollInFlightRef = useRef(false)

  const unreadCount = items.filter((item) => !item.read).length

  useEffect(() => {
    if (!user?._id) return
    let cancelled = false

    const poll = async () => {
      if (pollInFlightRef.current) return
      pollInFlightRef.current = true

      try {
        const data = await notificationService.getNotifications()
        if (cancelled) return
        
        const newNotifications = data?.data || []
        
        // Show toasts for newly arriving notifications if they weren't in state previously
        setItems(prevItems => {
          if (prevItems.length > 0) {
            const existingIds = new Set(prevItems.map(i => i._id));
            const freshUnread = newNotifications.filter(n => !n.read && !existingIds.has(n._id));
            
            if (freshUnread.length > 0) {
              const newest = freshUnread[0];
              toast.info(`${newest.sender} - ${newest.message}`);
            }
          }
          return newNotifications;
        });

      } catch {
        // Silent polling failure: avoid flooding the console while the API is slow.
      } finally {
        pollInFlightRef.current = false
      }
    }

    poll()
    const timer = window.setInterval(poll, 20000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [user?._id])

  useEffect(() => {
    if (!isOpen) return

    const onOutside = (event) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const onEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', onOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [isOpen])

  const markAsRead = async (item) => {
    // Optimistic UI update
    setItems((prev) => prev.map((entry) => (entry._id === item._id ? { ...entry, read: true } : entry)))

    try {
      await notificationService.markAsRead(item._id)
    } catch {
      // Revert if failed
      setItems((prev) => prev.map((entry) => (entry._id === item._id ? { ...entry, read: false } : entry)))
    }
  }
  
  const markAllAsRead = async () => {
    setItems((prev) => prev.map((entry) => ({ ...entry, read: true })))
    try {
      await notificationService.markAllAsRead()
    } catch (e) {
      console.error(e);
    }
  }

  const openNotification = async (item) => {
    if (!item.read) {
       await markAsRead(item)
    }
    setIsOpen(false)

    if (item.type === 'PROPERTY' && item.referenceId) {
      navigate(`/property/${item.referenceId}`)
      return
    }

    navigate(getDashboardPath(user?.role))
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-label={`Notifications ${unreadCount} unread`}
        aria-expanded={isOpen}
        aria-controls="role-notification-panel"
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          border: '1px solid rgba(124,58,237,0.2)',
          background: '#fff',
          color: '#7c3aed',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="m5 7 7 5 7-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} unread notifications`}
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              minWidth: 18,
              height: 18,
              borderRadius: 999,
              background: '#ef4444',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              lineHeight: '18px',
              textAlign: 'center',
              padding: '0 4px',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id="role-notification-panel"
          role="region"
          aria-label="Notifications panel"
          style={{
            position: 'absolute',
            right: 0,
            top: 46,
            width: 320,
            maxHeight: 380,
            overflowY: 'auto',
            background: '#fff',
            border: '1px solid rgba(124,58,237,0.16)',
            borderRadius: 12,
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.18)',
            padding: 10,
            zIndex: 1200,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1a0a2e' }}>
              Notifications
            </div>
            {unreadCount > 0 && (
               <button onClick={markAllAsRead} style={{ fontSize: 12, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Mark all as read</button>
            )}
          </div>
          {items.length === 0 ? (
            <div style={{ fontSize: 13, color: 'rgba(26,10,46,0.55)' }}>No new notifications</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item) => (
                <div
                  key={item._id}
                  style={{
                    border: '1px solid rgba(124,58,237,0.12)',
                    borderRadius: 10,
                    background: item.read ? '#faf8ff' : '#f5f3ff',
                    padding: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#ede9fe', color: '#7c3aed', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase' }}>
                        {String(item.sender || '?').trim().charAt(0) || '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: 10.5, color: 'rgba(26,10,46,0.5)', marginBottom: 1 }}>From</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a0a2e' }}>{item.sender}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(26,10,46,0.5)' }}>{formatTime(item.createdAt)}</div>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'rgba(26,10,46,0.72)', margin: '4px 0 8px' }}>
                    {item.message}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'rgba(26,10,46,0.5)', marginBottom: 8 }}>
                    {item.type === 'MESSAGE'
                      ? 'New message'
                      : item.type === 'INQUIRY'
                        ? 'New inquiry'
                        : item.type === 'USER'
                          ? 'New user registration'
                          : 'New property listing'}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => openNotification(item)}
                      aria-label={`Open notification from ${item.sender}`}
                      style={{
                        border: '1px solid rgba(124,58,237,0.25)',
                        borderRadius: 8,
                        background: '#fff',
                        color: '#7c3aed',
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '4px 8px',
                        cursor: 'pointer',
                      }}
                    >
                      Open
                    </button>
                    {!item.read && (
                      <button
                        type="button"
                        onClick={() => markAsRead(item)}
                        aria-label={`Mark notification from ${item.sender} as read`}
                        style={{
                          border: '1px solid rgba(124,58,237,0.18)',
                          borderRadius: 8,
                          background: '#f5f3ff',
                          color: '#7c3aed',
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: '4px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
