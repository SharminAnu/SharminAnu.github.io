const PROFILE_PATH = "profile.json";
const SCHOLAR_PATH = "scholar.json";

const textOrFallback = (value, fallback = "") =>
  value && String(value).trim().length > 0 ? value : fallback;

const createEl = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
};

const toListText = (items) =>
  items && items.length ? items.join(", ") : "";

const formatPublication = (publication) => {
  const parts = [];
  if (publication.title) parts.push(publication.title);
  if (publication.authors) parts.push(publication.authors);
  if (publication.venue) parts.push(publication.venue);
  if (publication.status) parts.push(`(${publication.status})`);
  return parts.join(". ");
};

const groupByYearDesc = (items) => {
  const groups = new Map();
  items.forEach((item) => {
    const year = item.year || "Unknown";
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push(item);
  });

  return Array.from(groups.entries()).sort((a, b) => {
    const yearA = Number(a[0]) || 0;
    const yearB = Number(b[0]) || 0;
    return yearB - yearA;
  });
};

const renderHero = (profile) => {
  const siteName = document.getElementById("site-name");
  const title = document.getElementById("hero-title");
  const tagline = document.getElementById("hero-tagline");
  const summary = document.getElementById("hero-summary");
  const meta = document.getElementById("hero-meta");

  if (siteName) siteName.textContent = textOrFallback(profile.name, "Portfolio");
  if (title) title.textContent = textOrFallback(profile.title);
  if (tagline) tagline.textContent = textOrFallback(profile.tagline);
  if (summary) summary.textContent = textOrFallback(profile.summary);

  if (meta) {
    meta.innerHTML = "";
    const metaItems = [
      profile.location,
      profile.email,
      profile.phone
    ].filter(Boolean);

    metaItems.forEach((item) => {
      const span = document.createElement("span");
      span.textContent = item;
      meta.appendChild(span);
    });
  }
};

const renderCv = (profile) => {
  const cvCard = document.getElementById("cv-card");
  if (!cvCard) return;

  const cvFile = textOrFallback(profile.cv?.file, "");
  const cvLabel = textOrFallback(profile.cv?.label, "Download CV");

  if (!cvFile) {
    cvCard.textContent = "Add your CV file name in profile.json.";
    return;
  }

  const button = createEl("a", "button", cvLabel);
  button.href = cvFile;
  button.setAttribute("download", "");

  const pdfEmbed = createEl("div", "pdf-embed");
  const iframe = document.createElement("iframe");
  iframe.title = `${profile.name || "CV"} PDF`;
  iframe.src = cvFile;
  iframe.loading = "lazy";
  pdfEmbed.appendChild(iframe);

  const helper = createEl(
    "p",
    "meta",
    "If the PDF does not display, ensure the file exists in the site root."
  );

  cvCard.append(button, pdfEmbed, helper);
};

const renderAcademics = (profile) => {
  const academics = document.getElementById("academics-list");
  if (!academics) return;
  academics.innerHTML = "";

  profile.education?.forEach((entry) => {
    const card = createEl("div", "card");
    card.appendChild(createEl("h3", "", entry.institution));
    card.appendChild(createEl("p", "card-subtitle", entry.degree));
    if (entry.advisor) card.appendChild(createEl("p", "", `Advisor: ${entry.advisor}`));
    if (entry.gpa) card.appendChild(createEl("p", "", `GPA: ${entry.gpa}`));
    academics.appendChild(card);
  });
};

const renderProjects = (profile) => {
  const projects = document.getElementById("projects-list");
  if (!projects) return;
  projects.innerHTML = "";

  profile.projects?.forEach((project) => {
    const card = createEl("article", "card");
    card.appendChild(createEl("h3", "", project.title));
    card.appendChild(createEl("p", "", project.description));
    const stack = toListText(project.stack || []);
    if (stack) card.appendChild(createEl("p", "meta", stack));
    projects.appendChild(card);
  });
};

const renderPublications = (scholar) => {
  const publications = document.getElementById("publications-list");
  if (!publications) return;
  publications.innerHTML = "";

  const publicationItems = scholar.publications || [];
  const grouped = groupByYearDesc(publicationItems);

  grouped.forEach(([year, items]) => {
    const card = createEl("div", "card");
    card.appendChild(createEl("h3", "", String(year)));
    const list = createEl("ol", "list");
    items.forEach((publication) => {
      const li = createEl("li", "", formatPublication(publication));
      list.appendChild(li);
    });
    card.appendChild(list);
    publications.appendChild(card);
  });
};

const renderActivities = (profile) => {
  const activities = document.getElementById("activities-list");
  if (!activities) return;
  activities.innerHTML = "";

  profile.activities?.forEach((activity) => {
    const card = createEl("div", "card");
    card.appendChild(createEl("h3", "", activity.title));
    if (activity.subtitle) {
      card.appendChild(createEl("p", "card-subtitle", activity.subtitle));
    }
    if (activity.description) {
      card.appendChild(createEl("p", "", activity.description));
    }
    if (activity.bullets?.length) {
      const list = createEl("ul", "list");
      activity.bullets.forEach((bullet) => {
        list.appendChild(createEl("li", "", bullet));
      });
      card.appendChild(list);
    }
    activities.appendChild(card);
  });
};

const renderContact = (profile) => {
  const contact = document.getElementById("contact-card");
  if (!contact) return;
  contact.innerHTML = "";

  const email = textOrFallback(profile.email);
  const phone = textOrFallback(profile.phone);
  const location = textOrFallback(profile.location);
  const links = profile.links || {};

  const createBlock = (label, content) => {
    const block = createEl("div");
    block.appendChild(createEl("p", "meta-label", label));
    block.appendChild(content);
    return block;
  };

  if (email) {
    const emailLink = createEl("a", "", email);
    emailLink.href = `mailto:${email}`;
    contact.appendChild(createBlock("Email", emailLink));
  }

  if (phone) {
    const phoneLink = createEl("a", "", phone);
    phoneLink.href = `tel:${phone.replace(/\s+/g, "")}`;
    contact.appendChild(createBlock("Phone", phoneLink));
  }

  if (location) {
    contact.appendChild(createBlock("Location", createEl("p", "", location)));
  }

  const linkContainer = createEl("div");
  linkContainer.appendChild(createEl("p", "meta-label", "Links"));
  const inline = createEl("div", "inline-links");
  const linkDefs = [
    { label: "GitHub", url: links.github },
    { label: "Google Scholar", url: links.scholar },
    { label: "LinkedIn", url: links.linkedin },
    { label: "Portfolio", url: links.portfolio }
  ];

  linkDefs.forEach(({ label, url }) => {
    const link = createEl("a", "", label);
    link.href = url || "#";
    link.setAttribute("aria-label", `${label} profile`);
    inline.appendChild(link);
  });

  linkContainer.appendChild(inline);
  contact.appendChild(linkContainer);
};

const renderFooter = (profile, scholar) => {
  const footer = document.getElementById("footer-text");
  if (!footer) return;
  const year = new Date().getFullYear();
  const synced = scholar.lastSynced ? `Last synced ${scholar.lastSynced}.` : "";
  footer.textContent = `Built for ${profile.name || "your profile"}. ${synced} ${year}.`;
};

const init = async () => {
  try {
    const [profileRes, scholarRes] = await Promise.all([
      fetch(PROFILE_PATH),
      fetch(SCHOLAR_PATH)
    ]);
    const profile = await profileRes.json();
    const scholar = await scholarRes.json();

    renderHero(profile);
    renderCv(profile);
    renderAcademics(profile);
    renderProjects(profile);
    renderPublications(scholar);
    renderActivities(profile);
    renderContact(profile);
    renderFooter(profile, scholar);
  } catch (error) {
    console.error("Failed to load profile data:", error);
  }
};

init();
