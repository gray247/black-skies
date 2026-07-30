# Black Skies V1 Accepted UI Vocabulary

Status: Package `19.21` current-copy inventory

Version: `1.0.0-rc1`

This record mirrors the accepted Writing Studio and Command Center product. It
does not authorize copy changes. Source and installed-application behavior win
if a future mismatch is found.

## Window identities

| Surface | Exact identity and role |
| --- | --- |
| Writing Studio | Window title `Black Skies — Writing Studio`; project lifecycle, structure, prose editing, Save, recovery, export, optional critique |
| Command Center | Window title `Black Skies — Command Center`; navigation and project/save/recovery status only; no prose or structural mutation |

## Project lifecycle

| UI text | Meaning |
| --- | --- |
| `Open project…` | Select the actual project folder containing `project.json`. |
| `New project title` | Title used for a new project. |
| `Create project…` | Select a parent folder; Black Skies creates a project folder inside it. |
| `Recent projects` | Remembered project references. |
| `Missing` | A remembered project path is unavailable. |
| `Remove` | Forget the recent reference without deleting project files. |

## Binder and editor

| Area | Exact accepted text |
| --- | --- |
| Structure | `Binder`, `Manuscript units`, `Unit title (optional)`, `Create unit` |
| Selected unit | `Selected unit title`, `Update title`, `Move up`, `Move down`, `Delete unit…` |
| Editor | `Active manuscript unit`, `Manuscript editor`, `Start writing…`, `Save`, `Saving…` |
| Empty states | `Create the first manuscript unit when you are ready to write.`, `No manuscript unit selected`, `Create or select a unit from the binder.` |

Blank unit titles display as `Untitled`. Unit deletion confirms that the action
cannot be undone in this package.

Keyboard guidance:

- `Ctrl+S` saves the selected unit.
- `Ctrl+Z` undoes editor changes.
- `Ctrl+Y` and `Ctrl+Shift+Z` redo editor changes.
- Switching units preserves unsaved buffers during the live session.

## Save and close language

| State | Exact family |
| --- | --- |
| no active project | `All changes saved` |
| active project clean/saved | `Saved durably` |
| dirty | `1 unsaved unit` / `N unsaved units`; binder marker `Unsaved` |
| saving | `Saving…` |
| failed | `Save failed` or `Save failed: {message}` |
| Command failure | `Save failed in Writing Studio` |
| close warning | `This project has manuscript changes that have not been saved.` |
| close actions | `Keep editing`; `Discard changes` |

No V1 copy may promise autosave or automatic Save on exit.

## Markdown export

| Context | Exact text |
| --- | --- |
| Action | `Export Markdown…`; progress `Exporting…` |
| Dirty remedy | `Save the project successfully before exporting.` |
| Save dialog | `Export Markdown manuscript`; action `Export`; filter `Markdown` |
| Replacement dialog | `Replace existing Markdown file?`; `A file already exists at this destination.`; actions `Replace`, `Cancel` |
| Cancellation | `Export cancelled. No file was created.` |
| Success | `Export complete: {path} ({bytes} bytes, {unit count}).` |

## Recovery

| State | Exact accepted text |
| --- | --- |
| decision heading | `Recover unsaved Writing Studio prose` |
| decision explanation | `Review every candidate. Recovered prose remains unsaved until you use the normal Save action.` |
| accept | `Recover this prose` |
| reject | `Reject and delete candidate` |
| accepted | `Recovered prose is applied and remains unsaved. Use Save for each recovered unit to make it durable.` |
| degraded | `Recovery evidence needs attention` |

Recovery rejection is explicit destructive cleanup of the displayed candidate,
not a general project delete.

## Command Center

Accepted role copy:

```text
Navigation, project status, and durable save truth.
Manuscript mutation is unavailable here.
```

Accepted mutability note:

```text
Advisory/status/navigation only.
No prose editor or structural mutation controls are exposed.
```

If authority is unavailable, Command Center says
`Writing Studio authority could not be reached. No saved or recovery claim is
shown.` It must not infer state.

## Optional remote critique

| Context | Exact accepted text |
| --- | --- |
| Surface | `Optional remote critique`; `Selected prose only` |
| Credential | `OpenAI API key (session only; no readback)`; `Set session key`; `Clear key` |
| Selection | `Select 200–12,000 non-whitespace characters in the manuscript editor.` |
| Preview | `Review outbound critique request`; `Exact outbound preview` |
| Approval | `Approve and send exact payload` |
| Progress | `Waiting for advisory critique. Editing will invalidate and discard this request.`; `Stop waiting` |
| Result | `Advisory critique`; `Dismiss critique` |

The preview includes provider, pinned model, remote processing, pricing
snapshot, estimated/calculated maximum cost, payload SHA-256, retention and
cancellation disclosures, frozen instructions, exact request JSON, exact
selected prose, and transmission clearance. No copy may imply automatic
sending, local processing, manuscript mutation, persistence, or Command Center
availability.

## Tone and error rules

- Use calm, direct, writer-facing language.
- Name the owning window when responsibility matters.
- Never call unsaved/recovered work durable.
- Never claim export completion before the destination write succeeds.
- Preserve explicit destructive language for discard, recovery rejection, and
  unit deletion.
- Do not expose credentials or manuscript prose in operator records.
- Do not use legacy Companion, service-health, plugin, analytics, autosave,
  snapshot-history, broad export, layout-preset, or model-router terminology
  for the accepted V1 product.
