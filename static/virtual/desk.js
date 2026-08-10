(function () {
  "use strict";

  const projects = Array.isArray(window.OC_DESK_PROJECTS)
    ? window.OC_DESK_PROJECTS
    : [];

  const grid = document.querySelector("#project-grid");
  const index = document.querySelector("#hero-project-index");
  const projectCount = document.querySelector("#project-count");
  const panelProjectCount = document.querySelector("#panel-project-count");
  const currentYear = document.querySelector("#current-year");

  const create = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  const createVisual = (type) => {
    const visual = create("div", `project-visual project-visual-${type}`);
    visual.setAttribute("aria-hidden", "true");

    if (type === "timeline") {
      visual.innerHTML = `
        <div class="visual-paper">
          <div class="visual-paper-head"><span>ARCHIVE 01</span><i></i><span>2004—2026</span></div>
          <div class="visual-timeline">
            <div><time>2004</time><span></span><p><b>ORIGIN</b><i></i><i></i></p></div>
            <div><time>2013</time><span></span><p><b>CHAPTER II</b><i></i></p></div>
            <div><time>2019</time><span></span><p><b>TURNING POINT</b><i></i><i></i></p></div>
            <div><time>2026</time><span></span><p><b>PRESENT</b><i></i></p></div>
          </div>
        </div>`;
    } else if (type === "player") {
      visual.innerHTML = `
        <div class="visual-player">
          <div class="visual-album"><span>TRACK<br>NO. 02</span><i></i></div>
          <div class="visual-track">
            <span>NOW PLAYING</span>
            <strong>Night Archive</strong>
            <small>CHARACTER PLAYLIST</small>
            <div class="visual-progress"><i></i></div>
            <ol><li>01</li><li>02</li><li>03</li></ol>
          </div>
        </div>`;
    } else if (type === "mail") {
      visual.innerHTML = `
        <div class="visual-mail">
          <aside><i></i><i></i><i></i></aside>
          <div class="visual-mail-list"><b>INBOX</b><i></i><i></i><i></i></div>
          <article><span>MESSAGE</span><b>Archive Letter</b><i></i><i></i><i></i></article>
        </div>`;
    } else if (type === "review") {
      visual.innerHTML = `
        <div class="visual-review">
          <header><b>OC 点评</b><span>•••</span></header>
          <div class="visual-review-hero"><i></i><p><small>REVIEW ARCHIVE</small><strong>REVIEW FILE</strong></p></div>
          <div class="visual-review-score"><b>4.7</b><span>★★★★★</span><i></i></div>
          <div class="visual-review-entry"><span></span><p><b>城市食客</b><i></i><i></i></p></div>
        </div>`;
    } else if (type === "receipt") {
      visual.innerHTML = `
        <div class="visual-receipt">
          <header><b>RECEIPT</b><span>NO. 0007</span></header>
          <div class="visual-receipt-brand"><i>票</i><p><strong>RECEIPT STUDIO</strong><small>RECEIPT &amp; INVOICE</small></p></div>
          <div class="visual-receipt-lines"><i></i><i></i><i></i></div>
          <div class="visual-receipt-total"><span>TOTAL</span><b>¥ 108.00</b></div>
        </div>`;
    } else if (type === "cart") {
      visual.innerHTML = `
        <div class="visual-cart">
          <header><b>购物车</b><span>•••</span></header>
          <div class="visual-cart-account"><i></i><p><b>GOLD MEMBER</b><span></span></p></div>
          <div class="visual-cart-product"><i></i><p><b>Archive Notebook</b><span></span><em>¥58 × 2</em></p></div>
          <footer><span>合计 ¥284</span><b>去结算</b></footer>
        </div>`;
    } else if (type === "desktop") {
      visual.innerHTML = `
        <div class="visual-desktop">
          <div class="visual-desktop-profile">
            <header><i></i><i></i><i></i><span>PROFILE.EXE</span></header>
            <div><b>OC</b><p><strong>CHARACTER FILE</strong><i></i><i></i></p></div>
          </div>
          <div class="visual-desktop-note"><b>MEMO</b><i></i><i></i><i></i></div>
          <footer><b>▦</b><span>DESKTOP ARCHIVE</span><time>23:17</time></footer>
        </div>`;
    } else if (type === "backpack") {
      visual.innerHTML = `
        <div class="visual-backpack">
          <header><b>OC BACKPACK</b><span>PERSONAL INVENTORY</span></header>
          <div class="visual-backpack-profile"><i>OC</i><p><b>CHARACTER FILE</b><span></span><span></span></p></div>
          <div class="visual-backpack-grid"><i>◇</i><i>✦</i><i>＋</i><i>◆</i><i>!</i><i>◇</i></div>
          <footer><span>INVENTORY</span><b>05 / 24</b></footer>
        </div>`;
    } else if (type === "appraisal") {
      visual.innerHTML = `
        <div class="visual-appraisal">
          <header><span>APPRAISAL CERTIFICATE</span><b>鉴</b></header>
          <div class="visual-appraisal-body">
            <div class="visual-appraisal-photo">◇</div>
            <div class="visual-appraisal-data"><i></i><i></i><i></i><i></i></div>
          </div>
          <div class="visual-appraisal-result"><span>APPRAISAL OPINION</span><i></i><i></i></div>
          <footer><span>DOCUMENT · 010</span><b>VERIFIED</b></footer>
        </div>`;
    } else if (type === "booklet") {
      visual.innerHTML = `
        <div class="visual-booklet">
          <header><span>OC BOOKLET</span><b>11</b></header>
          <div class="visual-booklet-title"><small>COLLECTION INDEX</small><strong>BOOKLET STUDIO</strong></div>
          <div class="visual-booklet-image"><i></i></div>
          <footer><span>PAGE 01 / 07</span><b>ARCHIVE</b></footer>
        </div>`;
    } else if (type === "immersive") {
      visual.innerHTML = `
        <div class="visual-immersive">
          <header><b>DIM NEXUS</b><span>12 / GENERATOR</span></header>
          <div class="visual-immersive-stage">
            <aside><i>OC</i><i>01</i><i>02</i></aside>
            <section><small>IMMERSIVE CREATION</small><strong>GENERATE<br>YOUR WORLD</strong><div><i></i><i></i><i></i></div></section>
          </div>
          <footer><span>MULTI FORMAT</span><b>ENTER ↗</b></footer>
        </div>`;
    } else if (type === "shipping") {
      visual.innerHTML = `
        <div class="visual-shipping">
          <header><b>NORTHSHORE</b><span>13 / POSTAL</span></header>
          <div class="visual-shipping-route"><small>DESTINATION</small><strong>B7 204</strong><b>N-17</b></div>
          <div class="visual-shipping-address"><span>TO / CONSIGNEE</span><i></i><i></i><i></i></div>
          <div class="visual-shipping-code"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
          <footer><span>FICTIONAL OC PROP</span><b>4018 1104 7259</b></footer>
        </div>`;
    } else if (type === "express") {
      visual.innerHTML = `
        <div class="visual-express">
          <div class="visual-express-stripe"></div>
          <header><b>EXPRESS LABEL</b><span>14 / COURIER</span></header>
          <div class="visual-express-route"><small>DEST HUB</small><strong>310-021</strong><b>A 09</b></div>
          <div class="visual-express-address"><span>收件 / CONSIGNEE</span><i></i><i></i></div>
          <div class="visual-express-code"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
          <footer><span>6 STYLES</span><b>XF-1439-2019</b></footer>
        </div>`;
    } else if (type === "occard") {
      visual.innerHTML = `
        <div class="visual-occard">
          <header><b>OC CARD LAB</b><span>15 / PROFILE</span></header>
          <div class="visual-occard-body">
            <div class="visual-occard-photo">OC</div>
            <div class="visual-occard-info"><strong>CHARACTER FILE</strong><i></i><i></i><i></i></div>
          </div>
          <div class="visual-occard-stats"><span></span><span></span><span></span></div>
          <footer><em></em><em></em><em></em><em></em><b>4 STYLES</b></footer>
        </div>`;
    } else if (type === "badge") {
      visual.innerHTML = `
        <div class="visual-badge">
          <div class="visual-badge-hole"></div>
          <header><b>ID BADGE</b><span>16 / STAFF</span></header>
          <div class="visual-badge-body"><div class="visual-badge-photo">OC</div><p><small>EXAMPLE ORG</small><strong>示例人物</strong><i></i><i></i></p></div>
          <div class="visual-badge-code"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
          <footer><span>FICTIONAL ID</span><b>6 STYLES</b></footer>
        </div>`;
    } else {
      visual.innerHTML = `
        <div class="visual-social">
          <div class="visual-social-head"><span></span><p><b>archive_notes</b><i></i></p><em>•••</em></div>
          <div class="visual-social-copy"><i></i><i></i><i></i><i></i></div>
          <div class="visual-social-image"><span>FICTIONAL<br>POST</span></div>
          <div class="visual-social-actions"><span>○</span><span>↻</span><span>♡</span><span>⌑</span></div>
        </div>`;
    }

    return visual;
  };

  const createProjectCard = (project) => {
    const card = create("a", "project-card");
    card.href = project.href;
    card.dataset.visual = project.visual;
    card.setAttribute("aria-label", `${project.title}：${project.action}`);

    if (project.featured) card.classList.add("is-featured");
    if (project.external) {
      card.target = "_blank";
      card.rel = "noopener noreferrer";
    }

    const top = create("div", "project-card-top");
    const identity = create("div", "project-identity");
    identity.append(
      create("span", "project-number", project.number),
      create("span", "project-category", project.category)
    );

    const status = create("span", "project-status");
    status.append(create("i"));
    status.append(document.createTextNode(project.status));
    top.append(identity, status);

    const body = create("div", "project-card-body");
    const copy = create("div", "project-copy");
    const heading = create("h3");
    heading.append(
      create("span", "", project.title),
      create("small", "", project.englishTitle)
    );
    copy.append(heading, create("p", "", project.description));

    const tags = create("ul", "project-meta");
    project.meta.forEach((item) => tags.append(create("li", "", item)));
    copy.append(tags);

    body.append(copy, createVisual(project.visual));

    const footer = create("div", "project-card-footer");
    footer.append(
      create("span", "", project.action),
      create("span", "project-arrow", project.external ? "↗" : "→")
    );

    card.append(top, body, footer);
    return card;
  };

  const createIndexItem = (project) => {
    const item = create("li");
    const link = create("a");
    link.href = project.href;
    link.append(
      create("span", "", project.number),
      create("strong", "", project.title),
      create("small", "", project.category),
      create("i", "", project.external ? "↗" : "→")
    );
    item.append(link);
    return item;
  };

  if (grid) {
    const cardFragment = document.createDocumentFragment();
    projects.forEach((project) => cardFragment.append(createProjectCard(project)));
    grid.replaceChildren(cardFragment);
  }

  if (projectCount) {
    projectCount.textContent = `${String(projects.length).padStart(2, "0")} 个工具`;
  }

  if (panelProjectCount) {
    panelProjectCount.textContent = String(projects.length).padStart(2, "0");
  }

  if (currentYear) currentYear.textContent = String(new Date().getFullYear());
})();


