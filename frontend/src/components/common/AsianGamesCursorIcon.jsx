import React, { useCallback, useState } from 'react';
import { Box } from '@mui/material';
import {
  DirectionsRun as RunIcon,
  Pool as SwimIcon,
  SportsBasketball as BallIcon,
  SportsMartialArts as MartialArtsIcon,
  SportsSoccer as SoccerIcon,
} from '@mui/icons-material';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const AsianGamesCursorIcon = ({ compact = false }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handlePointerMove = useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2, -1, 1);
    const y = clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2, -1, 1);
    setPosition({ x, y });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  const size = compact ? 168 : 300;
  const iconSize = compact ? 30 : 42;
  const x = position.x;
  const y = position.y;

  return (
    <Box
      aria-label="Cursor tracking Asian Games sports emblem"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      sx={{
        width: size,
        height: size,
        position: 'relative',
        mx: 'auto',
        touchAction: 'none',
        perspective: 900,
        '--x': x,
        '--y': y,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: compact ? 12 : 20,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.28)',
          transform: `translate(${x * 10}px, ${y * 10}px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg)`,
          transition: 'transform 180ms ease-out',
          background: 'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.96), rgba(255,255,255,0.68) 34%, rgba(255,255,255,0.1) 72%)',
          boxShadow: compact
            ? '0 18px 48px rgba(0,0,0,0.18)'
            : '0 30px 90px rgba(0,0,0,0.24)',
        }}
      />

      {[
        { color: '#0081C8', rotate: -90 },
        { color: '#FCB131', rotate: -18 },
        { color: '#000000', rotate: 54 },
        { color: '#00A651', rotate: 126 },
        { color: '#EE334E', rotate: 198 },
      ].map((ring, index) => (
        <Box
          key={ring.color}
          sx={{
            position: 'absolute',
            inset: compact ? 38 : 68,
            border: `${compact ? 4 : 6}px solid ${ring.color}`,
            borderRadius: '50%',
            opacity: 0.92,
            transform: `translate(${x * (index + 2) * 2}px, ${y * (index + 2) * 2}px) rotate(${ring.rotate + x * 8}deg) scaleX(1.72) scaleY(0.84)`,
            transition: 'transform 180ms ease-out',
            mixBlendMode: 'multiply',
          }}
        />
      ))}

      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: compact ? 78 : 122,
          height: compact ? 78 : 122,
          borderRadius: '28%',
          transform: `translate(calc(-50% + ${x * 18}px), calc(-50% + ${y * 18}px)) rotate(${x * 7}deg)`,
          transition: 'transform 150ms ease-out',
          bgcolor: '#003A70',
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 20px 46px rgba(0,58,112,0.32)',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            width: '160%',
            height: '160%',
            background: `radial-gradient(circle at ${50 + x * 24}% ${42 + y * 24}%, rgba(255,255,255,0.35), transparent 34%)`,
          },
        }}
      >
        <RunIcon sx={{ fontSize: compact ? 44 : 70, position: 'relative' }} />
      </Box>

      {[
        { icon: <SwimIcon />, color: '#0081C8', x: -0.08, y: -0.43 },
        { icon: <BallIcon />, color: '#FCB131', x: 0.42, y: -0.05 },
        { icon: <MartialArtsIcon />, color: '#EE334E', x: 0.1, y: 0.42 },
        { icon: <SoccerIcon />, color: '#00A651', x: -0.46, y: 0.1 },
      ].map((item, index) => (
        <Box
          key={item.color}
          sx={{
            position: 'absolute',
            left: `calc(50% + ${item.x * size}px)`,
            top: `calc(50% + ${item.y * size}px)`,
            width: compact ? 48 : 64,
            height: compact ? 48 : 64,
            borderRadius: '50%',
            bgcolor: item.color,
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            transform: `translate(calc(-50% + ${x * (14 + index * 4)}px), calc(-50% + ${y * (14 + index * 4)}px))`,
            transition: 'transform 150ms ease-out',
            boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
          }}
        >
          {React.cloneElement(item.icon, { sx: { fontSize: iconSize } })}
        </Box>
      ))}

      <Box
        sx={{
          position: 'absolute',
          left: `calc(50% + ${x * (compact ? 70 : 126)}px)`,
          top: `calc(50% + ${y * (compact ? 70 : 126)}px)`,
          width: compact ? 18 : 24,
          height: compact ? 18 : 24,
          borderRadius: '50%',
          bgcolor: '#fff',
          border: '3px solid #003A70',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          transform: 'translate(-50%, -50%)',
          transition: 'left 80ms linear, top 80ms linear',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
};

export default AsianGamesCursorIcon;
