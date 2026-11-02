import './App.css'

const navigationItems = [
  { label: 'Today', isAvailable: true },
  { label: 'All activities', isAvailable: false },
  { label: 'Archived', isAvailable: false },
]

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="wordmark" href="#dashboard" aria-label="Retoma dashboard">
          <span className="wordmark-mark" aria-hidden="true"></span>
          <span>retoma</span>
        </a>

        <nav aria-label="Primary navigation">
          <ul className="navigation-list">
            {navigationItems.map((item) => (
              <li key={item.label}>
                {item.isAvailable ? (
                  <a href="#dashboard" aria-current="page">
                    {item.label}
                  </a>
                ) : (
                  <span className="navigation-item-unavailable">
                    <span>{item.label}</span>
                    <span>Coming soon</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <p className="sidebar-note">
          A quiet place for the things you want to return to.
        </p>
      </aside>

      <main id="dashboard" className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Your next moment</p>
            <h1>Make space to pick things back up.</h1>
            <p className="intro">
              Keep a gentle record of your projects and interests, so you always
              know where to begin again.
            </p>
          </div>
          <div className="action-group">
            <button type="button" disabled aria-describedby="add-activity-status">
              Add activity
            </button>
            <span id="add-activity-status">Coming soon</span>
          </div>
        </header>

        <section className="activity-section" aria-labelledby="activities-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Activity list</p>
              <h2 id="activities-heading">Ready when you are</h2>
            </div>
            <span className="item-count">0 activities</span>
          </div>

          <div className="empty-state">
            <div className="empty-state-mark" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <h3>Nothing is waiting yet.</h3>
            <p>
              When activity creation is available, this is where you will find a
              clear next step for every project or interest you want to resume.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
