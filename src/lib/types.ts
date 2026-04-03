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
  alimentaire: 'Système alimentaire',
  agriculture_urbaine: 'Agriculture urbaine',
  economie_circulaire: 'Économie circulaire',
  culinaire: 'Expérience culinaire',
};

export const GROUP_TYPE_LABELS: Record<GroupType, string> = {
  corporatif: 'Corporatif',
  scolaire: 'Scolaire / OBNL',
  institution: 'Institution / Média',
};

export const CULINARY_FORMULA_LABELS: Record<CulinaryFormula, string> = {
  none: 'Aucune',
  decouverte: 'Découverte (12$/pers)',
  degustation: 'Dégustation (10$/pers)',
  boite_lunch: 'Boîte à lunch (21$/pers)',
  buffet: 'Buffet froid (30$/pers)',
  cocktail: 'Cocktail dinatoire (47,50$/pers)',
};

export const AUDIENCE_LABELS: Record<AudienceType, string> = {
  corporatif: 'Corporatif',
  ecoles: 'Écoles',
  institutions: 'Institutions & Médias',
};

export const STATUS_LABELS: Record<ContactStatus, string> = {
  a_contacter: 'À contacter',
  envoye: 'Envoyé',
  en_discussion: 'En discussion',
  confirme: 'Confirmé',
  refuse: 'Refusé',
  ne_pas_contacter: 'Ne pas contacter',
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  active: 'Active',
  paused: 'En pause',
  completed: 'Terminée',
  draft: 'Brouillon',
};
