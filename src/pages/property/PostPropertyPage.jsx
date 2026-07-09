import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { propertyService, saleRequestService } from "../../services"
import { useAuth } from "../../context/AuthContext"
import { toast } from "react-toastify"
import { AMENITIES } from "../../constants"

const STEPS = ["Basic Info","Location","Details","Amenities","Review"]

/* ---------------- MAIN ---------------- */

export default function PostPropertyPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [data, setData] = useState({
    title:"",
    listingType:"sale",
    propertyType:"",
    price:"",
    description:"",
    city:"",
    locality:"",
    area:"",
    bhk:"",
    bathrooms:"",
    guestCapacity:"",
    amenities:[],
    sellViaAgent:false,
    sellViaAgentNote:"",
  })
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])

  const set = (key,val) => setData(p=>({...p,[key]:val}))

  // Handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setImageFiles(prev => [...prev, ...files])
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    URL.revokeObjectURL(imagePreviews[index])
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      const typeMap = {
        Apartment: 'apartment',
        Villa: 'villa',
        House: 'house',
        Plot: 'plot',
        Commercial: 'commercial',
        Office: 'commercial'
      }

      const toNumberOrUndefined = (value) => {
        if (value === "" || value == null) return undefined
        const nextValue = Number(value)
        return Number.isFinite(nextValue) ? nextValue : undefined
      }

      const bedrooms = toNumberOrUndefined(data.bhk)
      const bathrooms = toNumberOrUndefined(data.bathrooms)
      const guestCapacity = toNumberOrUndefined(data.guestCapacity)

      const propertyData = {
        title: data.title,
        purpose: data.listingType,
        type: typeMap[data.propertyType] || 'apartment',
        price: Number(data.price),
        description: data.description,
        location: {
          city: data.city,
          address: data.locality,
        },
        area: data.area,
        bedrooms,
        bhk: bedrooms,
        bathrooms,
        baths: bathrooms,
        guestCapacity,
        amenities: data.amenities,
        owner: user?._id,
      }

      const response = await propertyService.create(propertyData)
      const propertyId = response?._id || response?.data?._id
      if (!propertyId) {
        throw new Error("Property created but no ID was returned")
      }

      let imageUploadFailed = false

      if (imageFiles.length > 0) {
        const formData = new FormData()
        formData.append('propertyId', propertyId)
        formData.append('property_id', propertyId)
        imageFiles.forEach(file => formData.append('images', file))
        try {
          await propertyService.uploadImages(propertyId, formData)
        } catch (uploadError) {
          imageUploadFailed = true
          console.error('Failed to upload property images:', uploadError)
        }
      }

      if (user?.role === 'owner' && data.sellViaAgent) {
        await saleRequestService.create({
          propertyId,
          ownerMessage: data.sellViaAgentNote,
        })
      }

      if (imageUploadFailed) {
        toast.error("Property created, but image upload failed. Try uploading smaller images.")
      } else {
        toast.success(data.sellViaAgent ? "Property listed and shared with agents" : "Property listed successfully")
      }

      navigate(user?.role === 'owner' ? "/dashboard/owner" : "/dashboard/agent")
      return
      /*

      if (imageUploadFailed) {
        toast.error("Property created, but image upload failed. Try uploading smaller images.")
      } else {
      toast.success(data.sellViaAgent ? "Property listed and shared with agents" : "Property Listed 🚀")
      }
      navigate(user?.role === 'owner' ? "/dashboard/owner" : "/dashboard/agent")
      */
    } catch (error) {
      console.error(error)
      toast.error("Failed to create property")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [imagePreviews])

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      {/* HEADER */}
      <div className="border-b border-[rgba(124,58,237,0.15)] bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-[#1a0a2e]">Post Property</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-lg border border-[rgba(124,58,237,0.22)] text-[#7c3aed] font-medium hover:bg-[rgba(124,58,237,0.05)] transition"
          >
            ← Back to Website
          </button>
          <button onClick={() => navigate(-1)} className="text-[rgba(26,10,46,0.5)] hover:text-[#7c3aed] transition">
            Back
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* STEP BAR */}
        <div className="flex justify-between mb-8">
          {STEPS.map((s,i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition
                ${i <= step ? "bg-linear-to-rrom-[#7c3aed] to-[#6d28d9] text-white" : "bg-[#e8e4ff] text-[rgba(26,10,46,0.5)]"}
              `}>
                {i < step ? "✓" : i+1}
              </div>
              <span className="text-xs mt-2 text-[rgba(26,10,46,0.5)]">
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* FORM CARD */}
        <div className="bg-white rounded-xl shadow-sm border border-[rgba(124,58,237,0.12)] p-6 space-y-6">
          {/* STEP CONTENT */}
          {step === 0 && (
            <>
              <Input label="Title" value={data.title} onChange={v => set("title", v)} />
              <Input label="Price" type="number" value={data.price} onChange={v => set("price", v)} />
              <TextArea label="Description" value={data.description} onChange={v => set("description", v)} />
            </>
          )}

          {step === 1 && (
            <>
              <Input label="City" value={data.city} onChange={v => set("city", v)} />
              <Input label="Locality" value={data.locality} onChange={v => set("locality", v)} />
            </>
          )}

          {step === 2 && (
            <>
              <Input label="Area (sqft)" type="number" value={data.area} onChange={v => set("area", v)} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Input label="Bedrooms" type="number" min="0" value={data.bhk} onChange={v => set("bhk", v)} />
                <Input label="Bathrooms" type="number" min="0" value={data.bathrooms} onChange={v => set("bathrooms", v)} />
                <Input label="Guests" type="number" min="0" value={data.guestCapacity} onChange={v => set("guestCapacity", v)} />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a, data, set)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition
                      ${data.amenities.includes(a)
                        ? "bg-linear-to-r from-[#7c3aed] to-[#6d28d9] text-white shadow-sm"
                        : "bg-[#f0eeff] text-[rgba(26,10,46,0.7)] hover:bg-[#e8e4ff]"
                      }
                    `}
                  >
                    {a}
                  </button>
                ))}
              </div>

              {/* Image Upload Section */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-[rgba(26,10,46,0.7)] mb-2">Property Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="w-full p-2 border border-[rgba(124,58,237,0.2)] rounded-lg bg-[#f9f9ff] text-[#1a0a2e] text-sm cursor-pointer"
                />
                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-3">
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[rgba(124,58,237,0.2)]">
                        <img src={src} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {step === 4 && (
            <div className="text-sm text-[rgba(26,10,46,0.6)] bg-[#f9f9ff] p-4 rounded-lg">
              <p>Review your property details before submitting.</p>
              <ul className="mt-2 space-y-1">
                <li><strong>Title:</strong> {data.title || "—"}</li>
                <li><strong>Price:</strong> ₹{data.price || "—"}</li>
                <li><strong>Description:</strong> {data.description || "—"}</li>
                <li><strong>City:</strong> {data.city || "—"}</li>
                <li><strong>Locality:</strong> {data.locality || "—"}</li>
                <li><strong>Area:</strong> {data.area || "—"} sqft</li>
                <li><strong>Bedrooms:</strong> {data.bhk || "—"}</li>
                <li><strong>Bathrooms:</strong> {data.bathrooms || "—"}</li>
                <li><strong>Guests:</strong> {data.guestCapacity || "—"}</li>
                <li><strong>Amenities:</strong> {data.amenities.length ? data.amenities.join(", ") : "None"}</li>
                <li><strong>Images:</strong> {imageFiles.length} file(s) selected</li>
              </ul>
              {user?.role === 'owner' && (
                <div className="mt-4 pt-4 border-t border-[rgba(124,58,237,0.12)]">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.sellViaAgent}
                      onChange={(e) => set("sellViaAgent", e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[#7c3aed]"
                    />
                    <span>
                      <span className="block font-semibold text-[#1a0a2e]">Sell via agent</span>
                      <span className="block text-xs text-[rgba(26,10,46,0.55)]">
                        Share this property with agents so one of them can accept and manage the sale for you.
                      </span>
                    </span>
                  </label>
                  {data.sellViaAgent && (
                    <textarea
                      rows={3}
                      value={data.sellViaAgentNote}
                      onChange={(e) => set("sellViaAgentNote", e.target.value)}
                      placeholder="Optional note for agents about pricing, urgency, or preferred contact timing..."
                      className="mt-3 w-full p-3 rounded-lg border border-[rgba(124,58,237,0.2)] bg-white text-[#1a0a2e] outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition resize-y"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex justify-between pt-4">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s-1)}
                className="px-5 py-2 rounded-lg border border-[rgba(124,58,237,0.3)] text-[#7c3aed] font-medium hover:bg-[rgba(124,58,237,0.05)] transition"
              >
                Back
              </button>
            )}

            {step < STEPS.length-1 ? (
              <button
                onClick={() => setStep(s => s+1)}
                className="ml-auto px-5 py-2 rounded-lg bg-linear-to-r from-[#7c3aed] to-[#6d28d9] text-white font-medium shadow-sm hover:shadow-md transition"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="ml-auto px-5 py-2 rounded-lg bg-linear-to-r from-[#7c3aed] to-[#6d28d9] text-white font-medium shadow-sm hover:shadow-md transition disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- COMPONENTS ---------------- */
function Input({ label, value, onChange, type = "text", min }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[rgba(26,10,46,0.7)] mb-1">{label}</label>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 rounded-lg border border-[rgba(124,58,237,0.2)] bg-[#f9f9ff] text-[#1a0a2e] outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition"
      />
    </div>
  )
}

function TextArea({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[rgba(26,10,46,0.7)] mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full p-2 rounded-lg border border-[rgba(124,58,237,0.2)] bg-[#f9f9ff] text-[#1a0a2e] outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition resize-y"
      />
    </div>
  )
}

function toggleAmenity(a, data, set) {
  const list = data.amenities
  set("amenities", list.includes(a) ? list.filter(x => x !== a) : [...list, a])
}
