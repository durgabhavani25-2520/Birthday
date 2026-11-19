import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import FaceGate from './FaceGate.jsx';
import ThreeBackground from './ThreeBackground.jsx';
import './styles.css';

const birthdayRevealTime = new Date('2026-11-24T00:00:00+05:30').getTime();

const secretNotes = [
  { icon: '♡', title: 'A little reminder', note: 'Even on the days you feel tired, remember that you are someone’s safe place. You make my world feel softer just by being in it.' },
  { icon: '✿', title: 'My favourite memory', note: 'The little moments when we cook together, laugh at nothing, and talk about everything. I wish I could save those moments in a jar.' },
  { icon: '☁', title: 'A promise', note: 'Whenever life feels heavy, you never have to carry it all alone. I will always be here to listen, to laugh, and to sit beside you.' },
  { icon: '✧', title: 'Open when you miss me', note: 'Think of this page as a tiny hug. No matter where we are or how busy life gets, you will always have a place in my heart.' },
];

const birthdayWishMessage = 'Happy birthday, my dearest Akka! 🎂💙✨ I wish I could call you right now and tell you how much you mean to me. You are my comfort, my safe place, and one of the greatest gifts in my life. May your new year bring you health, peace, laughter, and all the love you so freely give. I love you endlessly. Have the most beautiful birthday! 🥰🎉💐';
const whatsappWishUrl = `https://wa.me/919391102253?text=${encodeURIComponent(birthdayWishMessage)}`;
const smsWishUrl = `sms:+919391102253?body=${encodeURIComponent(birthdayWishMessage)}`;
const callAkkaUrl = 'tel:+919391102253';

function PhotoSlot({ label, className = '', src, alt = label, position = '50% 50%' }) {
  return <div className={`photo-slot ${className}`}>
    {src
      ? <img className="photo-slot-image" src={src} alt={alt} style={{ objectPosition: position }} />
      : <div className="photo-placeholder"><span className="camera">⌑</span><strong>Your photo goes here</strong><small>{label}</small></div>}
  </div>;
}

function ScratchNoteCard({ item, revealed, onReveal }) {
  const canvasRef = useRef(null);
  const scratchingRef = useRef(false);
  const lastPointRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const drawCover = () => {
      const bounds = canvas.getBoundingClientRect();
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(bounds.width * scale);
      canvas.height = Math.round(bounds.height * scale);

      const context = canvas.getContext('2d');
      if (!context) return;

      context.setTransform(scale, 0, 0, scale, 0, 0);
      const cover = context.createLinearGradient(0, 0, bounds.width, bounds.height);
      cover.addColorStop(0, '#d2e3e9');
      cover.addColorStop(0.5, '#91adbb');
      cover.addColorStop(1, '#c0d5dd');
      context.fillStyle = cover;
      context.fillRect(0, 0, bounds.width, bounds.height);

      context.strokeStyle = 'rgba(255,255,255,.2)';
      context.lineWidth = 1;
      for (let x = -bounds.height; x < bounds.width; x += 18) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x + bounds.height, bounds.height);
        context.stroke();
      }

      context.textAlign = 'center';
      context.fillStyle = 'rgba(20,51,70,.78)';
      context.font = '34px serif';
      context.fillText('✧', bounds.width / 2, bounds.height / 2 - 12);
      context.font = '600 15.6px sans-serif';
      context.fillText('SCRATCH TO REVEAL', bounds.width / 2, bounds.height / 2 + 16);
    };

    drawCover();
    window.addEventListener('resize', drawCover);
    return () => window.removeEventListener('resize', drawCover);
  }, []);

  const scratchAt = (event) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const bounds = canvas.getBoundingClientRect();
    const point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    context.globalCompositeOperation = 'destination-out';
    context.lineWidth = 42;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();

    if (lastPointRef.current) {
      context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      context.lineTo(point.x, point.y);
      context.stroke();
    } else {
      context.arc(point.x, point.y, 21, 0, Math.PI * 2);
      context.fill();
    }

    lastPointRef.current = point;
  };

  const startScratch = (event) => {
    scratchingRef.current = true;
    lastPointRef.current = null;
    event.currentTarget.setPointerCapture(event.pointerId);
    scratchAt(event);
  };

  const continueScratch = (event) => {
    if (scratchingRef.current) scratchAt(event);
  };

  const finishScratch = () => {
    if (!scratchingRef.current) return;
    scratchingRef.current = false;
    lastPointRef.current = null;

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let clearedPixels = 0;
    for (let i = 3; i < pixels.length; i += 16) {
      if (pixels[i] < 20) clearedPixels += 1;
    }

    const sampledPixels = Math.ceil((canvas.width * canvas.height) / 4);
    if (clearedPixels / sampledPixels >= 0.4) onReveal();
  };

  return <button
    className={`secret-card ${revealed ? 'opened' : ''}`}
    type="button"
    onClick={event => {
      if (event.detail === 0 && !revealed) onReveal();
    }}
    aria-expanded={revealed}
  >
    <span className="secret-icon">{item.icon}</span>
    <span className="secret-title">{item.title}</span>
    {revealed
      ? <span className="secret-note">{item.note}</span>
      : <span className="secret-hint">Scratch to reveal ✧</span>}
    {!revealed && <canvas
      ref={canvasRef}
      className="secret-scratch-surface"
      aria-hidden="true"
      onPointerDown={startScratch}
      onPointerMove={continueScratch}
      onPointerUp={finishScratch}
      onPointerCancel={() => {
        scratchingRef.current = false;
        lastPointRef.current = null;
      }}
    />}
  </button>;
}

function HangingPhotoGallery() {
  const [photos, setPhotos] = useState([
    { name: 'A favourite portrait', url: '/photos/photo-01.jpg', label: 'A favourite photo', position: '50% 38%' },
    { name: 'A happy candid moment', url: '/photos/photo-06.jpg', label: 'A silly moment', position: '50% 46%' },
    { name: 'A day together', url: '/photos/photo-04.jpg', label: 'A day together', position: '50% 48%' },
    { name: 'A warm memory', url: '/photos/photo-08.jpg', label: 'A warm memory', position: '50% 48%' },
  ]);

  useEffect(() => () => {
    photos.forEach(photo => URL.revokeObjectURL(photo.url));
  }, [photos]);

  const addPhotos = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 4);
    const memories = ['A favourite photo', 'A silly moment', 'A day together', 'A warm memory'];
    setPhotos(files.map((file, index) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      label: memories[index],
    })));
    event.target.value = '';
  };

  return <div className="hanging-gallery">
    <div className="hanger-track">
      <div className="photo-hanger" aria-hidden="true">
        <span className="hanger-hook"></span>
        <span className="hanger-rail"></span>
      </div>
      <div className="hanging-photos" role="region" aria-label="Photos hanging on a keepsake hanger" tabIndex={0}>
        {photos.map((photo, index) => {
          return <figure className="hanging-photo" key={photo.name} style={{ '--photo-index': index }}>
            <span className="photo-string" aria-hidden="true"></span>
            <span className="photo-clip" aria-hidden="true"></span>
            <div className="stitched-photo">
              <img src={photo.url} alt={photo.name} style={{ objectPosition: photo.position || '50% 50%' }} />
            </div>
            <figcaption>{photo.label}</figcaption>
          </figure>;
        })}
      </div>
    </div>
    <label className="photo-upload">Choose up to 4 photos
      <input type="file" accept="image/*" multiple onChange={addPhotos} />
    </label>
    <p className="hanging-hint">Pin four favourite pictures to the hanger and keep your memories close.</p>
  </div>;
}

function Calendar() {
  const cells = [null,null,null,null,null,null,null,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30];
  return <div className="calendar-card">
    <div className="calendar-top"><span>♡</span><span>THE MONTH OF YOU</span><span>♡</span></div>
    <h2>November <em>2026</em></h2>
    <div className="calendar-grid weekdays">{['S','M','T','W','T','F','S'].map((d,i)=><span key={i}>{d}</span>)}</div>
    <div className="calendar-grid dates">{cells.map((d,i)=><span key={i} className={d===25?'birthday-date':d===null?'empty':''}>{d===25?<><b>25</b><i>♡</i></>:d}</span>)}</div>
    <p className="calendar-caption">The day the world got a little more beautiful ✨</p>
  </div>
}

function BirthdayCountdown({ remaining }) {
  const message = 'Happy birthday, Akka! Wishing you a beautiful year full of love, laughter, peace, and all the happiness you deserve. I love you endlessly! ♡';

  if (remaining === 0) {
    return <div className="birthday-countdown birthday-countdown-complete" role="status">
      <p className="eyebrow">The special day is here</p>
      <h3>Happy Birthday, Akka! ♡</h3>
      <p>{message}</p>
      <a className="whatsapp-share" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
        Open WhatsApp to share this message <span aria-hidden="true">↗</span>
      </a>
      <small>WhatsApp will open with the message ready. Choose a chat and tap Send.</small>
    </div>;
  }

  const seconds = Math.floor(remaining / 1000);
  const units = [
    { label: 'Days', value: Math.floor(seconds / 86400) },
    { label: 'Hours', value: Math.floor((seconds % 86400) / 3600) },
    { label: 'Minutes', value: Math.floor((seconds % 3600) / 60) },
    { label: 'Seconds', value: seconds % 60 },
  ];

  return <div className="birthday-countdown" role="timer" aria-label="Countdown to the birthday page reveal at midnight on November 24, 2026, India time">
    <p className="eyebrow">Counting down to midnight · India time</p>
    <div className="countdown-units">
      {units.map(({ label, value }) => <div className="countdown-unit" key={label}>
        <strong>{String(value).padStart(2, '0')}</strong>
        <span>{label}</span>
      </div>)}
    </div>
  </div>;
}

const siblingQuestions = [
  { question: 'Who gets the biggest slice of birthday cake?', answer: 'Akka — birthday law! 🎂', runaway: 'Me, I called dibs! 😎' },
  { question: 'Who is the official family snack inspector?', answer: 'Akka, obviously 🍟', runaway: 'The fridge. It started it! 😂' },
  { question: 'Who wins an argument by saying “I’m older”?', answer: 'Akka. No further questions! 👑', runaway: 'I win by being louder! 🙉' },
  { question: 'Who owns the TV remote on birthday night?', answer: 'Birthday Akka has full control! 📺', runaway: 'I was just holding it! 😇' },
];

function SiblingQuiz() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [runawayPosition, setRunawayPosition] = useState({ x: 74, y: 50 });
  const [runawayEscaped, setRunawayEscaped] = useState(false);
  const [dodgeCount, setDodgeCount] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [complete, setComplete] = useState(false);
  const lastDodgeAt = useRef(0);

  const moveRunaway = (event) => {
    if (dodgeCount >= 3) return;
    if (event.type === 'pointerdown') event.preventDefault();
    const now = Date.now();
    if (now - lastDodgeAt.current < 350) return;
    lastDodgeAt.current = now;
    setDodgeCount(count => Math.min(count + 1, 3));
    const bounds = event.currentTarget.getBoundingClientRect();
    const maxX = Math.max(12, window.innerWidth - bounds.width - 12);
    const maxY = Math.max(76, window.innerHeight - bounds.height - 12);
    setRunawayPosition({
      x: 12 + Math.random() * Math.max(0, maxX - 12),
      y: 76 + Math.random() * Math.max(0, maxY - 76),
    });
    setRunawayEscaped(true);
    setFeedback(dodgeCount === 2 ? 'You almost caught that cheeky answer! 🎯' : 'That answer is playing hide-and-seek! 😆');
  };

  const answerCorrectly = () => {
    if (questionIndex === siblingQuestions.length - 1) {
      setComplete(true);
      setFeedback('');
      return;
    }
    setQuestionIndex(index => index + 1);
    setDodgeCount(0);
    setRunawayPosition({ x: 74, y: 50 });
    setRunawayEscaped(false);
    setFeedback('Correct! The sibling court approves. ✨');
    lastDodgeAt.current = 0;
  };

  const replay = () => {
    setQuestionIndex(0);
    setDodgeCount(0);
    setRunawayPosition({ x: 74, y: 50 });
    setRunawayEscaped(false);
    setFeedback('');
    setComplete(false);
    lastDodgeAt.current = 0;
  };

  const runawayButton = (global = false) => <button
    className={`quiz-answer quiz-answer-runaway${global ? ' quiz-answer-global' : ''}`}
    type="button"
    style={global
      ? { left: `${runawayPosition.x}px`, top: `${runawayPosition.y}px` }
      : { left: `${runawayPosition.x}%`, top: `${runawayPosition.y}%` }}
    onPointerEnter={moveRunaway}
    onPointerDown={moveRunaway}
    onClick={() => {
      setDodgeCount(3);
      setFeedback('You caught it! Still, Akka wins this round. 😄');
    }}
  >
    {dodgeCount >= 3 ? 'Caught me! 😅' : siblingQuestions[questionIndex].runaway}
  </button>;

  return <>
    <section className="sibling-quiz section-wrap">
    <p className="eyebrow">The very serious sibling quiz</p>
    <h2>Sibling court is<br/><em>now in session.</em></h2>
    {!complete
      ? <>
        <p className="section-sub">Question {questionIndex + 1} of {siblingQuestions.length} · Catch the cheeky answer if you can.</p>
        <div className="quiz-card">
          <h3>{siblingQuestions[questionIndex].question}</h3>
          <div className="quiz-options">
            <button className="quiz-answer quiz-answer-correct" type="button" onClick={answerCorrectly}>
              {siblingQuestions[questionIndex].answer}
            </button>
            {!runawayEscaped && runawayButton()}
          </div>
          <p className="quiz-feedback" role="status" aria-live="polite">
            {feedback || (dodgeCount >= 3 ? 'Caught it! Now pick the birthday-approved answer.' : 'The other answer runs away three times, then you can catch it.')}
          </p>
        </div>
      </>
      : <div className="quiz-card quiz-complete" role="status">
        <span aria-hidden="true">🏆</span>
        <h3>Official verdict: Akka is the best!</h3>
        <p>And you are pretty lucky to have her. Happy birthday, Akka! ♡</p>
        <button className="quiz-replay" type="button" onClick={replay}>Play again</button>
      </div>}
    </section>
    {runawayEscaped && !complete && createPortal(runawayButton(true), document.body)}
  </>;
}

function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [remaining, setRemaining] = useState(() => Math.max(0, birthdayRevealTime - Date.now()));
  const [revealedNotes, setRevealedNotes] = useState([]);
  const [cakeLit, setCakeLit] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const revealNote = (i) => setRevealedNotes(prev => prev.includes(i) ? prev : [...prev, i]);

  useEffect(() => {
    const updateCountdown = () => setRemaining(Math.max(0, birthdayRevealTime - Date.now()));
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll('.section-wrap:not(.hero)');
    if (!('IntersectionObserver' in window)) {
      sections.forEach(section => section.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    sections.forEach(section => {
      section.classList.add('scroll-reveal');
      observer.observe(section);
    });
    return () => observer.disconnect();
  }, [unlocked, remaining === 0]);

  useEffect(() => {
    if (window.matchMedia('(max-width: 800px), (pointer: coarse), (prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const renderPointer = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      document.documentElement.style.setProperty('--pointer-x', `${currentX.toFixed(3)}`);
      document.documentElement.style.setProperty('--pointer-y', `${currentY.toFixed(3)}`);
      if (Math.abs(targetX - currentX) > 0.002 || Math.abs(targetY - currentY) > 0.002) {
        frame = requestAnimationFrame(renderPointer);
      } else {
        frame = 0;
      }
    };

    const handlePointerMove = (event) => {
      targetX = (event.clientX / window.innerWidth - 0.5) * 2;
      targetY = (event.clientY / window.innerHeight - 0.5) * 2;
      if (!frame) frame = requestAnimationFrame(renderPointer);
    };

    const tiltTargets = document.querySelectorAll('.calendar-card, .secret-card');
    const handleTiltMove = (event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      event.currentTarget.style.setProperty('--card-rx', `${(-y * 7).toFixed(2)}deg`);
      event.currentTarget.style.setProperty('--card-ry', `${(x * 7).toFixed(2)}deg`);
      event.currentTarget.style.setProperty('--glow-x', `${((x + 0.5) * 100).toFixed(0)}%`);
      event.currentTarget.style.setProperty('--glow-y', `${((y + 0.5) * 100).toFixed(0)}%`);
    };
    const resetTilt = (event) => {
      event.currentTarget.style.setProperty('--card-rx', '0deg');
      event.currentTarget.style.setProperty('--card-ry', '0deg');
      event.currentTarget.style.setProperty('--glow-x', '50%');
      event.currentTarget.style.setProperty('--glow-y', '50%');
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    tiltTargets.forEach((target) => {
      target.addEventListener('pointermove', handleTiltMove, { passive: true });
      target.addEventListener('pointerleave', resetTilt, { passive: true });
    });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', handlePointerMove);
      tiltTargets.forEach((target) => {
        target.removeEventListener('pointermove', handleTiltMove);
        target.removeEventListener('pointerleave', resetTilt);
      });
    };
  }, [unlocked, remaining === 0]);

  if (!unlocked) return <FaceGate onUnlock={() => setUnlocked(true)} />;
  if (remaining > 0) return <>
    <ThreeBackground />
    <main className="countdown-only-screen">
      <BirthdayCountdown remaining={remaining} />
    </main>
  </>;

  return <>
    <ThreeBackground />
    <main>
    <div className="floating-hearts" aria-hidden="true"><span>♡</span><span>✧</span><span>♡</span><span>✿</span><span>♡</span></div>
    <div className="sky-effects" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
    <section className="birthday section-wrap" id="birthday">
      <div className="section-heading"><p className="eyebrow">A date worth keeping</p><h2>November is special.<br/><em>But the 25th is magic.</em></h2></div>
      <Calendar />
      <BirthdayCountdown remaining={remaining} />
      <p className="birthday-note">Some dates are just dates. And then there is the day <strong>you came into this world.</strong></p>
    </section>

    <section className="hero section-wrap" id="home">
      <div className="hero-tag"><span>MADE WITH LOVE</span><span>✧</span><span>JUST FOR YOU</span></div>
      <div className="birthday-marquee" aria-label="Happy birthday, Akka">
        <div className="birthday-marquee-track"><span>HAPPY BIRTHDAY, AKKA ✧ MADE WITH LOVE ✧ HAPPY BIRTHDAY, AKKA ✧ MADE WITH LOVE ✧</span><span aria-hidden="true">HAPPY BIRTHDAY, AKKA ✧ MADE WITH LOVE ✧ HAPPY BIRTHDAY, AKKA ✧ MADE WITH LOVE ✧</span></div>
      </div>
      <div className="hero-copy"><p className="eyebrow">To my favourite person, my Akka</p><h1>Happy birthday,<br/><em>my beautiful sister.</em></h1><p className="hero-sub">A little corner of the internet, filled with all the love I sometimes can't fit into words.</p><a className="scroll-link" href="#birthday">Scroll into your little surprise <span>↓</span></a></div>
      <div className="hero-art"><div className="halo"></div><div className="hero-flower">✿</div><div className="hero-heart">♡</div><PhotoSlot label="A photo of us" className="hero-photo" src="/photos/photo-01.jpg" alt="Akka smiling" position="50% 35%"/><div className="tape"></div><div className="handwritten">my forever<br/>safe place</div></div>
      <div className="hero-bottom"><span>25 · 11 · 2026</span><span>♡</span><span>SCROLL SLOWLY</span></div>
    </section>

    <section className="letter section-wrap">
      <div className="letter-paper"><div className="letter-stamp">♡</div><p className="eyebrow">A letter from my heart</p><h2>Dear Akka,</h2>
        <p>When I sit beside you, I feel a happiness that is hard to explain. Even when I feel lonely, or when something is weighing on my heart, sharing it with you somehow makes the sadness lighter.</p>
        <p>You feel like a home to me. A place where I can be myself, talk about anything, laugh without a reason, and feel understood. You care for me in ways that remind me of a mom, and I feel so lucky to have that kind of love in my life.</p>
        <p>And I love our little everyday moments — especially when we cook together. They may seem ordinary, but they are the memories I want to keep forever.</p>
        <p>On your birthday, I wish you the same comfort, happiness, kindness, and love that you give to me so effortlessly. May your heart always feel full, and may every beautiful thing find its way to you.</p>
        <p className="letter-end">I love you endlessly.<br/><span>Your little one ♡</span></p>
      </div>
      <div className="letter-photo"><PhotoSlot label="A favourite memory" src="/photos/photo-05.jpg" alt="Akka with family" position="50% 42%"/><span className="caption">A memory I wish I could relive ✧</span></div>
    </section>

    <section className="memory section-wrap">
      <p className="eyebrow">The little things are the big things</p><h2>My favourite kind<br/><em>of happiness.</em></h2>
      <div className="memory-grid"><PhotoSlot label="Cooking together" src="/photos/photo-11.jpg" alt="Akka in a candid moment" position="50% 28%"/><div className="memory-quote"><span>“</span><p>Some of my happiest memories aren't grand moments. They're simply being with you, making something delicious, talking, and feeling like everything is okay.</p><small>— a little piece of us</small></div><PhotoSlot label="A candid moment" src="/photos/photo-04.jpg" alt="A happy moment together" position="50% 48%"/></div>
    </section>

    <SiblingQuiz />

    <section className="gallery section-wrap">
      <div className="section-heading"><p className="eyebrow">Our scrapbook</p><h2>Little moments,<br/><em>forever memories.</em></h2><p className="section-sub">Choose up to four favourite photos and pin them to this little hanger.</p></div>
      <HangingPhotoGallery />
      <div className="gallery-note">✿ Every picture holds a little piece of my heart ✿</div>
    </section>

    <section className="secrets section-wrap">
      <p className="eyebrow">A few tiny surprises</p><h2>Open a little<br/><em>love note.</em></h2><p className="section-sub">Scratch each card with your cursor or finger to reveal a hidden note.</p>
      <div className="secret-grid">{secretNotes.map((item, i) =>
        <ScratchNoteCard
          key={i}
          item={item}
          revealed={revealedNotes.includes(i)}
          onReveal={() => revealNote(i)}
        />
      )}</div>
    </section>

    <section className="cake-section section-wrap">
      <p className="eyebrow">Make a wish, birthday girl</p><h2>One little wish<br/><em>for your new year.</em></h2>
      <div className={`cake ${cakeLit?'lit':''}`}><div className="candles"><span className="candle"><i></i></span><span className="candle"><i></i></span><span className="candle"><i></i></span></div><div className="cake-top">♡ ♡ ♡</div><div className="cake-layer layer-one"></div><div className="cake-layer layer-two"></div><div className="cake-plate"></div></div>
      <a className="wish-button" href={whatsappWishUrl} target="_blank" rel="noreferrer" onClick={()=>setCakeLit(true)}>{cakeLit?'Candles are glowing — wish Akka ♡':'Tap to light candles & wish Akka ✨'}</a>
      {cakeLit&&<div className="wish-message">
        <p>May this year bring you peace, laughter, beautiful surprises, and a thousand reasons to smile. <strong>You deserve all of it.</strong> ♡</p>
        <p className="wish-delivery-note">WhatsApp opens with your wish ready. Choose the chat and tap Send.</p>
        <div className="wish-actions">
          <a href={smsWishUrl}>Send as text message</a>
          <a href={callAkkaUrl}>Call Akka</a>
        </div>
      </div>}
    </section>

    <section className="finale section-wrap"><div className="final-card"><span className="final-star">✧</span><p className="eyebrow">One last thing</p><h2>In every version<br/>of my life, <em>I want you<br/>as my sister.</em></h2><PhotoSlot label="A photo for the final surprise" className="final-photo" src="/photos/photo-08.jpg" alt="A wonderful memory" position="50% 48%"/><p className="final-message">Happy birthday, Akka.<br/>Thank you for being my person, my comfort, and one of the greatest gifts in my life.</p><div className="signature">With all my love, always <span>♡</span></div></div></section>
    <footer><span>Made with love, just for Akka</span><span>25.11.2026 · ♡</span></footer>
    </main>
  </>;
}

createRoot(document.getElementById('root')).render(<App />);
