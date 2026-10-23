import { useEffect, useMemo, useRef } from 'react';
import { useInView, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { cn } from '@/lib/utils';

// Magic UI Number Ticker, adapted for JavaScript, inherited theme colors,
// reduced motion and a stable screen-reader value.
// https://magicui.design/docs/components/number-ticker
export function NumberTicker({ value, startValue = 0, delay = 0, className, ...props }) {
  const ref = useRef(null);
  const motionValue = useMotionValue(startValue);
  const springValue = useSpring(motionValue, { damping: 25, stiffness: 400 });
  const isInView = useInView(ref, { once: true, margin: '0px' });
  const reduceMotion = useReducedMotion();
  const formatter = useMemo(() => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }), []);

  useEffect(() => springValue.on('change', (latest) => {
    if (ref.current) ref.current.textContent = formatter.format(latest);
  }), [springValue, formatter]);

  useEffect(() => {
    if (reduceMotion) {
      motionValue.set(value);
      springValue.jump(value);
      return;
    }
    if (!isInView) return;
    const timer = window.setTimeout(() => motionValue.set(value), delay * 1000);
    return () => window.clearTimeout(timer);
  }, [motionValue, springValue, isInView, reduceMotion, delay, value]);

  return (
    <span className={cn('inline-block tabular-nums', className)} {...props}>
      <span className="sr-only">{formatter.format(value)}</span>
      <span ref={ref} aria-hidden="true">{formatter.format(reduceMotion ? value : startValue)}</span>
    </span>
  );
}
