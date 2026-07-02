import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { articles } from '../data/articles.ts';
import { deployments } from '../data/deployments.ts';
import { manufacturers } from '../data/manufacturers.ts';
import { robots } from '../data/robots.ts';
import { useCases } from '../data/useCases.ts';

const execFileAsync = promisify(execFile);

const entries = [];
const seen = new Set();

const addUrl = (owner, field, url) => {
  if (!url) return;
  const key = `${owner}\t${field}\t${url}`;
  if (seen.has(key)) return;
  seen.add(key);
  entries.push({ owner, field, url });
};

const addSources = (owner, sources = []) => {
  sources.forEach((source, index) => addUrl(owner, `sources[${index}]`, source.url));
};

const addImageAsset = (owner, field, image) => {
  if (!image) return;
  addUrl(owner, `${field}.sourceUrl`, image.sourceUrl);
};

const addImageAssets = (owner, record) => {
  addImageAsset(owner, 'heroImage', record.heroImage);
  if (!record.images) return;
  Object.entries(record.images).forEach(([role, image]) => addImageAsset(owner, `images.${role}`, image));
};

for (const useCase of useCases.filter((item) => item.publishStatus === 'published')) {
  addSources(`useCase:${useCase.id}`, useCase.sources);
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
  addSources(`deployment:${deployment.id}`, deployment.sources);
}

for (const article of articles.filter((item) => item.publishStatus === 'published')) {
  addSources(`article:${article.id}`, article.sources);
  addImageAssets(`article:${article.id}`, article);
}

for (const robot of robots.filter((item) => item.publishStatus === 'published')) {
  addSources(`robot:${robot.id}`, robot.sources);
  addImageAssets(`robot:${robot.id}`, robot);
}

for (const manufacturer of manufacturers.filter((item) => item.publishStatus === 'published')) {
  addSources(`manufacturer:${manufacturer.id}`, manufacturer.sources);
  addImageAsset(`manufacturer:${manufacturer.id}`, 'logo', manufacturer.logo);
}

let failures = 0;

for (const entry of entries) {
  try {
    const { stdout } = await execFileAsync('curl', [
      '-L',
      '-A',
      'DeploidSourceCheck/1.0',
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
    const blockedButReachable = status === 403 || status === 405;
    const ok = (status >= 200 && status < 400) || blockedButReachable;
    const label = ok ? (blockedButReachable ? 'BLOCKED' : 'OK') : 'FAIL';
    console.log(`${label}\t${statusText}\t${entry.owner}\t${entry.field}\t${effectiveUrl}`);
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
