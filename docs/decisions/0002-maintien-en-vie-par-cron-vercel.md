# 0002 — Le maintien en vie de Supabase passe par un cron Vercel, pas par GitHub

**Statut** : adopté (2026-10-22) — en place (commit `ed5cfa4`)

## Contexte

Supabase met en pause un projet gratuit après 7 jours sans activité. Un
workflow GitHub planifié « pingait » la base deux fois par semaine ; le projet
s'est pourtant retrouvé en pause, et il a fallu migrer la base vers un nouveau
compte le 2026-10-22. GitHub désactive les workflows planifiés d'un dépôt après
60 jours sans activité : dernier commit le 2026-06-29, ping arrêté fin août
(cause établie par les dates ; l'état du workflow n'a pas été relu).

## Décision

Un cron Vercel quotidien (8 h UTC, `vercel.json`) appelle `/api/keep-alive`,
qui fait une vraie lecture en base. La route refuse tout appel sans
`Authorization: Bearer $CRON_SECRET`, y compris si la variable manque. Le
workflow GitHub reste en place, en secours.

## Pourquoi

- Le cron Vercel tourne tant que l'app est déployée, **indépendamment de
  l'activité du dépôt** — exactement la situation où un maintien en vie sert.
- Le plan Hobby de Vercel autorise un cron quotidien : suffisant contre une
  pause à 7 jours.
- Un service de ping externe aurait ajouté un compte et une dépendance de plus.

## Conséquences

- `CRON_SECRET` doit exister dans les variables Vercel (en place le
  2026-10-22).
- Vérifier de temps en temps l'exécution dans Vercel → Cron Jobs : un maintien
  en vie se vérifie par son effet, pas par sa présence dans le dépôt.
- Si l'app change d'hébergeur, le maintien en vie déménage avec elle.
