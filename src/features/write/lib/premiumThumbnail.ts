// Pure helpers for building the premium-article NFT thumbnail (NIC-131 §6.3).
// No side effects except the async loadHeaderImage which fetches + draws once.

// ---------------------------------------------------------------------------
// XML-escaping helper — applied to all user-supplied text interpolated into SVG.
// ---------------------------------------------------------------------------

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Text layout helpers
// ---------------------------------------------------------------------------

export function getTitleTexts(post: { title: string }): string {
  const { title } = post;
  const lines: string[] = [];
  if (title.length <= 35) {
    lines.push(title);
  } else {
    const words = title.split(" ");
    let firstLine = "";
    let secondLine = "";
    for (const word of words) {
      if (lines.length === 0) {
        const candidate = firstLine ? firstLine + " " + word : word;
        if (candidate.length < 34) {
          firstLine = candidate;
        } else {
          lines.push(firstLine);
          firstLine = "";
          // Start second line
          const s = secondLine ? secondLine + " " + word : word;
          if (s.length < 31) {
            secondLine = s;
          } else {
            secondLine = secondLine ? secondLine + "..." : s + "...";
            lines.push(secondLine);
            secondLine = "";
            break;
          }
        }
      } else if (lines.length === 1) {
        const s = secondLine ? secondLine + " " + word : word;
        if (s.length < 31) {
          secondLine = s;
        } else {
          secondLine = secondLine ? secondLine + "..." : s + "...";
          lines.push(secondLine);
          secondLine = "";
          break;
        }
      }
    }
    if (lines.length === 0 && firstLine) lines.push(firstLine);
    if (lines.length === 1 && secondLine) lines.push(secondLine);
  }

  return lines
    .map(
      (item, index) =>
        `<text opacity=".9" x="80" y="${380 + index * 35}" font-size="28" font-family="Georgia" font-style="normal" font-weight="400" line-height="30px" fill="#ffffff"> ${escapeXml(item)} </text>`,
    )
    .join("");
}

export function getSubtitleTexts(post: { subtitle: string }): string {
  const { subtitle } = post;
  const lines: string[] = [];
  if (subtitle.length <= 55) {
    lines.push(subtitle);
  } else {
    const words = subtitle.split(" ");
    let first = "";
    let second = "";
    let third = "";
    for (const word of words) {
      if (lines.length === 0) {
        const candidate = first ? first + " " + word : word;
        if (candidate.length < 55) {
          first = candidate;
        } else {
          lines.push(first);
          first = "";
          const s = second ? second + " " + word : word;
          if (s.length < 55) {
            second = s;
          } else {
            second = second ? second + "..." : s + "...";
            lines.push(second);
            second = "";
            break;
          }
        }
      } else if (lines.length === 1) {
        const s = second ? second + " " + word : word;
        if (s.length < 55) {
          second = s;
        } else {
          lines.push(second);
          second = "";
          const t = third ? third + " " + word : word;
          if (t.length < 52) {
            third = t;
          } else {
            third = third ? third + "..." : t + "...";
            lines.push(third);
            third = "";
            break;
          }
        }
      } else if (lines.length === 2) {
        const t = third ? third + " " + word : word;
        if (t.length < 52) {
          third = t;
        } else {
          third = third ? third + "..." : t + "...";
          lines.push(third);
          third = "";
          break;
        }
      }
    }
    if (lines.length === 0 && first) lines.push(first);
    if (lines.length === 1 && second) lines.push(second);
    if (lines.length === 2 && third) lines.push(third);
  }

  return lines
    .map(
      (item, index) =>
        `<text opacity=".9" x="80" y="${470 + index * 25}" font-size="19.4" font-family="Georgia" font-style="normal" font-weight="400" line-height="28px" fill="#B2B2B2"> ${escapeXml(item)} </text>`,
    )
    .join("");
}

// ---------------------------------------------------------------------------
// SVG builder
// ---------------------------------------------------------------------------

export function buildSvgForPremiumArticle(
  post: { title: string; subtitle: string; headerImage: string },
  handle: string,
): string {
  return `<svg width="659" height="709" viewBox="0 0 659 709" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="min-height:150px;max-width:250px;max-height:250px">
  <path stroke="url(#a)" stroke-width="4" d="M537 590h120v117H537z"/>
  <path stroke="url(#b)" stroke-width="4" d="M546 490h78v76h-78z"/>
  <path stroke="url(#c)" stroke-width="4" d="M439 617h53v52h-53z"/>
  <g filter="url(#d)"><path d="m12.685 36.613 27.189-24.167a8 8 0 0 1 11.421.811L584.424 643.23c3.349 3.957 2.107 10.005-2.529 12.324l-39.206 19.602a8 8 0 0 1-3.578.845H18a8 8 0 0 1-8-8V42.593a8 8 0 0 1 2.685-5.98" fill="url(#e)"/></g>
  <g filter="url(#f)"><path fill="#fff" d="M54.828 14.71H589.78V645H54.828z"/></g>
  <g filter="url(#g)"><path fill="#fff" d="M50.414 10.297h534.952v630.29H50.414z"/></g>
  <g filter="url(#h)"><path fill="#151451" d="M46 5h534.952v630.29H46z"/></g>
  <path d="M46 11a6 6 0 0 1 6-6h529v329H46z" fill="url(#i)"/>
  <path fill="url(#j)" d="M571 288h10v140h-10z"/>
  <path fill="#151451" d="M79 305.138h29.131v29.131H79z"/>
  <path fill="#D9D9D9" d="M86.2 312.972h14.566v1.821H86.2zm0 5.462h14.566v1.821H86.2zm0 5.463h7.283v1.821H86.2z"/>
  <path d="M581 635.405c-174.5 0-520.058.095-529.5.095-9.842 0-5 12.5 7.734 12.5H590" stroke="#151451"/>
  <path fill="url(#k)" style="mix-blend-mode:multiply" d="M46 4h22v631H46z"/>
  <path opacity=".4" d="M100 4h451l-58.71 308-47.463 249L100 633z" fill="url(#l)"/>
  ${getTitleTexts(post)}
  ${getSubtitleTexts(post)}
  <text x="80" y="612" font-size="21.4" font-family="Arial" font-weight="700" fill="#fff">@${escapeXml(handle)}</text>
  <defs>
    <linearGradient id="a" x1="597" y1="588" x2="597" y2="709" gradientUnits="userSpaceOnUse"><stop stop-color="#25F68D"/><stop offset="1" stop-color="#1BC0F2"/></linearGradient>
    <linearGradient id="b" x1="585" y1="488" x2="585" y2="568" gradientUnits="userSpaceOnUse"><stop stop-color="#25F68D"/><stop offset="1" stop-color="#1BC0F2"/></linearGradient>
    <linearGradient id="c" x1="465.5" y1="615" x2="465.5" y2="671" gradientUnits="userSpaceOnUse"><stop stop-color="#25F68D"/><stop offset="1" stop-color="#1BC0F2"/></linearGradient>
    <linearGradient id="e" x1="409" y1="273" x2="105" y2="676" gradientUnits="userSpaceOnUse"><stop stop-color="#D9D9D9"/><stop offset="1" stop-color="#CDCDCD" stop-opacity=".24"/></linearGradient>
    <linearGradient id="j" x1="576" y1="288" x2="576" y2="428" gradientUnits="userSpaceOnUse"><stop stop-color="#25F68D"/><stop offset="1" stop-color="#1BC0F2"/></linearGradient>
    <linearGradient id="k" x1="68" y1="219" x2="38.667" y2="219" gradientUnits="userSpaceOnUse"><stop stop-color="#D9D9D9" stop-opacity="0"/><stop offset=".49" stop-color="#C6C6C6"/><stop offset="1" stop-color="#D9D9D9" stop-opacity="0"/></linearGradient>
    <linearGradient id="l" x1="522.408" y1="-206.236" x2="54.907" y2="157.836" gradientUnits="userSpaceOnUse"><stop stop-color="#fff"/><stop offset=".516" stop-color="#fff" stop-opacity=".672"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <filter id="d" x="0" y=".425" width="596.318" height="685.575" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="bg"/><feBlend in="SourceGraphic" in2="bg" result="shape"/><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="f" x="51.297" y="14.71" width="542.014" height="637.352" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="bg"/><feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="ha"/><feOffset dy="3.531"/><feGaussianBlur stdDeviation="1.766"/><feComposite in2="ha" operator="out"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/><feBlend in2="bg" result="ds"/><feBlend in="SourceGraphic" in2="ds" result="shape"/></filter>
    <filter id="g" x="46.883" y="10.297" width="542.014" height="637.352" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="bg"/><feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="ha"/><feOffset dy="3.531"/><feGaussianBlur stdDeviation="1.766"/><feComposite in2="ha" operator="out"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/><feBlend in2="bg" result="ds"/><feBlend in="SourceGraphic" in2="ds" result="shape"/></filter>
    <filter id="h" x="42.469" y="5" width="542.014" height="637.352" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="bg"/><feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="ha"/><feOffset dy="3.531"/><feGaussianBlur stdDeviation="1.766"/><feComposite in2="ha" operator="out"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/><feBlend in2="bg" result="ds"/><feBlend in="SourceGraphic" in2="ds" result="shape"/></filter>
    <pattern id="i" patternContentUnits="objectBoundingBox" width="1" height="1"><use xlink:href="#m" transform="matrix(.00192 0 0 .00312 -.086 0)"/></pattern>
    <image id="m" width="612" height="321" xlink:href="${post.headerImage}"/>
  </defs>
</svg>`;
}

// ---------------------------------------------------------------------------
// Async image loader: fetch → blob → data-URL → canvas cover-fit → data-URL
// ---------------------------------------------------------------------------

export function loadHeaderImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const image = new Image();
          image.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = 612;
            canvas.height = 321;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(dataUrl);
              return;
            }
            // COVER-fit centering
            let scale: number;
            let dx: number;
            let dy: number;
            if (image.width / image.height > 612 / 321) {
              scale = 321 / image.height;
              dx = (612 - scale * image.width) / 2;
              dy = 0;
            } else {
              scale = 612 / image.width;
              dx = 0;
              dy = (321 - scale * image.height) / 2;
            }
            ctx.drawImage(
              image,
              dx,
              dy,
              scale * image.width,
              scale * image.height,
            );
            resolve(canvas.toDataURL());
          };
          image.onerror = reject;
          image.src = dataUrl;
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });
}
