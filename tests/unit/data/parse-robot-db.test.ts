import { describe, expect, it } from 'vitest';
import { parseSheet, parseRobotSheet } from '../../../scripts/parse-robot-db.ts';

const HTML = `<html><head><style>
.s1{text-decoration:line-through;}
.s2{color:#000;}
</style></head><body><table>
<tr><td class="s2">Unitree</td><td class="s2"><a href="https://x/g1">G1</a></td><td class="s2">二足</td></tr>
<tr><td class="s2"></td><td class="s1"><a href="https://x/old">G1-Boxing</a></td><td class="s2">競技用</td></tr>
</table></body></html>`;

describe('parseSheet', () => {
  it('取り消し線クラスをセル単位で検出する', () => {
    const rows = parseSheet(HTML);
    expect(rows[0][1].strike).toBe(false);
    expect(rows[1][1].strike).toBe(true);
  });

  it('セル内のhrefを保持する', () => {
    expect(parseSheet(HTML)[0][1].url).toBe('https://x/g1');
  });

  it('リンクの無いセルの url は null', () => {
    expect(parseSheet(HTML)[0][0].url).toBeNull();
  });

  it('タグを除去してテキストだけを返す', () => {
    expect(parseSheet(HTML)[0][1].text).toBe('G1');
  });

  it('HTMLエンティティを復号する', () => {
    const html = '<style>.a{}</style><table><tr><td class="a">A&amp;B</td></tr></table>';
    expect(parseSheet(html)[0][0].text).toBe('A&B');
  });

  it('ゼロ幅スペースを除去する', () => {
    const html = '<style>.a{}</style><table><tr><td class="a">​</td></tr></table>';
    expect(parseSheet(html)[0][0].text).toBe('');
  });

  it('1セルに複数のリンクがあるとき全部拾う', () => {
    // 代理店シートの「情報源」列は 51/57 行が複数URLを持つ。
    // 先頭1本だけ取ると残りが text へ連結され、出典として使えない文字列になる。
    const html =
      '<style>.a{}</style><table><tr><td class="a">' +
      '<a href="https://x/one">one</a><a href="https://x/two">two</a>' +
      '</td></tr></table>';
    const cell = parseSheet(html)[0][0];
    expect(cell.urls).toEqual(['https://x/one', 'https://x/two']);
    expect(cell.url).toBe('https://x/one');
  });

  it('<br> 区切りの素テキストURLを分割する', () => {
    // 代理店シートの「情報源」列は 51/57 行がこの形。<br> を剥がすと
    // https://a/https://b/ という1本の壊れた文字列になる。
    const html =
      '<style>.a{}</style><table><tr><td class="a">' +
      'https://x/one<br>https://x/two<br>https://x/three' +
      '</td></tr></table>';
    const cell = parseSheet(html)[0][0];
    expect(cell.urls).toEqual(['https://x/one', 'https://x/two', 'https://x/three']);
    expect(cell.text).toBe('https://x/one\nhttps://x/two\nhttps://x/three');
  });

  it('リンクと素テキストURLが混在しても重複させない', () => {
    const html =
      '<style>.a{}</style><table><tr><td class="a">' +
      '<a href="https://x/one">https://x/one</a><br>https://x/two' +
      '</td></tr></table>';
    expect(parseSheet(html)[0][0].urls).toEqual(['https://x/one', 'https://x/two']);
  });

  it('リンクが無いセルの urls は空配列', () => {
    expect(parseSheet(HTML)[0][0].urls).toEqual([]);
  });

  it('line-through を含まないクラスは strike にしない', () => {
    const html =
      '<style>.u{text-decoration:underline;}</style><table><tr><td class="u">X</td></tr></table>';
    expect(parseSheet(html)[0][0].strike).toBe(false);
  });
});

describe('parseRobotSheet', () => {
  // 原本の列は「行番号 / 調査 / メーカー / 機種 / (非表示) / 移動方式 …」の21セル。
  // メーカーは index 2、機種は index 3。テストもこの配置で組む。
  const cell = (value = '', { cls = 's2', href = null as string | null } = {}) =>
    `<td class="${cls}">${href ? `<a href="${href}">${value}</a>` : value}</td>`;

  const row = (cells: Record<number, string>) =>
    `<tr>${Array.from({ length: 21 }, (_, i) => cells[i] ?? cell()).join('')}</tr>`;

  /** データ行の開始位置を決めるヘッダ行（§1 の項目名行） */
  const headerRow = row({ 5: cell('設置・移動方式') });

  const sheet = (...rows: string[]) =>
    `<html><head><style>
.s1{text-decoration:line-through;}
.s2{color:#000;}
</style></head><body><table>${headerRow}${rows.join('')}</table></body></html>`;

  it('結合セルのメーカー名を前方補完する', () => {
    const html = sheet(
      row({ 2: cell('Unitree'), 3: cell('G1', { href: 'https://x/g1' }), 5: cell('二足') }),
      row({ 3: cell('G1 EDU', { href: 'https://x/g1edu' }), 5: cell('二足') }),
    );
    const rows = parseRobotSheet(html);
    expect(rows).toHaveLength(2);
    expect(rows[1].maker).toBe('Unitree');
  });

  it('メーカー名セルの取り消し線では除外しない（機種名セルのみで判定）', () => {
    // 計画 §1.2: Sunday Robotics はメーカー名セルに斜線があるが Memo は対象内。
    const html = sheet(
      row({
        2: cell('Sunday Robotics', { cls: 's1' }),
        3: cell('ACT-2', { cls: 's1', href: 'https://x/act2' }),
      }),
      row({ 3: cell('Memo', { href: 'https://x/memo' }), 5: cell('車輪') }),
    );
    const rows = parseRobotSheet(html);
    expect(rows[0]).toMatchObject({ model: 'ACT-2', strike: true });
    expect(rows[1]).toMatchObject({ maker: 'Sunday Robotics', model: 'Memo', strike: false });
  });

  it('機種名セルのURLとメーカー名セルのURLを分けて返す', () => {
    const html = sheet(
      row({
        2: cell('Unitree', { href: 'https://maker.example' }),
        3: cell('G1', { href: 'https://x/g1' }),
      }),
    );
    const rows = parseRobotSheet(html);
    expect(rows[0].makerUrl).toBe('https://maker.example');
    expect(rows[0].modelUrl).toBe('https://x/g1');
  });

  it('機種名が空の行は返さない', () => {
    expect(parseRobotSheet(sheet(row({ 2: cell('Unitree') })))).toHaveLength(0);
  });

  it('項目名ヘッダより前の行を取り込まない', () => {
    // 列記号行（A/B/C…）はメーカー・機種の位置に文字が入るため、
    // 行数固定でなく内容アンカーで飛ばせていることを確かめる。
    const html = `<html><head><style>.s2{color:#000;}</style></head><body><table>${row({
      2: cell('B'),
      3: cell('C'),
    })}${headerRow}${row({ 2: cell('Unitree'), 3: cell('G1') })}</table></body></html>`;
    const rows = parseRobotSheet(html);
    expect(rows).toHaveLength(1);
    expect(rows[0].model).toBe('G1');
  });

  it('スペック列を specs へ入れ、空セルは落とす', () => {
    const html = sheet(
      row({ 2: cell('Unitree'), 3: cell('G1'), 5: cell('二足'), 7: cell('35') }),
    );
    expect(parseRobotSheet(html)[0].specs).toEqual({ mobility: '二足', weightKg: '35' });
  });
});
