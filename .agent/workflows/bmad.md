# WORKFLOW : MÉTHODE BMAD (BEHAVIOR-MODEL-ACTION-PROOF)

Ce workflow impose une gouvernance stricte de niveau Senior Architecte pour garantir la qualité et la sécurité du projet. Il combine les principes BMAD avec les capacités d'orchestration d'agents de Google Antigravity.

## PHASE B : BEHAVIOR & CONTEXTE (COMPORTEMENT)

1. **Analyse Cognitive** : Tu DOIS initier chaque tâche par un bloc `<thought>` pour décomposer le besoin utilisateur et identifier les risques.

2. **Investigation MCP** : Utilise systématiquement le serveur MCP `context7` pour valider les documentations et APIs (LangChain, LangGraph, Docling) avant de planifier.

3. **Audit de Sécurité** : Vérifie que les secrets sont isolés dans le `.env` et que l'exécution reste confinée au workspace actuel.

## PHASE M : MODEL & PLANNING (MODÉLISATION)

1. **Protocole Artifact-First** : Ne génère aucun code sans avoir créé l'artefact `artifacts/plan_[task_id].md`.

2. **Structure du Plan** : Le plan doit inclure :
   - Objectifs Lean (élimination du gaspillage)
   - Liste des fichiers impactés (priorité au dossier `src/`)
   - Stratégie de tests unitaires (TDD via pytest)

3. **Validation Humaine** : Arrête-toi et demande une revue de l'artefact avant de passer à l'action.

### Agents BMAD et Livrables

| Agent Persona | Rôle Principal | Livrable Clé |
|--------------|----------------|--------------|
| **Analyste** | Recherche et validation | Project Brief |
| **Product Manager** | Définition des besoins | PRD.md |
| **Architecte** | Conception système | Architecture Docs |
| **Product Owner** | Préparation et découpage | Sharded Epics |
| **Scrum Master** | Orchestration des tâches | Story Files |
| **Développeur** | Codage et tests unitaires | Code source |
| **QA / Quinn** | Validation et qualité | Rapports de tests |

## PHASE A : ACTION & DÉVELOPPEMENT (ACTION)

### Phase 1 : Analyse et Recherche
- **Agent** : L'Analyste
- **Actions** : Étude de marché, analyse concurrentielle, définition du cas d'usage
- **Livrable** : Project Brief (mémo de projet)

### Phase 2 : Planification et Ingénierie des Besoins
- **Agent** : Product Manager (PM)
- **Actions** : Traduction du brief en fonctionnalités, définition des Epics et hiérarchisation des User Stories
- **Livrable** : PRD.md (Product Requirements Document)

### Phase 3 : Architecture et Solution Technique
- **Agent** : L'Architecte
- **Actions** : Sélection de la pile technologique (Tech Stack), conception de la base de données, spécification des API
- **Livrable** : Documents d'architecture, diagrammes de flux, protocoles de sécurité

### Phase 3.5 : Document Sharding (Découpage)
- **Agent** : Product Owner (PO)
- **Actions** : Découper le PRD monolithique en fichiers d'Epics individuels focalisés
- **Bénéfice** : Réduit la consommation de tokens jusqu'à 90% et améliore la précision de l'IA

### Phase 4 : Implémentation et Développement Agile

1. **Création des Stories** :
   - Agent : Scrum Master (SM)
   - Transforme les Epics en Story Files ({epicNum}.{storyNum}.story.md)

2. **Codage** :
   - Agent : Développeur (Dev)
   - Implémente selon les story files et le Control Manifest
   - **Standards Python 2025** : PEP 8 (Black), PEP 257 (Google Docstrings), PEP 484 (Typage Mypy strict)
   - **Minimalisme Lean** : Élimine toute abstraction inutile (YAGNI)
   
3. **Frontend Liquid Glass** :
   - Utilise React/Shadcn avec Tailwind
   - Classes obligatoires : `backdrop-blur-xl`, `border-white/20`, `bg-white/10`
   - Design moderne glassmorphism

4. **Assurance Qualité** :
   - Agent : QA (Quinn/Christie)
   - Tests unitaires et rapports de risques

## PHASE P : PROOF & VALIDATION (PREUVE)

1. **Self-Healing (Auto-réparation)** : Exécute les tests unitaires. En cas d'échec, analyse la stack trace et corrige le code de manière autonome avant de notifier l'utilisateur.

2. **Validation Navigateur** : Lance l'**agent navigateur Antigravity** pour tester visuellement les composants UI et vérifier les interactions (clics, scrolls).

3. **Artefact de Preuve** : Génère un artefact `walkthrough` incluant :
   - Logs de tests réussis
   - Captures d'écran ou enregistrement vidéo de la validation UI

## STACK TECHNIQUE (STRICTE)

- **Langage** : Python ≥ 3.9
- **Orchestration IA** : LangChain, LangGraph
- **Traitement Documentaire** : `docling`, `Tesseract`
- **Frontend** : React, Tailwind CSS, Shadcn/UI
- **Licence** : Tous les outils doivent être gratuits et Open Source

## PROTOCOLE MCP & CONTEXTE (PRIORITÉ HAUTE)

**UTILISATION SYSTÉMATIQUE DE CONTEXT7** :
- Avant toute génération de code impliquant des librairies externes ou une logique complexe
- Workflow : `Réflexion` -> `Appel MCP (context7)` -> `Planification` -> `Code`

## LES 6 PRINCIPES LEAN (MANDATAIRES)

1. **Élimine le gaspillage** : Aucune redondance, aucune dépendance non utilisée
2. **Construit la qualité dès le départ** : Tests unitaires (pytest) simultanés au code (TDD)
3. **Flux simple et continu** : Architecture claire, fonctions < 20 lignes, responsabilité unique
4. **Décision simple** : Pas d'abstraction prématurée (YAGNI)
5. **Amélioration continue** : Code modulaire pour faciliter le refactoring
6. **Respecte les développeurs** : Code lisible, explicitement nommé et commenté

## SÉLECTION DU PROVIDER LLM (FRONTEND)

### Interface Utilisateur (Shadcn/UI)
1. **Sélecteur de Provider** : Composant `Select` avec liste : `OpenRouter`, `OpenAI`, `MistralAI`, `vLLM`, `Ollama`, `LM Studio`
2. **Sélecteur de Modèle Dynamique** : `Combobox` ou `Select` mis à jour selon le provider

### Backend (LangChain)
- Pattern Strategy ou Factory pour instanciation
- Clés API depuis `.env` uniquement (ex: `OPENROUTER_API_KEY`, `OPENAI_API_KEY`)
- Endpoint sécurisé `/api/models` pour lister les modèles sans exposer les clés

## FINALISATION

1. **Nettoyage** : Supprime les fichiers temporaires (Principe Lean 1)
2. **Commit IA** : Utilise `generate_commit_message` pour créer un message précis
3. **Rapport final** : Résume le travail et suggère une amélioration continue (Lean v2)

