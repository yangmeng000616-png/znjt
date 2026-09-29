import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudSun,
  Clock,
  CloudRain,
  Wind,
  Eye,
  Zap,
  ArrowDown,
  RefreshCw,
  AlertTriangle,
  Flame,
  Radio,
  Building2,
  ShieldAlert,
  Car,
  ChevronRight,
  CloudLightning,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  MapPin,
  Layers,
  Sparkles,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import CesiumMap from './components/CesiumMap';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function Panel({
  title,
  children,
  extra,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-cyan-500/25 bg-[#071022]/85 backdrop-blur-md p-2.5 flex flex-col relative shadow-[0_6px_24px_rgba(0,0,0,0.5)] ring-1 ring-white/5',
        className
      )}
    >
      {title && (
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-3 bg-cyan-400 rounded-sm shadow-[0_0_6px_#22d3ee]"></div>
            <h3 className="text-white font-bold text-xs tracking-wide">{title}</h3>
          </div>
          {extra && <div className="text-slate-400 text-[10px]">{extra}</div>}
        </div>
      )}
      <div className="flex-1 flex flex-col min-h-0">{children}</div>
    </div>
  );
}

export default function App() {
  const [activeNav, setActiveNav] = useState('综合态势');
  const [activeWeatherLayer, setActiveWeatherLayer] = useState('降水');
  const [selectedRiskLocation, setSelectedRiskLocation] = useState<string | null>(null);
  const [trendTab, setTrendTab] = useState('降水');
  const [currentTime, setCurrentTime] = useState('2025-04-28 10:24:36');
  const [isRoaming, setIsRoaming] = useState(false);
  const [showRainEffect, setShowRainEffect] = useState(true);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  // Real-time clock updating every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      setCurrentTime(
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(
          now.getMinutes()
        )}:${pad(now.getSeconds())}`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#040812] select-none text-slate-200">
      {/* ================= LAYER 0: FULL SCREEN CESIUM 3D GLOBE ================= */}
      <div className="absolute inset-0 w-full h-full z-0">
        <CesiumMap
          activeLayer={activeWeatherLayer}
          setActiveLayer={setActiveWeatherLayer}
          selectedRiskLocation={selectedRiskLocation}
          onSelectRiskLocation={setSelectedRiskLocation}
          isRoaming={isRoaming}
          setIsRoaming={setIsRoaming}
          showRainEffect={showRainEffect}
          setShowRainEffect={setShowRainEffect}
          panelCollapsed={panelCollapsed}
          setPanelCollapsed={setPanelCollapsed}
        />
      </div>

      {/* ================= LAYER 1: VIGNETTE (POINTER EVENTS NONE) ================= */}
      <div className="absolute inset-0 pointer-events-none z-[1] bg-radial-[ellipse_at_center,_transparent_55%,_rgba(4,8,18,0.7)_100%]"></div>

      {/* ================= LAYER 2: HUD DATA DASHBOARD PANELS (COMPACT) ================= */}
      <div className="relative z-10 w-full h-full pointer-events-none flex flex-col justify-between p-2.5">
        {/* TOP SLIM HEADER */}
        <header className="pointer-events-auto flex items-center justify-between px-3 py-1.5 shrink-0 bg-[#071022]/85 backdrop-blur-md border border-cyan-500/25 rounded-lg shadow-[0_6px_24px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 rounded-md flex items-center justify-center shadow-md shadow-cyan-500/30 border border-white/20">
                <Cloud className="text-white" size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-200">
                    智慧交通气象保障平台
                  </h1>
                  <span className="bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 text-[9px] px-1.5 py-0.2 rounded-full flex items-center gap-1 shadow-[0_0_8px_rgba(34,211,238,0.25)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    Cesium三维大屏
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 tracking-wider font-light">
                  高精度数字孪生 · 气象雷达回波 · 交通影响评估
                </p>
              </div>
            </div>

            {/* Navigation Bar */}
            <nav className="flex items-center gap-1 ml-3 bg-slate-900/80 p-0.5 rounded border border-slate-800">
              {['综合态势', '短临预报', '交通影响', '预警信息'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveNav(tab)}
                  className={cn(
                    'px-3 py-1 rounded text-[11px] font-medium transition-all',
                    activeNav === tab
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm border border-cyan-400/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  )}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Quick Camera Landmarks */}
          <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
            <span className="text-slate-400 text-[10px] flex items-center gap-1 mr-0.5">
              <MapPin size={11} className="text-cyan-400" /> 定位:
            </span>
            {[
              { label: '全景', id: null },
              { label: 'G25暴雨段', id: 'G25 高速 K128-K146' },
              { label: '萧山机场', id: '机场高速' },
              { label: '钱塘江大桥', id: '跨江大桥' },
            ].map(poi => (
              <button
                key={poi.label}
                onClick={() => setSelectedRiskLocation(poi.id)}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] transition-all',
                  selectedRiskLocation === poi.id
                    ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-400/60'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                )}
              >
                {poi.label}
              </button>
            ))}
          </div>

          {/* Right Info Badges */}
          <div className="flex items-center gap-4 text-[11px] text-slate-300">
            <div className="flex items-center gap-1 text-slate-300">
              <Clock size={13} className="text-cyan-400" />
              <span className="font-mono tabular-nums">{currentTime}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-300">
              <CloudSun size={14} className="text-yellow-400" />
              <span>多云 22°C</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse"></div>
              <span className="text-emerald-400 text-[10px] font-medium">数据正常</span>
            </div>
          </div>
        </header>

        {/* MIDDLE SECTION: LEFT & RIGHT FLOATING COMPACT PANELS */}
        <div className="flex-1 flex justify-between gap-2.5 min-h-0 py-1.5">
          {/* ================= LEFT FLOATING COLUMN (COMPACT) ================= */}
          <div
            className={cn(
              'w-[245px] pointer-events-auto flex flex-col gap-2 min-h-0 h-full transition-all duration-500 transform',
              panelCollapsed ? '-translate-x-[260px] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'
            )}
          >
            {/* Panel 1: 当前交通气象 */}
            <Panel
              title="当前交通气象"
              extra={
                <div className="flex items-center gap-0.5 text-slate-400 text-[10px]">
                  <RefreshCw size={10} className="text-cyan-400" /> 10:20
                </div>
              }
            >
              <div className="flex items-center gap-1.5 text-slate-300 text-[11px] mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></div>
                浙江省 · 杭州市
              </div>

              <div className="flex items-center justify-between bg-slate-800/50 border border-cyan-500/20 rounded-md p-2 mb-2">
                <div className="flex items-center gap-2">
                  <CloudRain className="text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]" size={28} />
                  <div className="text-2xl font-black text-white flex items-baseline tracking-tight">
                    22.6<span className="text-xs text-slate-400 ml-0.5 font-normal">°C</span>
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded border border-cyan-500/40 text-cyan-400 text-[10px] bg-cyan-500/15 font-medium shadow-[0_0_6px_rgba(34,211,238,0.2)]">
                  小雨
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1">
                <div className="flex flex-col items-center justify-center bg-slate-900/60 rounded border border-slate-800 p-1">
                  <div className="text-slate-400 text-[10px]">降水</div>
                  <div className="text-cyan-400 font-bold text-xs">8.4</div>
                  <div className="text-slate-500 text-[8px]">mm/h</div>
                </div>
                <div className="flex flex-col items-center justify-center bg-slate-900/60 rounded border border-slate-800 p-1">
                  <div className="text-slate-400 text-[10px]">风速</div>
                  <div className="text-cyan-400 font-bold text-xs">6.8</div>
                  <div className="text-slate-500 text-[8px]">m/s</div>
                </div>
                <div className="flex flex-col items-center justify-center bg-slate-900/60 rounded border border-slate-800 p-1">
                  <div className="text-slate-400 text-[10px]">能见度</div>
                  <div className="text-cyan-400 font-bold text-xs">4.2</div>
                  <div className="text-slate-500 text-[8px]">km</div>
                </div>
                <div className="flex flex-col items-center justify-center bg-slate-900/60 rounded border border-slate-800 p-1">
                  <div className="text-slate-400 text-[10px]">湿度</div>
                  <div className="text-cyan-400 font-bold text-xs">82</div>
                  <div className="text-slate-500 text-[8px]">%</div>
                </div>
              </div>
            </Panel>

            {/* Panel 2: 当前影响 */}
            <Panel title="当前影响">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between bg-slate-900/50 py-1.5 px-2 rounded border border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></div>
                    <span className="text-slate-300 text-[11px]">受影响道路</span>
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-cyan-400 font-bold text-xs">126</span>
                    <span className="text-slate-500 text-[9px]">km</span>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-slate-900/50 py-1.5 px-2 rounded border border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_6px_#facc15]"></div>
                    <span className="text-slate-300 text-[11px]">重点风险路段</span>
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-yellow-400 font-bold text-xs">8</span>
                    <span className="text-slate-500 text-[9px]">个</span>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-slate-900/50 py-1.5 px-2 rounded border border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_6px_#ef4444]"></div>
                    <span className="text-slate-300 text-[11px]">交通气象预警</span>
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-red-400 font-bold text-xs">3</span>
                    <span className="text-slate-500 text-[9px]">个</span>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Panel 3: 气象要素切换 */}
            <Panel title="气象要素切换">
              <div className="grid grid-cols-5 gap-1">
                {[
                  { id: '降水', label: '降水', icon: <ArrowDown size={12} /> },
                  { id: '风场', label: '风场', icon: <Wind size={12} /> },
                  { id: '能见度', label: '能见度', icon: <Eye size={12} /> },
                  { id: '强对流', label: '强对流', icon: <Zap size={12} /> },
                  { id: '雷电', label: '雷电', icon: <CloudLightning size={12} /> },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveWeatherLayer(item.id === '雷电' ? '强对流' : item.id)}
                    className={cn(
                      'flex flex-col items-center justify-center p-1 rounded cursor-pointer border transition-all text-[10px]',
                      activeWeatherLayer === item.id || (item.id === '雷电' && activeWeatherLayer === '强对流')
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    )}
                  >
                    <div className="mb-0.5">{item.icon}</div>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </Panel>

            {/* Panel 4: 当前影响统计 */}
            <Panel title="当前影响统计" className="flex-1">
              <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400 text-[11px]">高速公路</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-cyan-400 font-bold text-xs">126</span>
                    <span className="text-slate-500 text-[8px]">km</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400 text-[11px]">快速路</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-cyan-400 font-bold text-xs">48</span>
                    <span className="text-slate-500 text-[8px]">km</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-slate-400 text-[11px]">跨江桥梁</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-yellow-400 font-bold text-xs">6</span>
                    <span className="text-slate-500 text-[8px]">座</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-slate-400 text-[11px]">隧道设施</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-emerald-400 font-bold text-xs">2</span>
                    <span className="text-slate-500 text-[8px]">个</span>
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          {/* ================= RIGHT FLOATING COLUMN (COMPACT) ================= */}
          <div
            className={cn(
              'w-[265px] pointer-events-auto flex flex-col gap-2 min-h-0 h-full transition-all duration-500 transform',
              panelCollapsed ? 'translate-x-[280px] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'
            )}
          >
            {/* Panel 1: 交通气象风险 */}
            <Panel
              title="交通气象风险"
              extra={<span className="text-cyan-400 cursor-pointer hover:text-cyan-300 text-[10px]">更多 &gt;</span>}
            >
              <div className="grid grid-cols-4 gap-1 mt-0.5">
                <div className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded border text-red-400 border-red-500/30 bg-red-500/10 shadow-[0_0_6px_rgba(239,68,68,0.15)]">
                  <ArrowDown size={14} className="mb-0.5" />
                  <div className="text-[10px] mb-0.5 font-medium">暴雨</div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-base font-bold">03</span>
                    <span className="text-[8px] opacity-70">处</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded border text-orange-400 border-orange-500/30 bg-orange-500/10 shadow-[0_0_6px_rgba(249,115,22,0.15)]">
                  <Wind size={14} className="mb-0.5" />
                  <div className="text-[10px] mb-0.5 font-medium">大风</div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-base font-bold">02</span>
                    <span className="text-[8px] opacity-70">处</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded border text-yellow-400 border-yellow-500/30 bg-yellow-500/10 shadow-[0_0_6px_rgba(250,204,21,0.15)]">
                  <Eye size={14} className="mb-0.5" />
                  <div className="text-[10px] mb-0.5 font-medium">低能见度</div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-base font-bold">05</span>
                    <span className="text-[8px] opacity-70">处</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded border text-purple-400 border-purple-500/30 bg-purple-500/10 shadow-[0_0_6px_rgba(168,85,247,0.15)]">
                  <Zap size={14} className="mb-0.5" />
                  <div className="text-[10px] mb-0.5 font-medium">强对流</div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-base font-bold">01</span>
                    <span className="text-[8px] opacity-70">处</span>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Panel 2: 重点风险路段 (Clicking flies Cesium camera to spot!) */}
            <Panel
              title="重点风险路段"
              extra={
                <span className="text-cyan-400 cursor-pointer hover:text-cyan-300 text-[10px] flex items-center gap-0.5">
                  点击追踪 &gt;
                </span>
              }
              className="flex-1"
            >
              <div className="flex flex-col gap-1.5 overflow-y-auto pr-0.5 custom-scrollbar">
                {[
                  {
                    id: 'G25 高速 K128-K146',
                    badge: '最高风险',
                    badgeColor: 'bg-red-500/15 text-red-400 border-red-500/30',
                    dotColor: 'bg-red-500 shadow-[0_0_6px_#ef4444]',
                    desc: '预计30分钟后降水增强',
                    detail: (
                      <>
                        降水: 28 → <span className="text-red-400 font-bold">45 mm/h</span>
                      </>
                    ),
                  },
                  {
                    id: '跨江大桥',
                    badge: '大风风险',
                    badgeColor: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
                    dotColor: 'bg-orange-500 shadow-[0_0_6px_#f97316]',
                    desc: '未来1小时阵风 17.8 m/s',
                    detail: '风向: 西南风',
                  },
                  {
                    id: '机场高速',
                    badge: '低能见度',
                    badgeColor: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
                    dotColor: 'bg-yellow-400 shadow-[0_0_6px_#facc15]',
                    desc: '预计最低能见度 1.8 km',
                    detail: '时段: 10:40-12:00',
                  },
                  {
                    id: '余杭区',
                    badge: '强对流风险',
                    badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
                    dotColor: 'bg-purple-500 shadow-[0_0_6px_#a855f7]',
                    desc: '预计影响: 11:20-13:00',
                    detail: '伴有雷电、短时强降水',
                  },
                ].map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedRiskLocation(item.id)}
                    className={cn(
                      'bg-slate-900/60 border rounded p-2 flex flex-col gap-1 cursor-pointer transition-all',
                      selectedRiskLocation === item.id
                        ? 'border-cyan-400 bg-slate-800/90 shadow-[0_0_12px_rgba(34,211,238,0.3)] ring-1 ring-cyan-400'
                        : 'border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/50'
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <div className={cn('w-1.5 h-1.5 rounded-full', item.dotColor)}></div>
                        <span className="text-white font-medium text-[11px] truncate max-w-[150px]">{item.id}</span>
                      </div>
                      <span className={cn('text-[9px] px-1 py-0.2 rounded border', item.badgeColor)}>
                        {item.badge}
                      </span>
                    </div>
                    <div className="pl-3 text-[10px] text-slate-400 leading-tight">
                      <div className="truncate">{item.desc}</div>
                      <div className="text-slate-300 mt-0.5">{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        {/* BOTTOM SECTION: 72H TREND & TRAFFIC IMPACT (COMPACT HEIGHT 145px) */}
        <div
          className={cn(
            'pointer-events-auto grid grid-cols-[1fr_300px] gap-2.5 h-[145px] shrink-0 transition-all duration-500 transform',
            panelCollapsed ? 'translate-y-[160px] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
          )}
        >
          {/* ================= BOTTOM LEFT (72-HOUR TREND) ================= */}
          <div className="min-h-0">
            <Panel title="未来72小时交通气象趋势" className="h-full">
              <div className="absolute top-2 right-3 flex bg-slate-900/80 border border-slate-800 rounded overflow-hidden">
                {['降水', '风速', '能见度', '强对流', '温度'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setTrendTab(tab)}
                    className={cn(
                      'px-2 py-0.5 text-[10px] font-medium transition-colors',
                      trendTab === tab
                        ? 'bg-cyan-500/25 text-cyan-300 border-b border-cyan-400'
                        : 'text-slate-400 hover:text-white'
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex-1 grid grid-cols-3 gap-2 mt-0.5 min-h-0">
                {[
                  {
                    date: '04/28 今天',
                    weather: '小雨转阴',
                    data: [2.1, 4.5, 8.4, 3.2, 1.0],
                    times: ['08时', '12时', '16时', '20时', '00时'],
                    max: 10,
                    color: 'cyan',
                  },
                  {
                    date: '04/29 明天',
                    weather: '中雨转阵雨',
                    data: [1.5, 3.0, 12.4, 18.6, 2.8],
                    times: ['04时', '08时', '12时', '16时', '20时'],
                    max: 20,
                    color: 'blue',
                  },
                  {
                    date: '04/30 后天',
                    weather: '雷阵雨',
                    data: [0.5, 1.2, 9.0, 15.2, 1.1],
                    times: ['04时', '08时', '12时', '16时', '20时'],
                    max: 20,
                    color: 'mixed',
                  },
                ].map((day, i) => (
                  <div
                    key={i}
                    className="bg-slate-900/50 border border-slate-800/80 rounded p-1.5 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-slate-200 text-[11px] font-medium">{day.date}</span>
                      <span className="text-slate-400 text-[10px]">{day.weather}</span>
                    </div>

                    <div className="flex-1 flex items-end justify-between px-1 gap-1 relative">
                      <div className="absolute bottom-4 w-full border-t border-slate-800/80"></div>
                      {day.data.map((val, idx) => {
                        const heightPct = Math.max((val / day.max) * 100, 8);
                        let barColor = 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]';
                        if (day.color === 'blue') barColor = 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.5)]';
                        if (day.color === 'mixed') {
                          if (idx === 2) barColor = 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.5)]';
                          else if (idx === 3) barColor = 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]';
                          else barColor = 'bg-cyan-500';
                        }

                        return (
                          <div key={idx} className="flex flex-col items-center flex-1 group z-10">
                            <div className="w-full flex items-end justify-center h-10 mb-0.5 relative">
                              <div
                                className={cn('w-2 rounded-t-sm transition-all duration-500', barColor)}
                                style={{ height: `${heightPct}%` }}
                              ></div>
                            </div>
                            <div className="text-[9px] text-slate-500 leading-tight">{day.times[idx]}</div>
                            <div className="text-[9px] text-slate-300 font-mono leading-tight">{val.toFixed(1)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* ================= BOTTOM RIGHT (TRAFFIC IMPACT SUMMARY) ================= */}
          <div className="min-h-0">
            <Panel title="未来天气对交通的主要影响" className="h-full">
              <div className="flex flex-col justify-between h-full py-0 gap-1.5">
                <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded border border-slate-800/80 hover:bg-slate-800/40 transition-colors">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_6px_#ef4444] bg-red-500"></div>
                  <div className="text-[11px] leading-tight">
                    <span className="text-red-400 font-bold mr-1">明日14:00–18:00</span>
                    <span className="text-slate-300">
                      东部地区有明显降水过程，预计对 G60、G25 等产生较明显影响。
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded border border-slate-800/80 hover:bg-slate-800/40 transition-colors">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_6px_#facc15] bg-yellow-400"></div>
                  <div className="text-[11px] leading-tight">
                    <span className="text-yellow-400 font-bold mr-1">29日凌晨至上午</span>
                    <span className="text-slate-300">
                      局部可能出现低能见度，重点影响萧山机场、机场高速通行。
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded border border-slate-800/80 hover:bg-slate-800/40 transition-colors">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_6px_#a855f7] bg-purple-500"></div>
                  <div className="text-[11px] leading-tight">
                    <span className="text-purple-400 font-bold mr-1">30日午后强对流</span>
                    <span className="text-slate-300">
                      需防范局地雷电、大风对水上客运及跨江特大桥梁通行的不利影响。
                    </span>
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
