'use client';

import { useParams } from 'next/navigation';
import { ArrowLeft, User, MapPin, Tag, Star, MessageCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { Settings } from 'lucide-react';


const MOCK_PRODUCT = {
  id: '1',
  name: 'Tomate - 50kg - MURIASE',
  category: 'Produto Agricola',
  price: 70,
  unit: 'kg',
  quantity: 50,
  location: 'Muriase',
  distance: '135 km de você',
  seller: { 
    id: '1', 
    name: 'João João',
    rating: 4.5,
    reviewCount: 12
  },
  image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800',
  description: 'Tomate fresco de alta qualidade, cultivado organicamente.',
};

const MOCK_REVIEWS = [
  {
    id: 1,
    user: 'Antônio Guerra',
    rating: 4.5,
    comment: 'Ele é muito serio e tem produto de qualidade, gostei de trabalhar com ele.',
    date: '2 dias atrás'
  },
];

const SIMILAR_PRODUCTS = [
  {
    id: '2',
    name: 'Pepino - 50kg - MURIASE',
    price: 100,
    unit: 'kg',
    seller: 'Rafael Quinze',
    image: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: '3',
    name: 'Cebola - 180kg - Malema',
    price: 70,
    unit: 'kg',
    seller: 'João João',
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=400',
  },
];

export default function ProductDetailPage() {
  const params = useParams();
  const product = MOCK_PRODUCT; 

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gray-50 md:ml-64 pb-20">
        <header className="bg-white p-4 md:p-6 flex justify-between items-center shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Link href="/market" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-2xl md:text-3xl font-black logo-wamini">
              Wamini
            </h1>
          </div>
          <div className="flex gap-3">
            <LanguageSwitcher />
            <Link href="/settings" className="p-2 rounded-full hover:bg-gray-100">
              <Settings size={24} />
            </Link>
          </div>
        </header>
        <main className="p-4 md:p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-96 object-cover"
                />
              </div>
            </div>
            <div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-4">{product.name}</h2>
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                  <div className="w-10 h-10 rounded-full gradient-wamini flex items-center justify-center font-bold">
                    {product.seller.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-1">
                      <User size={16} />
                      {product.seller.name}
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="flex items-center gap-2 text-gray-600">
                    <MapPin size={18} className="text-orange-500" />
                    <span className="text-orange-500 font-medium">{product.distance}</span>
                  </p>
                </div>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag size={18} />
                    <span className="text-2xl font-bold">{product.price} mts/kg</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="flex-1 btn-gradient py-3 font-bold">
                    FALAR COM VENDOR
                  </button>
                  <Link 
                    href={`/profile/${product.seller.id}`}
                    className="px-6 py-3 border-2 border-black rounded-3xl font-bold hover:bg-gray-50 transition-colors"
                  >
                    VER PERFIL
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Avaliações</h3>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={16} 
                      className={i < Math.floor(product.seller.rating) ? 'fill-orange-500 text-orange-500' : 'text-gray-300'} 
                    />
                  ))}
                </div>
              </div>

              {MOCK_REVIEWS.map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold">
                      {review.user.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{review.user}</p>
                      <p className="text-gray-600 text-sm mt-1 italic">"{review.comment}"</p>
                    </div>
                  </div>
                </div>
              ))}

              <button className="mt-4 text-sm font-medium hover:underline" style={{
                background: 'linear-gradient(135deg, #D8FF12 0%, #FBB03B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                CARREGAR MAIS AVALIAÇÕES
              </button>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-4">Produtos Similares</h3>
              
              <div className="space-y-4">
                {SIMILAR_PRODUCTS.map((item) => (
                  <Link
                    key={item.id}
                    href={`/market/${item.id}`}
                    className="flex gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">{item.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                        <Tag size={12} />
                        <span>{item.price} mts/{item.unit}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <User size={12} />
                        <span>{item.seller}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
      <MobileNav />
    </>
  );
}
