'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Campaign, Contact, Settings, AudienceType, ContactStatus } from './types';
import { SEED_CONTACTS, DEFAULT_TEMPLATES, SEED_VERSION } from './seed-data';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function getFirstName(fullName: string): string {
  return fullName.split(' ')[0];
}


interface DataContextType {
  // Campaigns
  campaigns: Campaign[];
  createCampaign: (data: Omit<Campaign, 'id' | 'contactsSent' | 'status' | 'createdAt' | 'updatedAt'>) => Campaign;
  updateCampaign: (id: string, data: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  getCampaign: (id: string) => Campaign | undefined;
  runCampaign: (id: string) => Promise<void>;
  pauseCampaign: (id: string) => void;

  // Contacts
  contacts: Contact[];
  createContact: (data: Omit<Contact, 'id' | 'createdAt'>) => Contact;
  updateContact: (id: string, data: Partial<Contact>) => void;
  getContactsByCampaign: (campaignId: string) => Contact[];
  getContactsByAudience: (audienceType: AudienceType) => Contact[];

  // Settings
  settings: Settings;
  updateSettings: (data: Partial<Settings>) => void;

  // Stats
  stats: {
    totalSentThisMonth: number;
    emailCount: number;
    linkedinCount: number;
    responseRate: number;
    activeCampaigns: number;
  };

  // Toasts
  toasts: Toast[];
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Running campaigns
  runningCampaigns: Set<string>;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const DataContext = createContext<DataContextType | null>(null);

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}

function initContacts(): Contact[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('crm_contacts');
  const storedVersion = localStorage.getItem('crm_seed_version');
  if (stored && storedVersion === SEED_VERSION) return JSON.parse(stored);

  const contacts: Contact[] = SEED_CONTACTS.map((c) => ({
    ...c,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }));
  localStorage.setItem('crm_contacts', JSON.stringify(contacts));
  localStorage.setItem('crm_seed_version', SEED_VERSION);
  return contacts;
}

function initCampaigns(): Campaign[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('crm_campaigns');
  if (stored) return JSON.parse(stored);

  // Create some demo campaigns
  const now = new Date().toISOString();
  const demoCampaigns: Campaign[] = [
    {
      id: generateId(),
      name: 'Corporate Visits Q1 2026',
      audienceType: 'corporatif',
      status: 'active',
      contactLimit: 25,
      contactsSent: 7,
      aiPrompt: DEFAULT_TEMPLATES.corporatif.body,
      bookingLink: 'https://monorganisation.com/les-visites/',
      geography: 'Montréal',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'Spring School Outings',
      audienceType: 'ecoles',
      status: 'paused',
      contactLimit: 15,
      contactsSent: 3,
      aiPrompt: DEFAULT_TEMPLATES.ecoles.body,
      bookingLink: 'https://monorganisation.com/les-visites/',
      geography: 'Montréal, Laval',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'Media Partnerships',
      audienceType: 'institutions',
      status: 'completed',
      contactLimit: 10,
      contactsSent: 10,
      aiPrompt: DEFAULT_TEMPLATES.institutions.body,
      geography: 'Québec',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now,
    },
  ];
  localStorage.setItem('crm_campaigns', JSON.stringify(demoCampaigns));
  return demoCampaigns;
}

function initSettings(): Settings {
  if (typeof window === 'undefined') {
    return {
      apolloKey: '',
      aiApiKey: '',
      aiProvider: 'claude',
      sendgridKey: '',
      googleSheetId: '',
      linkedinConnected: false,
      googleConnected: false,
      senderEmail: 'contact@monorganisation.com',
      senderName: 'Nora Azouz',
      signature: 'Responsable communications et événements\nMon Organisation | contact@monorganisation.com | monorganisation.com',
      defaultPdfUrl: '',
      defaultBookingLink: 'https://monorganisation.com/les-visites/',
      demoMode: false,
      demoEmail: 'contact@monorganisation.com',
      bookingSheetId: '',
      bookingFormTab: 'Form Responses',
    };
  }
  const stored = localStorage.getItem('crm_settings');
  if (stored) {
    const parsed = JSON.parse(stored);
    // Backfill new fields for existing stored settings
    if (parsed.bookingSheetId === undefined) parsed.bookingSheetId = '';
    if (parsed.bookingFormTab === undefined) parsed.bookingFormTab = 'Form Responses 1';
    return parsed;
  }

  const defaults: Settings = {
    apolloKey: '',
    aiApiKey: '',
    aiProvider: 'claude',
    sendgridKey: '',
    googleSheetId: '',
    linkedinConnected: false,
    googleConnected: false,
    senderEmail: 'contact@monorganisation.com',
    senderName: 'Nora Azouz',
    signature: 'Responsable communications et événements\nMon Organisation | contact@monorganisation.com | monorganisation.com',
    defaultPdfUrl: '',
    defaultBookingLink: 'https://monorganisation.com/les-visites/',
    demoMode: false,
    demoEmail: 'contact@monorganisation.com',
    bookingSheetId: '',
    bookingFormTab: 'Form Responses',
  };
  localStorage.setItem('crm_settings', JSON.stringify(defaults));
  return defaults;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [settings, setSettings] = useState<Settings>(initSettings());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [runningCampaigns, setRunningCampaigns] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCampaigns(initCampaigns());
    setContacts(initContacts());
    setSettings(initSettings());
    setMounted(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('crm_campaigns', JSON.stringify(campaigns));
  }, [campaigns, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('crm_contacts', JSON.stringify(contacts));
  }, [contacts, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('crm_settings', JSON.stringify(settings));
  }, [settings, mounted]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const createCampaign = useCallback(
    (data: Omit<Campaign, 'id' | 'contactsSent' | 'status' | 'createdAt' | 'updatedAt'>): Campaign => {
      const now = new Date().toISOString();
      const campaign: Campaign = {
        ...data,
        id: generateId(),
        contactsSent: 0,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      };
      setCampaigns((prev) => [campaign, ...prev]);
      addToast('Campaign created successfully!', 'success');
      return campaign;
    },
    [addToast]
  );

  const updateCampaign = useCallback((id: string, data: Partial<Campaign>) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c))
    );
  }, []);

  const deleteCampaign = useCallback(
    (id: string) => {
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      addToast('Campaign deleted', 'info');
    },
    [addToast]
  );

  const getCampaign = useCallback(
    (id: string) => campaigns.find((c) => c.id === id),
    [campaigns]
  );

  const pauseCampaign = useCallback(
    (id: string) => {
      setRunningCampaigns((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      updateCampaign(id, { status: 'paused' });
      addToast('Campaign paused', 'info');
    },
    [updateCampaign, addToast]
  );

  const runCampaign = useCallback(
    async (id: string) => {
      const campaign = campaigns.find((c) => c.id === id);
      if (!campaign) return;

      const isDemoMode = settings.demoMode;

      updateCampaign(id, { status: 'active' });
      setRunningCampaigns((prev) => new Set(prev).add(id));
      addToast(
        isDemoMode
          ? `🧪 Demo — preview sent to ${settings.demoEmail}`
          : `Campaign "${campaign.name}" started`,
        isDemoMode ? 'info' : 'success'
      );

      const availableContacts: Contact[] = contacts.filter(
        (c) =>
          c.audienceType === campaign.audienceType &&
          c.status === 'a_contacter' &&
          !c.campaignId
      );

      // ── Auto-discover: pull contacts from Apollo when list is insufficient ──
      if (campaign.autoDiscover && availableContacts.length < campaign.contactLimit) {
        const needed = campaign.contactLimit - availableContacts.length;
        const pages = Math.ceil(needed / 10);
        const location = campaign.geography || 'Montreal, Quebec, Canada';

        // Build dedup sets from current contacts state
        const existingLinkedins = new Set(contacts.map((c) => c.linkedinUrl).filter(Boolean));
        const existingEmails = new Set(contacts.map((c) => c.email).filter(Boolean));

        addToast(`🔍 Discovering contacts via Apollo (${needed} needed)…`, 'info');

        for (let page = 1; page <= pages && availableContacts.length < campaign.contactLimit; page++) {
          try {
            const discoverRes = await fetch('/api/discover', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audienceType: campaign.audienceType, location, page }),
            });

            if (!discoverRes.ok) {
              const err = await discoverRes.json().catch(() => ({}));
              if (err.error === 'plan_limit') {
                addToast('⚠️ Apollo plan insufficient for auto-discovery', 'error');
              }
              break;
            }

            const { contacts: discovered } = await discoverRes.json() as { contacts: Array<{ name: string; firstName: string; lastName: string; title: string; organization: string; city: string; linkedinUrl: string; photoUrl: string | null; email: string | null }> };

            for (const dc of discovered) {
              if (availableContacts.length >= campaign.contactLimit) break;

              // Dedup check
              if (dc.linkedinUrl && existingLinkedins.has(dc.linkedinUrl)) continue;
              if (dc.email && existingEmails.has(dc.email)) continue;

              let resolvedEmail: string | undefined = dc.email || undefined;

              // Try to enrich email via LinkedIn URL lookup if missing
              if (!resolvedEmail && dc.linkedinUrl) {
                try {
                  const enrichRes = await fetch('/api/lookup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ linkedinUrl: dc.linkedinUrl }),
                  });
                  if (enrichRes.ok) {
                    const enrichData = await enrichRes.json();
                    if (enrichData.email) resolvedEmail = enrichData.email;
                  }
                } catch { /* enrichment failure is non-fatal */ }
              }

              const newContact = createContact({
                fullName: dc.name || `${dc.firstName} ${dc.lastName}`.trim() || 'Unknown Contact',
                organization: dc.organization || '',
                title: dc.title || '',
                email: resolvedEmail,
                linkedinUrl: dc.linkedinUrl || undefined,
                channel: resolvedEmail ? 'email' : 'linkedin',
                status: 'a_contacter',
                audienceType: campaign.audienceType,
              });

              availableContacts.push(newContact);
              if (dc.linkedinUrl) existingLinkedins.add(dc.linkedinUrl);
              if (resolvedEmail) existingEmails.add(resolvedEmail);

              // Add discovered contact to the audience pipeline tab in Sheets
              fetch('/api/sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  target: 'pipeline',
                  name: newContact.fullName,
                  email: newContact.email,
                  title: newContact.title,
                  org: newContact.organization,
                  linkedinUrl: newContact.linkedinUrl,
                  audienceType: newContact.audienceType,
                  channel: newContact.channel,
                  status: 'To Contact',
                }),
              }).catch(() => { /* non-fatal */ });
            }
          } catch (err) {
            console.error('Auto-discover page error:', err);
            break;
          }
        }

        addToast(`✅ ${availableContacts.length} contacts ready to send`, 'success');
      }

      const template = DEFAULT_TEMPLATES[campaign.audienceType];
      let sent = campaign.contactsSent;

      // Demo mode: pick 1 random contact, never mark as sent, never touch real contacts
      const contactsToProcess = isDemoMode
        ? [availableContacts[Math.floor(Math.random() * availableContacts.length)]].filter(Boolean)
        : availableContacts;

      for (const contact of contactsToProcess) {
        if (sent >= campaign.contactLimit) break;

        // Respect rate limits between sends
        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
          // Step 1: Generate AI-personalized message via Gemini
          let subject = template.subject;
          let body = template.body.replace('[Prénom]', getFirstName(contact.fullName));

          try {
            const genRes = await fetch('/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contactName: contact.fullName,
                contactTitle: contact.title,
                contactOrg: contact.organization,
                audienceType: campaign.audienceType,
                template: campaign.aiPrompt || template.body,
                keywords: campaign.keywords,
                pdfUrl: campaign.pdfUrl || settings.defaultPdfUrl,
                websiteUrl: 'https://monorganisation.com/les-visites/',
                bookingLink: campaign.bookingLink || settings.defaultBookingLink,
              }),
            });
            if (genRes.ok) {
              const genData = await genRes.json();
              if (genData.subject && genData.body) {
                subject = genData.subject;
                body = genData.body;
              }
            }
          } catch {
            // Fall back to template if AI unavailable
          }

          // Step 2: Send — email contacts get a real send, LinkedIn contacts are queued for manual outreach
          let sendOk = false;

          if (contact.email && contact.channel === 'email') {
            try {
              const sendRes = await fetch('/api/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: contact.email,
                  subject,
                  body,
                  senderName: settings.senderName,
                  senderEmail: settings.senderEmail,
                  demoMode: isDemoMode,
                  demoEmail: settings.demoEmail,
                  originalRecipient: `${contact.fullName} <${contact.email}>`,
                }),
              });
              sendOk = sendRes.ok;
              if (!sendOk) {
                const err = await sendRes.json().catch(() => ({}));
                console.error('Send failed for', contact.fullName, err);
              }
            } catch {
              sendOk = false;
            }
          } else {
            // LinkedIn-only contact: mark as queued, user must send manually via Recherche contact
            sendOk = true;
          }

          if (sendOk) {
            if (isDemoMode) {
              // Demo: don't mark contact as sent, don't touch Sheets
              addToast(
                `🧪 Preview sent to ${settings.demoEmail} (for: ${contact.fullName} · ${contact.organization})`,
                'info'
              );
            } else {
              const channelLabel = contact.channel === 'email' ? 'email' : 'LinkedIn (manual)';
              const sentAt = new Date().toISOString();
              setContacts((prev) =>
                prev.map((c) =>
                  c.id === contact.id
                    ? {
                        ...c,
                        campaignId: id,
                        status: 'envoye' as ContactStatus,
                        sentAt,
                        lastAction: `Sent via ${channelLabel}: ${subject}`,
                      }
                    : c
                )
              );

              sent++;
              setCampaigns((prev) =>
                prev.map((c) =>
                  c.id === id ? { ...c, contactsSent: sent, updatedAt: new Date().toISOString() } : c
                )
              );

              fetch('/api/sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  target: 'sent',
                  name: contact.fullName,
                  email: contact.email,
                  title: contact.title,
                  org: contact.organization,
                  linkedinUrl: contact.linkedinUrl,
                  audienceType: contact.audienceType,
                  subject,
                  channel: contact.channel,
                  sentAt,
                }),
              }).catch(() => { /* non-fatal */ });

              addToast(
                contact.channel === 'email'
                  ? `✉️ Email sent to ${contact.fullName} (${contact.organization})`
                  : `💼 ${contact.fullName} queued for manual LinkedIn outreach`,
                'success'
              );
            }
          } else {
            addToast(`⚠️ Send failed for ${contact.fullName} — skipped`, 'error');
          }
        } catch (err) {
          console.error('Campaign send error for', contact.fullName, err);
          addToast(`⚠️ Error for ${contact.fullName} — skipped`, 'error');
        }
      }

      if (sent >= campaign.contactLimit) {
        updateCampaign(id, { status: 'completed', contactsSent: sent });
        addToast(`🎉 Campaign "${campaign.name}" completed!`, 'success');
      }

      setRunningCampaigns((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [campaigns, contacts, settings, updateCampaign, addToast]
  );

  const createContact = useCallback(
    (data: Omit<Contact, 'id' | 'createdAt'>): Contact => {
      const contact: Contact = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      setContacts((prev) => [contact, ...prev]);
      return contact;
    },
    []
  );

  const updateContact = useCallback((id: string, data: Partial<Contact>) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }, []);

  const getContactsByCampaign = useCallback(
    (campaignId: string) => contacts.filter((c) => c.campaignId === campaignId),
    [contacts]
  );

  const getContactsByAudience = useCallback(
    (audienceType: AudienceType) => contacts.filter((c) => c.audienceType === audienceType),
    [contacts]
  );

  const updateSettings = useCallback(
    (data: Partial<Settings>) => {
      setSettings((prev) => ({ ...prev, ...data }));
      addToast('Settings saved', 'success');
    },
    [addToast]
  );

  // Compute stats
  const stats = {
    totalSentThisMonth: contacts.filter(
      (c) =>
        c.sentAt &&
        new Date(c.sentAt).getMonth() === new Date().getMonth() &&
        new Date(c.sentAt).getFullYear() === new Date().getFullYear()
    ).length,
    emailCount: contacts.filter((c) => c.channel === 'email' && c.sentAt).length,
    linkedinCount: contacts.filter((c) => c.channel === 'linkedin' && c.sentAt).length,
    responseRate: (() => {
      const sentContacts = contacts.filter((c) => c.sentAt);
      if (sentContacts.length === 0) return 0;
      const responded = sentContacts.filter(
        (c) => c.status === 'en_discussion' || c.status === 'confirme'
      ).length;
      return Math.round((responded / sentContacts.length) * 100);
    })(),
    activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
  };

  return (
    <DataContext.Provider
      value={{
        campaigns,
        createCampaign,
        updateCampaign,
        deleteCampaign,
        getCampaign,
        runCampaign,
        pauseCampaign,
        contacts,
        createContact,
        updateContact,
        getContactsByCampaign,
        getContactsByAudience,
        settings,
        updateSettings,
        stats,
        toasts,
        addToast,
        removeToast,
        runningCampaigns,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
