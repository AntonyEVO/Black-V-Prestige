# Checklist post-migration — Black V Prestige → Hostinger

À faire une fois le site basculé sur `https://www.blackvprestige.com` (hébergement Hostinger).

---

## 1. Étapes techniques critiques (à faire le jour même de la migration)

- [ ] **Vérifier que `.htaccess` est bien actif** sur Hostinger (redirection HTTPS + www fonctionnelles). Tester : `http://blackvprestige.com` doit rediriger vers `https://www.blackvprestige.com`.
- [ ] **Vérifier le certificat SSL** (Hostinger le provisionne généralement automatiquement via Let's Encrypt — confirmer qu'il est actif et sans avertissement navigateur).
- [ ] **Le backend (paiement, formulaires) reste sur Vercel** — seul le frontend statique déménage sur Hostinger. Les fonctions serverless (`api/create-payment-intent.js`, `send-contact.js`, `send-booking.js`, `send-partner.js`) continuent de tourner sur `https://black-v-prestige.vercel.app`. **Déjà fait dans ce chantier SEO** : la liste blanche CORS (`ALLOWED_ORIGINS`) de ces 4 fichiers a été mise à jour pour autoriser `https://www.blackvprestige.com` et `https://blackvprestige.com`. Vérifier après migration que le formulaire de contact, la réservation avec paiement et le formulaire apporteur d'affaires fonctionnent bien depuis le nouveau domaine (sinon, erreur CORS dans la console du navigateur).
- [ ] **Rediriger ou désactiver `https://antonyevo.github.io/Black-V-Prestige/`** (ancien hébergement temporaire) : soit désactiver GitHub Pages, soit laisser une redirection simple vers le nouveau domaine si vous voulez conserver un peu de "jus SEO" des liens externes déjà pointés vers l'ancienne adresse.
- [ ] Une fois la migration confirmée stable, retirer `https://antonyevo.github.io` de la liste `ALLOWED_ORIGINS` des 4 fichiers `api/*.js` (nettoyage, non urgent).

## 2. Email professionnel

- [ ] Créer l'adresse `contact@blackvprestige.com` dans le panneau Hostinger (webmail ou redirection vers une autre boîte).
- [ ] Une fois créée, remplacer `blackvprestige@gmail.com` par cette adresse dans tout le code (header, footer, contact, JSON-LD) — voir le reste du chantier SEO, Phase 5.

## 3. Google Search Console

- [ ] Ajouter la propriété `https://www.blackvprestige.com` dans Google Search Console.
- [ ] Vérifier la propriété (méthode DNS recommandée si le domaine est chez Hostinger, ou balise HTML).
- [ ] Soumettre le sitemap : `https://www.blackvprestige.com/sitemap.xml`.
- [ ] Demander l'indexation manuelle des pages prioritaires (accueil + les 8 pages locales créées) pour accélérer leur apparition dans les résultats.
- [ ] Surveiller le rapport "Pages" dans les semaines suivant la migration pour détecter d'éventuelles erreurs d'indexation.

## 4. Google Business Profile (essentiel pour le SEO local)

- [ ] Créer ou revendiquer une fiche Google Business Profile pour Black V Prestige.
- [ ] Renseigner l'adresse de zone d'intervention (Sainte-Maxime), les zones desservies (Saint-Tropez, Cannes, Nice, Monaco), le téléphone, le site web.
- [ ] Choisir la catégorie d'établissement adaptée ("Service de chauffeur privé" / "Airport shuttle service" selon disponibilité).
- [ ] Ajouter des photos réelles de la flotte dès qu'elles remplacent les images Unsplash (voir `IMAGES-A-REMPLACER.md`).
- [ ] Encourager les premiers avis clients réels — une fois obtenus et vérifiables, on pourra alors ajouter un `aggregateRating` dans le schema JSON-LD `LocalBusiness` (volontairement omis pour l'instant, faute d'avis réels).

## 5bis. Sécurité — limitation de débit (rate limiting)

Un audit de sécurité (2026-07-26) a permis de corriger deux failles critiques : la manipulation du prix payé et le contournement du contrôle CORS (voir historique Git pour le détail). Un point reste en suspens, volontairement non implémenté dans le code car il nécessiterait une nouvelle dépendance (base de données/cache externe type Redis) :

- [ ] **Activer une protection anti-abus sur le projet Vercel** : dans le tableau de bord Vercel du projet `black-v-prestige`, section **Firewall** (ou **Attack Challenge Mode**), activer une limite de requêtes par IP sur les routes `/api/*`. Sans base de données externe (Vercel KV, Upstash Redis...), un rate limiting fiable ne peut pas être codé directement dans les fonctions serverless (elles ne partagent pas d'état entre elles). L'option Vercel Firewall est la solution la plus simple sans changement de code — vérifier si elle est disponible sur le plan actuel (peut nécessiter un plan payant).
- [ ] Si le trafic d'abus devient un problème réel malgré ça, envisager d'ajouter un CAPTCHA (Cloudflare Turnstile, gratuit) sur les formulaires contact/apporteur d'affaires.

## 5. Vérifications générales

- [ ] Contrôler qu'aucun lien interne ne pointe encore vers l'ancien domaine ou vers `vercel.app`.
- [ ] Retester le parcours de réservation complet (adresse → prix → paiement Stripe) sur le nouveau domaine.
- [ ] Retester le formulaire de contact et le formulaire apporteur d'affaires sur le nouveau domaine.
- [ ] Vérifier `robots.txt` accessible à `https://www.blackvprestige.com/robots.txt` et bien à jour.
- [ ] Renseigner le SIRET / la raison sociale réelle dans `mentions-legales.html` (actuellement en placeholder `[à compléter]`).
- [ ] Ajouter les vraies URLs de réseaux sociaux dans le footer une fois les comptes créés (actuellement `href="#"`, volontairement laissés ainsi à la demande du client).
