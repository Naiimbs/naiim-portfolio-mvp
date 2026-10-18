# Guide & Toolkit de conception de workflows IA

## Transformer un processus confus en automatisation fiable et centrée sur l’humain

Ce playbook aide les designers, fondateurs, opérateurs et builders IA à décider quoi automatiser, où l’IA apporte de la valeur et où le jugement humain doit rester présent.

## 1. Commencer par le résultat
Choisissez un processus récurrent avec un responsable et un résultat mesurable. Les bons candidats sont répétitifs, riches en informations, lents ou sujets aux erreurs. Commencez par le résultat, pas par l’outil.

Écrivez : Quand **[déclencheur]** arrive, **[personne/système]** réalise **[étapes]** afin d’obtenir **[résultat]**.

## 2. Cartographier l’existant
Pour chaque étape, notez le responsable, le déclencheur, les entrées, l’action, la décision, la sortie, l’outil, le problème et les exceptions. Un workflow qui ne fonctionne que dans le cas idéal n’est pas prêt pour la production.

## 3. Choisir le mode d’automatisation
- **Manuel :** rare, sensible, créatif ou difficile à évaluer.
- **Assisté par IA :** extraction, classification, résumé, comparaison ou rédaction avec validation humaine.
- **Automatisé :** actions déterministes avec des règles claires, comme créer une tâche ou synchroniser des champs.
- **Gate humain :** avant toute communication externe, décision financière, juridique, médicale, recrutement, suppression ou publication.

## 4. Concevoir le workflow cible
Utilisez six couches : **Déclencheur → Contexte → Tâche de raisonnement → Validation → Approbation humaine → Action et journalisation**. Chaque étape IA doit être précise, testable et produire une sortie structurée.

## 5. Tester qualité et sécurité
Testez les cas normaux, incomplets, contradictoires, dupliqués, adversariaux et limites. Suivez l’exactitude, le taux de correction, le temps gagné, les échecs, le coût et la confiance utilisateur. Ajoutez permissions, limites, logs, rollback et monitoring.

## Exemple : agent de recherche d’emploi
Chaque jour, le workflow collecte des offres, évalue l’adéquation selon des critères explicites, supprime les doublons et explique les preuves. La personne valide la shortlist avant toute candidature.

## Checklist finale
Le résultat est-il mesurable ? Le responsable est-il identifié ? Les sources sont-elles explicites ? Les étapes IA sont-elles étroites ? Les valeurs manquantes sont-elles sûres ? Les actions sont-elles journalisées et réversibles ?
