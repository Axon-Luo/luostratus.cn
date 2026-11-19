import { useState } from 'preact/hooks';
import { LESSONS } from '../content/lessons';
import type { LessonSample } from '../content/lessons';
import { contrastRatio } from '../core/color/contrast';
import { lessonPalette } from '../core/lessons';
import { applyPaletteToStudio, toast } from '../state';
import { Card, Tabs } from '../ui/components';

const READ_KEY = 'cf.learn.v1';

function loadRead(): string[] {
  try {
    const raw = localStorage.getItem(READ_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function SampleRow({ s }: { s: LessonSample }) {
  const ratio = contrastRatio(s.fg, s.bg);
  const target = s.size === 'large' ? 3 : 4.5;
  const ok = ratio >= target;
  return (
    <div class="lesson-sample">
      <p
        class="lesson-sample-text"
        style={{
          background: s.bg,
          color: s.fg,
          fontSize: s.size === 'large' ? '20px' : '14px',
          fontWeight: s.size === 'large' ? 700 : 400,
        }}
        aria-hidden="true"
      >
        配色工坊 Aa · 把生活调成喜欢的颜色
      </p>
      <div class="lesson-sample-meta">
        <span>{s.label}</span>
        <span class="mono">
          {s.fg} / {s.bg} · {ratio.toFixed(2)}:1
        </span>
        <span class={`badge ${ok ? 'ok' : 'bad'}`}>{ok ? '达标' : '未达标'}</span>
      </div>
    </div>
  );
}

export function Learn() {
  const [selected, setSelected] = useState<string | null>(null);
  const [level, setLevel] = useState<'all' | '入门' | '进阶'>('all');
  const [read, setRead] = useState<string[]>(loadRead);
  const lesson = LESSONS.find((l) => l.id === selected);

  const open = (id: string) => {
    setSelected(id);
    setRead((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(READ_KEY, JSON.stringify(next));
      } catch {
        /* 隐私模式下仅本次有效 */
      }
      return next;
    });
    window.scrollTo({ top: 0 });
  };

  if (lesson) {
    const p = lessonPalette(lesson);
    const index = LESSONS.findIndex((l) => l.id === lesson.id);
    const next = LESSONS[index + 1];
    return (
      <div class="container page">
        <button
          type="button"
          class="link"
          onClick={() => {
            setSelected(null);
            window.scrollTo({ top: 0 });
          }}
        >
          回到小课堂
        </button>
        <header class="page-head lesson-head">
          <span class="lesson-meta">
            第 {index + 1} / {LESSONS.length} 篇 · {lesson.level} · {lesson.minutes} 分钟
          </span>
          <h1>{lesson.title}</h1>
          <p>{lesson.summary}</p>
        </header>

        <Card title="示例配色">
          <div class="theme-strip lesson-strip" aria-hidden="true">
            {p.colors.map((c) => (
              <i key={c.role} style={{ background: c.hex }} />
            ))}
          </div>
          <div class="card-actions lesson-actions">
            <button
              type="button"
              class="btn primary sm"
              onClick={() => {
                applyPaletteToStudio(p);
                toast('已带回工作台');
              }}
            >
              用这套去工作台试试
            </button>
            <a class="btn ghost sm" href="#/cases">
              看生活案例
            </a>
          </div>
        </Card>

        <div class="lesson-sections">
          {lesson.sections.map((section) => (
            <section class="lesson-section" key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.text}</p>
              {section.points && (
                <ul class="lesson-points">
                  {section.points.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {section.table && (
                <div class="lesson-table-wrap">
                  <table class="lesson-table">
                    <thead>
                      <tr>
                        {section.table.head.map((h) => (
                          <th scope="col" key={h}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row) => (
                        <tr key={row.join('|')}>
                          {row.map((cell, i) => (
                            <td key={`${cell}-${i}`}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {section.samples && (
                <div class="lesson-samples" role="group" aria-label="对比度示例">
                  {section.samples.map((s) => (
                    <SampleRow key={`${s.fg}-${s.bg}`} s={s} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        <Card title="带走这几点">
          <ul class="lesson-takeaways">
            {lesson.takeaways.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        {next && (
          <button type="button" class="btn ghost wide lesson-next" onClick={() => open(next.id)}>
            下一篇：{next.title}
          </button>
        )}
      </div>
    );
  }

  const totalMinutes = LESSONS.reduce((sum, l) => sum + l.minutes, 0);
  const beginner = LESSONS.filter((l) => l.level === '入门').length;
  const filtered = level === 'all' ? LESSONS : LESSONS.filter((l) => l.level === level);

  return (
    <div class="container page">
      <header class="page-head">
        <h1>配色小课堂</h1>
        <p>
          {LESSONS.length} 篇 · 约 {totalMinutes} 分钟：从比例与对比度，到色觉、色彩模型、色阶与印刷；每篇都带示例与可以直接用的配色
        </p>
      </header>

      <div class="lesson-filter">
        <Tabs
          small
          options={[
            { id: 'all', label: `全部 ${LESSONS.length}` },
            { id: '入门', label: `入门 ${beginner}` },
            { id: '进阶', label: `进阶 ${LESSONS.length - beginner}` },
          ]}
          value={level}
          onChange={(id) => setLevel(id as 'all' | '入门' | '进阶')}
        />
        <span class="hint">已读 {read.filter((id) => LESSONS.some((l) => l.id === id)).length} 篇</span>
      </div>

      <div class="lesson-grid">
        {filtered.map((item) => {
          const p = lessonPalette(item);
          const isRead = read.includes(item.id);
          return (
            <article class="lesson-card" key={item.id}>
              <div class="lesson-card-top">
                <span class="lesson-meta">
                  {item.level} · {item.minutes} 分钟
                  {isRead && <span class="lesson-read">已读</span>}
                </span>
                <div class="lesson-strip" aria-hidden="true">
                  {p.colors.map((c) => (
                    <i key={c.role} style={{ background: c.hex }} />
                  ))}
                </div>
              </div>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
              <button type="button" class="btn ghost sm" onClick={() => open(item.id)}>
                {isRead ? '继续阅读' : '开始阅读'}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
