"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, X, Save, GripVertical } from "lucide-react";

interface Speaker {
  _id: string;
  name: string;
  role: string;
  talkTitle: string;
  abstract: string;
  imageUrl: string;
  bio: string;
  order: number;
}

export default function SpeakersPage() {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [isRearrangeMode, setIsRearrangeMode] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    talkTitle: "To be Updated Soon",
    abstract: "To be Updated Soon",
    bio: "To be Updated Soon",
    image: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch speakers
  const fetchSpeakers = async () => {
    try {
      const res = await fetch("/api/speakers");
      if (!res.ok) throw new Error("Failed to fetch speakers");
      // const data = await res.json();
      // // Sort speakers by order
      // const sortedSpeakers = data.sort((a: Speaker, b: Speaker) => (a.order || 0) - (b.order || 0));
      // setSpeakers(sortedSpeakers);
      const data = await res.json();
      setSpeakers(data);
    } catch (error) {
      console.error("Error fetching speakers:", error);
      setError("Failed to load speakers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpeakers();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        image: e.target.files[0],
      });
    }
  };

  // Create new speaker
  const handleCreateSpeaker = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("role", formData.role);
      formDataToSend.append("talkTitle", formData.talkTitle);
      formDataToSend.append("abstract", formData.abstract);
      formDataToSend.append("bio", formData.bio);
      // Set order to the end of the list
      formDataToSend.append("order", String(speakers.length));
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      const res = await fetch("/api/speakers", {
        method: "POST",
        body: formDataToSend,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create speaker");
      }

      await fetchSpeakers();
      setShowAddForm(false);
      resetForm();
    } catch (error) {
      console.error("Error creating speaker:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create speaker",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Update speaker
  const handleUpdateSpeaker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpeaker) return;

    setSubmitting(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("role", formData.role);
      formDataToSend.append("talkTitle", formData.talkTitle);
      formDataToSend.append("abstract", formData.abstract);
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      const res = await fetch(`/api/speakers/${editingSpeaker._id}`, {
        method: "PATCH",
        body: formDataToSend,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update speaker");
      }

      await fetchSpeakers();
      setEditingSpeaker(null);
      resetForm();
    } catch (error) {
      console.error("Error updating speaker:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update speaker",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete speaker
  const handleDeleteSpeaker = async (id: string) => {
    if (!confirm("Are you sure you want to delete this speaker?")) return;

    try {
      const res = await fetch(`/api/speakers/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete speaker");
      }

      await fetchSpeakers();
    } catch (error) {
      console.error("Error deleting speaker:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete speaker",
      );
      setTimeout(() => setError(null), 3000);
    }
  };

  // Drag and drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
    if (dragIndex === dropIndex) return;

    // Create new order
    const newSpeakers = [...speakers];
    const [draggedSpeaker] = newSpeakers.splice(dragIndex, 1);
    newSpeakers.splice(dropIndex, 0, draggedSpeaker);

    // Update order numbers
    const updatedSpeakers = newSpeakers.map((speaker, idx) => ({
      ...speaker,
      order: idx,
    }));

    // Update UI immediately
    setSpeakers(updatedSpeakers);

    // Save to database
    try {
      const updates = updatedSpeakers.map((speaker, idx) => ({
        id: speaker._id,
        order: idx,
      }));

      const res = await fetch("/api/speakers/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) {
        throw new Error("Failed to update order");
      }
    } catch (error) {
      console.error("Error updating speaker order:", error);
      setError("Failed to save new order. Please try again.");
      // Revert to original order on error
      await fetchSpeakers();
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleEditSpeaker = (speaker: Speaker) => {
    setEditingSpeaker(speaker);
    setFormData({
      name: speaker.name,
      role: speaker.role,
      talkTitle: speaker.talkTitle,
      abstract: speaker.abstract,
      bio: speaker.bio,
      image: null,
    });
    setShowAddForm(false);
    setError(null);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      talkTitle: "To be Updated Soon",
      abstract: "To be Updated Soon",
      bio: "To be Updated Soon",
      image: null,
    });
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingSpeaker(null);
    resetForm();
    setError(null);
  };

  const toggleRearrangeMode = () => {
    setIsRearrangeMode(!isRearrangeMode);
    setDragOverIndex(null);
  };

  const saveRearrangeOrder = async () => {
    try {
      const updates = speakers.map((speaker, idx) => ({
        id: speaker._id,
        order: idx,
      }));

      const res = await fetch("/api/speakers/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) {
        throw new Error("Failed to save order");
      }

      setError(null);
      setIsRearrangeMode(false);
      // Show success message
      const successMsg = document.createElement("div");
      successMsg.className =
        "fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fadeIn";
      successMsg.textContent = "Order saved successfully!";
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (error) {
      console.error("Error saving order:", error);
      setError("Failed to save order. Please try again.");
      await fetchSpeakers(); // Revert to original order
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Speakers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-lg sticky top-0 z-10 border-b border-purple-500/20">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Conference Speakers
              </h1>
              <p className="text-gray-300 mt-2">
                {isRearrangeMode
                  ? "Drag and drop to reorder speakers"
                  : "Meet our distinguished speakers"}
              </p>
            </div>
            <div className="flex gap-3">
              {!isRearrangeMode && (
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setEditingSpeaker(null);
                    resetForm();
                    setError(null);
                  }}
                  className="group bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  Add New Speaker
                </button>
              )}
              {speakers.length > 0 && (
                <button
                  onClick={
                    isRearrangeMode ? saveRearrangeOrder : toggleRearrangeMode
                  }
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    isRearrangeMode
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                  }`}
                >
                  {isRearrangeMode ? (
                    <>
                      <Save className="w-5 h-5" />
                      Save Order
                    </>
                  ) : (
                    <>
                      <GripVertical className="w-5 h-5" />
                      Rearrange
                    </>
                  )}
                </button>
              )}
              {isRearrangeMode && (
                <button
                  onClick={toggleRearrangeMode}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fadeIn">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        {/* Add/Edit Form Modal */}
        {(showAddForm || editingSpeaker) && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/30 shadow-2xl animate-slideUp">
              <div className="sticky top-0 bg-gray-900 border-b border-purple-500/20 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  {editingSpeaker ? "Edit Speaker" : "Add New Speaker"}
                </h2>
                <button
                  onClick={cancelForm}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form
                onSubmit={
                  editingSpeaker ? handleUpdateSpeaker : handleCreateSpeaker
                }
                className="p-6 space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Dr. John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Role/Institution *
                  </label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="University Name, Country"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Talk Title
                  </label>
                  <input
                    type="text"
                    name="talkTitle"
                    value={formData.talkTitle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Talk Title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Abstract
                  </label>
                  <textarea
                    name="abstract"
                    value={formData.abstract}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Abstract of the talk..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Biography of the speaker..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Profile Image *
                    {!editingSpeaker && (
                      <span className="text-red-400 ml-1">
                        (Required for new speaker)
                      </span>
                    )}
                    {editingSpeaker && (
                      <span className="text-gray-400 ml-1">
                        (Optional - leave empty to keep current)
                      </span>
                    )}
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    required={!editingSpeaker}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {submitting
                      ? "Saving..."
                      : editingSpeaker
                        ? "Update Speaker"
                        : "Save Speaker"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Speakers Grid */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ${isRearrangeMode ? "cursor-move" : ""}`}
        >
          {speakers.map((speaker, index) => (
            <div
              key={speaker._id}
              draggable={isRearrangeMode}
              onDragStart={(e) => isRearrangeMode && handleDragStart(e, index)}
              onDragOver={(e) => isRearrangeMode && handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => isRearrangeMode && handleDrop(e, index)}
              className={`group bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border transition-all duration-300 ${
                isRearrangeMode
                  ? `cursor-grab active:cursor-grabbing border-blue-500/50 hover:shadow-2xl ${
                      dragOverIndex === index
                        ? "border-blue-500 border-2 shadow-xl transform scale-105"
                        : "border-purple-500/20"
                    }`
                  : "border-purple-500/20 hover:border-purple-500/40 hover:transform hover:scale-105 hover:shadow-2xl"
              }`}
            >
              {/* Image Container */}
              <div className="relative h-72 overflow-hidden">
                {isRearrangeMode && (
                  <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm z-10 flex items-center justify-center">
                    <GripVertical className="w-12 h-12 text-white opacity-75" />
                  </div>
                )}
                <img
                  src={speaker.imageUrl}
                  alt={speaker.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-image.jpg";
                  }}
                />
                {/* Action Buttons - Hide in rearrange mode */}
                {!isRearrangeMode && (
                  <div className="absolute top-4 right-4 flex gap-2 transition-opacity duration-300">
                    <button
                      onClick={() => handleEditSpeaker(speaker)}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-all duration-300 shadow-lg"
                      title="Edit Speaker"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSpeaker(speaker._id)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-all duration-300 shadow-lg"
                      title="Delete Speaker"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
                  {speaker.name}
                </h2>
                <p className="text-purple-300 text-sm mb-4">{speaker.role}</p>

                <div className="border-t border-purple-500/20 pt-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Talk Topic
                  </h3>
                  <p className="text-purple-200 text-sm font-medium mb-2">
                    {speaker.talkTitle}
                  </p>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Abstract
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {speaker.abstract}
                  </p>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Biography of the speaker
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {speaker.bio}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {speakers.length === 0 && (
          <div className="text-center py-20">
            <div className="text-gray-400 text-lg mb-4">No speakers found</div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Your First Speaker
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
