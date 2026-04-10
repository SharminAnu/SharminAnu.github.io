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

const escapeHtml = (str) => {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
};

const highlightAuthor = (authors, name) => {
  if (!authors || !name) return authors || "";
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "g");
  return authors.replace(regex, `<span class="author-highlight">${name}</span>`);
};

const toListText = (items) =>
  items && items.length ? items.join(", ") : "";

const buildPublicationBlock = (publication, highlightName) => {
  const block = createEl("div", "fj-pub");

  const titleRow = createEl("div", "fj-pub-title");
  if (publication.url) {
    const link = createEl("a", "fj-pub-link", publication.title);
    link.href = publication.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    titleRow.appendChild(link);
  } else {
    const span = createEl("span", "fj-pub-plain", publication.title || "");
    titleRow.appendChild(span);
  }

  if (publication.authors) {
    const authorEl = createEl("p", "fj-pub-authors");
    authorEl.innerHTML = highlightAuthor(publication.authors, highlightName);
    block.appendChild(titleRow);
    block.appendChild(authorEl);
  } else {
    block.appendChild(titleRow);
  }

  const venueParts = [];
  if (publication.venue) venueParts.push(publication.venue);
  if (publication.year) venueParts.push(String(publication.year));
  if (venueParts.length) {
    block.appendChild(createEl("p", "fj-pub-venue", venueParts.join(", ")));
  }

  return block;
};

const sortPublicationsFlat = (items) =>
  [...items].sort((a, b) => {
    const yA = Number(a.year) || 0;
    const yB = Number(b.year) || 0;
    return yB - yA;
  });

const renderHero = (profile) => {
  const siteName = document.getElementById("site-name");
  const nameEl = document.getElementById("hero-name");
  const tagline = document.getElementById("hero-tagline");
  const list = document.getElementById("research-interests-list");
  const docTitle = document.getElementById("doc-title");

  if (siteName) siteName.textContent = textOrFallback(profile.navLabel, "Home");
  if (nameEl) nameEl.textContent = textOrFallback(profile.name);
  if (tagline) tagline.textContent = textOrFallback(profile.tagline);
  if (docTitle) docTitle.textContent = `${textOrFallback(profile.name, "Profile")} — ${textOrFallback(profile.title)}`;

  if (list) {
    list.innerHTML = "";
    (profile.researchInterests || []).forEach((item) => {
      list.appendChild(createEl("li", "", item));
    });
  }
};

const renderNews = (profile) => {
  const container = document.getElementById("news-list");
  if (!container) return;
  container.innerHTML = "";
  const items = profile.news || [];
  if (!items.length) {
    container.appendChild(createEl("p", "fj-muted", "No news items yet—check back soon."));
    return;
  }
  items.forEach((item) => {
    const row = createEl("div", "fj-news-item");
    const date = createEl("span", "fj-news-date", item.date || "");
    const text = document.createElement("span");
    text.innerHTML = escapeHtml(item.text || "");
    row.appendChild(date);
    row.appendChild(text);
    container.appendChild(row);
  });
};

const renderAbout = (profile) => {
  const about = document.getElementById("about-body");
  if (!about) return;
  about.innerHTML = "";
  const p1 = createEl("p", "", textOrFallback(profile.summary));
  about.appendChild(p1);
  const extra = textOrFallback(profile.aboutExtra);
  if (extra) about.appendChild(createEl("p", "", extra));
};

const renderEducation = (profile) => {
  const root = document.getElementById("education-list");
  if (!root) return;
  root.innerHTML = "";
  profile.education?.forEach((entry) => {
    const block = createEl("div", "fj-block");
    block.appendChild(createEl("h3", "fj-edu-school", entry.institution));
    block.appendChild(createEl("p", "fj-edu-degree", entry.degree));
    if (entry.details?.length) {
      const ul = createEl("ul", "fj-list");
      entry.details.forEach((line) => ul.appendChild(createEl("li", "", line)));
      block.appendChild(ul);
    }
    root.appendChild(block);
  });
};

const renderResearchOrExperienceBlock = (item) => {
  const block = createEl("div", "fj-block");
  block.appendChild(createEl("h3", "", item.title));
  if (item.subtitle) {
    block.appendChild(createEl("p", "fj-role-meta", item.subtitle));
  }
  if (item.description) {
    block.appendChild(createEl("p", "", item.description));
  }
  if (item.bullets?.length) {
    const ul = createEl("ul", "fj-list");
    item.bullets.forEach((b) => ul.appendChild(createEl("li", "", b)));
    block.appendChild(ul);
  }
  return block;
};

const renderResearch = (profile) => {
  const root = document.getElementById("research-list");
  if (!root) return;
  root.innerHTML = "";
  const items = profile.research || [];
  if (!items.length) {
    root.appendChild(createEl("p", "fj-muted", "Research positions will appear here."));
    return;
  }
  items.forEach((item) => root.appendChild(renderResearchOrExperienceBlock(item)));
};

const renderExperience = (profile) => {
  const root = document.getElementById("experience-list");
  if (!root) return;
  root.innerHTML = "";
  profile.experience?.forEach((item) => root.appendChild(renderResearchOrExperienceBlock(item)));
};

const renderProjects = (profile) => {
  const root = document.getElementById("projects-list");
  if (!root) return;
  root.innerHTML = "";
  profile.projects?.forEach((project) => {
    const block = createEl("div", "fj-block");
    block.appendChild(createEl("h3", "", project.title));
    block.appendChild(createEl("p", "", project.description));
    const stack = toListText(project.stack || []);
    if (stack) block.appendChild(createEl("p", "fj-project-meta", stack));
    root.appendChild(block);
  });
};

const renderInterests = (profile) => {
  const root = document.getElementById("interests-tags");
  if (!root) return;
  root.innerHTML = "";
  (profile.interests || []).forEach((label) => {
    root.appendChild(createEl("span", "fj-tag", label));
  });
};

const renderSkills = (profile) => {
  const root = document.getElementById("skills-list");
  if (!root) return;
  root.innerHTML = "";
  (profile.skills || []).forEach((line) => {
    root.appendChild(createEl("li", "", line));
  });
};

const renderPublications = (scholar) => {
  const publications = document.getElementById("publications-list");
  const note = document.getElementById("publications-note");
  if (note) {
    note.textContent = "";
    const url = scholar.scholarProfile?.profileUrl;
    note.appendChild(
      document.createTextNode(
        url ? "List synced from Google Scholar; newest first." : "Newest first."
      )
    );
    if (url) {
      note.appendChild(document.createTextNode(" "));
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "View Google Scholar profile";
      note.appendChild(link);
      note.appendChild(document.createTextNode("."));
    }
  }
  if (!publications) return;
  publications.innerHTML = "";

  const publicationItems = scholar.publications || [];
  const highlightName = scholar.authorHighlight || "S Sultana";
  const sorted = sortPublicationsFlat(publicationItems);

  if (!sorted.length) {
    publications.appendChild(createEl("p", "fj-muted", "No publications loaded yet."));
    return;
  }

  sorted.forEach((pub) => {
    publications.appendChild(buildPublicationBlock(pub, highlightName));
  });
};

const renderContact = (profile) => {
  const contact = document.getElementById("contact-card");
  if (!contact) return;
  contact.innerHTML = "";

  const createBlock = (label, content) => {
    const block = createEl("div");
    block.appendChild(createEl("p", "meta-label", label));
    block.appendChild(content);
    return block;
  };

  const email = textOrFallback(profile.email);
  if (email) {
    const emailLink = createEl("a", "", email);
    emailLink.href = `mailto:${email}`;
    contact.appendChild(createBlock("Email", emailLink));
  }

  const phone = textOrFallback(profile.phone);
  if (phone) {
    const phoneLink = createEl("a", "", phone);
    phoneLink.href = `tel:${phone.replace(/\s+/g, "")}`;
    contact.appendChild(createBlock("Phone", phoneLink));
  }

  const location = textOrFallback(profile.location);
  if (location) {
    contact.appendChild(createBlock("Location", createEl("p", "", location)));
  }

  const cvFile = textOrFallback(profile.cv?.file, "");
  const cvLabel = textOrFallback(profile.cv?.label, "Download CV");
  if (cvFile) {
    const btn = createEl("a", "button", cvLabel);
    btn.href = cvFile;
    btn.setAttribute("download", "");
    contact.appendChild(createBlock("CV", btn));
  }

  const links = profile.links || {};
  const linkDefs = [
    { label: "GitHub", url: links.github, icon: "code" },
    { label: "Google Scholar", url: links.scholar, icon: "book" },
    { label: "LinkedIn", url: links.linkedin, icon: "in" },
    { label: "Portfolio", url: links.portfolio, icon: "link" }
  ];

  const hasAnyLink = linkDefs.some((d) => textOrFallback(d.url));
  if (hasAnyLink) {
    const wrap = createEl("div");
    wrap.appendChild(createEl("p", "meta-label", "Links"));
    const inline = createEl("div", "inline-links");

    const iconSvg = (type) => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      svg.classList.add("icon");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      if (type === "code") {
        path.setAttribute(
          "d",
          "M9 18l-6-6 6-6 1.4 1.4L5.8 12l4.6 4.6L9 18zm6 0l-1.4-1.4L18.2 12l-4.6-4.6L15 6l6 6-6 6z"
        );
      } else if (type === "book") {
        path.setAttribute(
          "d",
          "M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2zm0 2v12h12V6H6z"
        );
      } else if (type === "in") {
        path.setAttribute(
          "d",
          "M6 9h3v9H6V9zm1.5-5a1.75 1.75 0 110 3.5A1.75 1.75 0 017.5 4zM11 9h3v1.3h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.6V18h-3v-4.1c0-1-.02-2.3-1.4-2.3-1.4 0-1.6 1.1-1.6 2.2V18h-3V9z"
        );
      } else {
        path.setAttribute(
          "d",
          "M10 7a1 1 0 011-1h2a4 4 0 010 8h-1v-2h1a2 2 0 000-4h-2a1 1 0 01-1-1zm-1 2v2H8a2 2 0 000 4h2a1 1 0 010 2H8a4 4 0 010-8h1z"
        );
      }
      svg.appendChild(path);
      return svg;
    };

    linkDefs.forEach(({ label, url, icon }) => {
      const u = textOrFallback(url);
      if (!u) return;
      const link = createEl("a", "icon-link");
      link.href = u;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", `${label}`);
      link.appendChild(iconSvg(icon));
      link.appendChild(createEl("span", "icon-text", label));
      inline.appendChild(link);
    });

    wrap.appendChild(inline);
    contact.appendChild(wrap);
  }
};

const renderFooter = (profile, scholar) => {
  const footer = document.getElementById("footer-text");
  if (!footer) return;
  const year = new Date().getFullYear();
  const synced = scholar.lastSynced ? ` Publications last synced ${scholar.lastSynced}.` : "";
  footer.textContent = `© ${year} ${profile.name || "Sharmin Sultana"}.${synced}`;
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
    renderNews(profile);
    renderAbout(profile);
    renderEducation(profile);
    renderPublications(scholar);
    renderResearch(profile);
    renderExperience(profile);
    renderProjects(profile);
    renderInterests(profile);
    renderSkills(profile);
    renderContact(profile);
    renderFooter(profile, scholar);
  } catch (error) {
    console.error("Failed to load profile data:", error);
  }
};

init();
