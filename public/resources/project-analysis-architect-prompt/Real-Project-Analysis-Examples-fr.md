# Exemples d’analyse réelle — portfolio de Naïm Bsili

Ces exemples montrent à quoi peut ressembler une réponse fondée lorsque le prompt est utilisé sur le dépôt réel du portfolio. Les chemins confirmés sont séparés des hypothèses. Il s’agit de résultats d’analyse, pas d’instructions pour modifier la production.

## Exemple 1 — Publier une ressource Prompt via le CMS

**Objectif :** Publier un prompt d’analyse logicielle en plusieurs langues, avec une page de détail, une action de copie, des fichiers téléchargeables et une route publique.

**Constats confirmés :** Le site est une application React/Vite. Les détails publics d’une ressource sont rendus par `src/pages/ResourceDetailPage.jsx`, les cartes du catalogue par `src/pages/ResourcesPage.jsx`, les ressources sont normalisées dans `src/services/resources.js`, et le catalogue réel est alimenté par Supabase `content_registry`. Le déploiement passe par `.github/workflows/manual-vps-deploy.yml`.

**Chemin concerné :** La route est `/resources/:slug`. Les paramètres propres au type Prompt sont définis dans `src/config/resourceTypeDetails.js`. La page lit notamment `prompt_format`, `model_compatibility`, `variables`, `example_input`, `example_output` et `safety_notes` depuis les métadonnées CMS.

**Risques confirmés :** Une entrée peut être correcte dans Supabase alors que les fichiers liés ne sont pas présents dans le bundle statique déployé. L’ordre sûr consiste à déployer les fichiers, puis à publier l’entrée CMS. Une route qui recouvre le dossier `public/resources/<slug>` peut aussi être affectée par la priorité Nginx.

**Plan recommandé :** Ajouter et vérifier les fichiers traduits, déployer les assets, créer une entrée `content_registry` publiée avec `resource_type: prompt`, paramètres propres au type, traductions, exemples et liens, puis vérifier la route, le bouton de copie, le changement de langue et le ZIP.

## Exemple 2 — Diagnostiquer une erreur 403 sur une ressource

**Objectif :** Expliquer pourquoi la page `/resources/project-analysis-architect-prompt` peut retourner 403 alors que les fichiers retournent 200.

**Constat confirmé :** `nginx.conf` contient une règle spéciale pour les routes resource à un seul segment. L’ancienne règle testait `$uri/`, alors que le même slug existe aussi comme dossier sous `public/resources`. Nginx traitait donc le dossier au lieu de transmettre la requête à l’application React.

**Plan minimal :** Conserver le service des fichiers profonds, mais faire tomber la route à un segment vers `/index.html` sans tester le dossier lui-même. Tester ensuite le catalogue, la page de détail et les fichiers Markdown/ZIP.

## Exemple 3 — Auditer un parcours de téléchargement assisté par IA

**Objectif :** Permettre aux contacts connus de télécharger directement et demander nom, prénom et rôle aux nouveaux contacts, avec une interface traduite.

**Chemins confirmés :** La modale est `src/components/resources/ResourceLeadFormModal.jsx`, les appels marketing sont dans `src/services/marketing.js`, et la fonction Supabase `resource-ingest` traite la demande.

**Frontière de sécurité confirmée :** Le navigateur ne doit pas décider si un e-mail existe déjà. La fonction serveur doit valider la demande, appliquer les limites de débit et les contrôles de domaines jetables, puis décider si les informations de profil sont nécessaires.

**Tests recommandés :** Contact existant, nouveau contact valide, domaine jetable, adresse incorrecte, requêtes répétées, ressource non publiée, libellés EN/FR/AR et échec du téléchargement après l’enregistrement du lead.
