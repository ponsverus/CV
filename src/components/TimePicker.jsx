import React, { useEffect, useRef, useState } from 'react';

/**
 * TimePicker
 *
 * Props:
 *   value    — "HH:MM" string (formato 24h)
 *   onChange — (value: "HH:MM") => void
 */
export default function TimePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('h'); // 'h' | 'm'
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const dragging = useRef(false);

  const pad = (n) => String(n).padStart(2, '0');
  const display = value ? String(value).slice(0, 5) : '—';

  // parse value externo ao abrir
  useEffect(() => {
    if (!value) return;
    const [h, m] = String(value).split(':').map(Number);
    if (Number.isFinite(h)) setHour(h);
    if (Number.isFinite(m)) setMinute(m);
  }, [value]);

  // fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // desenha o relógio sempre que mode/hour/minute mudam
  useEffect(() => {
    if (!open) return;
    draw();
  }, [open, mode, hour, minute]);

  function openPicker() {
    if (value) {
      const [h, m] = String(value).split(':').map(Number);
      if (Number.isFinite(h)) setHour(h);
      if (Number.isFinite(m)) setMinute(m);
    }
    setMode('h');
    setOpen(true);
  }

  // ─── desenho ───────────────────────────────────────────────────────────────
  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 240, cx = 120, cy = 120;
    ctx.clearRect(0, 0, W, W);

    // face
    ctx.beginPath();
    ctx.arc(cx, cy, 116, 0, Math.PI * 2);
    ctx.fillStyle = '#242426';
    ctx.fill();

    // separadores sutis dos anéis (só na fase de hora)
    if (mode === 'h') {
      [92, 60].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    mode === 'h' ? drawHours(ctx, cx, cy) : drawMinutes(ctx, cx, cy);
    drawHand(ctx, cx, cy);
  }

  function numAngle(i, total) {
    return (i / total) * Math.PI * 2 - Math.PI / 2;
  }

  function drawHours(ctx, cx, cy) {
    // anel externo AM: 12, 1 … 11  R=92
    const amNums = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    amNums.forEach((n, i) => {
      const a = numAngle(i, 12);
      const R = 92;
      const x = cx + R * Math.cos(a);
      const y = cy + R * Math.sin(a);
      const active = hour === n;
      if (active) {
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#d4a017';
        ctx.fill();
      }
      ctx.fillStyle = active ? '#000' : '#e0e0e0';
      ctx.font = `${active ? 600 : 400} 14px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(n), x, y);
    });

    // anel interno PM: 13 … 23, 0  R=60
    const pmNums = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0];
    pmNums.forEach((n, i) => {
      const a = numAngle(i, 12);
      const R = 60;
      const x = cx + R * Math.cos(a);
      const y = cy + R * Math.sin(a);
      const label = n === 0 ? '00' : String(n);
      const active = hour === n;
      if (active) {
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#d4a017';
        ctx.fill();
      }
      ctx.fillStyle = active ? '#000' : '#777';
      ctx.font = `${active ? 600 : 400} 11px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y);
    });
  }

  function drawMinutes(ctx, cx, cy) {
    const R = 92;
    for (let i = 0; i < 60; i++) {
      const a = numAngle(i, 60);
      if (i % 5 !== 0) {
        // tick menor
        ctx.beginPath();
        ctx.moveTo(cx + (R + 6) * Math.cos(a), cy + (R + 6) * Math.sin(a));
        ctx.lineTo(cx + (R + 11) * Math.cos(a), cy + (R + 11) * Math.sin(a));
        ctx.strokeStyle = '#3a3a3c';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        continue;
      }
      const x = cx + R * Math.cos(a);
      const y = cy + R * Math.sin(a);
      const active = minute === i;
      if (active) {
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#d4a017';
        ctx.fill();
      }
      ctx.fillStyle = active ? '#000' : '#e0e0e0';
      ctx.font = `${active ? 600 : 400} 13px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pad(i), x, y);
    }
  }

  function drawHand(ctx, cx, cy) {
    let a, R;
    if (mode === 'h') {
      const isPM = hour >= 13 || hour === 0;
      R = isPM ? 60 : 92;
      const pmNums = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0];
      const amNums = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      const idx = isPM ? pmNums.indexOf(hour) : amNums.indexOf(hour);
      a = numAngle(idx < 0 ? 0 : idx, 12);
    } else {
      R = 92;
      a = numAngle(minute, 60);
    }

    const ex = cx + R * Math.cos(a);
    const ey = cy + R * Math.sin(a);

    // linha
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = 'rgba(212,160,23,0.75)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    // ponto central
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#d4a017';
    ctx.fill();

    // brilho na ponta
    const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 20);
    grad.addColorStop(0, 'rgba(212,160,23,0.22)');
    grad.addColorStop(1, 'rgba(212,160,23,0)');
    ctx.beginPath();
    ctx.arc(ex, ey, 20, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // ─── interação ─────────────────────────────────────────────────────────────
  function handlePointer(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * (240 / rect.width) - 120;
    const y = (clientY - rect.top) * (240 / rect.height) - 120;
    const dist = Math.hypot(x, y);
    const ang = Math.atan2(y, x) + Math.PI / 2;
    const norm = (ang < 0 ? ang + Math.PI * 2 : ang) / (Math.PI * 2);

    if (mode === 'h') {
      const inner = dist < 76;
      if (inner) {
        const pmNums = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0];
        const idx = Math.round(norm * 12) % 12;
        setHour(pmNums[idx]);
      } else {
        const amNums = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        const idx = Math.round(norm * 12) % 12;
        setHour(amNums[idx]);
      }

      if (e.type === 'pointerdown' || e.type === 'touchstart') {
        setTimeout(() => {
          setMode('m');
        }, 350);
      }
    } else {
      const m = Math.round(norm * 60 / 5) * 5 % 60;
      setMinute(m);

      // confirma ao soltar (pointerup/touchend) — tratado em onPointerUp
    }
  }

  function handlePointerUp() {
    if (mode === 'm' && dragging.current) {
      // já escolheu o minuto — salva e fecha
      const newVal = `${pad(hour)}:${pad(minute)}`;
      onChange(newVal);
      setOpen(false);
      dragging.current = false;
    }
  }

  function handlePointerDown(e) {
    dragging.current = true;
    handlePointer(e);
  }

  function handlePointerMove(e) {
    if (!dragging.current) return;
    handlePointer(e);
  }

  // quando muda para modo minuto após escolher hora, reseta dragging
  useEffect(() => {
    if (mode === 'm') dragging.current = false;
  }, [mode]);

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="relative inline-block w-full">

      {/* Trigger — bloco estilo InputWithChevron */}
      <button
        type="button"
        onClick={openPicker}
        className="w-full flex items-center justify-between px-4 py-3 bg-dark-200 border border-gray-800 rounded-custom text-white hover:border-gray-700 focus:border-primary/50 focus:outline-none transition-colors"
      >
        <span className="text-sm font-normal tabular-nums">{display}</span>
        <span className="pointer-events-none flex items-center justify-center w-5 h-5 rounded-full bg-dark-100 border border-gray-800 text-gray-400 text-xs shrink-0">
          ▾
        </span>
      </button>

      {/* Relógio analógico */}
      {open && (
        <div className="absolute left-0 mt-2 z-50 bg-dark-100 border border-gray-800 rounded-custom shadow-2xl p-3"
          style={{ width: 264 }}>
          <canvas
            ref={canvasRef}
            width={240}
            height={240}
            style={{ display: 'block', cursor: 'pointer', touchAction: 'none', borderRadius: '50%' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
        </div>
      )}
    </div>
  );
}
