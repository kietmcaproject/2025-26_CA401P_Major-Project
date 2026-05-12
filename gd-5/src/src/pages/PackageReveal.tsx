import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, DollarSign, Share, Heart, MessageCircle, Eye, EyeOff } from 'lucide-react';

const PackageReveal = () => {
  const navigate = useNavigate();
  const [revealedCards, setRevealedCards] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const packages = [
    {
      id: 1,
      destination: 'Kyoto, Japan',
      image: '/api/placeholder/400/300',
      duration: '7 days',
      price: '$2,400',
      highlights: ['Cherry Blossoms', 'Temple Tours', 'Tea Ceremony'],
      itinerary: [
        'Day 1-2: Traditional Ryokan Experience',
        'Day 3-4: Bamboo Forest & Golden Pavilion',
        'Day 5-7: Cultural Workshops & Gardens'
      ],
      vibe: 'Cultural & Serene'
    },
    {
      id: 2,
      destination: 'Santorini, Greece',
      image: '/api/placeholder/400/300',
      duration: '6 days',
      price: '$1,900',
      highlights: ['Sunset Views', 'Wine Tasting', 'Beach Clubs'],
      itinerary: [
        'Day 1-2: Oia Village & Caldera Views',
        'Day 3-4: Volcanic Islands & Hot Springs',
        'Day 5-6: Local Cuisine & Beach Time'
      ],
      vibe: 'Romantic & Luxurious'
    },
    {
      id: 3,
      destination: 'Patagonia, Chile',
      image: '/api/placeholder/400/300',
      duration: '10 days',
      price: '$3,200',
      highlights: ['Torres del Paine', 'Glacier Trekking', 'Wildlife Safari'],
      itinerary: [
        'Day 1-3: Base Camp & Preparation',
        'Day 4-7: Multi-day Trekking Adventure',
        'Day 8-10: Glacier Tours & Wildlife'
      ],
      vibe: 'Adventure & Nature'
    }
  ];

  const revealCard = (cardId: number) => {
    if (revealedCards.includes(cardId)) return;
    
    setRevealedCards(prev => [...prev, cardId]);
    setShowConfetti(true);
    
    // Hide confetti after animation
    setTimeout(() => setShowConfetti(false), 2000);
  };

  const ConfettiEffect = () => (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-bounce-in"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            fontSize: `${Math.random() * 20 + 10}px`
          }}
        >
          {['🎉', '✨', '🎊', '⭐', '💫'][Math.floor(Math.random() * 5)]}
        </div>
      ))}
    </div>
  );

  const PackageCard = ({ pkg, isRevealed, onReveal }: { 
    pkg: typeof packages[0], 
    isRevealed: boolean, 
    onReveal: () => void 
  }) => (
    <Card className="relative group">
      {/* Front (Hidden) */}
      {!isRevealed && (
        <div
          onClick={onReveal}
          className="glass-card p-8 cursor-pointer transition-all duration-500 hover:scale-105 h-96 flex items-center justify-center"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          <div className="text-center space-y-4">
            <div className="text-6xl animate-bounce-in">🎁</div>
            <h3 className="text-2xl font-bold gradient-text">Mystery Destination</h3>
            <p className="text-muted-foreground">Click to reveal your surprise!</p>
            <Button className="glass-button ripple-button">
              <Eye className="mr-2 h-4 w-4" />
              Reveal Package
            </Button>
          </div>
        </div>
      )}

      {/* Back (Revealed) */}
      {isRevealed && (
        <div className="glass-card overflow-hidden animate-fade-in-up">
          {/* Destination Image */}
          <div className="h-48 bg-gradient-to-br from-black to-secondary relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-4 left-4 text-white">
              <h3 className="text-2xl font-bold">{pkg.destination}</h3>
              <Badge variant="secondary" className="mt-1">
                {pkg.vibe}
              </Badge>
            </div>
          </div>

          {/* Package Details */}
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {pkg.duration}
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {pkg.price}
                </div>
              </div>
            </div>

            {/* Highlights */}
            <div>
              <h4 className="font-semibold mb-2">Highlights</h4>
              <div className="flex flex-wrap gap-2">
                {pkg.highlights.map((highlight, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="bounce-hover"
                  >
                    {highlight}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Itinerary */}
            <div>
              <h4 className="font-semibold mb-2">Your Journey</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {pkg.itinerary.map((day, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="w-2 h-2 rounded-full bg-black mt-2 mr-3 flex-shrink-0" />
                    {day}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-4">
              <Button size="sm" className="glass-button flex-1 ripple-button">
                <Heart className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" className="glass-button">
                <Share className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button size="sm" variant="outline" className="glass-button">
                <MessageCircle className="h-4 w-4 mr-1" />
                Chat
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen p-4">
      {/* Confetti Effect */}
      {showConfetti && <ConfettiEffect />}

      {/* Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="floating absolute top-20 left-10 text-4xl">🎉</div>
        <div className="floating-delayed absolute top-40 right-20 text-3xl">✈️</div>
        <div className="floating absolute bottom-40 left-20 text-3xl">🌟</div>
        <div className="floating-delayed absolute top-60 right-10 text-2xl">🎊</div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-5xl font-bold gradient-text mb-4">
            🎁 Your Surprise Travel Packages!
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            We've crafted 3 amazing journeys just for you. Click each package to reveal your adventure!
          </p>
          <div className="flex justify-center space-x-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <MapPin className="h-4 w-4 mr-2" />
              Personalized for You
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Calendar className="h-4 w-4 mr-2" />
              Available Dates
            </Badge>
          </div>
        </div>

        {/* Package Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              isRevealed={revealedCards.includes(pkg.id)}
              onReveal={() => revealCard(pkg.id)}
            />
          ))}
        </div>

        {/* Action Buttons */}
        {revealedCards.length > 0 && (
          <div className="text-center space-y-4 animate-fade-in-up">
            <div className="flex justify-center space-x-4">
              <Button 
                size="lg" 
                className="glass-button ripple-button px-8"
                onClick={() => navigate('/dashboard')}
              >
                Book Your Adventure
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="glass-button px-8"
                onClick={() => navigate('/preferences')}
              >
                Create Another Trip
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Need help deciding? Chat with our travel assistant below!
            </p>
          </div>
        )}
      </div>

      {/* Floating Chat Button */}
      <Button
        size="lg"
        className="fixed bottom-6 right-6 rounded-full w-16 h-16 glass-button ripple-button shadow-floating"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default PackageReveal;