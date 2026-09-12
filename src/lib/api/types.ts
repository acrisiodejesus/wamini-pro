// User types
export interface User {
  id: number;
  name: string;
  localization?: string;
  mobile_number: string;
  photo?: string;
  subscription_plan?: 'free' | 'basic' | 'plus' | 'premium';
  subscription_status?: 'active' | 'inactive';
  subscription_expiry?: string;
}

export interface UserProfile extends User {
  // Profile endpoint returns same fields as User plus subscriptions
}

export interface RegisterData {
  name: string;
  localization?: string;
  mobile_number: string;
  password: string;
  photo?: string;
}

export interface LoginData {
  mobile_number: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: number;
    name: string;
  };
}

export interface RegisterResponse {
  message: string;
  user_id: number;
}

// Product types
export interface Product {
  id: number;
  name: string;
  quantity: number;
  price: number;
  photo?: string;
  publish_date: string;
  user_id: number;
}

export interface CreateProductData {
  name: string;
  quantity: number;
  price: number;
  photo?: string;
}

// Input types (agricultural inputs)
export interface Input {
  id: number;
  name: string;
  quantity: number;
  price: number;
  photo?: string;
  publish_date: string;
  user_id: number;
}

export interface CreateInputData {
  name: string;
  quantity: number;
  price: number;
  photo?: string;
}

// Transport types
export interface Transport {
  id: number;
  transport_type: string;
  name: string;
  price_per_km: number;
  photo?: string;
  user_id: number;
}

export interface CreateTransportData {
  transport_type: string;
  name: string;
  price_per_km: number;
  photo?: string;
}

// Negotiation/Chat types
export interface Negotiation {
  id: number;
  buyer_id: number;
  seller_id: number;
  product_id?: number;
  input_id?: number;
  transport_id?: number;
  status?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  other_user_id?: number | null;
  other_user_name?: string | null;
  product_name?: string | null;
  input_name?: string | null;
  transport_name?: string | null;
  last_message?: string | null;
  last_timestamp?: string;
  unread_count?: number;
}

export interface Message {
  id: number;
  sender_id: number;
  sender_name?: string;
  body: string | null;
  attachment_url?: string | null;
  attachment_type?: string | null;
  timestamp: string;
}

export interface CreateNegotiationData {
  product_id?: number;
  input_id?: number;
  transport_id?: number;
  messages?: any[];
}

export interface SendMessageData {
  body?: string;
  attachment_url?: string;
  attachment_type?: string;
}

export interface MessageResponse {
  message: string;
  data: Message;
}

// Review types
export interface Review {
  id: number;
  reviewer_id: number;
  reviewer_name: string;
  target_id: number;
  negotiation_id: number;
  rating: number;       // 1..5
  comment: string | null;
  created_at: string;
}

export interface CreateReviewData {
  target_id: number;
  rating: number;
  comment?: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  average_rating: number;
  total_count: number;
}
