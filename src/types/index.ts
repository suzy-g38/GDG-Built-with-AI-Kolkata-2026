export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  description: string;
  stock: number;
}

export type NetworkQuality = 'fast' | 'medium' | 'slow';
export type NetworkSource = 'chrome-ai' | 'heuristic';
