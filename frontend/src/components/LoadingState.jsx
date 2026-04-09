export default function LoadingState({ label = 'Generating case study...' }) {
  return (
    <div className="case-study-card loading-card">
      <div className="loading-headline">
        <div className="loading-dots">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
        </div>
        <span className="loading-label">{label}</span>
      </div>
      <div className="skeleton skeleton-badge" />
      <div className="skeleton skeleton-title skeleton-offset-sm" />
      <div className="skeleton-group">
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text medium" />
        <div className="skeleton skeleton-text short" />
      </div>
      <div className="skeleton-group">
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text medium" />
      </div>
      <div className="skeleton-group">
        <div className="skeleton skeleton-text short" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text medium" />
      </div>
    </div>
  )
}
