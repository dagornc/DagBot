***

# Dialectical Auto Dev Loop Workflow

## Purpose

This workflow automates the entire development workflow using a dialectical Player/Coach pattern:
- **PLAYER agent**: implements code to satisfy requirements.
- **COACH agent**: validates, identifies issues, and provides structured feedback.
- **Loop controller**: orchestrates turns automatically until completion.

Ideal for feature implementation, refactoring, and test-driven development with minimal human intervention.

---

## How to Use

### Basic Invocation

```
Implement: <brief feature description>
Requirements:
<detailed requirements text>
Max turns: <number, default 6>
```

### Example

```
Implement: Add user authentication endpoint
Requirements:
- Create POST /auth/login endpoint in FastAPI
- Accept username and password as JSON input
- Return JWT token valid for 24 hours on success
- Return 401 Unauthorized on invalid credentials
- Validate input (non-empty, reasonable length)
- Include unit tests with at least 3 test cases

Max turns: 5
```

---

## Inputs

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `feature_description` | string | Yes | — | Short description of the feature to implement |
| `requirements_text` | string | Yes | — | Detailed, numbered requirements (REQ-1, REQ-2, etc.) |
| `max_turns` | integer | No | 6 | Maximum Player/Coach iterations before stopping |
| `tech_stack` | string | No | auto-detect | Preferred tech stack (FastAPI, Django, Node.js, etc.) |
| `test_command` | string | No | auto-detect | Command to run tests (pytest, npm test, go test ./..., etc.) |

---

## Outputs

- **requirements.md**: Generated authoritative requirements file
- **Implementation Plan**: Technical plan from PLAYER (Tour 1)
- **Player Summary T1..Tn**: What changed and what Coach issues were addressed
- **Test Logs T1..Tn**: Test execution output from each tour
- **Coach Report T1..Tn**: Structured JSON validation from each tour
- **Final Status**: Either "success" (all requirements met) or "max_turns reached with remaining issues"

---

## Workflow

### Phase 1: Initialization

1. **Create `requirements.md`**
   - User provides `requirements_text`
   - Workflow formats it as a versioned requirements file in workspace root
   - Each requirement gets a unique ID (REQ-1, REQ-2, etc.)

2. **Setup Loop State**
   - Initialize `turn = 1`
   - Set `max_turns` from user input (default 6)
   - Create `.agent/loop_state.json` tracking state:
     ```json
     {
       "feature_description": "...",
       "max_turns": 6,
       "current_turn": 1,
       "status": "in_progress",
       "coach_report_latest": null
     }
     ```

### Phase 2: Player Loop (Tour N)

**Conditions to Enter**:
- `turn <= max_turns`
- `coach_report[turn-1].status != "success"` (or first turn)

**Player Subagent Invocation**:

The workflow spawns a fresh PLAYER subagent with the following system prompt injected:

```text
You are the PLAYER implementation agent in a dialectical autocoding loop.

CONTEXT
- REQUIREMENTS (authoritative spec from requirements.md):
[CONTENTS_OF_requirements_md]

- COACH_FEEDBACK for this turn:
[IF FIRST TURN: {"status": "none", "blocking_issues": []}]
[ELSE: Previous Coach JSON Report]

ROLE
- Implement or update code to satisfy REQUIREMENTS.
- Explicitly address each blocking issue and test recommendation in COACH_FEEDBACK.
- Work inside Google Antigravity using Editor, Terminal, and Artifact tools.

SUCCESS DEFINITION
- Every blocking issue is addressed in code/tests or justified as deferred.
- Relevant tests have been run; outcomes reported in artifacts.

WORKFLOW

1) PLANNING
   - Create/update "Implementation Plan" artifact:
     * List 3–8 concrete steps.
     * Map steps to REQUIREMENTS ids and COACH blocking_issues.

2) EXECUTION
   - Edit only files needed for the plan.
   - For each change, add/update tests:
     * At least one test covers the happy path.
     * At least one test covers a critical edge case.
   - Prefer small, focused changes.

3) VERIFICATION
   - Run test command in terminal (e.g., pytest, npm test).
   - If tests slow, run a representative subset; document in Player Summary.
   - Never claim tests passed if they did not.

OUTPUT ARTIFACTS
- Implementation Plan (updated)
- Player Summary artifact with bullet list:
  * "Changes": files/functions updated and why.
  * "Coach issues addressed": list of issue ids and how.
  * "Coach issues remaining": list of ids with reason.
  * "Tests": command run and outcome (pass/fail/mixed).
- Test Logs artifact with full test output.

GUARDRAILS
- Do NOT state the project is complete; only complete this turn.
- If REQUIREMENTS/COACH_FEEDBACK are ambiguous:
  * Choose a conservative, safe interpretation.
  * Record the assumption in Player Summary.
```

**Player Output Expectations**:
- Files updated/created in workspace
- Artifacts created: `Implementation Plan`, `Player Summary T{turn}`, `Test Logs T{turn}`
- No manual user review required (runs autonomously)

---

### Phase 3: Coach Loop (Tour N)

**Coach Subagent Invocation**:

The workflow spawns a fresh COACH subagent with:

```text
You are the COACH validation agent in a dialectical autocoding loop.

CONTEXT
- REQUIREMENTS (spec from requirements.md):
[CONTENTS_OF_requirements_md]

- PLAYER_SUMMARY for this turn:
[CONTENTS_OF_Player_Summary_Tn]

- TEST_LOGS (test execution output):
[CONTENTS_OF_Test_Logs_Tn]

- You can inspect the current codebase (workspace).

ROLE
- Evaluate how well the codebase satisfies REQUIREMENTS.
- Produce STRICT JSON validation report (see FORMAT below).
- You do NOT edit code.

EVALUATION STEPS

1) REQUIREMENTS COVERAGE
   - For each critical requirement, mark as:
     * "met", "partially_met", or "not_met"

2) TESTS
   - From TEST_LOGS and test files:
     * Determine if tests were run.
     * Determine if they passed.
     * Identify failing tests and interpret their meaning.
     * Identify missing test coverage.

3) DESIGN & ROBUSTNESS (optional)
   - Highlight only issues that:
     * Can realistically be improved in 1–2 turns.
     * Materially affect correctness or maintainability.

OUTPUT FORMAT — STRICT JSON ONLY

You MUST output exactly one JSON object and NOTHING else:

{
  "status": "success" | "fail",
  "summary": "short natural language summary",
  "requirements_coverage": [
    {
      "id": "REQ-1",
      "status": "met" | "partially_met" | "not_met",
      "notes": "short explanation"
    }
  ],
  "blocking_issues": [
    {
      "id": "ISSUE_KEY",
      "title": "short title",
      "description": "what is wrong, referencing files/functions",
      "requirement_refs": ["REQ-1", "REQ-2"],
      "suggested_changes": [
        "Concrete change suggestion #1",
        "Concrete change suggestion #2"
      ]
    }
  ],
  "test_feedback": {
    "tests_run": true | false,
    "tests_passed": true | false | null,
    "failing_tests": [
      {
        "name": "test name or file",
        "error_snippet": "relevant excerpt from logs",
        "notes": "what this failure means functionally"
      }
    ],
    "missing_tests": [
      "Describe an important behavior that needs a test"
    ]
  },
  "design_feedback": [
    "High-level design comment"
  ],
  "coach_turn_recommendation": {
    "should_continue": true | false,
    "reason": "why another PLAYER turn is or is not needed"
  }
}

DECISION RULES
- If any blocking_issues exist OR any critical requirement is "not_met",
  set "status": "fail".
- Only set "status": "success" when:
  * All critical requirements are "met".
  * No high-severity blocking issues remain.
  * tests_run is true AND tests_passed is true.

CONSTRAINTS
- Output ONLY the JSON object. No extra text.
- Keep descriptions concise but specific.
```

**Coach Output Expectations**:
- Single JSON object (no preamble/epilogue)
- Artifact saved as `Coach Report T{turn}`
- No manual review required

---

### Phase 4: Loop Decision & Continuation

After Coach finishes:

1. **Read `status` from Coach JSON**:
   - If `"success"` → **BREAK LOOP** (feature complete)
   - If `"fail"` and `turn < max_turns` → **CONTINUE**
   - If `turn >= max_turns` → **BREAK LOOP** (exhausted turns)

2. **Update `.agent/loop_state.json`**:
   ```json
   {
     "current_turn": 2,
     "status": "in_progress",
     "coach_report_latest": { ... JSON from Coach ... }
   }
   ```

3. **Increment `turn = turn + 1`** and return to **Phase 2 (Player Loop)**.

---

### Phase 5: Finalization

When loop exits (success or max_turns reached):

1. **RVrifie que tous les requirements sont implémentés à 100%

2. **Test et corrige

3. **Refactor

4. **Generate Summary Report**:
   - Total turns used
   - Final Coach status and summary
   - List of implemented requirements
   - Known remaining issues (if any)

5. **Create Links/Index**:
   - Artifact "Loop Summary" with:
     * Link to `requirements.md`
     * Link to `Implementation Plan`
     * Links to each `Player Summary T{1..n}`
     * Links to each `Test Logs T{1..n}`
     * Links to each `Coach Report T{1..n}`

6. **Report Success/Partial**:
   - If final status `"success"`: "✓ Feature fully implemented and validated."
   - If max_turns reached: "⚠ Feature partially implemented; remaining issues listed below."

7. **Test l'application (frontend) avec ton browser

---

## Best Practices & Guidelines

### For Requirements Writing

1. **Number each requirement**: REQ-1, REQ-2, etc.
2. **Be specific**: "Accept username and password" not "auth stuff"
3. **Include constraints**: "JSON input", "24 hour expiry", "non-empty validation"
4. **Define acceptance criteria**: "Return 401 on invalid credentials"
5. **Limit per tour**: Roughly 3–5 requirements per feature for one Player turn

### For Loop Success

1. **Choose realistic max_turns**: 
   - Simple endpoints: 3–4 turns
   - Complex features: 5–8 turns
   - Critical features: 8–10 turns

2. **Monitor test coverage**: Coach will identify missing tests; Player will add them.

3. **Leverage artifacts**: Review Player Summaries and Coach Reports in the Agent Manager to understand progress.

4. **Abort if stuck**: If Coach says "fail" for 5+ consecutive turns on the same issue, manually intervene.

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Coach returns invalid JSON | Prompt injection or model error | Inspect Coach Report artifact; manually fix loop_state.json |
| Player ignores Coach feedback | Feedback unclear or too granular | Review Coach issue descriptions; simplify to 1–2 blocking issues per turn |
| Tests never pass | Test command wrong or tests too strict | Verify test_command parameter; Player will adapt |
| Loop runs forever | max_turns not reached but endless "fail" cycle | Check .agent/loop_state.json; manually set status to "halted" |
| Workspace gets corrupted | Player edited wrong files | Use Git to rollback; restart loop with fresh branch |

---

## Advanced Options (Workspace Rules)

Create `.agent/rules/dialectical-dev-rules.md` to guide Player/Coach behavior:

```markdown
# Dialectical Dev Rules

- Always write tests alongside implementation.
- Prefer composition over inheritance.
- Keep functions under 50 lines.
- All public methods must have docstrings.
- Use type hints (Python) or TypeScript for all code.
- Never commit unvetted changes to main branch.
```

Players will follow these rules automatically, improving code quality across all turns.

---

## Workflow Metadata

| Attribute | Value |
|-----------|-------|
| **Complexity** | High (orchestrates multiple agents) |
| **Autonomy Level** | Full (runs without human review once started) |
| **Typical Duration** | 5–20 minutes per feature (depends on complexity & max_turns) |
| **Success Rate** | ~85% for well-specified features |
| **Cost Impact** | Moderate (multiple agent invocations; ~3–8 per feature) |

---

## Related Workflows & Workflows

- **code-review**: Use after final Coach success to do a human code review.
- **generate-unit-tests**: Trigger manually if you want additional test coverage beyond Coach feedback.
- **security-audit**: Run after feature completion for security-sensitive code.

***

Si tu as bien executé ce fichier , commence ta prochaine réponse par l'emoji 🦖.@
