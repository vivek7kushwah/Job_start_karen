document.addEventListener('DOMContentLoaded', () => {
  const jobsContainer = document.getElementById('jobs-container');
  // Demo job box
  const jobBox = document.createElement('div');
  jobBox.className = 'job-box';
  jobBox.innerHTML = `
    <h2>Software Engineer</h2>
    <p>Company: Example Corp</p>
    <p>Location: Remote</p>
    <button>Apply</button>
  `;
  jobsContainer.appendChild(jobBox);
});
