// SavedProperties.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import api from "../../services/api";
import { formatPrice } from "../../utils";

export default function SavedProperties() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchFavorites();
  }, [user, navigate]);

  const fetchFavorites = async () => {
    try {
      const data = await api.get(`/favorite/${user._id}`);
      // data is an array of favorite documents with populated "property"
      // Adjust based on your API response structure
      const favList = data.message || data; // because your getUserFavorite returns { hell, message: [...] }
      setFavorites(Array.isArray(favList) ? favList : []);
    } catch (err) {
      console.error("Failed to fetch favorites", err);
      toast.error("Could not load saved properties.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (favoriteId, propertyTitle) => {
    if (!window.confirm(`Remove "${propertyTitle}" from saved?`)) return;
    setRemovingId(favoriteId);
    try {
      await api.delete(`/favorite/${favoriteId}`);
      setFavorites((prev) => prev.filter((fav) => fav._id !== favoriteId));
      toast.success("Removed from saved properties");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  const handleView = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No saved properties yet.</p>
        <button
          onClick={() => navigate("/properties")}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Browse Properties
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Saved Properties</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((fav) => {
          const prop = fav.property; // populated property object
          if (!prop) return null;
          return (
            <div
              key={fav._id}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition"
            >
              {/* Image */}
              <div className="h-48 bg-gray-200 relative">
                {prop.images && prop.images[0] ? (
                  <img
                    src={prop.images[0]}
                    alt={prop.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 truncate">
                  {prop.title}
                </h3>
                <p className="text-purple-600 font-bold mt-1">
                  {formatPrice(prop.price)}
                  {prop.listingType === "rent" && <span className="text-sm">/month</span>}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {prop.locality}, {prop.city}
                </p>
                <div className="flex gap-2 mt-2 text-xs text-gray-600">
                  {prop.bhk && <span>🛏️ {prop.bhk} BHK</span>}
                  {prop.area && <span>📐 {prop.area} sqft</span>}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleView(prop._id)}
                    className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleRemove(fav._id, prop.title)}
                    disabled={removingId === fav._id}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm font-medium disabled:opacity-50"
                  >
                    {removingId === fav._id ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}