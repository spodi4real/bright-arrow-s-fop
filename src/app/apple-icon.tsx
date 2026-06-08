import { ImageResponse } from 'next/og';

export const dynamic = 'force-dynamic';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Brand mark: blue (#349fde) square with a white chevron + bar (the
// "A" mark from the favicon), reconstructed with divs so Satori
// renders it reliably.
export default function AppleIcon() {
  const bar = 12; // stroke thickness
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#349fde',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 110,
            height: 90,
            position: 'relative',
            display: 'flex',
          }}
        >
          {/* left leg of the chevron */}
          <div
            style={{
              position: 'absolute',
              left: 7,
              top: 14,
              width: 70,
              height: bar,
              background: '#fff',
              borderRadius: bar / 2,
              transform: 'rotate(-50deg)',
              transformOrigin: 'left center',
            }}
          />
          {/* right leg of the chevron */}
          <div
            style={{
              position: 'absolute',
              right: 7,
              top: 14,
              width: 70,
              height: bar,
              background: '#fff',
              borderRadius: bar / 2,
              transform: 'rotate(50deg)',
              transformOrigin: 'right center',
            }}
          />
          {/* horizontal crossbar */}
          <div
            style={{
              position: 'absolute',
              left: 20,
              right: 20,
              top: 62,
              height: bar,
              background: '#fff',
              borderRadius: bar / 2,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
