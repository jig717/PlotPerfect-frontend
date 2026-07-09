import { useEffect, useRef, useState } from 'react'
import { threadService } from '../../services'
import { getInitials, timeAgo } from '../../utils'
import { toast } from 'react-toastify'

const extractData = (payload) => payload?.data || payload || null

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const extractObjectId = (value) => {
  if (!value) return null
  const raw = typeof value === 'string' ? value : value?._id || value?.id || null
  if (!raw) return null
  const match = String(raw).match(/[a-fA-F0-9]{24}/)
  return match ? match[0] : null
}

const resolveInquiryId = (inquiry) =>
  extractObjectId(inquiry?._id) ||
  extractObjectId(inquiry?.inquiryId) ||
  extractObjectId(inquiry?.inquiry_id) ||
  extractObjectId(inquiry?.inquiry)

const resolveThreadId = (inquiry) =>
  extractObjectId(inquiry?.thread?._id) ||
  extractObjectId(inquiry?.threadId) ||
  extractObjectId(inquiry?.thread_id) ||
  extractObjectId(inquiry?.thread)

export default function ThreadPanel({ inquiry, user, onClose }) {
  const [thread, setThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
   const hasBootstrapped = useRef(false)
   const seenMessageIds = useRef(new Set())
  const inquiryId = resolveInquiryId(inquiry)
  const preferredThreadId = resolveThreadId(inquiry)

  useEffect(() => {
    if (!user?._id || (!inquiryId && !preferredThreadId)) return

    let cancelled = false

    const loadThread = async ({ silent = false } = {}) => {
      if (!silent) setLoading(true)
      try {
        let threadData = null

        if (preferredThreadId) {
          const byIdRes = await threadService.getById(preferredThreadId)
          threadData = extractData(byIdRes)
        }

        if (!threadData?._id && inquiryId) {
          try {
            const threadRes = await threadService.getByInquiryId(inquiryId)
            threadData = extractData(threadRes)
          } catch (error) {
            const status = error?.response?.status
            if (status === 400 || status === 404) {
              const createdThread = await threadService.create({ inquiryId })
              threadData = extractData(createdThread)
            } else {
              throw error
            }
          }
        }

        if (!threadData?._id) throw new Error('Thread not found')

        const messagesRes = await threadService.getMessages(threadData._id)
        const nextMessages = extractList(messagesRes)

        if (hasBootstrapped.current) {
          const incoming = nextMessages.filter((message) => {
            const messageId = message?._id
            const isMine = message?.sender?._id === user?._id
            return messageId && !seenMessageIds.current.has(messageId) && !isMine
          })
          if (incoming.length > 0) {
            const latest = incoming[incoming.length - 1]
            toast.info(`New message delivered from ${latest.sender?.username || 'Unknown User'}`)
          }
        }

        const nextSeenIds = new Set(nextMessages.map((message) => message?._id).filter(Boolean))
        seenMessageIds.current = nextSeenIds
        hasBootstrapped.current = true

        if (!cancelled) {
          setThread(threadData)
          setMessages(nextMessages)
        }

        await threadService.markRead(threadData._id)
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load thread:', error)
          if (!silent) {
            toast.error(error?.response?.data?.message || 'Failed to load conversation')
          }
        }
      } finally {
        if (!cancelled && !silent) setLoading(false)
      }
    }

    loadThread()
    const timer = window.setInterval(() => loadThread({ silent: true }), 10000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [inquiryId, preferredThreadId, user?._id])

  const handleSend = async () => {
    const content = draft.trim()
    if (!content || !thread?._id || sending) return

    setSending(true)
    try {
      const res = await threadService.sendMessage(thread._id, { content })
      const createdMessage = extractData(res)
      if (createdMessage?._id) {
        setMessages((prev) => [...prev, createdMessage])
      }
      setDraft('')
      await threadService.markRead(thread._id)
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error(error?.response?.data?.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleComposerKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const participants = Array.isArray(thread?.participants) ? thread.participants : []

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Conversation panel"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17, 24, 39, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(960px, 100%)',
          maxHeight: '85vh',
          background: '#ffffff',
          borderRadius: 24,
          border: '1px solid rgba(124,58,237,0.14)',
          boxShadow: '0 30px 80px rgba(15, 23, 42, 0.25)',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          overflow: 'hidden',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(124,58,237,0.12)', background: '#fcfaff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1a0a2e', marginBottom: 4 }}>
                {thread?.title || inquiry?.property?.title || 'Conversation'}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(26,10,46,0.55)' }}>
                {participants.map((participant) => participant.user?.name || participant.user?.email || 'User').join(' • ') || 'Loading participants'}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close conversation"
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                border: '1px solid rgba(124,58,237,0.18)',
                background: '#fff',
                color: '#7c3aed',
                fontSize: 18,
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        </div>

        <div
          role="log"
          aria-live="polite"
          style={{
            padding: 20,
            overflowY: 'auto',
            background: 'linear-gradient(180deg, #ffffff 0%, #faf8ff 100%)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                style={{
                  alignSelf: index % 2 === 0 ? 'flex-start' : 'flex-end',
                  width: 'min(420px, 85%)',
                  height: 72,
                  background: '#efeaff',
                  borderRadius: 18,
                  opacity: 0.7,
                }}
              />
            ))
          ) : messages.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'rgba(26,10,46,0.5)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
              <div style={{ fontWeight: 700, color: '#1a0a2e', marginBottom: 4 }}>No messages yet</div>
              <div style={{ fontSize: 14 }}>Start the conversation below.</div>
            </div>
          ) : (
            messages.map((message) => {
              const mine = message.sender?._id === user?._id
              return (
                <div
                  key={message._id}
                  style={{
                    alignSelf: mine ? 'flex-end' : 'flex-start',
                    maxWidth: 'min(520px, 90%)',
                    display: 'flex',
                    gap: 10,
                    flexDirection: mine ? 'row-reverse' : 'row',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: mine ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : '#ece7ff',
                      color: mine ? '#fff' : '#7c3aed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(message.sender?.name || message.sender?.email || 'U')}
                  </div>
                  <div
                    style={{
                      background: mine ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : '#ffffff',
                      color: mine ? '#fff' : '#1a0a2e',
                      border: mine ? 'none' : '1px solid rgba(124,58,237,0.12)',
                      borderRadius: 18,
                      padding: '12px 14px',
                      boxShadow: mine ? '0 10px 26px rgba(124,58,237,0.22)' : '0 6px 16px rgba(15, 23, 42, 0.06)',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, opacity: mine ? 0.85 : 0.7 }}>
                      {mine ? 'You' : message.sender?.name || message.sender?.email || 'User'}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{message.content}</div>
                    <div style={{ fontSize: 11, marginTop: 8, opacity: mine ? 0.85 : 0.55 }}>
                      {timeAgo(message.createdAt)}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div style={{ padding: 18, borderTop: '1px solid rgba(124,58,237,0.12)', background: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
            <label style={{ display: 'block' }}>
              <span className="sr-only">Type a message</span>
              <textarea
                rows={3}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Type your message…"
                style={{
                  width: '100%',
                  resize: 'vertical',
                  borderRadius: 16,
                  border: '1px solid rgba(124,58,237,0.18)',
                  background: '#faf8ff',
                  padding: '12px 14px',
                  fontSize: 14,
                  color: '#1a0a2e',
                  outline: 'none',
                  fontFamily: "'DM Sans',sans-serif",
                }}
              />
            </label>
            <button
              onClick={handleSend}
              disabled={sending || !draft.trim()}
              style={{
                padding: '12px 18px',
                borderRadius: 16,
                border: 'none',
                background: sending || !draft.trim() ? '#d8cffb' : 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: sending || !draft.trim() ? 'not-allowed' : 'pointer',
                minWidth: 110,
              }}
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
