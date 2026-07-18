import { importReviewerScores, ReviewerScoreImportSafeStop } from './aiCritiqueQualificationArtifacts.js';

function option(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) throw new Error(`Required option ${name} is missing.`);
  return value;
}

async function main(): Promise<void> {
  const reviewer = option('--reviewer');
  if (reviewer !== 'reviewer-a' && reviewer !== 'reviewer-b') throw new Error('Reviewer must be reviewer-a or reviewer-b.');
  const result = await importReviewerScores({ runDir: option('--run-dir'), reviewer, templatePath: option('--template') });
  process.stdout.write(`${JSON.stringify({ reviewer: result.reviewer, validationStatus: result.validationStatus, recoveryStatus: result.recoveryStatus, acceptedScoreFilename: result.acceptedScoreFilename, acceptedScoreSha256: result.acceptedScoreSha256, lifecycle: result.lifecycle, otherReviewerPending: result.otherReviewerPending })}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${JSON.stringify({ validationStatus: 'INVALID', recoveryStatus: error instanceof ReviewerScoreImportSafeStop ? error.recoveryStatus : 'SAFE_STOP' })}\n`);
  process.exitCode = 1;
});
