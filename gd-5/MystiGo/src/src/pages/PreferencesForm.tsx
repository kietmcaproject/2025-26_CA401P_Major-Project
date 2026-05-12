import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, DollarSign, Heart, Star, Mountain, Plane } from 'lucide-react';

const PreferencesForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dates: '',
    departureCity: '',
    budget: [2000],
    preferences: [] as string[],
    mustHaves: '',
    avoid: ''
  });

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const preferences = [
    { id: 'adventure', label: 'Adventure', emoji: '🏔️', color: 'accent' },
    { id: 'luxury', label: 'Luxury', emoji: '✨', color: 'accent-yellow' },
    { id: 'family', label: 'Family Fun', emoji: '👨‍👩‍👧‍👦', color: 'accent-coral' },
    { id: 'culture', label: 'Culture', emoji: '🏛️', color: 'secondary' },
    { id: 'beach', label: 'Beach', emoji: '🏝️', color: 'accent' },
    { id: 'city', label: 'City Life', emoji: '🌆', color: 'black' },
    { id: 'nature', label: 'Nature', emoji: '🌿', color: 'accent' },
    { id: 'nightlife', label: 'Nightlife', emoji: '🎉', color: 'accent-coral' }
  ];

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Submit and navigate to reveal
      navigate('/reveal');
    }
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const togglePreference = (pref: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(pref)
        ? prev.preferences.filter(p => p !== pref)
        : [...prev.preferences, pref]
    }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center">
              <h2 className="text-3xl font-bold gradient-text mb-2">Let's Get Started!</h2>
              <p className="text-muted-foreground">Tell us a bit about yourself</p>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Your Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="glass-card border-0 text-lg py-6"
              />
              <Input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="glass-card border-0 text-lg py-6"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center">
              <h2 className="text-3xl font-bold gradient-text mb-2">When & Where?</h2>
              <p className="text-muted-foreground">Your travel logistics</p>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black" />
                <Input
                  placeholder="Travel Dates (e.g., Dec 15-22, 2024)"
                  value={formData.dates}
                  onChange={(e) => setFormData(prev => ({ ...prev, dates: e.target.value }))}
                  className="glass-card border-0 text-lg py-6 pl-14"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary" />
                <Input
                  placeholder="Departure City"
                  value={formData.departureCity}
                  onChange={(e) => setFormData(prev => ({ ...prev, departureCity: e.target.value }))}
                  className="glass-card border-0 text-lg py-6 pl-14"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center">
              <h2 className="text-3xl font-bold gradient-text mb-2">What's Your Budget?</h2>
              <p className="text-muted-foreground">Total trip budget per person</p>
            </div>
            <Card className="glass-card p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold gradient-text">${formData.budget[0]}</div>
                  <p className="text-muted-foreground">per person</p>
                </div>
                <Slider
                  value={formData.budget}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}
                  max={10000}
                  min={500}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>$500</span>
                  <span>$10,000+</span>
                </div>
              </div>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center">
              <h2 className="text-3xl font-bold gradient-text mb-2">What's Your Vibe?</h2>
              <p className="text-muted-foreground">Select all that appeal to you</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {preferences.map((pref) => (
                <Card
                  key={pref.id}
                  className={`glass-card p-4 cursor-pointer transition-all duration-300 bounce-hover ${
                    formData.preferences.includes(pref.id) ? 'ring-2 ring-black' : ''
                  }`}
                  onClick={() => togglePreference(pref.id)}
                >
                  <div className="text-center space-y-2">
                    <div className="text-3xl">{pref.emoji}</div>
                    <div className="font-medium">{pref.label}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center">
              <h2 className="text-3xl font-bold gradient-text mb-2">Final Touches</h2>
              <p className="text-muted-foreground">Any special requests?</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Must-have experiences</label>
                <Input
                  placeholder="e.g., hot air balloon, cooking class, spa day"
                  value={formData.mustHaves}
                  onChange={(e) => setFormData(prev => ({ ...prev, mustHaves: e.target.value }))}
                  className="glass-card border-0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Things to avoid</label>
                <Input
                  placeholder="e.g., heights, spicy food, crowded places"
                  value={formData.avoid}
                  onChange={(e) => setFormData(prev => ({ ...prev, avoid: e.target.value }))}
                  className="glass-card border-0"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-4">
      {/* Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="floating absolute top-20 left-10 text-4xl">✈️</div>
        <div className="floating-delayed absolute top-40 right-20 text-3xl">🌍</div>
        <div className="floating absolute bottom-40 left-20 text-3xl">🎒</div>
        <div className="floating-delayed absolute top-60 left-1/2 text-2xl">⭐</div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <Card className="glass-card p-6 mb-8">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </Card>

        {/* Form Content */}
        <Card className="glass-card p-8">
          {renderStep()}
          
          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={step === 1}
              className="glass-button"
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              className="glass-button ripple-button"
            >
              {step === totalSteps ? 'Create My Surprise Trip!' : 'Next'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PreferencesForm;