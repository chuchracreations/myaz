import React, { useLayoutEffect, useRef, useState } from 'react';
import { MessageSquareText } from 'lucide-react';

const FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScHgr-s8Bd-WFL5P6LhJxFFo7rJeXGX1UjdIVnia5vBsEB-Fg/viewform?embedded=true';

// Google's embedded form isn't responsive below ~640px: at sidebar widths it
// falls back to an oversized "mobile" layout. Rendering it at its real design
// width and scaling the whole iframe down keeps the normal desktop layout.
const FORM_WIDTH = 640;
const FORM_HEIGHT = 1645;

export const FeedbackView: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const updateScale = () => setScale(wrapper.clientWidth / FORM_WIDTH);
    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="feedback-view">
      <div className="feedback-card">
        <div className="feedback-header">
          <div className="feedback-icon-tile">
            <MessageSquareText size={18} />
          </div>
          <div>
            <div className="utility-title">Feedback</div>
            <div className="utility-subtitle">Tell us what&apos;s working or what&apos;s not</div>
          </div>
        </div>

        <div
          ref={wrapperRef}
          className="feedback-frame-wrapper"
          style={{ height: FORM_HEIGHT * scale }}
        >
          <iframe
            className="feedback-frame"
            src={FEEDBACK_FORM_URL}
            title="Feedback form"
            style={{
              width: FORM_WIDTH,
              height: FORM_HEIGHT,
              transform: `scale(${scale})`,
            }}
          >
            Loading feedback form…
          </iframe>
        </div>
      </div>
    </div>
  );
};
