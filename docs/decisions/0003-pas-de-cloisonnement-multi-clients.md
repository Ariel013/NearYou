# 0003 — Pas de cloisonnement multi-clients : un seul annuaire public

**Statut** : adopté (2026-10-22)

## Contexte

La méthode d'amorce demande de trancher dès le départ si le produit servira un
jour plusieurs clients isolés, car la colonne de cloisonnement coûte une
colonne au premier jour et une migration de toutes les tables plus tard.

## Décision

GéoService est **un seul annuaire public**, partagé par tous les pays et
toutes les villes. Aucune colonne de cloisonnement par client. La dimension
géographique (pays, ville) est une **donnée de filtre**, pas une frontière
d'isolation.

## Pourquoi

- Le produit n'a pas de « client » au sens locataire : il n'y a ni entreprise
  abonnée, ni données qu'un groupe ne doive pas voir d'un autre.
- La recherche se fait déjà par distance, ce qui couvre le besoin régional.

## Conséquences

- Si un jour une marque blanche ou un annuaire privé d'entreprise apparaît, cet
  ADR est à remplacer **avant** la première ligne de code concernée.
- Les seules données non publiques sont des données personnelles (numéros,
  IP, messages) : elles se protègent par participant, pas par client.
