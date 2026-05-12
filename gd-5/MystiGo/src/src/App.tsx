import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PreferencesForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    budget: "",
    duration: "",
    travelType: "",
    people: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = () => {
    // optional: validate
    if (!formData.budget || !formData.duration || !formData.travelType) {
      alert("Please fill all fields");
      return;
    }

    // आगे reveal page पे भेज दो
    navigate("/reveal");
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white text-black rounded-2xl p-6 shadow-xl">

        <h2 className="text-2xl font-bold mb-4 text-center">
          Plan Your Mystery Trip ✈️
        </h2>

        {/* Budget */}
        <div className="mb-4">
          <label className="block text-sm mb-1">Budget</label>
          <select
            className="w-full border rounded-lg px-3 py-2"
            onChange={(e) => handleChange("budget", e.target.value)}
          >
            <option value="">Select Budget</option>
            <option value="low">₹10k - ₹30k</option>
            <option value="medium">₹30k - ₹70k</option>
            <option value="high">₹70k+</option>
          </select>
        </div>

        {/* Duration */}
        <div className="mb-4">
          <label className="block text-sm mb-1">Duration</label>
          <select
            className="w-full border rounded-lg px-3 py-2"
            onChange={(e) => handleChange("duration", e.target.value)}
          >
            <option value="">Select Duration</option>
            <option value="short">2-3 Days</option>
            <option value="medium">4-7 Days</option>
            <option value="long">7+ Days</option>
          </select>
        </div>

        {/* Travel Type */}
        <div className="mb-4">
          <label className="block text-sm mb-1">Travel Type</label>
          <select
            className="w-full border rounded-lg px-3 py-2"
            onChange={(e) => handleChange("travelType", e.target.value)}
          >
            <option value="">Select Type</option>
            <option value="adventure">Adventure</option>
            <option value="relax">Relax</option>
            <option value="luxury">Luxury</option>
          </select>
        </div>

        {/* People */}
        <div className="mb-6">
          <label className="block text-sm mb-1">People</label>
          <select
            className="w-full border rounded-lg px-3 py-2"
            onChange={(e) => handleChange("people", e.target.value)}
          >
            <option value="">Select People</option>
            <option value="solo">Solo</option>
            <option value="couple">Couple</option>
            <option value="group">Group</option>
          </select>
        </div>

        {/* Button */}
        <Button
          onClick={handleSubmit}
          className="w-full bg-black text-white hover:bg-black/90 rounded-lg"
        >
          Reveal My Trip 🎁
        </Button>

      </div>
    </div>
  );
};

export default PreferencesForm;