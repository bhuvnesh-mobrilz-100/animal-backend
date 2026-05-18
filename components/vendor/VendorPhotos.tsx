import { motion } from 'framer-motion';

interface VendorPhotosProps {
  images: Array<{
    url: string;
    alt: string;
  }>;
}

export function VendorPhotos({ images }: VendorPhotosProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((image, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <div className="aspect-[4/3] rounded-lg overflow-hidden">
            <img
              src={image.url}
              alt={image.alt}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}