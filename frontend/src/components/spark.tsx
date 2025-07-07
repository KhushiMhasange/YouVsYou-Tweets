import { useEffect, useState } from 'react';

export default function SparkEffect() {
  const [sparks, setSparks] = useState([]);

  const handleClick = (e) => {
    const newSpark = {
      id: Date.now(),
      x: e.clientX,
      y: e.clientY,
    };

    setSparks((prev) => [...prev, newSpark]);

    // Remove spark after animation
    setTimeout(() => {
      setSparks((prev) => prev.filter((s) => s.id !== newSpark.id));
    }, 300);
  };

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-50">
      {sparks.map((spark) => (
        <div
          key={spark.id}
          className="text-xl animate-spark absolute"
          style={{
            left: spark.x,
            top: spark.y,
            transform: 'translate(-50%, -50%)',
          }}
        >✨</div>
      ))}
    </div>
  );
}
