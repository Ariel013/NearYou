# 0001 — La messagerie exige un compte léger ; chercher et contacter restent sans compte

**Statut** : adopté (2026-10-22) — à implémenter

## Contexte

Le principe fondateur du projet : on cherche, on trouve, on contacte **sans
compte**. On veut ajouter une messagerie dans l'appli : le client écrit au
prestataire, qui reçoit le message dans une boîte de réception et y répond.

Un message anonyme n'a nulle part où recevoir la réponse, ouvre la boîte des
prestataires au spam (public souvent peu digitalisé, qui abandonnerait l'outil)
et ne laisse aucune prise à la modération.

## Décision

- Chercher, voir une fiche, appeler, écrire sur WhatsApp, demander
  l'itinéraire : **toujours sans compte**.
- **Envoyer un message dans l'appli exige un compte léger** : un numéro de
  téléphone vérifié (même mécanisme que la revendication, par WhatsApp), sans
  mot de passe ni formulaire. La vérification se fait au premier message.
- **Seule une fiche revendiquée a une boîte de réception.** Sur une fiche non
  revendiquée, on garde appel et WhatsApp, et on invite le prestataire à
  revendiquer.

## Pourquoi

- La réponse a besoin d'un destinataire identifié ; l'anti-spam et la
  modération ont besoin d'un auteur.
- Un compte classique (mot de passe, e-mail) aurait fait fuir le public visé ;
  le numéro vérifié est l'identité que ce public a déjà.
- Ouvrir la messagerie sur les fiches non revendiquées aurait rempli des boîtes
  que personne ne lit.

## Conséquences

- Il faut une **vraie session serveur** (cookie signé, httpOnly) pour les
  clients et pour les prestataires : la « session » actuelle du tableau de bord
  (état navigateur + en-tête `x-provider-phone`) ne suffit pas et doit être
  remplacée avant la messagerie (voir `docs/architecture.md` §6).
- Les messages sont des **données personnelles privées** : lisibles par leurs
  seuls participants (RLS), jamais renvoyés par une route publique. Une durée
  de conservation est à décider (`A-FAIRE.md`).
- Nouvelles tables (conversations, messages) : migration additive, signalée au
  rapport de tâche.
