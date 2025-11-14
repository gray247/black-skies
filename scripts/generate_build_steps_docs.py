from __future__ import annotations

import json
from pathlib import Path
from typing import Dict

ROOT = Path('docs')
DATA_PATH = ROOT / 'build_steps.json'
CHECKLIST_PATH = ROOT / 'BUILD_STEPS_CHECKLIST.md'
PLAYBOOK_PATH = ROOT / 'BUILD_STEPS_PLAYBOOK.md'
OVERVIEW_PATH = ROOT / 'BUILD_STEPS_DETAILED.md'

MANDATORY_MILESTONES = {
    'Milestone 0 — Environment, Offline Safety, Hygiene',
    'Milestone 1 — Package Skeleton & App Foundation',
    'Milestone 2 — Data Model & Storage',
    'Milestone 3 — Endpoints MVP (CRUD + Lists)',
    'Milestone 4 — Policies & Exporters',
}

SPECIAL_PROFILES: Dict[int, str] = {
    1: 'API-only',
    2: 'API-only',
    3: 'API-only',
    4: 'API-only',
    5: 'API-only',
    6: 'API-only',
    7: 'All',
    8: 'All',
    9: 'API-only',
    10: 'All',
    11: 'All',
    12: 'Desktop, Browser',
    60: 'Desktop, Browser',
    69: 'Browser',
    79: 'All',
    80: 'All',
    81: 'API-only',
    82: 'All',
    83: 'All',
    84: 'All',
    85: 'All',
}


def infer_profiles(summary: str, files: str, step: int) -> str:
    if step in SPECIAL_PROFILES:
        return SPECIAL_PROFILES[step]
    summary_lower = summary.lower()
    files_lower = files.lower()
    if any(keyword in summary_lower for keyword in ['ui', 'renderer', 'playwright', 'electron', 'dock']):
        return 'Desktop, Browser'
    if 'app/' in files_lower or 'pnpm' in files_lower:
        return 'Desktop, Browser'
    if 'docs' in files_lower or 'readme' in summary_lower:
        return 'All'
    if 'cli' in summary_lower:
        return 'API-only'
    return 'API-only'


def sanitize(text: str) -> str:
    cleaned = text.replace('', '').replace('—', '-').replace('–', '-')
    return cleaned.strip()


def bullet(text: str) -> str:
    return ' '.join(text.strip().split())


def display_name(name: str) -> str:
    return name.replace('—', '-').replace('–', '-')


def generate_docs() -> None:
    data = json.loads(DATA_PATH.read_text(encoding='utf-8'))

    checklist_lines = [
        '# Build Steps Checklist',
        '',
        'Generated from build_steps.json. Profiles indicate which deployment surfaces a step touches.',
        ''
    ]

    playbook_lines = [
        '# Build Steps Playbook',
        '',
        'Reference of every step with commands, acceptance notes, and Codex prompts. Generated from build_steps.json.',
        ''
    ]

    for milestone in data:
        raw_name = milestone['milestone']
        name = display_name(raw_name)
        mandatory_flag = milestone['mandatory_for_rc'] or raw_name in MANDATORY_MILESTONES
        mandatory = 'Mandatory for RC' if mandatory_flag else 'Post-RC (optional)'

        checklist_lines.append(f'## {name}')
        checklist_lines.append(f'*Status:* {mandatory}')
        checklist_lines.append('')
        checklist_lines.append('| Step | Summary | Profiles | Artifacts | Command |')
        checklist_lines.append('| :--- | :------ | :------- | :-------- | :------- |')

        playbook_lines.append(f'## {name}')
        playbook_lines.append(f'*Status:* {mandatory}')
        playbook_lines.append('')

        for step in milestone['steps']:
            step_num = step['step']
            summary = step['summary']
            files = sanitize(step.get('files', '-')) or '-'
            command = sanitize(step.get('command', '-')) or '-'
            profiles = infer_profiles(summary, files, step_num)

            checklist_lines.append(f'| {step_num} | {summary} | {profiles} | {files} | {command} |')

            playbook_lines.append(f'### Step {step_num}: {summary}')
            playbook_lines.append(f'- **Profiles:** {profiles}')
            playbook_lines.append(f'- **Primary artifacts:** {files}')
            what = bullet(step.get('what', ''))
            if what:
                playbook_lines.append(f'- **What:** {what}')
            playbook_lines.append(f'- **Command:** {command}')
            acceptance = bullet(step.get('acceptance', 'Ensure command passes and artifacts exist.'))
            playbook_lines.append(f'- **Acceptance:** {acceptance}')
            codex = bullet(step.get('codex_ask', ''))
            if codex:
                playbook_lines.append(f'- **Codex ask:** {codex}')
            playbook_lines.append('')

        checklist_lines.append('')

    CHECKLIST_PATH.write_text("\n".join(checklist_lines).rstrip() + "\n", encoding='utf-8')
    PLAYBOOK_PATH.write_text("\n".join(playbook_lines).rstrip() + "\n", encoding='utf-8')

    OVERVIEW_PATH.write_text(
        """# Build Steps Overview

The build steps are generated from structured metadata. Review:

- [docs/BUILD_STEPS_CHECKLIST.md](./BUILD_STEPS_CHECKLIST.md) for a table view (profiles, artifacts, commands).
- [docs/BUILD_STEPS_PLAYBOOK.md](./BUILD_STEPS_PLAYBOOK.md) for detailed descriptions and Codex prompts.

Regenerate these docs after editing docs/build_steps.json by running:

    python scripts/generate_build_steps_docs.py
""",
        encoding='utf-8'
    )


if __name__ == '__main__':
    generate_docs()
