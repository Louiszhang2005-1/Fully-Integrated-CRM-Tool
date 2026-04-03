# Guide d'utilisation — Plateforme de Prospection de La Centrale Agricole
**Document officiel — À l'intention de Nora**
**Date : Mars 2026**

---

## À propos de cet outil

Nous avons développé une plateforme web interne qui permet à La Centrale Agricole d'envoyer des messages personnalisés (courriels et LinkedIn) à des contacts potentiels — entreprises, écoles, institutions et médias — pour les inviter à découvrir nos programmes de visites.

L'outil utilise l'intelligence artificielle pour rédiger automatiquement des messages adaptés à chaque contact, ce qui permet de gagner un temps considérable tout en maintenant un ton professionnel et chaleureux.

---

## Ce que l'outil fait concrètement

1. **Importe des contacts** (entreprises, écoles, etc.) depuis une liste ou les trouve automatiquement sur le web
2. **Génère un message personnalisé** pour chaque contact grâce à l'IA (en tenant compte de leur nom, leur organisation, leur secteur)
3. **Envoie les courriels** directement depuis la plateforme
4. **Suit l'avancement** de chaque contact (message envoyé → en discussion → confirmé ou refusé)
5. **Gère les demandes de réservation** qui arrivent via le formulaire Google

---

## Comment utiliser la plateforme — Étape par étape

### Étape 1 — Accéder à la plateforme

La plateforme s'ouvre dans un navigateur web (comme Google Chrome ou Firefox). Il n'y a rien à installer. Il suffit d'ouvrir le lien fourni et on arrive directement sur le tableau de bord.

---

### Étape 2 — Le tableau de bord (page d'accueil)

En arrivant, on voit :
- Le nombre de courriels envoyés
- Le taux de réponse
- Les campagnes en cours

Une **campagne**, c'est simplement un groupe de contacts qu'on veut contacter pour un même objectif (ex. : contacter 20 entreprises du centre-ville pour leur proposer une visite corporative).

---

### Étape 3 — Créer une nouvelle campagne

1. Cliquer sur **"Campagnes → Nouvelle campagne"** dans le menu de gauche
2. Donner un nom à la campagne (ex. : "Entreprises Montréal Printemps 2026")
3. Choisir le type de public :
   - **Corporatif** — entreprises privées
   - **Écoles** — établissements scolaires
   - **Institutions / Médias** — organisations publiques, journalistes, OBNL
4. Définir un nombre maximum de contacts à contacter
5. Un message modèle est généré automatiquement — il peut être modifié si souhaité
6. Cliquer sur **"Créer la campagne"**

---

### Étape 4 — Ajouter des contacts

Il existe trois façons d'ajouter des contacts :

**Option A — Importer un fichier CSV (liste existante)**
> Si on a déjà une liste de contacts dans Excel ou Google Sheets, on l'exporte en format CSV et on l'importe dans l'onglet **"Contacts"**.

**Option B — Découverte automatique (Apollo)**
> Dans l'onglet **"Découvrir"**, on peut chercher des contacts par ville et par secteur (ex. : "Directeurs RH à Montréal"). La plateforme trouve automatiquement des noms, courriels et profils LinkedIn.

**Option C — Ajout manuel via LinkedIn**
> Dans l'onglet **"Lookup"**, on colle le lien du profil LinkedIn d'une personne et la plateforme récupère ses informations de contact et génère un message personnalisé.

---

### Étape 5 — Envoyer les messages

1. Ouvrir la campagne depuis le tableau de bord
2. Les contacts assignés à cette campagne apparaissent dans la liste
3. Cliquer sur **"Démarrer la campagne"**
4. L'IA génère un message personnalisé pour chaque contact
5. On peut prévisualiser le message avant l'envoi
6. Cliquer sur **"Envoyer"** — le courriel part directement

> **Note :** Il existe un **mode démo** qui permet de tester l'envoi sans que les vrais contacts reçoivent les courriels. Pratique pour vérifier que tout fonctionne avant un vrai envoi.

---

### Étape 6 — Suivre les contacts

Chaque contact a un statut qu'on met à jour manuellement au fil des échanges :

| Statut | Signification |
|--------|--------------|
| À contacter | Pas encore contacté |
| Envoyé | Message envoyé, en attente de réponse |
| En discussion | La personne a répondu, échanges en cours |
| Confirmé | Visite ou collaboration confirmée |
| Refusé | La personne n'est pas intéressée |
| Ne pas contacter | À exclure des futures campagnes |

Ces statuts peuvent aussi être synchronisés avec un **Google Sheets** pour que toute l'équipe puisse les voir.

---

### Étape 7 — Gérer les demandes de réservation

L'onglet **"Réservations"** affiche toutes les demandes reçues via le formulaire Google de La Centrale Agricole.

Pour chaque demande, on peut voir :
- Le nom et l'organisation du groupe
- Le type de visite demandée
- La date souhaitée
- Le nombre de personnes
- Le **revenu estimé** calculé automatiquement

On peut ensuite cliquer sur **"Accepter"** ou **"Refuser"** — un courriel de réponse est envoyé automatiquement à la personne et la réponse est enregistrée dans Google Sheets.

---

## Ce qui est automatique vs. ce qui est manuel

| Tâche | Automatique | Manuel |
|-------|-------------|--------|
| Rédaction des messages | ✅ IA | |
| Envoi des courriels | ✅ | |
| Calcul du revenu des réservations | ✅ | |
| Synchronisation avec Google Sheets | ✅ (bouton à cliquer) | |
| Mise à jour du statut des contacts | | ✅ |
| Décision d'accepter/refuser une réservation | | ✅ |
| Import de nouveaux contacts (CSV) | | ✅ |

---

## Limitations actuelles du MVP

> **MVP** (Minimum Viable Product) signifie que c'est une première version fonctionnelle, conçue pour être utilisée et testée avant d'être améliorée.

Voici les limites actuelles à connaître :

- **Google Sheets** : maximum 5 contacts par onglet de type d'audience (limite temporaire pour les tests)
- **Découverte Apollo** : le plan gratuit limite le nombre de recherches automatiques par mois
- **Données locales** : les contacts et campagnes sont sauvegardés dans le navigateur web utilisé — si on change d'ordinateur, les données ne suivent pas (ceci sera corrigé dans une version future)
- **Un seul utilisateur à la fois** : la plateforme n'est pas encore conçue pour être utilisée par plusieurs personnes simultanément

---

## Comment faire grandir cet outil — Plan d'évolution

Voici les étapes naturelles pour transformer ce MVP en outil d'équipe robuste :

### Phase 1 — Stabilisation (immédiat)
- Tester la plateforme avec 2-3 vraies campagnes
- Valider les messages générés par l'IA
- Collecter les retours de l'équipe sur ce qui manque ou ce qui est confus

### Phase 2 — Base de données partagée (1-3 mois)
- Migrer les données du navigateur vers une **base de données en ligne** (ex. : Supabase ou Airtable)
- Permettre à plusieurs membres de l'équipe d'accéder à la même liste de contacts depuis n'importe quel appareil

### Phase 3 — Connexions élargies (3-6 mois)
- Connecter un vrai compte Apollo.io payant pour trouver des milliers de contacts automatiquement
- Activer l'envoi via un domaine professionnel @lacentraleagricole.ca pour améliorer la délivrabilité
- Intégrer un calendrier (Google Calendar) pour afficher les réservations confirmées

### Phase 4 — Automatisation avancée (6-12 mois)
- Mettre en place des **relances automatiques** (si pas de réponse après 7 jours, un 2e message est envoyé automatiquement)
- Générer des **rapports mensuels** automatiques (combien de contacts, combien de réservations, revenu généré)
- Permettre aux contacts de réserver directement depuis un lien dans le courriel (intégration avec Calendly ou autre)

---

## Glossaire — Termes importants

| Terme | Explication simple |
|-------|--------------------|
| **Campagne** | Un groupe de contacts qu'on veut rejoindre pour un même objectif |
| **Contact** | Une personne ou organisation qu'on veut approcher |
| **CSV** | Un fichier de liste de contacts exporté depuis Excel ou Google Sheets |
| **IA (Intelligence artificielle)** | Le programme qui rédige automatiquement les messages |
| **Apollo** | Un service externe qui trouve des contacts professionnels sur internet |
| **Resend** | Le service qui envoie les courriels (comme un facteur numérique) |
| **Google Sheets** | Tableau en ligne partagé (comme Excel, mais dans le nuage) |
| **MVP** | Première version de l'outil, fonctionnelle mais simplifiée |
| **Mode démo** | Mode test où les courriels ne sont pas vraiment envoyés aux contacts |

---

## Questions fréquentes

**Est-ce que les courriels vont dans les spams ?**
> Avec une bonne configuration du domaine d'envoi, non. En mode MVP, les courriels partent d'une adresse générique — pour maximiser la délivrabilité, il faudra éventuellement utiliser un domaine propre à La Centrale Agricole.

**Est-ce que les données des contacts sont sécurisées ?**
> Oui. Les données sont stockées localement dans le navigateur et ne sont pas partagées avec des tiers, sauf lorsqu'on les synchronise volontairement avec Google Sheets.

**Que se passe-t-il si l'IA génère un mauvais message ?**
> On peut toujours relire et modifier le message avant de l'envoyer. L'IA propose — l'humain décide.

**Peut-on utiliser l'outil sur téléphone ?**
> La plateforme est conçue pour ordinateur. Sur téléphone, certaines fonctions peuvent sembler petites à l'écran.

---

## Contact technique

Pour toute question technique ou demande d'évolution de la plateforme, contacter le développeur responsable du projet.

---

*Document préparé pour La Centrale Agricole — Mars 2026*
*Version MVP — Confidentiel, usage interne*
