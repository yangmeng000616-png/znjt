import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  AlertTriangle,
  Plane,
  Train,
  Compass,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Layers,
  CloudRain,
  Eye,
  Wind,
  Zap,
  Maximize2,
  Minimize2,
  Camera,
  Video,
} from 'lucide-react';

declare const Cesium: any;

interface CesiumMapProps {
  activeLayer: string;
  setActiveLayer: (layer: string) => void;
  selectedRiskLocation: string | null;
  onSelectRiskLocation: (loc: string | null) => void;
  isRoaming: boolean;
  setIsRoaming: (roam: boolean) => void;
  showRainEffect: boolean;
  setShowRainEffect: (show: boolean) => void;
  panelCollapsed: boolean;
  setPanelCollapsed: (collapsed: boolean) => void;
}

export default function CesiumMap({
  activeLayer,
  setActiveLayer,
  selectedRiskLocation,
  onSelectRiskLocation,
  isRoaming,
  setIsRoaming,
  showRainEffect,
  setShowRainEffect,
  panelCollapsed,
  setPanelCollapsed,
}: CesiumMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const radarLayerRef = useRef<any>(null);
  const roamListenerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeOffset, setTimeOffset] = useState<number>(60);
  const [is3DMode, setIs3DMode] = useState(true);
  const [cesiumReady, setCesiumReady] = useState(false);

  // Generate dynamic weather radar texture for overlaying onto 3D Earth
  const generateRadarCanvas = (offset: number, mode: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const shiftX = (offset - 60) * 1.6;
    const shiftY = (offset - 60) * -0.9;

    if (mode === '降水') {
      const cells = [
        { x: 380 + shiftX, y: 400 + shiftY, r: 230, intensity: 1.0 },
        { x: 590 + shiftX * 0.8, y: 270 + shiftY * 0.8, r: 190, intensity: 0.85 },
        { x: 250 + shiftX * 0.6, y: 570 + shiftY * 0.6, r: 170, intensity: 0.65 },
        { x: 700 + shiftX * 0.5, y: 470 + shiftY * 0.5, r: 140, intensity: 0.5 },
      ];

      cells.forEach(cell => {
        // Outer light rain (cyan/blue)
        const gradOuter = ctx.createRadialGradient(cell.x, cell.y, 0, cell.x, cell.y, cell.r);
        gradOuter.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
        gradOuter.addColorStop(0.5, 'rgba(56, 189, 248, 0.35)');
        gradOuter.addColorStop(0.8, 'rgba(37, 99, 235, 0.18)');
        gradOuter.addColorStop(1, 'rgba(30, 64, 175, 0)');
        ctx.fillStyle = gradOuter;
        ctx.beginPath();
        ctx.arc(cell.x, cell.y, cell.r, 0, Math.PI * 2);
        ctx.fill();

        // Moderate rain (green)
        const gradMid = ctx.createRadialGradient(cell.x, cell.y, 0, cell.x, cell.y, cell.r * 0.72);
        gradMid.addColorStop(0, 'rgba(74, 222, 128, 0.65)');
        gradMid.addColorStop(0.65, 'rgba(34, 197, 94, 0.45)');
        gradMid.addColorStop(1, 'rgba(34, 197, 94, 0)');
        ctx.fillStyle = gradMid;
        ctx.beginPath();
        ctx.arc(cell.x, cell.y, cell.r * 0.72, 0, Math.PI * 2);
        ctx.fill();

        // Heavy rain (yellow/orange)
        const gradHeavy = ctx.createRadialGradient(cell.x, cell.y, 0, cell.x, cell.y, cell.r * 0.48);
        gradHeavy.addColorStop(0, 'rgba(250, 204, 21, 0.85)');
        gradHeavy.addColorStop(0.7, 'rgba(249, 115, 22, 0.75)');
        gradHeavy.addColorStop(1, 'rgba(249, 115, 22, 0)');
        ctx.fillStyle = gradHeavy;
        ctx.beginPath();
        ctx.arc(cell.x, cell.y, cell.r * 0.48, 0, Math.PI * 2);
        ctx.fill();

        // Torrential storm core (red / purple)
        if (cell.intensity > 0.7) {
          const gradCore = ctx.createRadialGradient(cell.x, cell.y, 0, cell.x, cell.y, cell.r * 0.28);
          gradCore.addColorStop(0, 'rgba(217, 70, 239, 0.95)');
          gradCore.addColorStop(0.45, 'rgba(239, 68, 68, 0.9)');
          gradCore.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = gradCore;
          ctx.beginPath();
          ctx.arc(cell.x, cell.y, cell.r * 0.28, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    } else if (mode === '风场') {
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      for (let y = 140; y < 920; y += 38) {
        ctx.beginPath();
        for (let x = 80; x < 960; x += 32) {
          const angle = Math.sin((x + offset * 6) * 0.012) * 0.45 - 0.25;
          const len = 24 + Math.sin(y * 0.02) * 8;
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        }
        ctx.stroke();
      }
    } else if (mode === '能见度') {
      const fogZones = [
        { x: 710 + shiftX * 0.3, y: 520, r: 260, color: 'rgba(250, 204, 21, 0.4)' },
        { x: 420, y: 660, r: 200, color: 'rgba(250, 204, 21, 0.3)' },
      ];
      fogZones.forEach(z => {
        const grad = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.r);
        grad.addColorStop(0, z.color);
        grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (mode === '强对流') {
      const grad = ctx.createRadialGradient(380 + shiftX, 400 + shiftY, 0, 380 + shiftX, 400 + shiftY, 220);
      grad.addColorStop(0, 'rgba(168, 85, 247, 0.9)');
      grad.addColorStop(0.5, 'rgba(239, 68, 68, 0.75)');
      grad.addColorStop(0.8, 'rgba(249, 115, 22, 0.4)');
      grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(380 + shiftX, 400 + shiftY, 220, 0, Math.PI * 2);
      ctx.fill();
    }

    return canvas;
  };

  // Initialize Cesium 3D Globe
  useEffect(() => {
    let checkInterval: any;

    const initCesium = () => {
      if (typeof Cesium === 'undefined' || !containerRef.current) return;

      try {
        Cesium.Ion.defaultAccessToken = '';

        // ArcGIS High Resolution Satellite Imagery
        const imageryProvider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maximumLevel: 18,
          credit: '',
        });

        const viewer = new Cesium.Viewer(containerRef.current, {
          imageryProvider: imageryProvider,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          navigationHelpButton: false,
          animation: false,
          fullscreenButton: false,
          vrButton: false,
          contextOptions: {
            webgl: {
              preserveDrawingBuffer: true,
            },
          },
        });

        viewerRef.current = viewer;

        // Visual enhancement: Dark night / space background
        viewer.scene.globe.enableLighting = false;
        viewer.scene.globe.depthTestAgainstTerrain = false;
        viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#040812');
        if (viewer.scene.skyAtmosphere) {
          viewer.scene.skyAtmosphere.show = true;
          viewer.scene.skyAtmosphere.hueShift = -0.15;
          viewer.scene.skyAtmosphere.saturationShift = 0.25;
        }

        // Camera perspective to Hangzhou with 3D tilt
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(120.12, 30.14, 25000),
          orientation: {
            heading: Cesium.Math.toRadians(38.0),
            pitch: Cesium.Math.toRadians(-33.0),
            roll: 0.0,
          },
        });

        // Add 3D Road Networks
        addHighwayNetwork(viewer);

        // Add 3D Map Markers
        addMapMarkers(viewer);

        // Add initial Radar Layer
        updateRadarLayer(viewer, 60, '降水');

        setCesiumReady(true);
      } catch (err) {
        console.error('Cesium init error:', err);
      }
    };

    if (typeof Cesium !== 'undefined') {
      initCesium();
    } else {
      checkInterval = setInterval(() => {
        if (typeof Cesium !== 'undefined') {
          clearInterval(checkInterval);
          initCesium();
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // Update radar overlay on time or layer change
  const updateRadarLayer = (viewer: any, offset: number, mode: string) => {
    if (!viewer) return;

    if (radarLayerRef.current) {
      viewer.entities.remove(radarLayerRef.current);
      radarLayerRef.current = null;
    }

    const canvas = generateRadarCanvas(offset, mode);
    const radarEntity = viewer.entities.add({
      rectangle: {
        coordinates: Cesium.Rectangle.fromDegrees(119.75, 29.95, 120.65, 30.58),
        material: new Cesium.ImageMaterialProperty({
          image: canvas,
          transparent: true,
        }),
      },
    });

    radarLayerRef.current = radarEntity;
  };

  useEffect(() => {
    if (viewerRef.current && cesiumReady) {
      updateRadarLayer(viewerRef.current, timeOffset, activeLayer);
    }
  }, [timeOffset, activeLayer, cesiumReady]);

  // Handle camera roaming
  useEffect(() => {
    if (!viewerRef.current || !cesiumReady) return;

    const viewer = viewerRef.current;
    if (isRoaming) {
      const onTick = () => {
        viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, -0.0006);
      };
      viewer.scene.preRender.addEventListener(onTick);
      roamListenerRef.current = onTick;
    } else if (roamListenerRef.current) {
      viewer.scene.preRender.removeEventListener(roamListenerRef.current);
      roamListenerRef.current = null;
    }

    return () => {
      if (roamListenerRef.current && viewerRef.current) {
        viewerRef.current.scene.preRender.removeEventListener(roamListenerRef.current);
      }
    };
  }, [isRoaming, cesiumReady]);

  // Handle selected risk location flyTo
  useEffect(() => {
    if (!viewerRef.current || !cesiumReady || !selectedRiskLocation) return;

    const locations: Record<string, { lng: number; lat: number; height: number; heading: number; pitch: number }> = {
      'G25 高速 K128-K146': { lng: 120.08, lat: 30.34, height: 9000, heading: 40, pitch: -30 },
      '跨江大桥': { lng: 120.13, lat: 30.19, height: 7000, heading: 30, pitch: -28 },
      '机场高速': { lng: 120.35, lat: 30.23, height: 11000, heading: 50, pitch: -32 },
      '余杭区': { lng: 120.03, lat: 30.36, height: 10000, heading: 45, pitch: -30 },
    };

    const target = locations[selectedRiskLocation];
    if (target) {
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(target.lng - 0.03, target.lat - 0.04, target.height),
        orientation: {
          heading: Cesium.Math.toRadians(target.heading),
          pitch: Cesium.Math.toRadians(target.pitch),
          roll: 0.0,
        },
        duration: 1.5,
      });
    }
  }, [selectedRiskLocation, cesiumReady]);

  // Timeline auto-play
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setTimeOffset(prev => {
          if (prev >= 120) return 0;
          return prev + 30;
        });
      }, 1800);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Add 3D Road Network Polylines
  const addHighwayNetwork = (viewer: any) => {
    viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray([
          120.02, 30.46,
          120.06, 30.38,
          120.09, 30.32,
          120.12, 30.25,
          120.14, 30.18,
          120.16, 30.08,
        ]),
        width: 5,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.3,
          color: Cesium.Color.fromCssColorString('#EF4444'),
        }),
        clampToGround: true,
      },
    });

    viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray([
          120.03, 30.33,
          120.12, 30.35,
          120.25, 30.34,
          120.35, 30.30,
          120.32, 30.18,
          120.20, 30.14,
          120.11, 30.17,
          120.03, 30.24,
          120.03, 30.33,
        ]),
        width: 3.5,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.25,
          color: Cesium.Color.fromCssColorString('#06B6D4'),
        }),
        clampToGround: true,
      },
    });

    viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray([
          120.18, 30.22,
          120.26, 30.22,
          120.36, 30.23,
          120.43, 30.23,
        ]),
        width: 4,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.25,
          color: Cesium.Color.fromCssColorString('#F59E0B'),
        }),
        clampToGround: true,
      },
    });

    viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray([
          120.12, 30.21,
          120.13, 30.18,
        ]),
        width: 4.5,
        material: Cesium.Color.fromCssColorString('#FBBF24'),
        clampToGround: true,
      },
    });
  };

  // Add 3D Map Markers
  const addMapMarkers = (viewer: any) => {
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(120.085, 30.345, 120),
      point: {
        pixelSize: 9,
        color: Cesium.Color.fromCssColorString('#EF4444'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
      },
      label: {
        text: '⚠️ G25 K128-K146 暴雨风险',
        font: 'bold 12px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.fromCssColorString('#7F1D1D'),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -12),
        backgroundColor: Cesium.Color.fromCssColorString('rgba(153, 27, 27, 0.88)'),
        showBackground: true,
        backgroundPadding: new Cesium.Cartesian2(7, 3),
      },
    });

    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(120.213, 30.291, 100),
      point: {
        pixelSize: 7,
        color: Cesium.Color.fromCssColorString('#38BDF8'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1.5,
      },
      label: {
        text: '🚄 杭州东站',
        font: '11px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.fromCssColorString('#0C4A6E'),
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -10),
        backgroundColor: Cesium.Color.fromCssColorString('rgba(14, 116, 144, 0.85)'),
        showBackground: true,
        backgroundPadding: new Cesium.Cartesian2(5, 2),
      },
    });

    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(120.434, 30.231, 100),
      point: {
        pixelSize: 7,
        color: Cesium.Color.fromCssColorString('#38BDF8'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1.5,
      },
      label: {
        text: '✈️ 杭州萧山国际机场',
        font: '11px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.fromCssColorString('#0C4A6E'),
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -10),
        backgroundColor: Cesium.Color.fromCssColorString('rgba(14, 116, 144, 0.85)'),
        showBackground: true,
        backgroundPadding: new Cesium.Cartesian2(5, 2),
      },
    });

    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(120.128, 30.196, 60),
      point: {
        pixelSize: 6,
        color: Cesium.Color.fromCssColorString('#F59E0B'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1,
      },
      label: {
        text: '🌉 钱塘江大桥',
        font: '10px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.fromCssColorString('#1E293B'),
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -9),
        backgroundColor: Cesium.Color.fromCssColorString('rgba(15, 23, 42, 0.9)'),
        showBackground: true,
        backgroundPadding: new Cesium.Cartesian2(4, 2),
      },
    });

    const highwayBadges = [
      { text: 'G25', lng: 120.06, lat: 30.40 },
      { text: 'G25', lng: 120.02, lat: 30.47 },
      { text: 'G92', lng: 120.35, lat: 30.31 },
      { text: 'G60', lng: 120.26, lat: 30.14 },
      { text: 'S2', lng: 120.28, lat: 30.36 },
      { text: 'Q36', lng: 120.06, lat: 30.16 },
    ];

    highwayBadges.forEach(badge => {
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(badge.lng, badge.lat, 40),
        label: {
          text: ` ${badge.text} `,
          font: 'bold 9px monospace',
          fillColor: Cesium.Color.WHITE,
          backgroundColor: Cesium.Color.fromCssColorString('rgba(22, 101, 52, 0.92)'),
          showBackground: true,
          backgroundPadding: new Cesium.Cartesian2(3, 1.5),
          style: Cesium.LabelStyle.FILL,
        },
      });
    });
  };

  // Camera Actions
  const handleResetNorth = () => {
    if (!viewerRef.current) return;
    setIsRoaming(false);
    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(120.12, 30.14, 25000),
      orientation: {
        heading: Cesium.Math.toRadians(38.0),
        pitch: Cesium.Math.toRadians(-33.0),
        roll: 0.0,
      },
      duration: 1.2,
    });
    onSelectRiskLocation(null);
  };

  const handleZoom = (inOut: 'in' | 'out') => {
    if (!viewerRef.current) return;
    const camera = viewerRef.current.camera;
    const factor = inOut === 'in' ? 0.65 : 1.5;
    camera.zoomIn(camera.positionCartographic.height * (1 - factor));
  };

  const toggle2D3D = () => {
    if (!viewerRef.current) return;
    if (is3DMode) {
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(120.20, 30.25, 34000),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-89.9),
          roll: 0,
        },
        duration: 1.2,
      });
      setIs3DMode(false);
    } else {
      handleResetNorth();
      setIs3DMode(true);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#040812]">
      {/* 3D Cesium Full Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Screen Rain Simulation Overlay */}
      {showRainEffect && (
        <div className="absolute inset-0 pointer-events-none z-10 opacity-70 mix-blend-screen overflow-hidden">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="rain-pattern" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
                <line x1="10" y1="0" x2="10" y2="25" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="35" y1="20" x2="35" y2="45" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.5" />
                <line x1="50" y1="5" x2="50" y2="35" stroke="#93c5fd" strokeWidth="0.8" strokeOpacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#rain-pattern)" className="animate-pulse" />
          </svg>
        </div>
      )}

      {/* Loading overlay */}
      {!cesiumReady && (
        <div className="absolute inset-0 bg-[#040812] flex flex-col items-center justify-center gap-3 z-30">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
          <span className="text-cyan-400 text-xs tracking-widest font-semibold">正在载入 Cesium 三维大屏空间数据引擎...</span>
        </div>
      )}

      {/* Top Floating GIS Controls (Sleek and compact) */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 pointer-events-auto">
        {/* Layer Selector */}
        <div className="flex items-center bg-[#071022]/90 backdrop-blur-md border border-cyan-500/30 rounded-lg overflow-hidden p-0.5 shadow-2xl">
          <span className="text-slate-400 text-[11px] px-2.5 py-0.5 flex items-center font-medium gap-1 border-r border-slate-700/60 mr-0.5">
            <Layers size={11} className="text-cyan-400" />
            气象图层
          </span>
          {['降水', '风场', '能见度', '强对流'].map(layer => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`px-3 py-0.5 text-[11px] rounded transition-all font-medium ${
                activeLayer === layer
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {layer}
            </button>
          ))}
        </div>

        {/* 3D Big Screen Tools */}
        <div className="flex items-center gap-1 bg-[#071022]/90 backdrop-blur-md border border-cyan-500/30 rounded-lg p-0.5 shadow-2xl">
          <button
            onClick={() => setIsRoaming(!isRoaming)}
            title="开启/停止三维旋转漫游巡检"
            className={`px-2.5 py-0.5 rounded text-[11px] flex items-center gap-1 transition-all font-medium ${
              isRoaming
                ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(34,211,238,0.8)]'
                : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60'
            }`}
          >
            <Video size={11} />
            {isRoaming ? '巡航中' : '3D巡航'}
          </button>

          <button
            onClick={() => setShowRainEffect(!showRainEffect)}
            title="开启/关闭三维降水环境特效"
            className={`px-2.5 py-0.5 rounded text-[11px] flex items-center gap-1 transition-all font-medium ${
              showRainEffect
                ? 'bg-blue-600/80 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)] border border-blue-400'
                : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60'
            }`}
          >
            <CloudRain size={11} />
            降水特效
          </button>

          <button
            onClick={() => setPanelCollapsed(!panelCollapsed)}
            title={panelCollapsed ? '展开大屏数据看板' : '收起看板进入纯净全屏地球'}
            className="px-2.5 py-0.5 rounded text-[11px] flex items-center gap-1 text-cyan-400 hover:text-white hover:bg-slate-800/60 transition-all font-medium"
          >
            {panelCollapsed ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
            {panelCollapsed ? '展开看板' : '纯净大屏'}
          </button>
        </div>
      </div>

      {/* Floating Camera Controls Right Side */}
      <div className="absolute top-16 right-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
        <button
          onClick={handleResetNorth}
          title="重置视角至杭州全貌"
          className="w-7 h-7 bg-[#071022]/90 backdrop-blur-md border border-cyan-500/40 rounded flex items-center justify-center text-cyan-400 hover:text-white hover:bg-slate-800 text-[11px] font-bold shadow-xl transition-all"
        >
          N
        </button>
        <button
          onClick={toggle2D3D}
          title="切换 2D / 3D 视角"
          className="w-7 h-7 bg-[#071022]/90 backdrop-blur-md border border-cyan-500/40 rounded flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 text-[10px] font-bold shadow-xl transition-all"
        >
          {is3DMode ? '3D' : '2D'}
        </button>
        <div className="flex flex-col bg-[#071022]/90 backdrop-blur-md border border-cyan-500/40 rounded overflow-hidden shadow-xl">
          <button
            onClick={() => handleZoom('in')}
            title="放大"
            className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 border-b border-slate-700/60 transition-colors"
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={() => handleZoom('out')}
            title="缩小"
            className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ZoomOut size={13} />
          </button>
        </div>
      </div>

      {/* Floating Center Bottom Timeline Player (Lower profile to make 3D globe huge) */}
      <div
        className={`absolute z-20 flex items-end justify-between pointer-events-none transition-all duration-500 ${
          panelCollapsed ? 'bottom-5 left-8 right-8' : 'bottom-40 left-[260px] right-[280px]'
        }`}
      >
        {/* Timeline Slider Player */}
        <div className="flex-1 max-w-[540px] bg-[#071022]/92 backdrop-blur-md border border-cyan-500/30 rounded-lg p-2.5 flex items-center gap-3.5 pointer-events-auto shadow-[0_0_20px_rgba(0,0,0,0.8)]">
          <span className="text-cyan-400 font-bold text-xs whitespace-nowrap tracking-wide flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            短临预报
          </span>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shrink-0 hover:bg-cyan-500/30 transition-all shadow-md active:scale-95"
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
          </button>

          {/* Timeline Bar */}
          <div className="flex-1 relative flex items-center h-6">
            <div className="absolute w-full h-1 bg-slate-800 rounded-full"></div>
            <div
              className="absolute h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300 rounded-full transition-all duration-300"
              style={{ width: `${(timeOffset / 120) * 100}%` }}
            ></div>
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,1)] border-2 border-white transition-all duration-300 cursor-pointer pointer-events-auto"
              style={{ left: `${(timeOffset / 120) * 100}%` }}
            ></div>

            {/* Time Tick Buttons */}
            <div className="absolute top-4 w-full flex justify-between text-[9px] text-slate-400 font-medium">
              {[
                { label: '现在', val: 0 },
                { label: '+30min', val: 30 },
                { label: '+60min', val: 60 },
                { label: '+90min', val: 90 },
                { label: '+120min', val: 120 },
              ].map(tick => (
                <button
                  key={tick.val}
                  onClick={() => setTimeOffset(tick.val)}
                  className={`transition-all ${
                    timeOffset === tick.val
                      ? 'text-cyan-400 font-bold border border-cyan-500/60 bg-cyan-500/20 px-1 py-0.2 rounded -mt-0.5'
                      : 'hover:text-white'
                  }`}
                >
                  {tick.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Precipitation / Weather Intensity Legend */}
        <div className="bg-[#071022]/92 backdrop-blur-md border border-cyan-500/30 rounded-lg p-2 w-52 pointer-events-auto shadow-[0_0_20px_rgba(0,0,0,0.8)] ml-2.5">
          <div className="flex justify-between text-[11px] text-slate-300 mb-1 font-medium">
            <span>
              {activeLayer}强度{' '}
              <span className="text-[9px] text-slate-500 font-normal">
                ({activeLayer === '降水' ? 'mm/h' : activeLayer === '风速' || activeLayer === '风场' ? 'm/s' : 'km'})
              </span>
            </span>
          </div>
          <div className="h-1.5 w-full rounded overflow-hidden flex shadow-inner">
            <div className="flex-1 bg-blue-500"></div>
            <div className="flex-1 bg-green-400"></div>
            <div className="flex-1 bg-yellow-400"></div>
            <div className="flex-1 bg-orange-500"></div>
            <div className="flex-1 bg-red-500"></div>
            <div className="flex-1 bg-purple-600"></div>
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-0.5 font-mono">
            <span>0.1</span>
            <span>1</span>
            <span>10</span>
            <span>25</span>
            <span>50</span>
          </div>
        </div>
      </div>
    </div>
  );
}
