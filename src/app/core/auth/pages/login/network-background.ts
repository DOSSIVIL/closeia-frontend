import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  kind: 0 | 1 | 2;
}

@Component({
  selector: 'app-network-background',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div class="mesh-layer"></div>
      <div class="mesh-layer mesh-layer--alt"></div>
      <canvas #canvas class="network-canvas"></canvas>
      <div class="vignette"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }
    .network-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
      opacity: 0;
      animation: canvas-in 1.2s ease-out 0.15s forwards;
    }
    @keyframes canvas-in { to { opacity: 1; } }
    .mesh-layer {
      position: absolute;
      inset: -20%;
      background:
        radial-gradient(40% 55% at 20% 30%, rgba(23, 73, 168, 0.55), transparent 70%),
        radial-gradient(45% 60% at 80% 25%, rgba(28, 143, 176, 0.45), transparent 70%),
        radial-gradient(50% 55% at 65% 85%, rgba(94, 234, 212, 0.18), transparent 70%),
        radial-gradient(40% 50% at 15% 80%, rgba(14, 27, 74, 0.65), transparent 70%);
      filter: blur(30px);
      animation: mesh-drift 28s ease-in-out infinite alternate;
      will-change: transform;
    }
    .mesh-layer--alt {
      background:
        radial-gradient(35% 50% at 75% 70%, rgba(28, 143, 176, 0.35), transparent 70%),
        radial-gradient(40% 55% at 30% 20%, rgba(23, 73, 168, 0.35), transparent 70%);
      animation-duration: 38s;
      animation-direction: alternate-reverse;
      opacity: 0.7;
    }
    @keyframes mesh-drift {
      0%   { transform: translate3d(-2%, -1%, 0) scale(1); }
      50%  { transform: translate3d(2%,  2%, 0) scale(1.06); }
      100% { transform: translate3d(-1%, 3%, 0) scale(1.02); }
    }
    .vignette {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(7, 11, 29, 0.35) 75%, rgba(7, 11, 29, 0.65) 100%);
      pointer-events: none;
    }
    @media (prefers-reduced-motion: reduce) {
      .mesh-layer { animation: none; }
      .network-canvas { animation: none; opacity: 1; }
    }
  `],
})
export class NetworkBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private nodes: Node[] = [];
  private raf = 0;
  private running = false;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private linkDist = 140;
  private mouse = { x: -9999, y: -9999, active: false };
  private reduceMotion = false;
  private ro?: ResizeObserver;

  private onVis = (): void => this.setRunning(!document.hidden);
  private onMove = (e: PointerEvent): void => {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    this.mouse.active = true;
  };
  private onLeave = (): void => { this.mouse.active = false; };

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    this.ctx = ctx;

    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas.parentElement ?? canvas);

    window.addEventListener('pointermove', this.onMove, { passive: true });
    window.addEventListener('pointerleave', this.onLeave, { passive: true });
    document.addEventListener('visibilitychange', this.onVis);

    this.resize();
    this.setRunning(true);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerleave', this.onLeave);
    document.removeEventListener('visibilitychange', this.onVis);
  }

  private resize(): void {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement ?? canvas;
    const rect = parent.getBoundingClientRect();

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);

    canvas.width = Math.floor(this.w * this.dpr);
    canvas.height = Math.floor(this.h * this.dpr);
    canvas.style.width = `${this.w}px`;
    canvas.style.height = `${this.h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const area = this.w * this.h;
    const density = this.w < 640 ? 1 / 22000 : this.w < 1024 ? 1 / 18000 : 1 / 14000;
    const count = Math.min(120, Math.max(28, Math.round(area * density)));
    this.linkDist = this.w < 640 ? 100 : this.w < 1024 ? 120 : 150;
    this.nodes = Array.from({ length: count }, () => this.spawn());

    if (this.reduceMotion) this.draw();
  }

  private spawn(): Node {
    const speed = this.reduceMotion ? 0 : 0.08 + Math.random() * 0.22;
    const angle = Math.random() * Math.PI * 2;
    return {
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 0.8 + Math.random() * 1.4,
      kind: Math.floor(Math.random() * 3) as 0 | 1 | 2,
    };
  }

  private setRunning(run: boolean): void {
    if (run === this.running) return;
    this.running = run;
    if (run) {
      if (this.reduceMotion) this.draw();
      else this.loop();
    } else {
      cancelAnimationFrame(this.raf);
    }
  }

  private loop = (): void => {
    this.step();
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  };

  private step(): void {
    const { w, h } = this;
    for (const n of this.nodes) {
      if (this.mouse.active) {
        const dx = n.x - this.mouse.x;
        const dy = n.y - this.mouse.y;
        const d2 = dx * dx + dy * dy;
        const R = 90;
        if (d2 < R * R && d2 > 0.001) {
          const d = Math.sqrt(d2);
          const f = (1 - d / R) * 0.6;
          n.vx += (dx / d) * f * 0.15;
          n.vy += (dy / d) * f * 0.15;
        }
      }
      n.vx *= 0.985;
      n.vy *= 0.985;
      const sp = Math.hypot(n.vx, n.vy);
      if (sp < 0.05) {
        n.vx += (Math.random() - 0.5) * 0.02;
        n.vy += (Math.random() - 0.5) * 0.02;
      }
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0) { n.x = 0; n.vx = Math.abs(n.vx); }
      else if (n.x > w) { n.x = w; n.vx = -Math.abs(n.vx); }
      if (n.y < 0) { n.y = 0; n.vy = Math.abs(n.vy); }
      else if (n.y > h) { n.y = h; n.vy = -Math.abs(n.vy); }
    }
  }

  private draw(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    const D = this.linkDist;
    const D2 = D * D;

    for (let i = 0; i < this.nodes.length; i++) {
      const a = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j++) {
        const b = this.nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > D2) continue;
        const t = 1 - Math.sqrt(d2) / D;
        const alpha = 0.35 * t;
        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, `rgba(94,234,212,${alpha})`);
        grad.addColorStop(1, `rgba(28,143,176,${alpha * 0.9})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    for (const n of this.nodes) {
      const color = n.kind === 0 ? 'rgba(94,234,212,0.95)' : n.kind === 1 ? 'rgba(211,248,240,0.90)' : 'rgba(28,143,176,0.95)';
      ctx.beginPath();
      ctx.fillStyle = color.replace(/0\.\d+\)/, '0.18)');
      ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}