import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { deployments } from '../data/deployments.ts';
import { useCases } from '../data/useCases.ts';

const execFileAsync = promisify(execFile);

const entries = [];
const seen = new Set();

const addUrl = (owner, field, url) => {
  const key = `${field}\t${url}`;
  if (seen.has(key)) return;
  seen.add(key);
  entries.push({ owner, field, url });
};

for (const useCase of useCases.filter((item) => item.publishStatus === 'published')) {
  useCase.sources.forEach((source, index) =>
    addUrl(`useCase:${useCase.id}`, `sources[${index}]`, source.url),
  );
  useCase.candidateRobots.forEach((candidate, candidateIndex) => {
    candidate.evidenceSourceUrls?.forEach((url, sourceIndex) =>
      addUrl(
        `useCase:${useCase.id}:candidateRobots[${candidateIndex}]:${candidate.robotId}`,
        `evidenceSourceUrls[${sourceIndex}]`,
        url,
      ),
    );
  });
}

for (const deployment of deployments.filter((item) => item.publishStatus === 'published')) {
  deployment.sources.forEach((source, index) =>
    addUrl(`deployment:${deployment.id}`, `sources[${index}]`, source.url),
  );
}

let failures = 0;

for (const entry of entries) {
  try {
    const { stdout } = await execFileAsync('curl', [
      '-L',
      '--max-time',
      '15',
      '-o',
      '/dev/null',
      '-s',
      '-w',
      '%{http_code}\t%{url_effective}',
      entry.url,
    ]);
    const [statusText, effectiveUrl] = stdout.trim().split('\t');
    const status = Number(statusText);
    const ok = status >= 200 && status < 400;
    console.log(`${ok ? 'OK' : 'FAIL'}\t${statusText}\t${entry.owner}\t${entry.field}\t${effectiveUrl}`);
    if (!ok) failures += 1;
  } catch (error) {
    failures += 1;
    console.log(`FAIL\tERROR\t${entry.owner}\t${entry.field}\t${entry.url}`);
    if (error instanceof Error && error.message) {
      console.log(`  ${error.message}`);
    }
  }
}

if (failures > 0) {
  console.error(`[source-links] ${failures} URL(s) failed`);
  process.exit(1);
}

console.log(`[source-links] OK (${entries.length} URL checks)`);
