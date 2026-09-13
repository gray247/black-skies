import { useEffect, useState } from 'react';

import {
  IDEATION_FIXED_CORE_QUESTIONS,
  IDEATION_MAX_TEXT_LENGTH,
  type IdeationBranchPosture,
  type IdeationContributionClass,
  type IdeationExplorationBranchV1,
  type IdeationIdeaSeedV1,
  type IdeationImportance,
  type IdeationPromotionDestination,
  type IdeationSnapshotV1,
  type IdeationUnresolvedAreaV1,
  type IdeationSeedKind,
} from '../../../shared/ipc/ideation';

export interface ManualIdeaSeedDraft {
  readonly title: string;
  readonly body: string;
  readonly kind: IdeationSeedKind;
  readonly tags: readonly string[];
  readonly protected: boolean;
}

export interface IdeasWorkspaceProps {
  readonly snapshot: IdeationSnapshotV1;
  readonly onCaptureSeed?: (draft: ManualIdeaSeedDraft) => void;
  readonly onCreateBranch?: (name: string, premise: string, seedIds: readonly string[], unknowns: readonly IdeationUnresolvedAreaV1[]) => void;
  readonly onTestPremise?: (branch: IdeationExplorationBranchV1, answers: Readonly<Record<string, string>>) => void;
  readonly onCombineSeeds?: (seedIds: readonly string[], name: string, premise: string, contributions: readonly { readonly seedId: string; readonly importance: IdeationImportance; readonly classification: IdeationContributionClass; readonly sourceVersionId: string | null; readonly note: string | null }[]) => void;
  readonly onArchiveBranch?: (branch: IdeationExplorationBranchV1) => void;
  readonly onRestoreBranch?: (branch: IdeationExplorationBranchV1) => void;
  readonly onPreparePromotion?: (branch: IdeationExplorationBranchV1, destination: IdeationPromotionDestination, selectedText: string, seedIds: readonly string[]) => void;
  readonly onRoutePromotion?: (branch: IdeationExplorationBranchV1, destination: IdeationPromotionDestination, selectedText: string, seedIds: readonly string[]) => void;
}

const seedKinds: readonly IdeationSeedKind[] = [
  'fragment', 'title', 'image', 'character', 'creature', 'location', 'ending', 'line', 'question', 'mood', 'partial-premise',
];

const destinations: readonly IdeationPromotionDestination[] = [
  'author-intent', 'outline', 'story-unit', 'narrative-insertion', 'character', 'lore', 'memory',
];

function currentSeedVersion(seed: IdeationIdeaSeedV1) {
  return seed.versions.find((version) => version.id === seed.currentVersionId) ?? null;
}

function currentPremise(branch: IdeationExplorationBranchV1): string {
  if (!branch.currentPremiseVersionId) return 'No premise saved yet.';
  return branch.premiseVersions.find((version) => version.id === branch.currentPremiseVersionId)?.text ?? 'Premise version unavailable.';
}

function provenanceLabel(seed: IdeationIdeaSeedV1): string {
  const version = currentSeedVersion(seed);
  if (!version) return 'No saved version';
  return version.provenance.kind === 'ai-advisory' ? 'Local AI' : version.provenance.kind === 'mixed' ? 'You and local AI' : 'You';
}

function postureLabel(posture: IdeationBranchPosture): string {
  return posture.replace(/-/gu, ' ');
}

function destinationLabel(destination: IdeationPromotionDestination): string {
  const labels: Record<IdeationPromotionDestination, string> = {
    'author-intent': 'Story Foundation',
    outline: 'Outline',
    'story-unit': 'Writing section',
    'narrative-insertion': 'Manuscript insertion',
    character: 'Character notes',
    lore: 'World notes',
    memory: 'Project memory',
  };
  return labels[destination];
}

export default function IdeasWorkspace({
  snapshot,
  onCaptureSeed,
  onCreateBranch,
  onTestPremise,
  onCombineSeeds,
  onArchiveBranch,
  onRestoreBranch,
  onPreparePromotion,
  onRoutePromotion,
}: IdeasWorkspaceProps): JSX.Element {
  const [seedDraft, setSeedDraft] = useState<ManualIdeaSeedDraft>({ title: '', body: '', kind: 'fragment', tags: [], protected: false });
  const [tagText, setTagText] = useState('');
  const [selectedSeedIds, setSelectedSeedIds] = useState<Set<string>>(() => new Set());
  const [combineName, setCombineName] = useState('');
  const [combinePremise, setCombinePremise] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchPremise, setBranchPremise] = useState('');
  const [branchUnknowns, setBranchUnknowns] = useState('');
  const [testAnswers, setTestAnswers] = useState<Record<string, Record<string, string>>>({});
  const [promotionText, setPromotionText] = useState<Record<string, string>>({});
  const [promotionDestination, setPromotionDestination] = useState<Record<string, IdeationPromotionDestination>>({});

  useEffect(() => {
    setSeedDraft({ title: '', body: '', kind: 'fragment', tags: [], protected: false });
    setTagText('');
    setSelectedSeedIds(new Set());
    setCombineName('');
    setCombinePremise('');
    setBranchName('');
    setBranchPremise('');
    setBranchUnknowns('');
    setTestAnswers({});
    setPromotionText({});
    setPromotionDestination({});
  }, [snapshot.document.projectId]);

  const seedsById = new Map(snapshot.document.seeds.map((seed) => [seed.id, seed]));
  const toggleSeed = (seedId: string) => setSelectedSeedIds((previous) => {
    const next = new Set(previous);
    if (next.has(seedId)) next.delete(seedId); else next.add(seedId);
    return next;
  });
  const capture = () => {
    onCaptureSeed?.({ ...seedDraft, tags: tagText.split(',').map((tag) => tag.trim()).filter(Boolean) });
  };
  const createBranch = () => {
    const unknowns = branchUnknowns.split('\n').map((statement, index) => statement.trim()).filter(Boolean).map((statement, index): IdeationUnresolvedAreaV1 => ({
      id: `draft-unknown-${index + 1}`,
      statement,
      posture: 'intentional-ambiguity',
      revisitCondition: null,
    }));
    onCreateBranch?.(branchName, branchPremise, [...selectedSeedIds], unknowns);
  };
  const combine = () => {
    const ids = [...selectedSeedIds];
    const contributions = ids.map((seedId) => ({ seedId, importance: 'supporting' as const, classification: 'central' as const, sourceVersionId: seedsById.get(seedId)?.currentVersionId ?? null, note: null }));
    onCombineSeeds?.(ids, combineName, combinePremise, contributions);
  };

  return (
    <section className="program7-ideas-workspace" aria-labelledby="program7-ideas-heading" data-testid="ideas-workspace" data-writing-gate="false">
      <header>
        <h1 id="program7-ideas-heading">Ideas</h1>
        <p>Capture possibilities, explore different directions, and decide later what belongs in the story.</p>
        <p data-testid="ideas-optional">You can skip this workspace and continue writing at any time.</p>
        <p>{snapshot.document.seeds.length} idea{snapshot.document.seeds.length === 1 ? '' : 's'} · {snapshot.document.branches.length} direction{snapshot.document.branches.length === 1 ? '' : 's'}</p>
      </header>
      {snapshot.availability === 'degraded' ? <p role="alert" data-testid="ideas-degraded">{snapshot.message ?? 'Ideas are temporarily unavailable. No change was made.'}</p> : null}
      {snapshot.message && snapshot.availability === 'ready' ? <p data-testid="ideas-message">{snapshot.message}</p> : null}

      <section aria-labelledby="ideas-capture-heading" className="program7-ideas-workspace__capture">
        <h2 id="ideas-capture-heading">Capture an idea</h2>
        <p>Start with your own words. Anything suggested by AI stays separate until you choose it.</p>
        <label htmlFor="ideas-seed-title">Title</label>
        <input id="ideas-seed-title" value={seedDraft.title} onChange={(event) => setSeedDraft({ ...seedDraft, title: event.target.value })} />
        <label htmlFor="ideas-seed-kind">Form</label>
        <select id="ideas-seed-kind" value={seedDraft.kind} onChange={(event) => setSeedDraft({ ...seedDraft, kind: event.target.value as IdeationSeedKind })}>
          {seedKinds.map((kind) => <option key={kind} value={kind}>{kind.replace(/-/gu, ' ')}</option>)}
        </select>
        <label htmlFor="ideas-seed-body">Your idea</label>
        <textarea id="ideas-seed-body" maxLength={IDEATION_MAX_TEXT_LENGTH} value={seedDraft.body} onChange={(event) => setSeedDraft({ ...seedDraft, body: event.target.value })} />
        <label htmlFor="ideas-seed-tags">Tags, separated by commas</label>
        <input id="ideas-seed-tags" value={tagText} onChange={(event) => setTagText(event.target.value)} />
        <label><input type="checkbox" checked={seedDraft.protected} onChange={(event) => setSeedDraft({ ...seedDraft, protected: event.target.checked })} /> Keep this idea’s text private from project tools</label>
        <button type="button" disabled={!onCaptureSeed} onClick={capture}>Save idea</button>
      </section>

      <section aria-labelledby="ideas-library-heading" className="program7-ideas-workspace__library">
        <header><h2 id="ideas-library-heading">Saved ideas</h2><p>Select ideas you want to explore together. Private ideas keep their text hidden from project tools.</p></header>
        {snapshot.document.seeds.length === 0 ? <p data-testid="ideas-library-empty">No ideas saved yet.</p> : (
          <div className="program7-ideas-workspace__seed-list">
            {snapshot.document.seeds.map((seed) => {
              const version = currentSeedVersion(seed);
              const protectedSeed = seed.protected;
              return (
                <article key={seed.id} data-testid={`idea-seed-${seed.id}`}>
                  <h3>{protectedSeed ? 'Protected idea seed' : version?.title ?? 'Untitled idea seed'}</h3>
                  <p>{protectedSeed ? 'Content hidden by protection policy.' : version?.body ?? 'No current seed version.'}</p>
                  <dl><div><dt>Type</dt><dd>{version?.kind?.replace(/-/gu, ' ') ?? 'unknown'}</dd></div><div><dt>Created by</dt><dd>{provenanceLabel(seed)}</dd></div><div><dt>Status</dt><dd>{seed.lifecycle}</dd></div><div><dt>Used in directions</dt><dd>{seed.branchIds.length}</dd></div></dl>
                  <p>{seed.tags.length > 0 ? `Tags: ${seed.tags.join(', ')}` : 'No tags'}</p>
                  <label><input type="checkbox" checked={selectedSeedIds.has(seed.id)} disabled={protectedSeed} onChange={() => toggleSeed(seed.id)} /> Select for a new direction</label>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="ideas-branch-create-heading" className="program7-ideas-workspace__branch-create">
        <h2 id="ideas-branch-create-heading">Explore a direction</h2>
        <p>Develop one possible path without changing the manuscript.</p>
        <label htmlFor="ideas-branch-name">Direction name</label>
        <input id="ideas-branch-name" value={branchName} onChange={(event) => setBranchName(event.target.value)} />
        <label htmlFor="ideas-branch-premise">Premise</label>
        <textarea id="ideas-branch-premise" value={branchPremise} onChange={(event) => setBranchPremise(event.target.value)} />
        <label htmlFor="ideas-branch-unknowns">Intentional unknowns, one per line</label>
        <textarea id="ideas-branch-unknowns" value={branchUnknowns} onChange={(event) => setBranchUnknowns(event.target.value)} />
        <button type="button" disabled={!onCreateBranch} onClick={createBranch}>Create direction</button>
      </section>

      <section aria-labelledby="ideas-combine-heading" className="program7-ideas-workspace__combine">
        <h2 id="ideas-combine-heading">Combine selected ideas</h2>
        <p>{selectedSeedIds.size} idea{selectedSeedIds.size === 1 ? '' : 's'} selected. You will still be able to see which ideas shaped the result.</p>
        <label htmlFor="ideas-combine-name">Combination name</label>
        <input id="ideas-combine-name" value={combineName} onChange={(event) => setCombineName(event.target.value)} />
        <label htmlFor="ideas-combine-premise">Combination premise</label>
        <textarea id="ideas-combine-premise" value={combinePremise} onChange={(event) => setCombinePremise(event.target.value)} />
        <button type="button" disabled={!onCombineSeeds || selectedSeedIds.size < 2} onClick={combine}>Combine selected ideas</button>
      </section>

      <section aria-labelledby="ideas-branches-heading" className="program7-ideas-workspace__branches">
        <h2 id="ideas-branches-heading">Directions</h2>
        {snapshot.document.branches.length === 0 ? <p data-testid="ideas-branches-empty">No directions created yet.</p> : snapshot.document.branches.map((branch) => {
          const answers = testAnswers[branch.id] ?? {};
          const selectedPromotionText = promotionText[branch.id] ?? currentPremise(branch);
          const destination = promotionDestination[branch.id] ?? 'author-intent';
          const prepared = snapshot.document.promotionPackages.find((candidate) =>
            candidate.branchId === branch.id &&
            candidate.destination === destination &&
            candidate.selectedText === selectedPromotionText,
          );
          const destinationCanRoute = destination === 'author-intent' || destination === 'outline' || destination === 'character' || destination === 'lore';
          const archived = branch.posture === 'archived';
          return (
            <article key={branch.id} id={`idea-branch-${branch.id}`} tabIndex={-1} data-testid={`idea-branch-${branch.id}`}>
              <header><div><h3>{branch.name}</h3><p>{postureLabel(branch.posture)}</p></div><span>{archived ? 'Archived branch' : 'Active branch'}</span></header>
              <dl>
                <div><dt>Parent branch</dt><dd>{branch.parentBranchId ?? 'None; original exploration'}</dd></div>
                <div><dt>Lineage branches</dt><dd>{branch.lineageBranchIds.length > 0 ? branch.lineageBranchIds.join(', ') : 'No descendants recorded'}</dd></div>
                <div><dt>Seed lineage</dt><dd>{branch.seedIds.length > 0 ? branch.seedIds.join(', ') : 'No seed attached'}</dd></div>
              </dl>
              <section aria-labelledby={`idea-branch-premise-${branch.id}`}><h4 id={`idea-branch-premise-${branch.id}`}>Current premise</h4><p>{currentPremise(branch)}</p></section>
              <section aria-label={`Intentional unknowns for ${branch.name}`}><h4>Unknowns and ambiguity</h4>{branch.unknowns.length === 0 ? <p>No unresolved areas recorded.</p> : <ul>{branch.unknowns.map((unknown) => <li key={unknown.id}><strong>{unknown.posture.replace('-', ' ')}</strong>: {unknown.statement}{unknown.revisitCondition ? ` · Revisit when: ${unknown.revisitCondition}` : ''}</li>)}</ul>}</section>
              <section aria-label={`Advisory premise test for ${branch.name}`}><h4>Premise test · advisory only</h4><p>Test findings are exploratory guidance, not canon, manuscript truth, or a branch decision.</p>{IDEATION_FIXED_CORE_QUESTIONS.map((question) => <label key={question.id} htmlFor={`idea-test-${branch.id}-${question.id}`}>{question.prompt}<input id={`idea-test-${branch.id}-${question.id}`} value={answers[question.id] ?? ''} onChange={(event) => setTestAnswers((previous) => ({ ...previous, [branch.id]: { ...answers, [question.id]: event.target.value } }))} /></label>)}<button type="button" disabled={!onTestPremise} onClick={() => onTestPremise?.(branch, answers)}>Run advisory premise test</button>{snapshot.document.premiseTests.filter((test) => test.branchId === branch.id).map((test) => <p key={test.id} data-testid={`idea-test-result-${test.id}`}>Advisory result: {test.findings.length} finding{test.findings.length === 1 ? '' : 's'} · uncertainty remains visible.</p>)}</section>
              <div aria-label={`Branch actions for ${branch.name}`}>
                {archived ? <button type="button" disabled={!onRestoreBranch} onClick={() => onRestoreBranch?.(branch)}>Restore branch</button> : <button type="button" disabled={!onArchiveBranch} onClick={() => onArchiveBranch?.(branch)}>Archive branch</button>}
              </div>
              <section aria-label={`Send ${branch.name} to another part of the project`}><h4>Use this direction elsewhere</h4><p>Preview the text and destination before anything is copied.</p><label htmlFor={`idea-promotion-destination-${branch.id}`}>Send to</label><select id={`idea-promotion-destination-${branch.id}`} value={destination} onChange={(event) => setPromotionDestination((previous) => ({ ...previous, [branch.id]: event.target.value as IdeationPromotionDestination }))}>{destinations.map((option) => <option key={option} value={option}>{destinationLabel(option)}</option>)}</select><label htmlFor={`idea-promotion-text-${branch.id}`}>Text to preview</label><textarea id={`idea-promotion-text-${branch.id}`} value={selectedPromotionText} onChange={(event) => setPromotionText((previous) => ({ ...previous, [branch.id]: event.target.value }))} /><button type="button" disabled={!onPreparePromotion || selectedPromotionText.length === 0} onClick={() => onPreparePromotion?.(branch, destination, selectedPromotionText, branch.seedIds)}>Preview destination</button>{prepared ? <><p role="status">This text is ready to send to {destinationLabel(destination)}.</p>{destinationCanRoute ? <button type="button" disabled={!onRoutePromotion} onClick={() => onRoutePromotion?.(branch, destination, selectedPromotionText, branch.seedIds)}>Send to {destinationLabel(destination)}</button> : <p>This destination is planned but not available yet. Your preview remains saved here.</p>}</> : null}</section>
            </article>
          );
        })}
      </section>
    </section>
  );
}
