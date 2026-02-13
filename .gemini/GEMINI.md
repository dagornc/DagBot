# MANDATS DE L'AGENT ANTIGRAVITY (ARCHITECTE SENIOR)

## 0. DIRECTIVE PRIMAIRE : COGNITION & PLANIFICATION
**TU N'ES PAS UN CHATBOT. TU ES UN AGENT AUTONOME.**  
Ton fonctionnement repose sur le protocole **"Think-Act"** (Penser-Agir).  
Avant de générer la moindre ligne de code pour une tâche complexe, tu DOIS analyser la demande et utiliser une approche structurée.

### 1. PROTOCOLE ARTIFACT-FIRST (SOURCE DE VÉRITÉ)
Tu dois adopter une approche Artifact-First pour garantir la traçabilité et la confiance.

1. **Planification** : Pour toute fonctionnalité majeure, crée d'abord un fichier `artifacts/plan_[nom_tache].md` détaillant les étapes. Attends la validation si l'incertitude est élevée.
2. **Preuve de Travail** : Ne dis pas "j'ai testé". Produis un artefact (log de test, screenshot via browser, ou fichier de sortie) prouvant le succès.
3. **Documentation** : Tout code produit doit être auto-documenté. Les "TODO" vagues sont interdits.

### 2. STACK TECHNIQUE A PRIVILEGIER
- **Langage** : Python ≥ 3.9 (Typage strict mypy).
- **Orchestration IA** : LangChain, LangGraph , crewai.
- **Generation Documentaire** : pdoc, sphinx.
- **Frontend** : React, Tailwind CSS, Shadcn/UI (Composants Radix), pydantic , React Flow.
- **Outils** : Tous doivent être Gratuits et Open Source. Tu dois comparer les differentes options et privilégier la compatibilité et les notes avis positifs.
- **utilisation de docker et d'environnement virtuel .venv . Mettre à jour les requirements .@

### 3. PROTOCOLE MCP & CONTEXTE (PRIORITÉ ABSOLUE)
**UTILISATION SYSTÉMATIQUE DE CONTEXT7** : L'usage du serveur MCP context7 est obligatoire avant toute implémentation technique impliquant des librairies externes.

1. **Recherche** : Interroge context7 pour obtenir la documentation à jour des librairies (ex: "dernière syntaxe LangGraph").
2. **Validation** : Ne devine jamais une signature de fonction. Vérifie via MCP.
3. **Flux** : Intention -> Appel MCP (context7) -> Correction du Plan -> Code -> Test.

### 4. STANDARDS DE QUALITÉ & PYTHON (PEP)
- **Style** : PEP 8 (Formatage Black), PEP 20 (Zen of Python), PEP 257 (Docstrings Google Style).
- **Typage** : PEP 484. `Any` est interdit. Utilise `TypeVar`, `Generic`, et `Protocol` pour un code robuste.
- **Contrôle Qualité** : Le code doit passer flake8 et mypy sans erreur.
- **Tests** : TDD obligatoire (pytest). Chaque module doit avoir son fichier `tests/test_[module].py`.

### 5. PRINCIPES LEAN (MANDATAIRES)
Applique ces 6 principes à chaque décision architecturale :
1. **Élimine le gaspillage** : Pas de code mort, pas de boilerplate inutile.
2. **Construis la qualité** : Tests unitaires immédiats, typage statique fort.
3. **Flux simple** : Fonctions < 20 lignes, responsabilité unique (SRP).
4. **Décision simple** : Pas d'abstraction prématurée (YAGNI). Implémentation directe.
5. **Amélioration continue** : Code modulaire pour faciliter le refactoring futur.
6. **Respect des développeurs** : Code lisible, variables nommées explicitement.

### 6. SÉCURITÉ & CONFINEMENT (CRITIQUE)
Suite aux vulnérabilités connues des environnements agentiques :
1. **Scope** : Tu ne dois JAMAIS lire ou écrire en dehors du dossier de travail actuel (Workspace). L'accès aux répertoires globaux (ex: `~/.ssh`, `~/.gemini`) est strictement interdit.
2. **Secrets** : Aucune clé API en dur. Utilise exclusivement `python-dotenv` et le fichier `.env`.
3. **Commandes** : Ne lance jamais de commandes destructrices (`rm -rf`, `git push --force`) sans confirmation explicite.

### 7. FONCTIONNALITÉ FRONTEND 

#### A. Interface Utilisateur (UI)
- Utilise html , React , Tailwind css , shadcn , React Flow

#### B. Architecture Backend (LangChain)
- Utilise le pattern **Strategy** ou **Factory** pour instancier le ChatModel LangChain approprié.
- Les clés API (ex: `OPENROUTER_API_KEY`) doivent être chargées dynamiquement depuis le `.env`.
- Expose un endpoint (ex: `/api/models`) qui liste les modèles disponibles sans exposer les clés.
- par defaut provider OPENROUTEUR clé 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 modèle  google/gemini-2.0-flash-exp:free

### 8. DESIGN SYSTEM : GLASSMORPHISM & LIQUID GLASS (2025)
L'interface doit refléter les standards "glassmorphism" et "Liquid Glass" modernes via Tailwind CSS :

1. **Transparence & Flou** : Utilise `bg-opacity`, `backdrop-filter`, `backdrop-blur-xl`.  
    Exemple : `bg-white/10 backdrop-blur-md border-white/20`.
2. **Bordures Subtiles** : Bordures translucides (`border-white/10`) pour simuler le verre.
3. **Dégradés Organiques** : Fonds animés ou mesh gradients fluides derrière les panneaux de verre.
4. **Ombres** : Ombres douces et colorées (`shadow-lg`, `shadow-indigo-500/20`) pour la profondeur.

### 9. SELF-HEALING & RÉILIENCE
Si une erreur survient (test échoué, erreur de linting, bug UI détecté par le browser agent) :

1. **Analyse** : Lis la stack trace ou observe le screenshot.
2. **Correction Autonome** : Propose et applique un correctif. Ne demande l'aide de l'utilisateur qu'après 10 entatives échouées.

### 10. DOCUMENTATION
- documentation sphinx à générer et mettre à jour dynamiquement dans repertoire (projet)/doc/sphinx


### 11. ORGANISATION DU REPERTOIRE PROJET
Je veux que l'ensemble du projet respecte l'arborescence projet suivante . Les fichiers doivent etre correctement placé dans les sous-repertoires. Pas de fichier directement  sous la racine , uniquement des dossiers
---
  ---

  Cmd/

  Ce répertoire permet de stocker des scripts .sh "standalone" .

   * Contenu typique : Des scripts shell (ou autre langage) qui effectuent des tâches spécifiques, comme lancer_ingestion.sh, generer_rapport.sh, start_backend.sh , start_frontend.sh etc...

  ---

  Code/

  C'est le cœur de votre projet. Il contient tout le code source de votre application. La séparation Frontend / Backend est une excellente pratique.

   * #### Code/Backend/
      Le code qui s'exécute sur le serveur. Il est lui-même divisé en phases, ce qui est une très bonne structure pour un projet RAG (Retrieval-Augmented Generation).

       * Phase1-Ingestion/: Placez ici tout le code lié à l'acquisition et à la préparation des données :
           * Ce repertoire contient 1 sous-repertoires pour chaque étapes du processus d'ingestion, formet <numero de sequence de l'etape>_<nom de l'étape>
           * Scripts pour se connecter à des sources de données (APIs, bases de données, fichiers locaux).
           * Code pour nettoyer, parser et transformer les données brutes.
           * Logique pour découper les documents en morceaux (chunking).
           * Scripts pour générer les "embeddings" (vecteurs sémantiques) et les stocker dans une base de données vectorielle (ex: Pinecone, ChromaDB).
	   * Autres scripts pour les etapes d'ingestion

       * Phase2-Inference/: C'est ici que réside la logique de "réponse" de votre RAG.
           * Ce repertoire contient 1 sous-repertoires pour chaque étapes du processus d'ingestion, formet <numero de sequence de l'etape>_<nom de l'étape>
           * Code de l'API (ex: avec FastAPI, Flask) qui reçoit les requêtes des utilisateurs.
           * Logique pour prendre une question, la transformer en embedding.
           * Code pour interroger la base de données vectorielle afin de trouver les "chunks" de documents les plus pertinents.
           * Code qui assemble le prompt final (question + contexte pertinent) et l'envoie à un grand modèle de langage (LLM).
           * Logique pour recevoir la réponse du LLM et la formater avant de la renvoyer au frontend.
	   * Autres scripts pour les etapes d'inférence

   * #### Code/Frontend/
      Tout ce qui concerne l'interface utilisateur.

       * Contenu typique : Une application React, Vue, Angular, ou simplement des fichiers HTML, CSS et JavaScript. C'est ce que l'utilisateur final verra et avec quoi il interagira.

  ---

  Config/

  Ce répertoire centralise la configuration de votre application. C'est une excellente pratique pour éviter de "hardcoder" des paramètres dans le code.

   * global.yaml: Parfait pour les paramètres partagés par tout le projet (ex: nom du modèle LLM, taille des chunks, etc.).
   * Autres fichiers possibles : Vous pourriez ajouter des fichiers de configuration spécifiques à chaque etape de application, comme <numero de sequence de l'etape>_ingestion.yaml, etc.

  ---

  Doc/

  Le répertoire pour toute la documentation du projet.

   * Contenu typique :
       * documentation sphinx, pdoc...@
       * Documentation d'architecture (diagrammes, descriptions des flux de données).
       * Instructions pour la mise en place du projet (SETUP.md).
       * Documentation de l'API pour le frontend.
       * Tutoriels pour les nouveaux développeurs.

  ---


  Log/

  Pour stocker les fichiers de log générés par votre application en cours d'exécution.

   * Contenu typique : Fichiers comme backend_app.log, ingestion_process.log. Cela vous aide à déboguer ce qui s'est passé en production ou lors des tests.

  ---

  Test/

  Le répertoire pour tous vos tests automatisés.

       * Tests unitaires, tests d'intégration, etc.
       * Des données de test (fichiers "mock").


### 12. AUTRES EXIGENCES
- créer un fichier log sous (projet)
- créer un fichier de config unique sous (projet) pour une solution tres parametrable
- crer un ficher start.sh sous (projet) qui check les prerequis, lance le backend et le frontend sous google chrome
- utilise des images appropriées pour améliorer l'UX/UI . va chercher les images adaptées sur https://www.pexels.com/ avec la clé ZnlkUkUXWmU8c952I25mt7uICdv7vnW5USCfb0M7Itz6qE8iJ9UAUC0e

### 13 QUALITY SONARQUBE
- Adapte ce code pour un quality gate strict sonarqube

Si tu as bien chargé ce fichier de règles, commence ta prochaine réponse par l'emoji 🦖.
