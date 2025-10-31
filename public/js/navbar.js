document.addEventListener('DOMContentLoaded', async () => {
  const mount = document.getElementById('navbar');
  if (!mount) return;
  try {
    const res = await fetch('partials/navbar.html');
    if (!res.ok) throw new Error('Failed to load navbar');
    const html = await res.text();
    mount.innerHTML = html;

    // Highlight active link based on current page
    const links = mount.querySelectorAll('.nav-links a');
    const current = location.pathname.split('/').pop();
    links.forEach(a => {
      const target = a.getAttribute('href');
      if (target && current && current.toLowerCase() === target.toLowerCase()) {
        a.classList.add('active');
      }
    });
  } catch (err) {
    console.error('Navbar injection error:', err);
  }
});