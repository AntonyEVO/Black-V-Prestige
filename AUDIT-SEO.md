# Audit SEO — Black V Prestige

Date de l'audit : 2026-07-26
Périmètre : 11 pages HTML statiques + `robots.txt` + `sitemap.xml`.
**Aucune modification n'a été effectuée à ce stade — audit en lecture seule.**

---

## 1. Titres, meta descriptions, canonical — par page

| Page | `<title>` (longueur) | Meta description (longueur) | Canonical |
|---|---|---|---|
| `index.html` | "Black V Prestige — Chauffeur Privé Haut de Gamme \| France Entière 24h/24" (**76 car., trop long**) | 218 car. (**trop long**) | ✅ `https://www.blackvprestige.fr/` (⚠️ **.fr**) |
| `services.html` | "Services — Black V Prestige \| Chauffeur Privé Haut de Gamme" (62 car., limite haute) | 188 car. (**trop long**) | ❌ absent |
| `experience.html` | "L'Expérience — Black V Prestige \| Chauffeur Privé Premium" (61 car., limite haute) | 140 car. (OK) | ❌ absent |
| `notre-flotte.html` | "Notre Flotte — Mercedes Classe V \| Black V Prestige" (53 car., OK) | 171 car. (légèrement long) | ✅ `https://www.blackvprestige.fr/notre-flotte/` (⚠️ **.fr**, et le slug `/notre-flotte/` ne correspond pas au vrai chemin `/notre-flotte.html`) |
| `evenements-partenaires.html` | "Événements & Partenaires — Black V Prestige" (47 car., un peu court, pas de mot-clé métier) | 179 car. (**trop long**) | ❌ absent |
| `a-propos.html` | "À propos — Black V Prestige \| Chauffeurs Privés Haut de Gamme" (65 car., **trop long**) | 177 car. (**trop long**) | ❌ absent |
| `contact.html` | "Contact — Black V Prestige \| Chauffeur Privé 24h/24" (54 car., OK) | 141 car. (OK) | ❌ absent |
| `reservation.html` | "Réservation en ligne — Black V Prestige" (42 car., un peu court) | 170 car. (légèrement long) | ❌ absent |
| `apporteur-affaires.html` | "Apporteur d'affaires — Black V Prestige \| Programme de commission" (67 car., **trop long**) | 163 car. (légèrement long) | ❌ absent |
| `mentions-legales.html` | "Mentions légales — Black V Prestige" (38 car., court — acceptable pour une page légale) | 84 car. (court — acceptable) | ❌ absent |
| `politique-confidentialite.html` | "Politique de confidentialité — Black V Prestige" (50 car., OK) | 90 car. (court — acceptable) | ❌ absent |

**Constat :** seules 2 pages sur 11 ont une balise canonical, et les deux pointent vers `.fr` (domaine final = `.com`). Les titres et meta descriptions sont tous **uniques** (pas de duplication), ce qui est déjà bon, mais plusieurs dépassent les longueurs recommandées (title >60, description >160).

---

## 2. Structure des titres (H1)

Chacune des 11 pages contient **exactement une balise `<h1>`** — aucune page à 0 ou à 2+. Ce point est déjà conforme, aucune correction structurelle requise ici.

*(La hiérarchie Hn complète — H2/H3/H4 — n'a pas été vérifiée en détail page par page ; à valider si vous voulez aller plus loin que la présence du H1 unique.)*

---

## 3. Open Graph / Twitter Card

| Balise | Pages qui l'ont |
|---|---|
| `og:title` / `og:description` | `index.html`, `notre-flotte.html` **uniquement** (2/11) |
| `og:url` | `index.html` uniquement, valeur = `https://www.blackvprestige.fr/` (⚠️ .fr) |
| `og:image` | **Aucune page** — balise absente partout |
| `twitter:card` / `twitter:*` | **Aucune page** — absentes partout |

**Constat :** 9 pages sur 11 n'ont strictement aucune balise Open Graph. Les partages sur réseaux sociaux/messageries afficheront un aperçu vide ou générique du navigateur.

---

## 4. Cohérence de domaine

- Occurrences de `blackvprestige.fr` dans le code HTML : **4** (dans `index.html` ×2, `mentions-legales.html` ×1, `notre-flotte.html` ×1 — canonical + og:url + une mention légale + sitemap-adjacent).
- `robots.txt` référence `Sitemap: https://www.blackvprestige.fr/sitemap.xml` (⚠️ .fr).
- `sitemap.xml` : toutes les 10 URLs listées sont en `https://www.blackvprestige.fr/...` (⚠️ .fr).
- Aucune URL codée en dur vers `vercel.app` trouvée dans le HTML (bon point — les liens internes de navigation sont relatifs : `services.html`, `contact.html`, etc.). Les seules références à `vercel.app` sont dans les fichiers JS (`assets/js/booking.js`, `hero-booking.js`, `contact-form.js`, `partner-form.js`) pour les appels aux fonctions serverless — **normal et à conserver**, ce n'est pas un lien de navigation.
- ⚠️ **`sitemap.xml` ne référence pas `apporteur-affaires.html`** (page ajoutée après la dernière génération du sitemap) — page orpheline du point de vue du sitemap, bien qu'elle soit correctement liée en interne (menu Services sur toutes les pages).

---

## 5. Données structurées (JSON-LD)

**Aucune balise `<script type="application/ld+json">` n'a été trouvée sur aucune des 11 pages.** Aucun schema `LocalBusiness`, `BreadcrumbList` ou `Service` n'existe actuellement.

---

## 6. robots.txt & sitemap.xml

Les deux fichiers existent déjà à la racine.

**`robots.txt` actuel :**
```
User-agent: *
Allow: /

Sitemap: https://www.blackvprestige.fr/sitemap.xml
```

**`sitemap.xml` actuel :** 10 URLs (accueil, services, experience, notre-flotte, evenements-partenaires, a-propos, reservation, contact, mentions-legales, politique-confidentialite) — toutes en `.fr`, `lastmod` figé au 2026-07-02 (obsolète, plusieurs pages ont été modifiées depuis), et **`apporteur-affaires.html` manquante**.

---

## 7. Images

### 7.1 Attributs `alt`
Toutes les images examinées ont un attribut `alt` renseigné, à l'exception des cas **intentionnellement décoratifs** (bannières plein écran en fond, où le texte informatif est déjà présent en overlay) :
- `index.html` : 4 images `.hero2__bg-img` (diaporama bannière) + 6 images `.service-card__bg` (cartes services en fond) → `alt=""`.
- `notre-flotte.html` : 1 image `.fleet-hero__bg-img` → `alt=""`.
- `apporteur-affaires.html` : 1 image hero → `alt=""`.

Ces `alt=""` sont défendables (image de fond, information dupliquée en texte visible), mais certaines — notamment les 6 cartes services d'`index.html` (aéroport, gare, hôtels, restaurants, événements, VIP) — gagneraient à avoir un `alt` descriptif plutôt que vide, car ce sont des images de contenu illustratif, pas du pur décor. À trancher en Phase 3.

**Aucune image avec `alt` manquant ou cassé n'a été trouvée** (bon point).

### 7.2 Images Unsplash (banque d'images à remplacer)
**22 occurrences de `images.unsplash.com` réparties sur 6 fichiers :**

| Fichier | Occurrences |
|---|---|
| `index.html` | 8 |
| `services.html` | 9 |
| `notre-flotte.html` | 2 |
| `experience.html` | 1 |
| `evenements-partenaires.html` | 1 |
| `a-propos.html` | 1 |

Détail complet (page, emplacement, suggestion) à produire dans `IMAGES-A-REMPLACER.md` en Phase 3.

### 7.3 Attributs `width` / `height`
**Aucune image, sur aucune des 11 pages, n'a d'attribut `width`/`height`.** Risque de CLS (Core Web Vitals) sur les images qui ne sont pas déjà contraintes par du CSS avec un `aspect-ratio` fixe.

---

## 8. Accessibilité de base

- `<html lang="fr">` présent et correct sur les 11 pages. ✅

---

## 9. Crédibilité / cohérence

- **Email** : `blackvprestige@gmail.com` utilisé partout (header, footer, contact, JSON-LD futur) — à remplacer par une adresse pro une fois créée sur Hostinger.
- **Réseaux sociaux** : les 3 icônes du footer (Instagram, LinkedIn, Facebook) ont toutes `href="#"` — aucun vrai lien, présent identiquement sur les 11 pages (même bloc de footer dupliqué).
- **Copyright** : `© 2024 Black V Prestige` sur les 11 pages — année à mettre à jour.
- **Mentions légales** : le fichier contient déjà, en placeholders explicites : `[Numéro SIRET à compléter]` et `[Nom de l'hébergeur — à compléter]` — informations jamais renseignées, à fournir.
- **Ciblage national** : 39 occurrences de "France entière" / "partout en France" / "toute la France" réparties sur les 11 pages (le plus dense : `index.html` ×10, `notre-flotte.html` ×9). Confirme l'ampleur du travail de repositionnement local prévu en Phase 2.
- **Témoignages dupliqués** : aucune duplication de témoignage trouvée dans `index.html` lors de cette passe (le point signalé dans le brief comme "mineur" n'a pas été confirmé — à revérifier plus finement si vous voulez, mais rien d'évident détecté).

---

## Résumé — principaux chantiers identifiés

1. **Canonical/OG/domaine** : généraliser une balise canonical `.com` à toutes les pages (actuellement 2/11, en `.fr`), ajouter OG/Twitter Card partout (actuellement 2/11 pour OG partiel, 0/11 pour l'image et Twitter).
2. **JSON-LD** : entièrement absent, à créer (LocalBusiness, Service, BreadcrumbList).
3. **Sitemap/robots** : à régénérer en `.com`, ajouter `apporteur-affaires.html`, rafraîchir les `lastmod`.
4. **Titres/descriptions trop longs** : 4 titles et 5 descriptions dépassent les longueurs recommandées.
5. **Contenu national → local** : 39 mentions "France entière" à requalifier via les pages locales (Phase 2, le levier principal).
6. **Images** : 22 images Unsplash à remplacer par de vraies photos ; aucun `width`/`height` nulle part.
7. **Crédibilité** : email Gmail, réseaux sociaux `#`, copyright 2024, SIRET/hébergeur non renseignés.

---

## Variables projet — à me confirmer avant la Phase 1

D'après votre brief, plusieurs variables restent à valeur d'exemple ou manquantes. Merci de me les confirmer (voir questions ci-dessous dans ma réponse) :

- `VILLE_BASE`, `ZONES_SERVIES`, `AEROPORTS_GARES_CIBLES`
- `EMAIL_PRO_SOUHAITE` (valeur réelle, pas l'exemple)
- `SIRET` / `RAISON_SOCIALE`
- `RESEAUX_SOCIAUX` (URLs réelles ou confirmation qu'il n'y en a pas encore)
- Confirmation du domaine final : le brief indique `.com`, alors que le code existant (canonical, sitemap, robots.txt) et une mémoire de session précédente pointaient vers `.fr` — à trancher explicitly avant de tout remplacer.
