export type AudienceType = 'corporatif' | 'ecoles' | 'institutions';

export type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft';

export type ContactStatus =
  | 'a_contacter'
  | 'envoye'
  | 'en_discussion'
  | 'confirme'
  | 'refuse'
  | 'ne_pas_contacter';

export type Channel = 'email' | 'linkedin';

export interface Campaign {
  id: string;
  name: string;
  audienceType: AudienceType;
  status: CampaignStatus;
  contactLimit: number;
  contactsSent: number;
  aiPrompt: string;
  pdfUrl?: string;
  bookingLink?: string;
  geography?: string;
  autoDiscover?: boolean;
  keywords?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  campaignId?: string;
  fullName: string;
  organization: string;
  title: string;
  email?: string;
  linkedinUrl?: string;
  phone?: string;
  channel: Channel;
  status: ContactStatus;
  audienceType: AudienceType;
  notes?: string;
  nbPeople?: number;
  levels?: string;
  opportunity?: string;
  lastAction?: string;
  nextContact?: string;
  sentAt?: string;
  createdAt: string;
}

export interface Settings {
  apolloKey: string;
  aiApiKey: string;
  aiProvider: 'claude' | 'openai';
  sendgridKey: string;
  googleSheetId: string;
  linkedinConnected: boolean;
  googleConnected: boolean;
  senderEmail: string;
  senderName: string;
  signature: string;
  defaultPdfUrl: string;
  defaultBookingLink: string;
  demoMode: boolean;
  demoEmail: string;
  bookingSheetId: string;
  bookingFormTab: string;
}

export type BookingStatus = 'pending' | 'accepted' | 'refused' | 'cancelled';
export type VisitType = 'alimentaire' | 'agriculture_urbaine' | 'economie_circulaire' | 'culinaire';
export type GroupType = 'corporatif' | 'scolaire' | 'institution';
export type CulinaryFormula = 'none' | 'decouverte' | 'degustation' | 'boite_lunch' | 'buffet' | 'cocktail';

export interface BookingRequest {
  id: string;
  rowIndex: number;
  timestamp: string;
  fullName: string;
  email: string;
  phone?: string;
  organization: string;
  groupType: GroupType;
  visitType: VisitType;
  preferredDate: string;
  nbPeople: number;
  culinaryFormula: CulinaryFormula;
  notes?: string;
  adminResponse?: string;
}

export const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  alimentaire: 'Food System',
  agriculture_urbaine: 'Urban Agriculture',
  economie_circulaire: 'Circular Economy',
  culinaire: 'Culinary Experience',
};

export const GROUP_TYPE_LABELS: Record<GroupType, string> = {
  corporatif: 'Corporate',
  scolaire: 'School / Non-profit',
  institution: 'Institution / Media',
};

export const CULINARY_FORMULA_LABELS: Record<CulinaryFormula, string> = {
  none: 'None',
  decouverte: 'Discovery ($12/person)',
  degustation: 'Tasting ($10/person)',
  boite_lunch: 'Lunch Box ($21/person)',
  buffet: 'Cold Buffet ($30/person)',
  cocktail: 'Cocktail Dinner ($47.50/person)',
};

export const AUDIENCE_LABELS: Record<AudienceType, string> = {
  corporatif: 'Corporate',
  ecoles: 'Schools',
  institutions: 'Institutions & Media',
};

export const STATUS_LABELS: Record<ContactStatus, string> = {
  a_contacter: 'To Contact',
  envoye: 'Sent',
  en_discussion: 'In Discussion',
  confirme: 'Confirmed',
  refuse: 'Refused',
  ne_pas_contacter: 'Do Not Contact',
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  active: 'Active',
  paused: 'On Hold',
  completed: 'Completed',
  draft: 'Draft',
};
