import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, StarHalf } from 'lucide-react';

interface VendorHeaderProps {
  name: string;
  logo: string;
  category: string;
  rating: number;
  reviews: number;
  coverImage: string;
  onBuyClick: () => void;
}

export function VendorHeader({ 
  name, 
  logo, 
  category, 
  rating, 
  reviews, 
  coverImage,
  onBuyClick 
}: VendorHeaderProps) {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-4 w-4 fill-yellow-400 stroke-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="h-4 w-4 fill-yellow-400 stroke-yellow-400" />);
    }

    return stars;
  };

  return (
    <div className="relative h-[400px]">
      <div className="absolute inset-0">
        <img
          src={coverImage}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>
      <div className="relative h-full max-w-7xl mx-auto px-4">
        <div className="flex items-end h-full pb-8">
          <div className="flex items-end gap-6 flex-1">
            <div className="bg-white p-4 rounded-lg">
              <Avatar className="h-32 w-32">
                <AvatarImage src={logo} alt={name} />
                <AvatarFallback>{name[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div className="text-white pb-4 flex-1">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-4xl font-bold">{name}</h1>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="secondary" className="bg-white/20">
                      {category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <div className="flex">
                        {renderStars(rating)}
                      </div>
                      <span>
                        {rating} ({reviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>
                <Button 
                  size="lg"
                  className="text-lg px-8"
                  onClick={onBuyClick}
                >
                  Buy Gift Card
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}