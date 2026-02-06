"use client";

import { useState } from "react";

interface CreateFoodSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    measurement: string;
    calories: string;
  }) => void;
}

export default function CreateFoodSidebar({
  isOpen,
  onClose,
  onSubmit,
}: CreateFoodSidebarProps) {
  const [formData, setFormData] = useState({
    name: "",
    measurement: "",
    calories: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: "", measurement: "", calories: "" });
  };

  const handleClose = () => {
    setFormData({ name: "", measurement: "", calories: "" });
    onClose();
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full bg-white dark:bg-zinc-950 shadow-lg z-50 flex flex-col transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={handleClose}
          className="text-black dark:text-zinc-50 font-semibold"
        >
          Back
        </button>
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          Create Food
        </h2>
        <div className="w-12" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-4">
        <div className="space-y-4 flex-1">
          <div>
            <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
              Food Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
              placeholder="e.g., Chicken Breast"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
              Measurement
            </label>
            <input
              type="text"
              value={formData.measurement}
              onChange={(e) =>
                setFormData({ ...formData, measurement: e.target.value })
              }
              className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
              placeholder="e.g., 100g"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
              Calories
            </label>
            <input
              type="number"
              value={formData.calories}
              onChange={(e) =>
                setFormData({ ...formData, calories: e.target.value })
              }
              className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
              placeholder="0"
            />
          </div>
        </div>

        {/* Submit Button - Fixed at Bottom */}
        <button
          type="submit"
          className="h-12 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors mt-4"
        >
          Add Food
        </button>
      </form>
    </div>
  );
}
