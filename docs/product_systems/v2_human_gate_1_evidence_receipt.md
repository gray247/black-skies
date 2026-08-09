# V2 Human Gate 1 Evidence Receipt

Status: ready for one combined author review  
Automated qualification: passed  
Human acceptance: pending  
Source base: `8fff84434ef138444df45be424cac386ddf5589e` plus the Gate 1 change set  
Git control: the author alone stages, commits, and pushes

## What Is Ready

This candidate joins two complete workflows on the Writing Surface:

1. **Critique Workbench** — select exact prose, inspect the exact outbound
   preview, explicitly approve it, receive an advisory result, copy it, or save
   one concise author-created Feedback Note.
2. **Writing Surface and Living Outline** — create planning fragments, quiet
   gaps, or planning areas; link them to writing before or after prose exists;
   move through the story from either side; and change planning order without
   silently changing accepted manuscript order.

Focus mode hides both support workflows immediately and restores them without
discarding editor text.

## Safety Truths Proven By Automation

- Manuscript files, accepted order, and project metadata stay authoritative.
- Planning movement changes only `living-outline.json`.
- A saved advisory note changes only `feedback-notes.json`.
- Missing or malformed optional sidecars do not block opening, editing, or
  saving the manuscript.
- Stale revisions, wrong projects, wrong windows, unknown links, and write
  failures return honest errors instead of pretending to save.
- Living Outline and Feedback Notes are bound to the active project and survive
  a clean application restart without leaking into another project.
- Automated critique uses a deterministic fixture. It makes no provider request,
  incurs no provider charge, and does not claim to test broad AI quality.
- No workflow can rewrite prose, reorder accepted manuscript units, promote
  advisory material to story truth, or change provider-routing policy.

## Automated Evidence

| Gate | Result |
| --- | --- |
| TypeScript | Passed |
| App lint | Passed with zero warnings |
| Active Stage 19 lint | Passed with zero warnings |
| Production renderer and main build | Passed |
| Combined Gate 1 component/contract suite | 102 passed |
| Earlier full Critique Workbench qualification | 373 passed, 2 existing policy skips |
| Combined create/link/move/Focus/critique/reopen/isolation Electron journey | Passed |
| Independent Critique Workbench Electron journey | Passed |
| Full Stage 19 regression | 615 passed, 2 existing policy skips, 22 Electron journeys passed |
| Package preflight | Passed |
| Unpacked Windows x64 package build and inspection | Passed; zero forbidden paths |

The unpacked package remains intentionally unsigned under the existing
`unsigned-internal-rc` policy. This gate did not create or qualify an installer;
it verified the changed boundary in a production build and unpacked application.

## Deliberately Not Added

- A second AI provider or automatic routing
- Background jobs or unattended critique
- Automatic prose rewriting or acceptance
- A durable AI-memory or truth system
- Connectors, paid-operation expansion, analytics dashboards, or broad cleanup
- Automatic gap alarms based only on a short outline
- The Emotion Graph; it follows after these first two workflows earn author
  acceptance and becomes the next evidence-led structural workflow

## One 20-Minute Human Review

Use only a short sample passage that you explicitly approve for provider
transmission. Record pass, fail, or confusing beside each numbered item.

### Minutes 0-2: Establish The Safety Baseline

1. Open or create a disposable project with at least two manuscript units.
2. Save both units. Record their titles, order, and one unmistakable sentence
   from each so silent changes are easy to notice.

### Minutes 2-9: Writing Surface and Living Outline

3. Create one unlinked **gap** marked **proposed** before writing the missing
   material. Confirm it stays quiet: no alarm and no demand to resolve it.
4. Create or select prose in a manuscript unit, then link that unit to the gap.
5. Create one **fragment** marked **authored** while prose is already selected.
6. Click each linked outline item. Confirm the editor moves to the correct unit.
7. Select each manuscript unit. Confirm its linked outline item is visibly
   located or highlighted.
8. Move one planning item up or down and open the linked-order preview. Confirm
   the manuscript-unit order itself does not move.
9. Enter Focus mode, type a short sentence, save it, and exit Focus mode.
   Confirm the support panes return and the sentence remains.

### Minutes 9-17: Critique Workbench and Feedback Notes

10. Select a short, non-protected passage and open the outbound preview. Confirm
    it contains exactly the prose you selected—not the whole manuscript.
11. Read the provider, model, privacy, cost, advisory, uncertainty, and limitation
    disclosures. Decline once if you want to prove that declining sends nothing.
12. Repeat the preview, approve it, and wait for the result. Confirm typing is
    not blocked while the request is in progress.
13. Confirm the result looks useful but unmistakably advisory. Copy it once.
14. Save one concise Feedback Note in your own words. Do not paste an entire
    provider response unless that is deliberately what you want to keep.
15. Close and reopen the project. Find the saved Feedback Note and the two Living
    Outline items. Confirm the baseline manuscript sentences and order are
    unchanged except for the sentence you intentionally typed in Focus mode.

### Minutes 17-20: One Honest Failure and Three Answers

16. Exercise one bounded failure: edit the selection after previewing so the
    request becomes stale, cancel a request, or temporarily use an unavailable
    provider. Confirm the application explains the failure and writing remains
    usable.
17. Answer these three questions in one or two sentences each:
    - **Could I understand it?**
    - **Could I safely act on it?**
    - **Did it interrupt writing?**

## Pass And Repair Rules

Human Gate 1 passes when both workflows are understandable, author-controlled,
non-blocking, durable, and visibly advisory, and when the manuscript remains
unchanged except for intentional edits.

Stop and open a repair batch if any of these occur:

- prose or accepted manuscript order changes without an explicit author action;
- a saved outline item or Feedback Note disappears after reopen;
- data appears in the wrong project;
- Focus mode loses editor text;
- a decline, stale request, cancellation, or failed write is reported as success;
- the result presents itself as truth or makes safe action unclear.

A failed review does not restart tiny manual checks. Record the failure, repair
it as one bounded automation batch, rerun the full automated gate, and repeat
this complete 20-minute review once.

## Author Decision

- [ ] Human Gate 1 accepted
- [ ] Repair batch required

Notes:

- Could I understand it?
- Could I safely act on it?
- Did it interrupt writing?

