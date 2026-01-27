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

const highlightAuthor = (authors, name) => {
  if (!authors || !name) return authors || "";
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "g");
  return authors.replace(regex, `<span class="author-highlight">${name}</span>`);
};

const buildPublicationItem = (publication, highlightName) => {
  const container = createEl("div", "pub-item");

  const titleRow = createEl("div", "pub-title");
  if (publication.url) {
    const link = createEl("a", "pub-link", publication.title);
    link.href = publication.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    titleRow.appendChild(link);
  } else {
    titleRow.textContent = publication.title || "";
  }

  let authors = null;
  if (publication.authors) {
    const authorEl = createEl("div", "pub-authors");
    authorEl.innerHTML = highlightAuthor(publication.authors, highlightName);
    authors = authorEl;
  }
  const venueParts = [];
  if (publication.venue) venueParts.push(publication.venue);
  if (publication.year) venueParts.push(publication.year);
  const venue = venueParts.length
    ? createEl("div", "pub-venue", venueParts.join(" · "))
    : null;

  container.appendChild(titleRow);
  if (authors) container.appendChild(authors);
  if (venue) container.appendChild(venue);

  return container;
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
  if (siteName) {
    siteName.textContent = textOrFallback(profile.navLabel, "Home");
  }
  if (title) title.textContent = textOrFallback(profile.title);
  if (tagline) tagline.textContent = textOrFallback(profile.tagline);
  if (summary) summary.textContent = textOrFallback(profile.summary);
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
  const highlightName = scholar.authorHighlight || "S Sultana";
  const grouped = groupByYearDesc(publicationItems);

  grouped.forEach(([year, items]) => {
    const card = createEl("div", "card");
    card.appendChild(createEl("h3", "", String(year)));
    const list = createEl("ol", "list");
    items.forEach((publication) => {
      const li = createEl("li");
      li.appendChild(buildPublicationItem(publication, highlightName));
      list.appendChild(li);
    });
    card.appendChild(list);
    publications.appendChild(card);
  });
};

const renderExperience = (profile) => {
  const experience = document.getElementById("experience-list");
  if (!experience) return;
  experience.innerHTML = "";

  profile.experience?.forEach((item) => {
    const card = createEl("div", "card");
    card.appendChild(createEl("h3", "", item.title));
    if (item.subtitle) {
      card.appendChild(createEl("p", "card-subtitle", item.subtitle));
    }
    if (item.description) {
      card.appendChild(createEl("p", "", item.description));
    }
    if (item.bullets?.length) {
      const list = createEl("ul", "list");
      item.bullets.forEach((bullet) => {
        list.appendChild(createEl("li", "", bullet));
      });
      card.appendChild(list);
    }
    experience.appendChild(card);
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
    { label: "GitHub", url: links.github, icon: "code" },
    { label: "Google Scholar", url: links.scholar, icon: "book" },
    { label: "LinkedIn", url: links.linkedin, icon: "in" },
    { label: "Portfolio", url: links.portfolio, icon: "link" }
  ];

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
    const link = createEl("a", "icon-link");
    link.href = url || "#";
    link.setAttribute("aria-label", `${label} link`);
    link.appendChild(iconSvg(icon));
    link.appendChild(createEl("span", "icon-text", label));
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

const setupSectionNavigation = () => {
  const sections = Array.from(document.querySelectorAll(".page-section"));
  const navLinks = Array.from(document.querySelectorAll(".nav-links a, .logo"));

  const setActive = (targetId) => {
    sections.forEach((section) => {
      const isTarget = section.id === targetId;
      if (isTarget) {
        section.classList.remove("is-hidden");
        section.classList.remove("is-active");
        requestAnimationFrame(() => {
          section.classList.add("is-active");
        });
      } else {
        section.classList.remove("is-active");
        section.classList.add("is-hidden");
      }
    });

    navLinks.forEach((link) => {
      const href = link.getAttribute("href") || "";
      const linkId = href.startsWith("#") ? href.slice(1) : "";
      link.classList.toggle("active", linkId === targetId);
    });
  };

  const navigate = (id) => {
    const targetId = sections.some((section) => section.id === id)
      ? id
      : "home";
    setActive(targetId);
  };

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("#")) return;
      event.preventDefault();
      const targetId = href.slice(1);
      history.replaceState(null, "", href);
      navigate(targetId);
    });
  });

  const initialTarget = window.location.hash
    ? window.location.hash.slice(1)
    : "home";
  navigate(initialTarget);
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
    renderAcademics(profile);
    renderProjects(profile);
    renderPublications(scholar);
    renderExperience(profile);
    renderContact(profile);
    renderFooter(profile, scholar);
    setupSectionNavigation();
  } catch (error) {
    console.error("Failed to load profile data:", error);
  }
};

init();
