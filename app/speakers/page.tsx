"use client";

import { useEffect, useState, useRef } from "react";
import { Pencil, Trash2, Plus, X, Save, GripVertical, ArrowUp, ArrowDown } from "lucide-react";

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
  const [touchStartIndex, setTouchStartIndex] = useState<number | null>(null);
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
  const [isMobile, setIsMobile] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch speakers
  const fetchSpeakers = async () => {
    try {
      const res = await fetch("/api/speakers");
      if (!res.ok) throw new Error("Failed to fetch speakers");
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

  // Reorder speakers function
  const reorderSpeakers = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newSpeakers = [...speakers];
    const [draggedSpeaker] = newSpeakers.splice(fromIndex, 1);
    newSpeakers.splice(toIndex, 0, draggedSpeaker);

    const updatedSpeakers = newSpeakers.map((speaker, idx) => ({
      ...speaker,
      order: idx,
    }));

    setSpeakers(updatedSpeakers);

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
      await fetchSpeakers();
      setTimeout(() => setError(null), 3000);
    }
  };

  // Desktop drag and drop
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
    await reorderSpeakers(dragIndex, dropIndex);
  };

  // Mobile touch events
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    if (!isRearrangeMode) return;
    
    longPressTimer.current = setTimeout(() => {
      setTouchStartIndex(index);
      // Vibrate if supported
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent, index: number) => {
    if (!isRearrangeMode || touchStartIndex === null) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const targetCard = elements.find(el => el.hasAttribute?.('data-speaker-index'));
    
    if (targetCard) {
      const targetIndex = parseInt(targetCard.getAttribute('data-speaker-index') || '-1');
      if (targetIndex !== -1 && targetIndex !== touchStartIndex) {
        reorderSpeakers(touchStartIndex, targetIndex);
        setTouchStartIndex(targetIndex);
        if (navigator.vibrate) navigator.vibrate(20);
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setTouchStartIndex(null);
  };

  // Move up/down buttons for mobile
  const moveSpeakerUp = async (index: number) => {
    if (index > 0) {
      await reorderSpeakers(index, index - 1);
    }
  };

  const moveSpeakerDown = async (index: number) => {
    if (index < speakers.length - 1) {
      await reorderSpeakers(index, index + 1);
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
    setTouchStartIndex(null);
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
      
      const successMsg = document.createElement("div");
      successMsg.className =
        "fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fadeIn";
      successMsg.textContent = "Order saved successfully!";
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (error) {
      console.error("Error saving order:", error);
      setError("Failed to save order. Please try again.");
      await fetchSpeakers();
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
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Conference Speakers
              </h1>
              <p className="text-gray-300 text-sm sm:text-base mt-1 sm:mt-2">
                {isRearrangeMode
                  ? isMobile ? "Long press and drag to reorder, or use arrow buttons" : "Drag and drop to reorder speakers"
                  : "Meet our distinguished speakers"}
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              {!isRearrangeMode && (
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setEditingSpeaker(null);
                    resetForm();
                    setError(null);
                  }}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Add New Speaker</span>
                  <span className="sm:hidden">Add</span>
                </button>
              )}
              {speakers.length > 0 && (
                <button
                  onClick={
                    isRearrangeMode ? saveRearrangeOrder : toggleRearrangeMode
                  }
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base ${
                    isRearrangeMode
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                  }`}
                >
                  {isRearrangeMode ? (
                    <>
                      <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Save Order</span>
                      <span className="sm:hidden">Save</span>
                    </>
                  ) : (
                    <>
                      <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Rearrange</span>
                      <span className="sm:hidden">Reorder</span>
                    </>
                  )}
                </button>
              )}
              {isRearrangeMode && (
                <button
                  onClick={toggleRearrangeMode}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Cancel</span>
                  <span className="sm:hidden">Cancel</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg animate-fadeIn text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Add/Edit Form Modal */}
        {(showAddForm || editingSpeaker) && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/30 shadow-2xl animate-slideUp">
              <div className="sticky top-0 bg-gray-900 border-b border-purple-500/20 px-4 sm:px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {editingSpeaker ? "Edit Speaker" : "Add New Speaker"}
                </h2>
                <button
                  onClick={cancelForm}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <form
                onSubmit={
                  editingSpeaker ? handleUpdateSpeaker : handleCreateSpeaker
                }
                className="p-4 sm:p-6 space-y-4 sm:space-y-5"
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
                    className="w-full px-3 sm:px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
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
                    className="w-full px-3 sm:px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
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
                    className="w-full px-3 sm:px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
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
                    className="w-full px-3 sm:px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
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
                    className="w-full px-3 sm:px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
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
                    className="w-full px-3 sm:px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
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
                    className="px-4 sm:px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base"
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
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 ${isRearrangeMode ? "cursor-move" : ""}`}
        >
          {speakers.map((speaker, index) => (
            <div
              key={speaker._id}
              data-speaker-index={index}
              draggable={!isMobile && isRearrangeMode}
              onDragStart={(e) => !isMobile && isRearrangeMode && handleDragStart(e, index)}
              onDragOver={(e) => !isMobile && isRearrangeMode && handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => !isMobile && isRearrangeMode && handleDrop(e, index)}
              onTouchStart={(e) => isMobile && handleTouchStart(e, index)}
              onTouchMove={(e) => isMobile && handleTouchMove(e, index)}
              onTouchEnd={handleTouchEnd}
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
              <div className="relative h-48 sm:h-56 md:h-64 lg:h-72 overflow-hidden">
                {isRearrangeMode && (
                  <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm z-10 flex items-center justify-center">
                    <GripVertical className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white opacity-75" />
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
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex gap-1 sm:gap-2 transition-opacity duration-300">
                    <button
                      onClick={() => handleEditSpeaker(speaker)}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 sm:p-2 rounded-full transition-all duration-300 shadow-lg"
                      title="Edit Speaker"
                    >
                      <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSpeaker(speaker._id)}
                      className="bg-red-500 hover:bg-red-600 text-white p-1.5 sm:p-2 rounded-full transition-all duration-300 shadow-lg"
                      title="Delete Speaker"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5 md:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
                  {speaker.name}
                </h2>
                <p className="text-purple-300 text-xs sm:text-sm mb-3 sm:mb-4">{speaker.role}</p>

                <div className="border-t border-purple-500/20 pt-3 sm:pt-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">
                    Talk Topic
                  </h3>
                  <p className="text-purple-200 text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                    {speaker.talkTitle}
                  </p>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">
                    Abstract
                  </h3>
                  <p className="text-gray-300 text-xs sm:text-sm leading-relaxed line-clamp-3">
                    {speaker.abstract}
                  </p>
                  <h3 className="text-base sm:text-lg font-semibold text-white mt-3 sm:mt-4 mb-1 sm:mb-2">
                    Biography
                  </h3>
                  <p className="text-gray-300 text-xs sm:text-sm leading-relaxed line-clamp-3">
                    {speaker.bio}
                  </p>
                  
                  {/* Mobile reorder buttons */}
                  {isRearrangeMode && isMobile && (
                    <div className="flex justify-between gap-2 mt-4 pt-3 border-t border-purple-500/20">
                      <button
                        onClick={() => moveSpeakerUp(index)}
                        disabled={index === 0}
                        className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed text-blue-400 py-2 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <ArrowUp className="w-4 h-4" />
                        <span className="text-sm">Move Up</span>
                      </button>
                      <button
                        onClick={() => moveSpeakerDown(index)}
                        disabled={index === speakers.length - 1}
                        className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed text-blue-400 py-2 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <ArrowDown className="w-4 h-4" />
                        <span className="text-sm">Move Down</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {speakers.length === 0 && (
          <div className="text-center py-12 sm:py-20">
            <div className="text-gray-400 text-base sm:text-lg mb-4">No speakers found</div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 inline-flex items-center gap-2 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
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

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}