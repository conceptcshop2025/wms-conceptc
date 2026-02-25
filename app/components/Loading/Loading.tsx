import './Loading.css';

interface LoadingProps {
  text?: string;
}

export default function Loading({ text = "Sincronizando" }: LoadingProps) {
  return (
    <div className="loading-overlay">
      <div className="loading-card">

        <div className="loading-grid">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={`loading-cell loading-cell-${i + 1}`} />
          ))}
        </div>

        <p className="loading-label">
          <span className="loading-dots">{text}</span>
        </p>

      </div>
    </div>
  );
}
