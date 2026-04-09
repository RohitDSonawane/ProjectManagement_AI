/**
 * Renders a full CaseStudyCard with all 7 fields.
 * content: CaseStudyCard object from backend
 */
export default function CaseStudyCard({ content }) {
  const safeContent = content && typeof content === 'object' ? content : {}
  const {
    concept = 'Case Study',
    story = 'No scenario text provided.',
    problem = 'No problem statement provided.',
    decision_point = 'No decision point provided.',
    concept_mapping = 'No concept mapping provided.',
    key_lessons = [],
    think_about_this = 'What would your first action be in this situation?',
  } = safeContent

  const lessons = Array.isArray(key_lessons) && key_lessons.length > 0
    ? key_lessons
    : ['No key lessons were generated for this response.']

  return (
    <div className="case-study-card">
      {/* Header */}
      <div className="card-header">
        <div className="card-concept-badge">
          📚 Case Study
        </div>
        <h2 className="card-concept-title">{concept}</h2>
      </div>

      {/* Body */}
      <div className="card-body">

        {/* Story */}
        <div className="card-section">
          <div className="card-section-label">
            <span className="label-icon">🌍</span> Real-World Scenario
          </div>
          <p className="card-section-text">{story}</p>
        </div>

        <div className="divider" />

        {/* Problem */}
        <div className="card-section">
          <div className="card-section-label">
            <span className="label-icon">⚠️</span> The Problem
          </div>
          <p className="card-section-text">{problem}</p>
        </div>

        {/* Decision Point */}
        <div className="card-decision-box">
          <div className="card-section-label" style={{ marginBottom: 8 }}>
            <span className="label-icon">⚡</span> Decision Point
          </div>
          <p className="card-section-text">{decision_point}</p>
        </div>

        <div className="divider" />

        {/* Concept Mapping */}
        <div className="card-mapping-box">
          <div className="card-section-label" style={{ marginBottom: 8 }}>
            <span className="label-icon">🔗</span> Concept Mapping
          </div>
          <p className="card-section-text">{concept_mapping}</p>
        </div>

        <div className="divider" />

        {/* Key Lessons */}
        <div className="card-section">
          <div className="card-section-label">
            <span className="label-icon">🎯</span> Key Lessons
          </div>
          <ul className="card-lessons-list">
            {lessons.map((lesson, i) => (
              <li className="card-lesson-item" key={i}>
                <span className="lesson-bullet">{i + 1}</span>
                <span>{lesson}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Think About This */}
        <div className="card-think-box">
          <span className="think-icon">💭</span>
          <div className="think-content">
            <div className="think-label">Think About This</div>
            <p className="think-text">{think_about_this}</p>
          </div>
        </div>

      </div>
    </div>
  )
}
