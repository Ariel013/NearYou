# 0005 — Suggestions d'adresses par Photon (OpenStreetMap), via notre API

**Statut** : adopté (2026-10-25)

## Contexte

À la création d'une fiche, l'adresse était un texte libre et la position une
épingle à glisser. Kevin veut des propositions pendant la frappe (« rue du
pa… » → les rues qui existent). Au Bénin et en Côte d'Ivoire, les adresses
postales sont rares : on se repère au quartier et au lieu repère (carrefour,
marché, pharmacie), et beaucoup de rues portent un nom officiel que personne
n'emploie (« Rue 7.020 »).

Mesuré le 2026-10-25 sur le service public Photon : rues d'Abidjan trouvées
(« rue du pa » → Rue du Partage, Rue du Paradis…), quartiers de Cotonou
(Fidjrossé), lieux repères (Carrefour la Vie) ; sans filtre, des résultats du
Nigeria et du Ghana remontent ; en sens inverse, un point donne son quartier
(« Fidjrossé, Cotonou »).

## Décision

- **Photon** (komoot, données OpenStreetMap) : gratuit, sans clé, fait pour
  l'autocomplétion.
- **Appelé par notre API** (`/api/geocode`, `/api/geocode/reverse`), jamais
  directement par le navigateur : l'IP de l'usager reste chez nous, la
  réponse est validée et filtrée (Bénin et Côte d'Ivoire seulement, proches
  de l'épingle d'abord), et un changement de fournisseur ne touche pas le
  client.
- **Choisir une suggestion place l'épingle** ; poser l'épingle remplit le
  quartier tant que la personne n'a rien tapé. Le texte libre reste accepté.

## Écartés

- **Nominatim** : ses règles d'usage interdisent l'autocomplétion.
- **Google Places** : meilleure couverture, mais payant au-delà du quota,
  clé et facturation, et conditions d'affichage contraignantes hors carte
  Google. À reconsidérer si Photon déçoit sur le terrain.
- **MapTiler, Geoapify** : mêmes données OpenStreetMap, avec clé et quota ;
  replis possibles.

## Conséquences

- Dépendance à un service public sans engagement : s'il est lent ou tombe,
  le champ redevient un texte libre (délai de 4 s, aucune erreur affichée).
  Au-delà de l'usage d'avant lancement : héberger Photon ou passer à un
  fournisseur à clé, derrière la même API.
- Réponses mises en cache un jour par le CDN ; le biais de proximité est
  arrondi à ~10 km et le point inversé à ~10 m pour que le cache serve.
- Ces deux routes sont publiques et sans limite de débit, comme le reste de
  l'API : un abus se répercuterait sur Photon. La limite de débit est au
  backlog.
- Ce que la personne tape part chez Photon depuis notre serveur ; ni son
  identité ni son numéro.
