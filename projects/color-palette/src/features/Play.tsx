import { useEffect, useRef, useState } from 'preact/hooks';
import {
  buildRound,
  isCorrect,
  scoreFor,
} from '../core/challenge';
import type { ChallengeMode, ChallengeRound } from '../core/challenge';
import { challenge, recordChallengeScore } from '../state';
import { Card, Empty } from '../ui/components';
import { copyText } from './fileExport';

const ROUNDS = 10;
const SECONDS = 60;

const MODE_LABELS: Record<ChallengeMode, string> = {
  hue: '找色相',
  order: '排明度',
  odd: '找不同',
  contrast: '对比度',
};

const MODE_DESCRIPTIONS: Record<ChallengeMode, string> = {
  hue: '屏幕给一个目标色，从几块相似色里找出色相最接近的一块；越往后色差越小',
  order: '五到七块同色系颜色打乱，按提示方向排序；相邻两块只差一点点',
  odd: '六到八块里只有一块不同，找出偏掉色相或饱和度的那块',
  contrast: '四到五组文字与背景，只有一组达到题目要求的阈值，其余都差一点',
};

export function Play() {
  const [mode, setMode] = useState<ChallengeMode>('hue');
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [round, setRound] = useState<ChallengeRound | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SECONDS);
  const [answer, setAnswer] = useState<number | number[] | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [feedback, setFeedback] = useState('');
  const [lastResult, setLastResult] = useState<{ correct: boolean } | null>(null);
  const [runId, setRunId] = useState(0);
  const seedRef = useRef(0);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setTimeLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [running, runId]);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setRunning(false);
    setFinished(true);
    recordChallengeScore(score);
  };

  useEffect(() => {
    if (running && timeLeft === 0) finish();
  }, [timeLeft, running]);

  const begin = (nextMode: ChallengeMode) => {
    setMode(nextMode);
    seedRef.current = (Date.now() ^ (nextMode === 'hue' ? 0x9e3779b9 : 0x85ebca6b)) >>> 0;
    setRunId((value) => value + 1);
    setRunning(true);
    setFinished(false);
    setRoundIndex(0);
    setScore(0);
    setTimeLeft(SECONDS);
    setAnswer(null);
    setOrder([]);
    setFeedback('');
    setLastResult(null);
    setRound(buildRound(nextMode, seedRef.current, 0));
    finishedRef.current = false;
  };

  const start = () => begin(mode);

  const switchMode = (nextMode: ChallengeMode) => {
    if (nextMode === mode) return;
    if (running) {
      begin(nextMode);
      return;
    }
    setMode(nextMode);
    if (finished) {
      setFinished(false);
      setRound(null);
      setAnswer(null);
      setOrder([]);
      setFeedback('');
      setLastResult(null);
    }
  };

  const choose = (index: number) => {
    if (!running || !round || round.mode === 'order' || feedback) return;
    const correct = isCorrect(round, index);
    setAnswer(index);
    setFeedback(correct ? '答对了' : '这次没对');
    setLastResult({ correct });
    if (correct) setScore((value) => value + scoreFor(true, timeLeft));
  };

  const toggleOrder = (index: number) => {
    if (!running || !round || round.mode !== 'order' || feedback) return;
    setOrder((old) => (old.includes(index) ? old.filter((x) => x !== index) : [...old, index]));
  };

  const submitOrder = () => {
    if (!running || !round || round.mode !== 'order' || feedback) return;
    if (order.length !== round.options.length) return;
    const correct = isCorrect(round, order);
    setAnswer(order);
    setFeedback(correct ? '顺序正确' : '顺序不对');
    setLastResult({ correct });
    if (correct) setScore((value) => value + scoreFor(true, timeLeft));
  };

  const next = () => {
    if (!round || finishedRef.current) return;
    if (roundIndex + 1 >= ROUNDS) {
      finish();
      return;
    }
    setRoundIndex((value) => value + 1);
    setRound(buildRound(mode, seedRef.current, roundIndex + 1));
    setAnswer(null);
    setOrder([]);
    setFeedback('');
  };

  // 作答后自动进入下一题；最后一题自动结算
  useEffect(() => {
    if (!running || !feedback) return;
    const timer = setTimeout(() => next(), 900);
    return () => clearTimeout(timer);
  }, [feedback, running]);

  const best = challenge.value.best;

  return (
    <div class="container page">
      <header class="page-head">
        <h1>配色挑战</h1>
        <p>60 秒，10 道题：找色相、排明度、找不同、对比度，颜色差越小，越考验眼睛</p>
      </header>

      <Card
        title={running ? `第 ${roundIndex + 1} / ${ROUNDS} 题` : finished ? '本局结束' : '准备开始'}
        hint={`最佳 ${best} 分${running ? ' · 切换题型会重新开始' : ''}`}
        actions={
          <div class="card-actions">
            {(['hue', 'order', 'odd', 'contrast'] as ChallengeMode[]).map((id) => (
              <button
                key={id}
                type="button"
                class={`chip ${mode === id ? 'is-on' : ''}`}
                aria-pressed={mode === id}
                onClick={() => switchMode(id)}
              >
                {MODE_LABELS[id]}
              </button>
            ))}
          </div>
        }
      >
        {!running && !finished && (
          <div class="play-start">
            <p>{MODE_DESCRIPTIONS[mode]}</p>
            <button type="button" class="btn primary" onClick={start}>
              开始挑战
            </button>
          </div>
        )}

        {running && round && (
          <>
            <div class="play-status" aria-live="polite">
              <span>
                得分 <b>{score}</b>
              </span>
              <span class={timeLeft <= 10 ? 'play-time is-low' : 'play-time'}>
                剩余 <b>{timeLeft}s</b>
              </span>
              {lastResult && (
                <span class={`play-last ${lastResult.correct ? 'is-ok' : 'is-bad'}`}>
                  上一题 {lastResult.correct ? '✓ 正确' : '✗ 错误'}
                </span>
              )}
              <span class="hint">难度 {Math.round(round.difficulty * 9 + 1)}/10</span>
              <span class="hint">{round.prompt}</span>
            </div>

            {round.target && (
              <div class="play-target">
                <span>目标色</span>
                <i style={{ background: round.target }} />
                <em class="mono">{round.target}</em>
              </div>
            )}

            {round.mode === 'contrast' && round.pairs ? (
              <div class="play-pairs">
                {round.pairs.map((pair, index) => {
                  const picked = typeof answer === 'number' && answer === index;
                  const correct = !!feedback && round.answer === index;
                  return (
                    <button
                      type="button"
                      key={`${pair.fg}-${pair.bg}-${index}`}
                      class={`play-pair ${picked ? 'is-picked' : ''} ${correct ? 'is-correct' : ''}`}
                      style={{ background: pair.bg, color: pair.fg }}
                      disabled={!!feedback}
                      onClick={() => choose(index)}
                      aria-label={`文字对比度选项 ${index + 1}`}
                    >
                      <span>把生活调成喜欢的颜色</span>
                      <em>Aa 正文 16px</em>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div
                class={`play-options ${round.mode === 'order' ? 'is-order' : ''} ${
                  round.mode === 'odd' ? 'is-odd' : ''
                }`}
              >
                {round.options.map((hex, index) => {
                  const isOrder = round.mode === 'order';
                  const userRank = order.indexOf(index);
                  const correctRank = Array.isArray(round.answer)
                    ? round.answer.indexOf(index)
                    : -1;
                  const picked = !isOrder && typeof answer === 'number' && answer === index;
                  const correct = isOrder
                    ? !!feedback && userRank === correctRank
                    : !!feedback && round.answer === index;
                  const miss = isOrder && !!feedback && userRank !== correctRank;
                  return (
                    <button
                      type="button"
                      key={`${hex}-${index}`}
                      class={`play-option ${picked ? 'is-picked' : ''} ${correct ? 'is-correct' : ''} ${
                        miss ? 'is-miss' : ''
                      }`}
                      style={{ background: hex }}
                      disabled={!!feedback}
                      onClick={() => (isOrder ? toggleOrder(index) : choose(index))}
                      aria-label={
                        isOrder && feedback
                          ? `颜色 ${hex}，正确顺序第 ${correctRank + 1}`
                          : `颜色 ${hex}`
                      }
                    >
                      {isOrder && feedback && (
                        <>
                          <span>{correctRank + 1}</span>
                          {miss && <em class="play-rank-you">你 {userRank + 1}</em>}
                        </>
                      )}
                      {isOrder && !feedback && userRank >= 0 && <span>{userRank + 1}</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {round.mode === 'order' && !feedback && (
              <div class="card-actions">
                <button
                  type="button"
                  class="btn primary"
                  disabled={order.length !== round.options.length}
                  onClick={submitOrder}
                >
                  提交顺序
                </button>
                <span class="hint">已选 {order.length} / {round.options.length}</span>
              </div>
            )}

            {feedback && (
              <div class="play-feedback">
                <p>
                  <strong>{feedback}</strong>
                  {round.explanation}
                  {round.mode === 'order' && ' 块上数字是正确顺序，红框上的「你 N」是你排的位置'}
                </p>
                <span class="play-next-hint">
                  即将{roundIndex + 1 >= ROUNDS ? '查看结果' : '进入下一题'}…
                </span>
              </div>
            )}
          </>
        )}

        {finished && (
          <div class="play-result">
            <strong>{score} 分</strong>
            <p>最佳成绩 {best} 分，错几道没关系，下次先看明暗再看色相</p>
            <div class="card-actions">
              <button type="button" class="btn primary" onClick={start}>
                再来一局
              </button>
              <button
                type="button"
                class="btn ghost"
                onClick={() =>
                  copyText(`配色挑战：${score} 分 / 最佳 ${best} 分，来试试你的眼睛`, '成绩已复制')
                }
              >
                复制成绩
              </button>
              <a class="btn ghost" href="#/daily">
                看今日一色
              </a>
            </div>
          </div>
        )}
      </Card>

      {!round && !running && !finished && (
        <Card title="小提示">
          <Empty>先选一种题型，点「开始挑战」</Empty>
        </Card>
      )}
    </div>
  );
}
