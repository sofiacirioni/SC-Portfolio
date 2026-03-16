#!/usr/bin/env python3
"""
Gemini code review script. Reads diff from /tmp/diff.txt, calls Gemini API,
writes review to /tmp/review.md.
"""
import json
import os
import urllib.request
import urllib.error


def slurp(path, limit=10000):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read(limit)
    except OSError:
        return ""


def section(title, content):
    if not content.strip():
        return ""
    return f"\n\n### {title}\n{content}"


def main():
    design_system = slurp("docs/ux-ui-design-system.md")
    clean_code = slurp("docs/frontend-clean-code.md")
    qa_checklist = slurp("docs/qa-testing-checklist.md")
    diff = slurp("/tmp/diff.txt", limit=90000)

    ctx = section("DESIGN SYSTEM (ux-ui-design-system.md)", design_system)
    ctx += section("FRONTEND ARCHITECTURE (frontend-clean-code.md)", clean_code)
    ctx += section("QA CHECKLIST (qa-testing-checklist.md)", qa_checklist)

    system_prompt = (
        "You are a Senior Fullstack Developer and UX/UI Designer "
        "specialising in Swiss minimalism and Angular SPAs. Your task is to review "
        "the incoming code diff for a personal portfolio website and provide a "
        "thorough, constructive review.\n\n"
        "## Project overview\n"
        "- Framework: Angular 21 standalone components — no NgModule, no router, no Angular Forms.\n"
        "- Styling:   Pure CSS with CSS custom properties. No Tailwind, no component library.\n"
        "- Animation: GSAP 3 (scramble phrase, ticker tape). Native fetch() for ASCII frames.\n"
        "- Grid:      12-column global grid (.global-grid). Every element's x-position declared "
        "via an explicit grid-column. Never freeform.\n"
        "- Fonts:     Martian Mono (local) · IBM Plex Serif (local) · IBM Plex Sans Condensed (Google Fonts). "
        "Always referenced as var(--font-mono), var(--font-serif), var(--font-body).\n"
        "- Tokens:    Colors and type sizes live in :root custom properties only. "
        "No hardcoded hex values or px font sizes inside component files.\n"
        "- NgZone:    All GSAP/DOM animation runs in NgZone.runOutsideAngular(). "
        "Angular state is updated only when a bound property changes.\n"
        "- Cleanup:   Every interval, timeout, GSAP tween, and observer must be cleared in ngOnDestroy().\n"
        f"{ctx}\n\n"
        "## Review guidelines\n"
        "1. **Be constructive.** Start by acknowledging what works well.\n"
        "2. **Grid audit.** Every new element must declare grid-column against the 12-column system.\n"
        "3. **Token audit.** Flag any hardcoded color hex or pixel font-size inside a component file.\n"
        "4. **Angular pattern audit.** Flag missing ngOnDestroy cleanup, missing runOutsideAngular, "
        "or any use of deprecated APIs.\n"
        "5. **CSS hygiene.** Flag Tailwind utilities, inline styles (other than necessary dynamic "
        "bindings), or redundant vendor prefixes.\n"
        "6. **Accessibility.** Check for missing aria-* attributes, non-semantic elements, and "
        "missing keyboard interaction.\n"
        "7. **Animation correctness.** Verify ASCII frame lifecycle, scramble phrase input contract, "
        "and ticker IntersectionObserver guard.\n"
        "8. **Aesthetic coherence.** Any suggestion must preserve the restrained, grid-anchored, "
        "Swiss/minimalist design language.\n\n"
        "## Output format (strict Markdown)\n"
        "Use exactly these three sections — no extra headers:\n\n"
        "### ✅ Strengths\n"
        "Bullet list of what was done well.\n\n"
        "### 🔍 Issues Found\n"
        "Numbered list. Each item: **file & line range** · **severity** "
        "(🔴 Critical / 🟡 Warning / 🔵 Suggestion) · one-line description · short code snippet if useful.\n\n"
        "### 💡 Actionable Improvements\n"
        "Numbered list of concrete, specific recommendations ordered by priority."
    )

    user_prompt = "Please review the following code diff:\n\n```diff\n" + diff + "\n```"

    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"parts": [{"text": user_prompt}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 2048},
    }

    api_key = os.environ["GEMINI_API_KEY"]
    url = (
        "https://generativelanguage.googleapis.com/v1beta"
        f"/models/gemini-1.5-flash:generateContent?key={api_key}"
    )

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            review_text = result["candidates"][0]["content"]["parts"][0]["text"]
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        review_text = f"⚠️ **Gemini API error {e.code}:** {e.reason}\n\n```\n{body[:1000]}\n```"
    except Exception as e:
        review_text = f"⚠️ **Unexpected error calling Gemini API:** `{e}`"

    with open("/tmp/review.md", "w", encoding="utf-8") as f:
        f.write(review_text)

    print("✓ Gemini review written to /tmp/review.md")


if __name__ == "__main__":
    main()
