import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { userService } from '../../services'
import { getDashboardPath, getInitials, resolveApiAssetUrl } from '../../utils'

const extractProfile = (payload) => {
  if (!payload) return null
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) return payload.data
  if (payload?.user && typeof payload.user === 'object') return payload.user
  if (payload?.profile && typeof payload.profile === 'object') return payload.profile
  return typeof payload === 'object' ? payload : null
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      try {
        const response = await userService.getProfile()
        const profile = extractProfile(response)

        if (cancelled || !profile) return

        setForm({
          name: profile.name || profile.username || '',
          email: profile.email || '',
          phone: profile.phone || '',
        })
        updateUser(profile)
      } catch (error) {
        if (cancelled) return
        setForm({
          name: user?.name || user?.username || '',
          email: user?.email || '',
          phone: user?.phone || '',
        })
        toast.error(error?.response?.data?.message || 'Could not load profile details')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProfile()
    return () => {
      cancelled = true
    }
  }, [updateUser, user?.email, user?.name, user?.phone, user?.username])

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('')
      return
    }

    const objectUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [selectedFile])

  const displayedImage = previewUrl || resolveApiAssetUrl(user?.profileImage || '')

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSelectImage = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Profile image must be smaller than 5MB')
      return
    }

    setSelectedFile(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }

    setSaving(true)

    try {
      if (selectedFile) {
        const multipart = new FormData()
        multipart.append('name', form.name.trim())
        multipart.append('email', form.email.trim())
        multipart.append('phone', form.phone.trim())
        multipart.append('profileImage', selectedFile)
        await userService.updateProfile(multipart)
      } else {
        await userService.updateProfile({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        })
      }

      const refreshedProfile = extractProfile(await userService.getProfile()) || {
        ...user,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      }

      updateUser(refreshedProfile)
      setForm({
        name: refreshedProfile.name || refreshedProfile.username || '',
        email: refreshedProfile.email || '',
        phone: refreshedProfile.phone || '',
      })
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const actionButtonStyle = {
    padding: '10px 18px',
    borderRadius: 12,
    border: '1px solid rgba(124,58,237,0.2)',
    background: '#ffffff',
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7ff', padding: '24px 16px', fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 800, color: '#1a0a2e' }}>My Profile</h1>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(26,10,46,0.5)' }}>Update your information and profile image across the whole app.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => navigate('/')} style={actionButtonStyle}>
              ← Back to Website
            </button>
            <button type="button" onClick={() => navigate(getDashboardPath(user?.role))} style={actionButtonStyle}>
              Back to Dashboard
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: 24 }}>
          <div style={{ background: '#ffffff', border: '1px solid rgba(124,58,237,0.12)', borderRadius: 20, padding: 24, boxShadow: '0 6px 24px rgba(124,58,237,0.06)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              {displayedImage ? (
                <img
                  src={displayedImage}
                  alt={form.name || 'Profile'}
                  style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(124,58,237,0.12)', boxShadow: '0 10px 24px rgba(124,58,237,0.12)' }}
                />
              ) : (
                <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 38, fontWeight: 800, boxShadow: '0 10px 24px rgba(124,58,237,0.18)' }}>
                  {getInitials(form.name || user?.name || user?.email || 'U')}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleSelectImage}
                style={{ display: 'none' }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ marginTop: 16, padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(124,58,237,0.2)', background: '#f8f4ff', color: '#7c3aed', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                {selectedFile ? 'Change Selected Image' : 'Upload Profile Image'}
              </button>

              <div style={{ marginTop: 18, width: '100%', background: '#faf8ff', borderRadius: 16, border: '1px solid rgba(124,58,237,0.08)', padding: 16, textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,10,46,0.45)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Account</div>
                <div style={{ marginTop: 10, fontSize: 18, fontWeight: 700, color: '#1a0a2e' }}>{form.name || user?.name || 'User'}</div>
                <div style={{ marginTop: 4, fontSize: 13, color: 'rgba(26,10,46,0.55)' }}>{form.email || user?.email || 'No email'}</div>
                <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(124,58,237,0.08)', color: '#7c3aed', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>
                  {user?.role || 'buyer'}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ background: '#ffffff', border: '1px solid rgba(124,58,237,0.12)', borderRadius: 20, padding: 24, boxShadow: '0 6px 24px rgba(124,58,237,0.06)' }}>
            {loading ? (
              <div style={{ fontSize: 14, color: 'rgba(26,10,46,0.5)' }}>Loading profile...</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,10,46,0.45)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Full Name</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) => handleChange('name', event.target.value)}
                      style={{ height: 46, borderRadius: 12, border: '1px solid rgba(124,58,237,0.2)', background: '#faf8ff', padding: '0 14px', color: '#1a0a2e', outline: 'none', fontSize: 14 }}
                    />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,10,46,0.45)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Email</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => handleChange('email', event.target.value)}
                      style={{ height: 46, borderRadius: 12, border: '1px solid rgba(124,58,237,0.2)', background: '#faf8ff', padding: '0 14px', color: '#1a0a2e', outline: 'none', fontSize: 14 }}
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,10,46,0.45)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Phone</span>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(event) => handleChange('phone', event.target.value)}
                      placeholder="Add your phone number"
                      style={{ height: 46, borderRadius: 12, border: '1px solid rgba(124,58,237,0.2)', background: '#faf8ff', padding: '0 14px', color: '#1a0a2e', outline: 'none', fontSize: 14 }}
                    />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,10,46,0.45)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Role</span>
                    <input
                      type="text"
                      value={user?.role || ''}
                      readOnly
                      style={{ height: 46, borderRadius: 12, border: '1px solid rgba(124,58,237,0.12)', background: '#f4f2fb', padding: '0 14px', color: 'rgba(26,10,46,0.65)', outline: 'none', fontSize: 14, textTransform: 'capitalize' }}
                    />
                  </label>
                </div>

                <div style={{ marginTop: 20, padding: 16, borderRadius: 16, background: '#faf8ff', border: '1px solid rgba(124,58,237,0.08)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,10,46,0.45)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Notes</div>
                  <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(26,10,46,0.6)', lineHeight: 1.6 }}>
                    Your updated profile image and details will be used across dashboards, navbar, and account sections after saving.
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => navigate(getDashboardPath(user?.role))}
                    style={{ padding: '12px 18px', borderRadius: 12, border: '1px solid rgba(124,58,237,0.18)', background: '#ffffff', color: '#7c3aed', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ padding: '12px 22px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 10px 24px rgba(124,58,237,0.18)', opacity: saving ? 0.75 : 1 }}
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .profile-grid-fallback {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
