import { Product } from '../types';

const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books'];

const productNames = [
  'Wireless Noise-Cancelling Headphones', 'Ergonomic Mechanical Keyboard', 'Ultra-Wide Monitor',
  'Standing Desk Converter', 'Laptop Cooling Pad', 'USB-C Hub Pro', 'Webcam 4K', 'LED Desk Lamp',
  'Bluetooth Speaker', 'Smart Watch Series X', 'Leather Messenger Bag', 'Minimalist Wallet',
  'Running Shoes Pro', 'Yoga Mat Premium', 'Resistance Bands Set', 'Protein Shaker Bottle',
  'Ceramic Coffee Mug', 'Bamboo Cutting Board', 'Cast Iron Skillet', 'French Press Coffee Maker',
  'Linen Throw Blanket', 'Scented Candle Set', 'Succulents Planter', 'Air Purifier Compact',
  'Noise Machine Sleep Aid', 'Kindle Paperwhite', 'Novel: The Midnight Library', 'Notebook Dotted A5',
  'Fountain Pen Classic', 'Desk Calendar 2026', 'Merino Wool Sweater', 'Chino Pants Slim',
  'Oxford Button Shirt', 'Leather Belt Brown', 'Wool Beanie', 'Quarter-Zip Pullover',
  'Hiking Boots Waterproof', 'Compression Socks Pack', 'Swim Goggles', 'Jump Rope Speed',
  'Foam Roller High-Density', 'Pull-Up Bar Doorframe', 'Dumbbell Set Adjustable', 'Gym Bag Large',
  'Water Bottle Insulated', 'Portable Charger 20000mAh', 'Cable Organiser Kit', 'Monitor Arm Dual',
  'Mechanical Pencil Pack', 'Mouse Pad XXL',
];

const descriptions = [
  'Premium quality with exceptional build and performance.',
  'Designed for professionals who demand the best.',
  'A customer favourite — over 10,000 five-star reviews.',
  'Sustainable materials, lifetime craftsmanship guarantee.',
  'Ships same day. 30-day hassle-free returns.',
];

export const products: Product[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: productNames[i],
  price: Math.round(15 + (i * 6.7 + i * i * 0.3) % 285),
  image: `/images/product-${(i % 10) + 1}.jpg`,
  category: categories[i % categories.length],
  rating: Math.round((3.2 + (i * 0.37) % 1.8) * 10) / 10,
  description: descriptions[i % descriptions.length],
  stock: Math.round(5 + (i * 13) % 95),
}));
