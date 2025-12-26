
export type QuoteStatus = 'draft' | 'sent' | 'booked' | 'cancelled';

export type ItemType = 'flight' | 'hotel' | 'activity' | 'transfer' | 'other';

export interface ItineraryItem {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  day: number;
  city?: string;
  time?: string;
  inclusions?: string[];
  exclusions?: string[];
}

export interface ClientDetails {
  name: string;
  email: string;
  phone?: string;
  travelers: {
    adults: number;
    children: number;
    infants: number;
  };
}

export interface Quote {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  client: ClientDetails;
  items: ItineraryItem[];
  status: QuoteStatus;
  createdAt: string;
  notes?: string;
  
  // Pricing breakdown
  pricePerAdult: number;
  pricePerChild: number;
  pricePerInfant: number;
  currency: string;
  
  inclusions: string[];
  exclusions: string[];
  cancellationPolicy: string;
  flightDetails: string;
  hotelDetails: string;

  // Baggage & Meta
  baggageDetails?: string;
  baggageRate?: number;
  baggagePcs?: number;
  generatedBy?: string;

  // Extra section
  extraTitle?: string;
  extraRate?: number;
  extraPax?: number;
}

export interface GeminiItineraryRequest {
  destination: string;
  durationDays: number;
  travelers: string; 
  budgetLevel: 'budget' | 'moderate' | 'luxury';
  interests: string;
}

export interface MasterItem {
    title: string;
    description: string;
    city?: string;
    inclusions?: string[];
    exclusions?: string[];
}

export interface ItineraryTemplate {
  name: string;
  destination: string;
  items: Omit<ItineraryItem, 'id'>[];
}

export interface Library {
  inclusions: string[];
  exclusions: string[];
  cancellationPolicies: string[];
  flightTemplates: string[];
  hotelTemplates: string[];
  flights: MasterItem[];
  activities: MasterItem[];
  transfers: MasterItem[];
  hotels: MasterItem[];
  others: MasterItem[];
  itineraryTemplates: ItineraryTemplate[];
}
