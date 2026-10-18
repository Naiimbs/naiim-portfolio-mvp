# Pack de prompts pour workflows IA

## Extraction structurée
Rôle : extraire uniquement les actions explicites de la source.
Tâche : identifier le titre, le responsable, l’échéance, la priorité, la preuve et la confiance.
Règles : utiliser uniquement la source fournie, ne rien inventer, retourner un JSON et utiliser null si l’information manque.

## Classification
Classer chaque élément dans les catégories autorisées. Retourner catégorie, confiance, preuve et review_required. Si la confiance est basse, demander une revue humaine.

## Réunion vers tâches
Transformer les notes en tâches explicites uniquement. Séparer décisions, questions et tâches. Conserver la preuve originale et signaler les responsables ou dates ambiguës.

## Synthèse de recherche
Comparer les sources fournies, conserver les liens, distinguer faits et interprétations, relever les conflits et produire une recommandation avec incertitudes et questions de revue humaine.

## Revue avant action
Avant toute action externe ou à impact élevé, résumer l’action, les preuves, les risques, les informations manquantes et le rollback. Ne pas exécuter sans approbation explicite.
